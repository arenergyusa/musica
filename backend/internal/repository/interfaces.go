package repository

import (
	"context"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
)

// UserRepository handles user data operations
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByReferralCode(ctx context.Context, code string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	GetTotalCount(ctx context.Context) (int, error)
	GetPendingKYCCount(ctx context.Context) (int, error)
	GetAll(ctx context.Context, limit, offset int) ([]*domain.User, error)
	GetPendingKYC(ctx context.Context, limit, offset int) ([]*domain.User, error)
}

// InvestmentRepository handles investment and plan data
type InvestmentRepository interface {
	GetPlans(ctx context.Context) ([]*domain.InvestmentPlan, error)
	CreateInvestment(ctx context.Context, inv *domain.Investment) error
	GetInvestmentsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Investment, error)
	GetActiveInvestments(ctx context.Context) ([]*domain.Investment, error)
	UpdateInvestmentStatus(ctx context.Context, id uuid.UUID, status string) error
	// Track cap
	UpdateCapTracker(ctx context.Context, investmentID uuid.UUID, rewardAmount float64) error
	GetActiveCount(ctx context.Context) (int, error)
	GetTotalActiveInvested(ctx context.Context) (float64, error)
}

// WalletRepository handles wallet balances and transaction logs atomically
type WalletRepository interface {
	GetBalance(ctx context.Context, userID uuid.UUID) (*domain.RewardWallet, error)
	CreditReward(ctx context.Context, userID uuid.UUID, amount float64, txType string, source string, refID string, desc string) error
	DebitWithdrawal(ctx context.Context, userID uuid.UUID, amount float64, refID string, desc string) error
	GetTransactions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Transaction, error)
	GetIncomeChartData(ctx context.Context, userID uuid.UUID, days int) ([]map[string]interface{}, error)
	GetTotalPaid(ctx context.Context) (float64, error)
}

// MLMRepository handles referral tree and volume logic
type MLMRepository interface {
	InsertNode(ctx context.Context, userID uuid.UUID, uplineID uuid.UUID) error
	GetDirectReferrals(ctx context.Context, userID uuid.UUID) ([]*domain.User, error)
	GetDownlineVolume(ctx context.Context, userID uuid.UUID) (float64, error)
	CalculateLevelsUnlocked(ctx context.Context, userID uuid.UUID) (int, error)
	HasActiveDirectReferral(ctx context.Context, userID uuid.UUID) (bool, error)
}

// WithdrawalRepository handles withdrawal requests
type WithdrawalRepository interface {
	CreateRequest(ctx context.Context, req *domain.Withdrawal) error
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error)
	GetPending(ctx context.Context) ([]*domain.Withdrawal, error)
	UpdateRequestStatus(ctx context.Context, id uuid.UUID, status string, adminNote string) error
	GetPendingCount(ctx context.Context) (int, error)
	GetAll(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error)
}
