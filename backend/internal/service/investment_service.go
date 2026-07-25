package service

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

type InvestmentService interface {
	GetPlans(ctx context.Context) ([]*domain.SponsorshipPlan, error)
	CreateInvestment(ctx context.Context, userID uuid.UUID, req *domain.InvestRequest) (*domain.Sponsorship, error)
	GetMyInvestments(ctx context.Context, userID uuid.UUID) ([]*domain.Sponsorship, error)
}

type investmentService struct {
	invRepo      repository.InvestmentRepository
	userRepo     repository.UserRepository
	mlmRepo      repository.MLMRepository
	settingsRepo repository.SettingsRepository
}

func NewInvestmentService(invRepo repository.InvestmentRepository, userRepo repository.UserRepository, mlmRepo repository.MLMRepository, settingsRepo repository.SettingsRepository) InvestmentService {
	return &investmentService{
		invRepo:      invRepo,
		userRepo:     userRepo,
		mlmRepo:      mlmRepo,
		settingsRepo: settingsRepo,
	}
}

func (s *investmentService) GetPlans(ctx context.Context) ([]*domain.SponsorshipPlan, error) {
	plans, err := s.invRepo.GetPlans(ctx)
	if err != nil {
		return nil, err
	}

	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	for _, p := range plans {
		p.DailyRatePct = settings.DailyRewardPct
		p.NonWorkingCapMultiplier = settings.NonWorkingCapMultiplier
		p.WorkingCapMultiplier = settings.WorkingCapMultiplier
	}

	return plans, nil
}

func (s *investmentService) CreateInvestment(ctx context.Context, userID uuid.UUID, req *domain.InvestRequest) (*domain.Sponsorship, error) {
	// 1. Get user to check KYC
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if user.KycStatus != "APPROVED" && user.KycStatus != "COMPLETED" {
		return nil, errors.New("KYC must be APPROVED before sponsoring projects")
	}

	// 2. Validate amount is a whole-rupee value and a multiple of 10,000 INR
	if req.Amount <= 0 || req.Amount != float64(int64(req.Amount)) || int64(req.Amount)%10000 != 0 {
		return nil, errors.New("sponsorship amount must be a multiple of 10,000 INR")
	}

	// 3. Check working vs non-working
	isWorking, err := s.mlmRepo.HasActiveDirectReferral(ctx, userID)
	if err != nil {
		return nil, err
	}

	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	capMultiplier := GetIncomeCap(isWorking, settings)
	capLimit := req.Amount * capMultiplier

	inv := &domain.Sponsorship{
		UserID:               userID,
		Amount:               req.Amount,
		DailyRatePct:         settings.DailyRewardPct,
		Status:               "PENDING", // Requires admin approval for payment receipt
		CapLimit:             capLimit,
		WorkingCapAtCreation: isWorking,
	}

	if err := s.invRepo.CreateInvestment(ctx, inv); err != nil {
		return nil, err
	}

	return inv, nil
}

func (s *investmentService) GetMyInvestments(ctx context.Context, userID uuid.UUID) ([]*domain.Sponsorship, error) {
	return s.invRepo.GetInvestmentsByUserID(ctx, userID)
}
