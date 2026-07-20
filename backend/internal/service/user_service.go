package service

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

type UserService interface {
	GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, req *domain.UpdateProfileRequest) (*domain.User, error)
	SubmitKYC(ctx context.Context, userID uuid.UUID, documentURL string) error
	GetKYCStatus(ctx context.Context, userID uuid.UUID) (string, string, error)
	GetDashboard(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
}

type userService struct {
	userRepo   repository.UserRepository
	walletRepo repository.WalletRepository
	invRepo    repository.InvestmentRepository
	mlmRepo    repository.MLMRepository
}

func NewUserService(userRepo repository.UserRepository, walletRepo repository.WalletRepository, invRepo repository.InvestmentRepository, mlmRepo repository.MLMRepository) UserService {
	return &userService{
		userRepo:   userRepo,
		walletRepo: walletRepo,
		invRepo:    invRepo,
		mlmRepo:    mlmRepo,
	}
}

func (s *userService) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}

func (s *userService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *domain.UpdateProfileRequest) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.BankAccount != "" {
		user.BankAccount = req.BankAccount
	}
	if req.IFSC != "" {
		user.IFSC = req.IFSC
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) SubmitKYC(ctx context.Context, userID uuid.UUID, documentURL string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	user.KycStatus = "PENDING"
	user.DocumentURL = documentURL

	return s.userRepo.Update(ctx, user)
}

func (s *userService) GetKYCStatus(ctx context.Context, userID uuid.UUID) (string, string, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", "", err
	}
	if user == nil {
		return "", "", errors.New("user not found")
	}
	return user.KycStatus, user.KycRejectionReason, nil
}

func (s *userService) GetDashboard(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	// Fetch User
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Fetch Wallet
	wallet, _ := s.walletRepo.GetBalance(ctx, userID)

	// Fetch Investments
	invs, _ := s.invRepo.GetInvestmentsByUserID(ctx, userID)
	var activeInvestments float64
	for _, inv := range invs {
		if inv.Status == "ACTIVE" {
			activeInvestments += inv.Amount
		}
	}

	// Fetch Team Stats
	volume, _ := s.mlmRepo.GetDownlineVolume(ctx, userID)
	directs, _ := s.mlmRepo.GetDirectReferrals(ctx, userID)

	var bal, totalW, totalC float64
	if wallet != nil {
		bal = wallet.Balance
		totalW = wallet.TotalWithdrawn
		totalC = wallet.TotalCredited
	}

	// Fetch Recent Transactions
	recentTxs, _ := s.walletRepo.GetTransactions(ctx, userID, 5, 0)
	if recentTxs == nil {
		recentTxs = []*domain.Transaction{}
	}

	// Fetch Chart Data
	chartData, _ := s.walletRepo.GetIncomeChartData(ctx, userID, 30)
	if chartData == nil {
		chartData = []map[string]interface{}{}
	}

	return map[string]interface{}{
		"user": map[string]interface{}{
			"name": user.Name,
			"kyc_status": user.KycStatus,
			"referral_code": user.ReferralCode,
		},
		"wallet": map[string]interface{}{
			"balance": bal,
			"total_withdrawn": totalW,
			"total_credited": totalC,
		},
		"investments": map[string]interface{}{
			"active_amount": activeInvestments,
			"total_plans": len(invs),
		},
		"team": map[string]interface{}{
			"direct_count": len(directs),
			"active_volume": volume,
		},
		"recent_transactions": recentTxs,
		"chart_data":          chartData,
	}, nil
}

