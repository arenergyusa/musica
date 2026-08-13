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
	GetByPhone(ctx context.Context, phone string) (*domain.User, error)
	GetByInviteCode(ctx context.Context, code string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	// UpdateAdminFields updates admin-editable profile fields for a user
	// (name, phone, email, usdt_address). Returns ErrEmailTaken when email
	// already belongs to another account.
	UpdateAdminFields(ctx context.Context, id uuid.UUID, name, phone, email, usdtAddress string) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetTotalCount(ctx context.Context) (int, error)
	GetAll(ctx context.Context, limit, offset int) ([]*domain.User, error)
	// SearchUsers filters by optional name/email search and status
	SearchUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error)
	// GetDailySignups returns daily new user counts for the last N days
	GetDailySignups(ctx context.Context, days int) ([]map[string]interface{}, error)
	// GetByIdentifier resolves a user by email OR generated username (login).
	GetByIdentifier(ctx context.Context, identifier string) (*domain.User, error)
	// GenerateUniqueUsername returns a fresh "MUxxxxxxx" username that is free.
	GenerateUniqueUsername(ctx context.Context) (string, error)
	// GetUsersMissingUsernameEmail lists ACTIVE users still owed their username email.
	GetUsersMissingUsernameEmail(ctx context.Context) ([]*domain.User, error)
	// MarkUsernameEmailSent records that the username email was delivered.
	MarkUsernameEmailSent(ctx context.Context, id uuid.UUID) error
}

// InvestmentRepository handles sponsorship and plan data
type InvestmentRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Sponsorship, error)
	GetPlans(ctx context.Context) ([]*domain.SponsorshipPlan, error)
	CreateInvestment(ctx context.Context, inv *domain.Sponsorship) error
	GetInvestmentsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Sponsorship, error)
	GetActiveInvestments(ctx context.Context) ([]*domain.Sponsorship, error)
	GetActiveInvestmentsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Sponsorship, error)
	UpdateInvestmentStatus(ctx context.Context, id uuid.UUID, status string) error
	UpdateInvestmentStatusAtomic(ctx context.Context, id uuid.UUID, fromStatus, toStatus string) (int64, error)
	ConfirmDepositAtomic(ctx context.Context, id, userID uuid.UUID, txHash string) (int64, error)
	// Track cap
	UpdateCapTracker(ctx context.Context, investmentID uuid.UUID, rewardAmount float64) error
	// UpdateInvestmentCap rewrites the cap limit and working flag (used to
	// upgrade a sponsorship's multiplier once WORKING status is provable).
	UpdateInvestmentCap(ctx context.Context, id uuid.UUID, capLimit float64, isWorking bool) (int64, error)
	GetActiveCount(ctx context.Context) (int, error)
	GetTotalActiveInvested(ctx context.Context) (float64, error)
	GetPendingCount(ctx context.Context) (int, error)
	// HasActiveInvestment reports whether the user owns at least one ACTIVE sponsorship.
	HasActiveInvestment(ctx context.Context, userID uuid.UUID) (bool, error)
	// Search by user for admin
	GetAllWithFilters(ctx context.Context, limit, offset int, status, search string) ([]*domain.Sponsorship, error)
}

// WalletRepository handles wallet balances and transaction logs atomically
type WalletRepository interface {
	GetBalance(ctx context.Context, userID uuid.UUID) (*domain.RewardWallet, error)
	CreditReward(ctx context.Context, userID uuid.UUID, amount float64, txType string, source string, refID string, rewardDate string, desc string) error
	DebitWithdrawal(ctx context.Context, userID uuid.UUID, amount float64, refID string, desc string) error
	GetTransactions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Transaction, error)
	GetIncomeChartData(ctx context.Context, userID uuid.UUID, days int) ([]map[string]interface{}, error)
	GetTotalPaid(ctx context.Context) (float64, error)
	// GetDailyIncomeBySource returns daily total income grouped by date for a given source (admin analytics)
	GetDailyIncomeBySource(ctx context.Context, source string, days int) ([]map[string]interface{}, error)
	GetLifetimeIncomeBySource(ctx context.Context, userID uuid.UUID, source string) (float64, error)
	HasDailyRewardBeenProcessed(ctx context.Context, investmentID uuid.UUID, dateStr string) (bool, error)
	// CreditLevelIncomeWithLog credits level income idempotently: it records the
	// payout in level_income_log (unique per beneficiary+source+level+date) in
	// the same transaction as the wallet credit, returning ErrAlreadyProcessed
	// when the payout was already applied.
	CreditLevelIncomeWithLog(ctx context.Context, beneficiaryID uuid.UUID, sourceUserID uuid.UUID, sourceInvID uuid.UUID, level int, amount float64, date string, desc string) error
}

// MLMRepository handles invite tree and volume logic
type MLMRepository interface {
	InsertNode(ctx context.Context, userID uuid.UUID, uplineID uuid.UUID) error
	GetDirectReferrals(ctx context.Context, userID uuid.UUID) ([]*domain.User, error)
	GetDownlineVolume(ctx context.Context, userID uuid.UUID) (float64, error)
	GetDownlineTotalInvestment(ctx context.Context, userID uuid.UUID) (float64, error)
	HasActiveDirectReferral(ctx context.Context, userID uuid.UUID) (bool, error)
	GetDirectVolumeAndCount(ctx context.Context, userID uuid.UUID) (float64, int, error)
	// GetUplineChain returns upline userIDs ordered from nearest (L1) to farthest (L15)
	GetUplineChain(ctx context.Context, userID uuid.UUID, maxLevels int) ([]uuid.UUID, error)
	// GetAncestorAtLevel returns the ancestor user_id at exactly `level` steps above
	GetAncestorAtLevel(ctx context.Context, userID uuid.UUID, level int) (*uuid.UUID, error)
	GetTeamBreakdown(ctx context.Context, userID uuid.UUID, maxLevel int) (*domain.TeamBreakdown, error)
}

// WithdrawalRepository handles withdrawal requests
type WithdrawalRepository interface {
	CreateRequest(ctx context.Context, req *domain.Withdrawal) error
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error)
	GetPending(ctx context.Context) ([]*domain.Withdrawal, error)
	UpdateRequestStatus(ctx context.Context, id uuid.UUID, status string, adminNote string) error
	UpdateRequestStatusWithRef(ctx context.Context, id uuid.UUID, status string, paymentRef string, adminNote string) error
	// GetProcessing returns withdrawals stuck in the ambiguous-broadcast state
	// (PROCESSING with a payment_ref) that still need on-chain reconciliation.
	GetProcessing(ctx context.Context) ([]*domain.Withdrawal, error)
	GetPendingCount(ctx context.Context) (int, error)
	GetAll(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error)
}

// SettingsRepository handles platform-wide configurations
type SettingsRepository interface {
	GetSettings(ctx context.Context) (*domain.PlatformSettings, error)
	UpdateSettings(ctx context.Context, settings *domain.PlatformSettings) error
}
