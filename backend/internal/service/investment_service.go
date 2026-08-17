package service

import (
	"context"
	"errors"
	"math"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

type InvestmentService interface {
	GetPlans(ctx context.Context) ([]*domain.SponsorshipPlan, error)
	CreateInvestment(ctx context.Context, userID uuid.UUID, req *domain.InvestRequest) (*domain.Sponsorship, error)
	GetMyInvestments(ctx context.Context, userID uuid.UUID) ([]*domain.Sponsorship, error)
	HasActiveInvestment(ctx context.Context, userID uuid.UUID) (bool, error)
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

	dailyRate := settings.MonthlyRewardPct / 30.0

	for _, p := range plans {
		p.MinAmount = 100
		p.Description = "USDT BEP-20 investment in multiples of $100 USD"
		p.DailyRatePct = dailyRate
		p.NonWorkingCapMultiplier = settings.NonWorkingCapMultiplier
		p.WorkingCapMultiplier = settings.WorkingCapMultiplier
	}

	return plans, nil
}

func (s *investmentService) CreateInvestment(ctx context.Context, userID uuid.UUID, req *domain.InvestRequest) (*domain.Sponsorship, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	if user.Status == "BLOCKED" {
		return nil, errors.New("account is blocked")
	}

	// Validate amount at the API boundary as well as in the client.
	if math.IsNaN(req.Amount) || math.IsInf(req.Amount, 0) || req.Amount < 100 || req.Amount > 10000 || math.Mod(req.Amount, 100) != 0 {
		return nil, errors.New("investment amount must be a multiple of $100 USD")
	}

	// Check working vs non-working based on 15-level unlock rule
	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	status, err := GetUserStatus(ctx, s.invRepo, s.mlmRepo, userID, settings)
	if err != nil {
		return nil, err
	}
	isWorking := status == UserStatusWorking

	capMultiplier := GetIncomeCap(isWorking, settings)
	capLimit := req.Amount * capMultiplier
	dailyRate := settings.MonthlyRewardPct / 30.0

	inv := &domain.Sponsorship{
		UserID:               userID,
		Amount:               req.Amount,
		DailyRatePct:         dailyRate,
		Status:               "PENDING",
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

func (s *investmentService) HasActiveInvestment(ctx context.Context, userID uuid.UUID) (bool, error) {
	return s.invRepo.HasActiveInvestment(ctx, userID)
}
