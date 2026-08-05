package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WithdrawalService interface {
	RequestWithdrawal(ctx context.Context, userID uuid.UUID, req *domain.WithdrawRequest) (*domain.Withdrawal, error)
	GetMyWithdrawals(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error)
}

type withdrawalService struct {
	dbPool       *pgxpool.Pool
	wdRepo       repository.WithdrawalRepository
	walletRepo   repository.WalletRepository
	userRepo     repository.UserRepository
	settingsRepo repository.SettingsRepository
	usdtService  USDTService
}

func NewWithdrawalService(
	dbPool *pgxpool.Pool,
	wdRepo repository.WithdrawalRepository,
	walletRepo repository.WalletRepository,
	userRepo repository.UserRepository,
	settingsRepo repository.SettingsRepository,
	usdtService USDTService,
) WithdrawalService {
	return &withdrawalService{
		dbPool:       dbPool,
		wdRepo:       wdRepo,
		walletRepo:   walletRepo,
		userRepo:     userRepo,
		settingsRepo: settingsRepo,
		usdtService:  usdtService,
	}
}

func (s *withdrawalService) RequestWithdrawal(ctx context.Context, userID uuid.UUID, req *domain.WithdrawRequest) (*domain.Withdrawal, error) {
	// 1. Check User USDT Address
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.UsdtAddress == "" {
		return nil, errors.New("USDT (BEP-20) address must be configured in Profile before requesting a withdrawal")
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
	_, err = tx.Exec(ctx, txQuery, userID, req.Amount, "Automated USDT Withdrawal Payout")
	if err != nil {
		return nil, err
	}

	wd := &domain.Withdrawal{
		UserID:          userID,
		AmountRequested: req.Amount,
		TDSAmount:       tdsAmount,
		NetAmount:       netAmount,
		Status:          "PENDING",
		ScheduledDate:   time.Now(),
	}

	// 3. Create Withdrawal record
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

	// 4. Trigger the automatic payout immediately. There is no admin approval step.
	if s.usdtService == nil {
		_ = s.refundFailedWithdrawal(ctx, wd.ID, userID, req.Amount, "Automatic payout service is unavailable")
		return nil, errors.New("automatic payout service is unavailable")
	}
	txHash, payoutErr := s.usdtService.ProcessAutoWithdrawal(ctx, wd.ID, userID, user.UsdtAddress, netAmount)
	if payoutErr != nil || txHash == "" {
		// A broadcast may have landed on-chain even when the RPC response was lost
		// (timeout / connection reset). Before refunding, verify the locally
		// computed tx hash on the chain with a detached context so a client
		// disconnect cannot abort the reconciliation.
		if txHash != "" {
			verifyCtx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
			defer cancel()
			for i := 0; i < 5; i++ {
				mined, checkErr := s.usdtService.IsTransactionMined(verifyCtx, txHash)
				if checkErr == nil && mined {
					wd.PaymentRef = txHash
					wd.Status = "PROCESSED"
					_ = s.wdRepo.UpdateRequestStatusWithRef(verifyCtx, wd.ID, "PROCESSED", txHash, "Automatic BEP-20 payout verified on-chain after broadcast ambiguity")
					return wd, nil
				}
				select {
				case <-time.After(3 * time.Second):
				case <-verifyCtx.Done():
				}
				if verifyCtx.Err() != nil {
					break
				}
			}
		}
		reason := "automatic payout failed"
		if payoutErr != nil {
			reason = payoutErr.Error()
		}
		if refundErr := s.refundFailedWithdrawal(ctx, wd.ID, userID, req.Amount, reason); refundErr != nil {
			return nil, fmt.Errorf("%s; refund failed: %w", reason, refundErr)
		}
		return nil, errors.New(reason)
	}

	wd.PaymentRef = txHash
	wd.Status = "PROCESSED"
	_ = s.wdRepo.UpdateRequestStatusWithRef(ctx, wd.ID, "PROCESSED", txHash, "Automatic BEP-20 payout broadcast via master key")

	return wd, nil
}

// refundFailedWithdrawal restores the debited amount when signing/broadcasting
// fails before a transaction hash is returned to the service.
func (s *withdrawalService) refundFailedWithdrawal(ctx context.Context, withdrawalID, userID uuid.UUID, amount float64, reason string) error {
	tx, err := s.dbPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	result, err := tx.Exec(ctx, `
		UPDATE withdrawals
		SET status = 'REJECTED', admin_note = $1, processed_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND status = 'PENDING'
	`, "Automatic payout failed: "+reason, withdrawalID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("withdrawal is no longer pending")
	}

	result, err = tx.Exec(ctx, `
		UPDATE reward_wallet
		SET balance = balance + $1,
			total_withdrawn = GREATEST(total_withdrawn - $1, 0),
			updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2
	`, amount, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("wallet not found")
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO transactions (user_id, type, amount, source, reference_id, description)
		VALUES ($1, 'CREDIT', $2, 'WITHDRAWAL', $3, $4)
	`, userID, amount, withdrawalID, "Automatic withdrawal refund: "+reason)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *withdrawalService) GetMyWithdrawals(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error) {
	return s.wdRepo.GetByUserID(ctx, userID)
}
