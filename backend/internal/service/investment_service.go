package service

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

type InvestmentService interface {
	GetPlans(ctx context.Context) ([]*domain.InvestmentPlan, error)
	CreateInvestment(ctx context.Context, userID uuid.UUID, req *domain.InvestRequest) (*domain.Investment, error)
	GetMyInvestments(ctx context.Context, userID uuid.UUID) ([]*domain.Investment, error)
}

type investmentService struct {
	invRepo repository.InvestmentRepository
	userRepo repository.UserRepository
	mlmRepo repository.MLMRepository
}

func NewInvestmentService(invRepo repository.InvestmentRepository, userRepo repository.UserRepository, mlmRepo repository.MLMRepository) InvestmentService {
	return &investmentService{
		invRepo: invRepo,
		userRepo: userRepo,
		mlmRepo: mlmRepo,
	}
}

func (s *investmentService) GetPlans(ctx context.Context) ([]*domain.InvestmentPlan, error) {
	return s.invRepo.GetPlans(ctx)
}

func (s *investmentService) CreateInvestment(ctx context.Context, userID uuid.UUID, req *domain.InvestRequest) (*domain.Investment, error) {
	// 1. Get user to check KYC
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if user.KycStatus != "APPROVED" && user.KycStatus != "COMPLETED" {
		return nil, errors.New("KYC must be APPROVED before investing")
	}

	// 2. Validate amount is multiple of 10000
	if int64(req.Amount)%10000 != 0 {
		return nil, errors.New("investment amount must be a multiple of 10,000")
	}

	// 3. Check working vs non-working
	isWorking, err := s.mlmRepo.HasActiveDirectReferral(ctx, userID)
	if err != nil {
		return nil, err
	}

	capMultiplier := 2.0
	if isWorking {
		capMultiplier = 3.0
	}

	capLimit := req.Amount * capMultiplier

	inv := &domain.Investment{
		UserID:               userID,
		Amount:               req.Amount,
		DailyRatePct:         0.3333,
		Status:               "PENDING", // Requires admin approval for payment receipt
		CapLimit:             capLimit,
		WorkingCapAtCreation: isWorking,
	}

	if err := s.invRepo.CreateInvestment(ctx, inv); err != nil {
		return nil, err
	}

	return inv, nil
}

func (s *investmentService) GetMyInvestments(ctx context.Context, userID uuid.UUID) ([]*domain.Investment, error) {
	return s.invRepo.GetInvestmentsByUserID(ctx, userID)
}
