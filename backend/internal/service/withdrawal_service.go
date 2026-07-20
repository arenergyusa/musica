package service

import (
	"context"
	"errors"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WithdrawalService interface {
	RequestWithdrawal(ctx context.Context, userID uuid.UUID, req *domain.WithdrawRequest) (*domain.Withdrawal, error)
	GetMyWithdrawals(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error)
	GetNextWithdrawalDate() time.Time
}

type withdrawalService struct {
	dbPool       *pgxpool.Pool
	wdRepo       repository.WithdrawalRepository
	walletRepo   repository.WalletRepository
	userRepo     repository.UserRepository
	settingsRepo repository.SettingsRepository
}

func NewWithdrawalService(dbPool *pgxpool.Pool, wdRepo repository.WithdrawalRepository, walletRepo repository.WalletRepository, userRepo repository.UserRepository, settingsRepo repository.SettingsRepository) WithdrawalService {
	return &withdrawalService{
		dbPool:       dbPool,
		wdRepo:       wdRepo,
		walletRepo:   walletRepo,
		userRepo:     userRepo,
		settingsRepo: settingsRepo,
	}
}

func (s *withdrawalService) GetNextWithdrawalDate() time.Time {
	now := time.Now()
	year, month, day := now.Date()

	var nextDay int
	if day <= 10 {
		nextDay = 10
	} else if day <= 20 {
		nextDay = 20
	} else {
		nextDay = 30
		// Handle February (28 or 29)
		if month == time.February {
			if isLeapYear(year) {
				nextDay = 29
			} else {
				nextDay = 28
			}
		}
	}

	if day > nextDay {
		// Moving to next month
		month++
		if month > 12 {
			month = 1
			year++
		}
		nextDay = 10
	}

	return time.Date(year, month, nextDay, 0, 0, 0, 0, now.Location())
}

func isLeapYear(year int) bool {
	return year%400 == 0 || (year%4 == 0 && year%100 != 0)
}

func (s *withdrawalService) RequestWithdrawal(ctx context.Context, userID uuid.UUID, req *domain.WithdrawRequest) (*domain.Withdrawal, error) {
	// 1. Check User Bank Details
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.BankAccount == "" || user.IFSC == "" {
		return nil, errors.New("bank details must be added before requesting withdrawal")
	}

	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return nil, errors.New("failed to load platform settings")
	}

	tdsAmount, netAmount, err := CalculateNetWithdrawal(req.Amount, settings)
	if err != nil {
		return nil, err
	}

	tx, err := s.dbPool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 2. Debit wallet atomically
	walletQuery := `
		UPDATE reward_wallet 
		SET balance = balance - $1, total_withdrawn = total_withdrawn + $1, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2 AND balance >= $1
	`
	res, err := tx.Exec(ctx, walletQuery, req.Amount, userID)
	if err != nil {
		return nil, err
	}
	if res.RowsAffected() == 0 {
		return nil, errors.New("insufficient wallet balance")
	}

	txQuery := `
		INSERT INTO transactions (user_id, type, amount, source, reference_id, description)
		VALUES ($1, 'DEBIT', $2, 'WITHDRAWAL', NULL, $3)
	`
	_, err = tx.Exec(ctx, txQuery, userID, req.Amount, "Withdrawal request")
	if err != nil {
		return nil, err
	}

	wd := &domain.Withdrawal{
		UserID:          userID,
		AmountRequested: req.Amount,
		TDSAmount:       tdsAmount,
		NetAmount:       netAmount,
		Status:          "PENDING",
		ScheduledDate:   s.GetNextWithdrawalDate(),
	}

	// 4. Create Withdrawal record
	wdQuery := `
		INSERT INTO withdrawals (user_id, amount_requested, tds_amount, net_amount, status, scheduled_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	err = tx.QueryRow(ctx, wdQuery,
		wd.UserID, wd.AmountRequested, wd.TDSAmount, wd.NetAmount, wd.Status, wd.ScheduledDate,
	).Scan(&wd.ID, &wd.CreatedAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return wd, nil
}

func (s *withdrawalService) GetMyWithdrawals(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error) {
	return s.wdRepo.GetByUserID(ctx, userID)
}
