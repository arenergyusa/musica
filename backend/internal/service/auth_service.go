package service

import (
	"context"
	"errors"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(ctx context.Context, req *domain.RegisterRequest) (*domain.User, error)
	Login(ctx context.Context, email, password string) (*domain.User, string, error)
	GenerateToken(userID uuid.UUID, role string) (string, error)
}

type authService struct {
	userRepo repository.UserRepository
	mlmRepo  repository.MLMRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, mlmRepo repository.MLMRepository, jwtSecret string) AuthService {
	return &authService{
		userRepo: userRepo,
		mlmRepo:  mlmRepo,
		jwtSecret: jwtSecret,
	}
}

func (s *authService) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.User, error) {
	var upline *domain.User
	if req.ReferralCode != "" {
		var err error
		upline, err = s.userRepo.GetByReferralCode(ctx, req.ReferralCode)
		if err != nil {
			return nil, err
		}
		if upline == nil {
			return nil, errors.New("invalid referral code")
		}
	}

	// 2. Check if email exists
	existing, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// 3. Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 4. Generate new unique referral code (e.g. first 4 of name + 4 random chars)
	newReferralCode := uuid.New().String()[:8] // simple generator

	user := &domain.User{
		Name:         req.Name,
		Email:        req.Email,
		Phone:        req.Phone,
		PasswordHash: string(hash),
		ReferralCode: newReferralCode,
		Role:         "user",
	}

	if upline != nil {
		user.ReferredBy = &upline.ID
	}

	// 5. Create User
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// 6. Insert into Referral Tree
	if upline != nil {
		if err := s.mlmRepo.InsertNode(ctx, user.ID, upline.ID); err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (*domain.User, string, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, "", err
	}
	if user == nil {
		return nil, "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	if user.Status == "BLOCKED" {
		return nil, "", errors.New("account is blocked")
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
