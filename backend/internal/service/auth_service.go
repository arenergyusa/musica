package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	emailpkg "github.com/arenergyusa/musica/backend/internal/pkg/email"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

const otpMaxAttempts = 5

func hashOTP(otp, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(otp))
	return hex.EncodeToString(h.Sum(nil))
}

type AuthService interface {
	Register(ctx context.Context, req *domain.RegisterRequest) (*domain.User, error)
	VerifyRegisterOTP(ctx context.Context, email, otp string) error
	Login(ctx context.Context, email, password string, rememberMe bool) (*domain.User, string, error)
	GenerateToken(userID uuid.UUID, role string, ttl time.Duration) (string, error)
	ForgotPassword(ctx context.Context, email string) error
	VerifyForgotPasswordOTP(ctx context.Context, email, otp string) error
	ResetPassword(ctx context.Context, req *domain.ResetPasswordRequest) error
	// Logout blacklists the presented JWT (by its jti claim) until it would
	// naturally expire, so a stolen token cannot keep working after logout (H2).
	Logout(ctx context.Context, tokenString string) error
	// SendUsernameEmails backfills the username announcement email to existing
	// ACTIVE users who have not received it yet (M30).
	SendUsernameEmails(ctx context.Context)
}

type authService struct {
	userRepo    repository.UserRepository
	mlmRepo     repository.MLMRepository
	otpRepo     repository.OTPRepository
	emailSender emailpkg.EmailSender
	redis       *redis.Client
	jwtSecret   string
}

func NewAuthService(userRepo repository.UserRepository, mlmRepo repository.MLMRepository, otpRepo repository.OTPRepository, emailSender emailpkg.EmailSender, jwtSecret string, redis *redis.Client) AuthService {
	return &authService{
		userRepo:    userRepo,
		mlmRepo:     mlmRepo,
		otpRepo:     otpRepo,
		emailSender: emailSender,
		jwtSecret:   jwtSecret,
		redis:       redis,
	}
}

// Generate 6-digit numeric OTP
func generateOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func otpAttemptsKey(email, purpose string) string {
	return "otp:attempts:" + strings.ToLower(strings.TrimSpace(email)) + ":" + purpose
}

// isOtpLocked reports whether this email+purpose has exceeded the OTP attempt budget.
func (s *authService) isOtpLocked(ctx context.Context, email, purpose string) bool {
	if s.redis == nil {
		return false
	}
	val, err := s.redis.Get(ctx, otpAttemptsKey(email, purpose)).Int()
	return err == nil && val >= otpMaxAttempts
}

// registerFailedAttempt records a failed verification and returns true when the
// email becomes locked out. Fail-open if Redis is unavailable.
func (s *authService) registerFailedAttempt(ctx context.Context, email, purpose string) bool {
	if s.redis == nil {
		return false
	}
	val, err := s.redis.Incr(ctx, otpAttemptsKey(email, purpose)).Result()
	if err != nil {
		return false
	}
	if val == 1 {
		s.redis.Expire(ctx, otpAttemptsKey(email, purpose), 10*time.Minute)
	}
	return val >= otpMaxAttempts
}

// clearAttempts resets the failure counter after a successful verification.
func (s *authService) clearAttempts(ctx context.Context, email, purpose string) {
	if s.redis != nil {
		s.redis.Del(ctx, otpAttemptsKey(email, purpose))
	}
}

func (s *authService) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.User, error) {
	if req.InviteCode == "" {
		return nil, errors.New("invite code is required")
	}

	upline, err := s.userRepo.GetByInviteCode(ctx, req.InviteCode)
	if err != nil {
		return nil, err
	}
	if upline == nil {
		return nil, errors.New("invalid invite code")
	}

	// Check if email exists and is active
	existingEmail, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existingEmail != nil && existingEmail.Status != "PENDING_VERIFICATION" {
		return nil, errors.New("email address is already registered")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var user *domain.User
	if existingEmail == nil {
		// Generate a unique system username (prefix "MU" + 8 digits) that is
		// emailed to the user after their account is verified (M30).
		username, err := s.userRepo.GenerateUniqueUsername(ctx)
		if err != nil {
			return nil, err
		}

		// Generate new unique invite code only for new user registration
		newInviteCode := uuid.New().String()[:8]
		user = &domain.User{
			Name:         req.Name,
			Email:        req.Email,
			Phone:        req.Phone,
			Username:     username,
			PasswordHash: string(hash),
			InviteCode:   newInviteCode,
			Role:         "user",
			Status:       "PENDING_VERIFICATION",
		}

		if upline != nil {
			user.InvitedBy = &upline.ID
		}

		if err := s.userRepo.Create(ctx, user); err != nil {
			return nil, err
		}

		if upline != nil {
			if err := s.mlmRepo.InsertNode(ctx, user.ID, upline.ID); err != nil {
				// Roll back the user so we never leave an orphaned account with
				// no invite-tree node (H6). Best-effort: if the delete fails the
				// PENDING_VERIFICATION reconciliation branch will reuse the row.
				if delErr := s.userRepo.Delete(ctx, user.ID); delErr != nil {
					log.Printf("Register: failed to rollback user %s after tree insert error: %v (original: %v)", user.ID, delErr, err)
				}
				return nil, err
			}
		}
	} else {
		// Update password and phone for pending verification account
		existingEmail.PasswordHash = string(hash)
		existingEmail.Phone = req.Phone

		// Reconcile upline/invited_by if changed
		var newUplineID *uuid.UUID
		if upline != nil {
			newUplineID = &upline.ID
		}

		uplineChanged := false
		if existingEmail.InvitedBy == nil && newUplineID != nil {
			uplineChanged = true
		} else if existingEmail.InvitedBy != nil && newUplineID == nil {
			uplineChanged = true
		} else if existingEmail.InvitedBy != nil && newUplineID != nil && *existingEmail.InvitedBy != *newUplineID {
			uplineChanged = true
		}

		if uplineChanged {
			existingEmail.InvitedBy = newUplineID
			if upline != nil {
				// Never silently drop the tree insert: a broken upline link means
				// the user would earn no downline income (H6).
				if err := s.mlmRepo.InsertNode(ctx, existingEmail.ID, upline.ID); err != nil {
					return nil, err
				}
			}
		}

		if err := s.userRepo.Update(ctx, existingEmail); err != nil {
			return nil, err
		}
		user = existingEmail
	}

	// Generate and save OTP
	otpCode, err := generateOTP()
	if err != nil {
		return nil, err
	}
	otp := &domain.OTP{
		Email:     user.Email,
		OTP:       hashOTP(otpCode, s.jwtSecret),
		Purpose:   "REGISTER",
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	if err := s.otpRepo.SaveOTP(ctx, otp); err != nil {
		return nil, err
	}
	// A freshly issued OTP resets the failure counter so a locked-out but
	// legitimate user can recover by requesting a new code (M15).
	s.clearAttempts(ctx, user.Email, "REGISTER")

	// Send Email
	body := emailpkg.RenderOTPEmail(
		"Verify your email",
		"Welcome to Musica! Use the code below to verify your email address and complete your registration.",
		otpCode,
	)
	go func(email, subject, body string) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in SendEmail: %v", r)
			}
		}()
		if err := s.emailSender.SendEmail(email, subject, body); err != nil {
			log.Printf("ERROR: Failed to send registration email to %s: %v", email, err)
		}
	}(user.Email, "Musica - Verify your email", body)

	return user, nil
}

func (s *authService) VerifyRegisterOTP(ctx context.Context, email, otp string) error {
	if s.isOtpLocked(ctx, email, "REGISTER") {
		return errors.New("too many invalid OTP attempts. Please request a new OTP.")
	}
	err := s.otpRepo.ConsumeOTP(ctx, email, hashOTP(otp, s.jwtSecret), "REGISTER")
	if err != nil {
		if s.registerFailedAttempt(ctx, email, "REGISTER") {
			return errors.New("too many invalid OTP attempts. Please request a new OTP.")
		}
		return errors.New("invalid or expired OTP")
	}
	s.clearAttempts(ctx, email, "REGISTER")

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	if user.Status != "PENDING_VERIFICATION" {
		return errors.New("user already verified or blocked")
	}

	user.Status = "ACTIVE"
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	s.sendUsernameEmail(user)

	return nil
}

// sendUsernameEmail delivers the account username to the user. It is called
// right after OTP verification (new accounts) and once per user by the startup
// backfill; MarkUsernameEmailSent makes it idempotent.
func (s *authService) sendUsernameEmail(user *domain.User) {
	if user == nil || user.Email == "" || user.Username == "" {
		return
	}
	body := emailpkg.RenderUsernameEmail(user.Name, user.Username)
	go func(email, subject, body string) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in SendEmail: %v", r)
			}
		}()
		if err := s.emailSender.SendEmail(email, subject, body); err != nil {
			log.Printf("ERROR: Failed to send username email to %s: %v", email, err)
			return
		}
		// Idempotency marker: only set after a successful send so a transient
		// SMTP failure leaves the user pending for the next backfill run.
		u, err := s.userRepo.GetByID(context.Background(), user.ID)
		if err != nil || u == nil {
			return
		}
		if err := s.userRepo.MarkUsernameEmailSent(context.Background(), user.ID); err != nil {
			log.Printf("WARN: failed to mark username email sent for %s: %v", user.Email, err)
		}
	}(user.Email, "Musica - Your Account Username", body)
}

// SendUsernameEmails is the startup backfill: it emails every ACTIVE user who
// already has a username but has not yet been told about it. Runs asynchronously
// so startup is not blocked, and paces sends to avoid SMTP bursts.
func (s *authService) SendUsernameEmails(ctx context.Context) {
	users, err := s.userRepo.GetUsersMissingUsernameEmail(ctx)
	if err != nil {
		log.Printf("SendUsernameEmails: failed to load pending users: %v", err)
		return
	}
	if len(users) == 0 {
		return
	}
	log.Printf("SendUsernameEmails: delivering usernames to %d existing user(s)", len(users))
	for _, u := range users {
		if ctx.Err() != nil {
			return
		}
		s.sendUsernameEmail(u)
		time.Sleep(300 * time.Millisecond)
	}
}

func (s *authService) Login(ctx context.Context, identifier, password string, rememberMe bool) (*domain.User, string, error) {
	user, err := s.userRepo.GetByIdentifier(ctx, identifier)
	if err != nil || user == nil {
		return nil, "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	if user.Status == "BLOCKED" {
		return nil, "", errors.New("account is blocked")
	}
	if user.Status == "PENDING_VERIFICATION" {
		return nil, "", errors.New("email not verified")
	}

	// "Remember me" is honoured at the token level, not just the cookie level,
	// so the JWT actually outlives the session the user asked for (M21).
	ttl := time.Hour * 24
	if rememberMe {
		ttl = time.Hour * 24 * 30
	}

	token, err := s.GenerateToken(user.ID, user.Role, ttl)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *authService) GenerateToken(userID uuid.UUID, role string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"jti":     uuid.New().String(),
		"iat":     now.Unix(),
		"nbf":     now.Unix(), // reject tokens before issuance (L3)
		"exp":     now.Add(ttl).Unix(),
		"role":    role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// Logout blacklists the presented token's jti for the remainder of its natural
// lifetime so the stateless JWT stops working even though it is still
// cryptographically valid (H2).
func (s *authService) Logout(ctx context.Context, tokenString string) error {
	if s.redis == nil || tokenString == "" {
		return nil
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return errors.New("invalid token claims")
	}

	jti, ok := claims["jti"].(string)
	if !ok || jti == "" {
		return nil
	}
	expFloat, ok := claims["exp"].(float64)
	if !ok {
		return nil
	}

	ttl := time.Unix(int64(expFloat), 0).Sub(time.Now())
	if ttl <= 0 {
		return nil
	}

	return s.redis.Set(ctx, "token:blacklist:"+jti, "1", ttl).Err()
}

func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil || user == nil {
		// Don't leak if user exists
		return nil
	}

	otpCode, err := generateOTP()
	if err != nil {
		return err
	}
	otp := &domain.OTP{
		Email:     user.Email,
		OTP:       hashOTP(otpCode, s.jwtSecret),
		Purpose:   "FORGOT_PASSWORD",
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	if err := s.otpRepo.SaveOTP(ctx, otp); err != nil {
		return err
	}
	// Reset the failure counter whenever a fresh code is issued (M15).
	s.clearAttempts(ctx, user.Email, "FORGOT_PASSWORD")

	body := emailpkg.RenderOTPEmail(
		"Reset your password",
		"Use the code below to reset your Musica account password.",
		otpCode,
	)
	go func(email, subject, body string) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in SendEmail: %v", r)
			}
		}()
		if err := s.emailSender.SendEmail(email, subject, body); err != nil {
			log.Printf("ERROR: Failed to send forgot password email to %s: %v", email, err)
		}
	}(user.Email, "Musica - Reset Password", body)

	return nil
}

func (s *authService) VerifyForgotPasswordOTP(ctx context.Context, email, otp string) error {
	if s.isOtpLocked(ctx, email, "FORGOT_PASSWORD") {
		return errors.New("too many invalid OTP attempts. Please request a new OTP.")
	}
	err := s.otpRepo.VerifyOTP(ctx, email, hashOTP(otp, s.jwtSecret), "FORGOT_PASSWORD")
	if err != nil {
		if s.registerFailedAttempt(ctx, email, "FORGOT_PASSWORD") {
			return errors.New("too many invalid OTP attempts. Please request a new OTP.")
		}
		return errors.New("invalid or expired OTP")
	}
	s.clearAttempts(ctx, email, "FORGOT_PASSWORD")
	return nil
}

func (s *authService) ResetPassword(ctx context.Context, req *domain.ResetPasswordRequest) error {
	if len(req.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	var hasUpper, hasNumber bool
	for _, c := range req.Password {
		if c >= 'A' && c <= 'Z' {
			hasUpper = true
		}
		if c >= '0' && c <= '9' {
			hasNumber = true
		}
	}
	if !hasUpper || !hasNumber {
		return errors.New("password must contain at least one uppercase letter and one number")
	}

	if s.isOtpLocked(ctx, req.Email, "FORGOT_PASSWORD") {
		return errors.New("too many invalid OTP attempts. Please request a new OTP.")
	}
	err := s.otpRepo.ConsumeOTP(ctx, req.Email, hashOTP(req.OTP, s.jwtSecret), "FORGOT_PASSWORD")
	if err != nil {
		if s.registerFailedAttempt(ctx, req.Email, "FORGOT_PASSWORD") {
			return errors.New("too many invalid OTP attempts. Please request a new OTP.")
		}
		return errors.New("invalid or expired OTP")
	}
	s.clearAttempts(ctx, req.Email, "FORGOT_PASSWORD")

	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	if user.Status == "BLOCKED" {
		return errors.New("account is blocked")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hash)
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	return nil
}
