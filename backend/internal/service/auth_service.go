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
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/pkg/email"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func hashOTP(otp, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(otp))
	return hex.EncodeToString(h.Sum(nil))
}

type AuthService interface {
	Register(ctx context.Context, req *domain.RegisterRequest) (*domain.User, error)
	VerifyRegisterOTP(ctx context.Context, email, otp string) error
	Login(ctx context.Context, email, password string) (*domain.User, string, error)
	GenerateToken(userID uuid.UUID, role string) (string, error)
	ForgotPassword(ctx context.Context, email string) error
	VerifyForgotPasswordOTP(ctx context.Context, email, otp string) error
	ResetPassword(ctx context.Context, req *domain.ResetPasswordRequest) error
}

type authService struct {
	userRepo    repository.UserRepository
	mlmRepo     repository.MLMRepository
	otpRepo     repository.OTPRepository
	emailSender email.EmailSender
	jwtSecret   string
}

func NewAuthService(userRepo repository.UserRepository, mlmRepo repository.MLMRepository, otpRepo repository.OTPRepository, emailSender email.EmailSender, jwtSecret string) AuthService {
	return &authService{
		userRepo:    userRepo,
		mlmRepo:     mlmRepo,
		otpRepo:     otpRepo,
		emailSender: emailSender,
		jwtSecret:   jwtSecret,
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

	// Check if phone number exists and belongs to a different active user
	existingPhone, err := s.userRepo.GetByPhone(ctx, req.Phone)
	if err != nil {
		return nil, err
	}
	if existingPhone != nil && existingPhone.Status != "PENDING_VERIFICATION" {
		if existingEmail == nil || existingPhone.ID != existingEmail.ID {
			return nil, errors.New("mobile number is already registered")
		}
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var user *domain.User
	if existingEmail == nil {
		// Generate new unique invite code only for new user registration
		newInviteCode := uuid.New().String()[:8]
		user = &domain.User{
			Name:         req.Name,
			Email:        req.Email,
			Phone:        req.Phone,
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
				_ = s.mlmRepo.InsertNode(ctx, existingEmail.ID, upline.ID)
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

	// Send Email
	body := fmt.Sprintf("<h1>Welcome to Musica!</h1><p>Your registration OTP is: <strong>%s</strong></p><p>It expires in 10 minutes.</p>", otpCode)
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
	err := s.otpRepo.ConsumeOTP(ctx, email, hashOTP(otp, s.jwtSecret), "REGISTER")
	if err != nil {
		return errors.New("invalid or expired OTP")
	}

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

	return nil
}

func (s *authService) Login(ctx context.Context, email, password string) (*domain.User, string, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
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

	token, err := s.GenerateToken(user.ID, user.Role)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *authService) GenerateToken(userID uuid.UUID, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
		"role":    role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
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

	body := fmt.Sprintf("<h1>Password Reset</h1><p>Your OTP to reset your password is: <strong>%s</strong></p><p>It expires in 10 minutes.</p>", otpCode)
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
	return s.otpRepo.VerifyOTP(ctx, email, hashOTP(otp, s.jwtSecret), "FORGOT_PASSWORD")
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

	err := s.otpRepo.ConsumeOTP(ctx, req.Email, hashOTP(req.OTP, s.jwtSecret), "FORGOT_PASSWORD")
	if err != nil {
		return errors.New("invalid or expired OTP")
	}

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
