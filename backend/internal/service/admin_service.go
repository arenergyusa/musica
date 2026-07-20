package service

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminService interface {
	ActivateInvestment(ctx context.Context, invID uuid.UUID) error
	ApproveWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error
	RejectWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error
	BlockUser(ctx context.Context, userID uuid.UUID) error
	GetDashboardStats(ctx context.Context) (map[string]interface{}, error)
	GetUsers(ctx context.Context, limit, offset int) ([]*domain.User, error)
	GetPendingKYC(ctx context.Context, limit, offset int) ([]*domain.User, error)
	ApproveKYC(ctx context.Context, userID uuid.UUID) error
	RejectKYC(ctx context.Context, userID uuid.UUID, reason string) error
	GetAllWithdrawals(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error)
	GetSettings(ctx context.Context) (*domain.PlatformSettings, error)
	UpdateSettings(ctx context.Context, settings *domain.PlatformSettings) error
}

type adminService struct {
	dbPool       *pgxpool.Pool
	invRepo      repository.InvestmentRepository
	wdRepo       repository.WithdrawalRepository
	userRepo     repository.UserRepository
	walletRepo   repository.WalletRepository
	settingsRepo repository.SettingsRepository
}

func NewAdminService(dbPool *pgxpool.Pool, invRepo repository.InvestmentRepository, wdRepo repository.WithdrawalRepository, userRepo repository.UserRepository, walletRepo repository.WalletRepository, settingsRepo repository.SettingsRepository) AdminService {
	return &adminService{
		dbPool:       dbPool,
		invRepo:      invRepo,
		wdRepo:       wdRepo,
		userRepo:     userRepo,
		walletRepo:   walletRepo,
		settingsRepo: settingsRepo,
	}
}

func (s *adminService) ActivateInvestment(ctx context.Context, invID uuid.UUID) error {
	// 1. Mark investment as ACTIVE
	if err := s.invRepo.UpdateInvestmentStatus(ctx, invID, "ACTIVE"); err != nil {
		return err
	}
	// Note: Referral rewards calculation could be triggered here or via an event queue.
	// For simplicity in MVP, we can leave it to background cron or direct service call.
	return nil
}

func (s *adminService) ApproveWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error {
	// Status transition to PROCESSED
	return s.wdRepo.UpdateRequestStatus(ctx, wdID, "PROCESSED", adminNote)
}

func (s *adminService) RejectWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error {
	tx, err := s.dbPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var userID uuid.UUID
	var amountRequested float64
	var status string
	err = tx.QueryRow(ctx, "SELECT user_id, amount_requested, status FROM withdrawals WHERE id = $1 FOR UPDATE", wdID).Scan(&userID, &amountRequested, &status)
	if err != nil {
		return err
	}
	if status != "PENDING" {
		return errors.New("only pending withdrawals can be rejected")
	}

	// Update withdrawal status
	_, err = tx.Exec(ctx, "UPDATE withdrawals SET status = 'REJECTED', admin_note = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2", adminNote, wdID)
	if err != nil {
		return err
	}

	// Credit wallet
	walletQuery := `
		UPDATE reward_wallet 
		SET balance = balance + $1, total_credited = total_credited + $1, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2
	`
	res, err := tx.Exec(ctx, walletQuery, amountRequested, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("wallet not found")
	}

	txQuery := `
		INSERT INTO transactions (user_id, type, amount, source, reference_id, description)
		VALUES ($1, 'CREDIT', $2, 'WITHDRAWAL_REFUND', $3, $4)
	`
	desc := "Withdrawal rejected: " + adminNote
	_, err = tx.Exec(ctx, txQuery, userID, amountRequested, wdID.String(), desc)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *adminService) BlockUser(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	user.Status = "BLOCKED"
	return s.userRepo.Update(ctx, user)
}

func (s *adminService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	var totalUsers, activeInvestments, pendingKyc, pendingWithdrawals int
	var totalInvested, totalPaid float64

	totalUsers, _ = s.userRepo.GetTotalCount(ctx)
	pendingKyc, _ = s.userRepo.GetPendingKYCCount(ctx)
	activeInvestments, _ = s.invRepo.GetActiveCount(ctx)
	totalInvested, _ = s.invRepo.GetTotalActiveInvested(ctx)
	totalPaid, _ = s.walletRepo.GetTotalPaid(ctx)
	pendingWithdrawals, _ = s.wdRepo.GetPendingCount(ctx)

	return map[string]interface{}{
		"totalUsers": totalUsers,
		"activeInvestments": activeInvestments,
		"totalInvested": totalInvested,
		"totalPaid": totalPaid,
		"pendingKyc": pendingKyc,
		"pendingWithdrawals": pendingWithdrawals,
	}, nil
}

func (s *adminService) GetUsers(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	return s.userRepo.GetAll(ctx, limit, offset)
}

func (s *adminService) GetPendingKYC(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	return s.userRepo.GetPendingKYC(ctx, limit, offset)
}

func (s *adminService) ApproveKYC(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	user.KycStatus = "APPROVED"
	user.KycRejectionReason = "" // Clear reason on approval
	return s.userRepo.Update(ctx, user)
}

func (s *adminService) RejectKYC(ctx context.Context, userID uuid.UUID, reason string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	user.KycStatus = "REJECTED"
	user.KycRejectionReason = reason
	return s.userRepo.Update(ctx, user)
}

func (s *adminService) GetAllWithdrawals(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error) {
	return s.wdRepo.GetAll(ctx, limit, offset)
}

func (s *adminService) GetSettings(ctx context.Context) (*domain.PlatformSettings, error) {
	return s.settingsRepo.GetSettings(ctx)
}

func (s *adminService) UpdateSettings(ctx context.Context, settings *domain.PlatformSettings) error {
	return s.settingsRepo.UpdateSettings(ctx, settings)
}
