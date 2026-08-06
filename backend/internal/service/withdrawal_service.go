package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WithdrawalService interface {
	RequestWithdrawal(ctx context.Context, userID uuid.UUID, req *domain.WithdrawRequest) (*domain.Withdrawal, error)
	GetMyWithdrawals(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error)
	// ReconcilePendingWithdrawals finalizes PROCESSING withdrawals by checking
	// their on-chain tx hash. Confirmed txs are marked PROCESSED; hashes that
	// are absent from the chain for an extended window are safely refunded.
	ReconcilePendingWithdrawals(ctx context.Context) error
}

type withdrawalService struct {
	dbPool       *pgxpool.Pool
	wdRepo       repository.WithdrawalRepository
	walletRepo   repository.WalletRepository
	userRepo     repository.UserRepository
	settingsRepo repository.SettingsRepository
	usdtService  USDTService
}

// M4 hardening: bound per-request and per-day payout amounts so a single user
// cannot drain the master wallet in one sweep. Values are platform-wide
// defaults; adjust per business policy.
const (
	maxWithdrawalPerTx = 5000.0
	maxDailyWithdrawal = 20000.0
)

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
	if user == nil {
		return nil, errors.New("user not found")
	}
	if user.Status == "BLOCKED" {
		return nil, errors.New("account is blocked")
	}
	if user.UsdtAddress == "" {
		return nil, errors.New("USDT (BEP-20) address must be configured in Profile before requesting a withdrawal")
	}

	if req.Amount > maxWithdrawalPerTx {
		return nil, fmt.Errorf("withdrawal amount exceeds the per-transaction limit of $%.0f", maxWithdrawalPerTx)
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

	// Serialize concurrent withdrawal requests from the same user and reject
	// when a payout is already in flight, so a user can never have two
	// overlapping broadcasts draining gas or double-crediting on-chain (M4).
	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, "wd:user:"+userID.String()); err != nil {
		return nil, err
	}
	var inFlight int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM withdrawals WHERE user_id = $1 AND status IN ('PENDING', 'PROCESSING')`, userID).Scan(&inFlight); err != nil {
		return nil, err
	}
	if inFlight > 0 {
		return nil, errors.New("a withdrawal request is already being processed. Please try again once it completes.")
	}

	// Daily per-user cap on total requested amounts (M4).
	var todaySum float64
	if err := tx.QueryRow(ctx, `SELECT COALESCE(SUM(amount_requested), 0) FROM withdrawals WHERE user_id = $1 AND scheduled_date >= CURRENT_DATE`, userID).Scan(&todaySum); err != nil {
		return nil, err
	}
	if todaySum+req.Amount > maxDailyWithdrawal {
		return nil, fmt.Errorf("daily withdrawal limit of $%.0f exceeded", maxDailyWithdrawal)
	}

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

	// A broadcast may have landed on-chain even when the RPC response was lost
	// (timeout / connection reset). We must never auto-refund based on a short
	// poll: if the tx is in the mempool it can still mine minutes later, which
	// would let the user keep both the on-chain payout and the refund.
	if payoutErr != nil || txHash == "" {
		if txHash != "" {
			// Ambiguous broadcast: mark PROCESSING and let the durable reconcile
			// job decide, instead of guessing after ~15s. The wallet is already
			// debited, so no double-spend is possible; only a confirmed-absent
			// hash (reconcile) triggers the refund.
			wd.PaymentRef = txHash
			wd.Status = "PROCESSING"
			if err := s.wdRepo.UpdateRequestStatusWithRef(ctx, wd.ID, "PROCESSING", txHash, "Automatic BEP-20 payout broadcast ambiguous - awaiting on-chain reconciliation"); err != nil {
				return nil, fmt.Errorf("broadcast may have landed (%v); failed to mark PROCESSING: %w", payoutErr, err)
			}
			return wd, nil
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
	if err := s.wdRepo.UpdateRequestStatusWithRef(ctx, wd.ID, "PROCESSED", txHash, "Automatic BEP-20 payout broadcast via master key"); err != nil {
		// The money was already broadcast. Never leave the row PENDING (which
		// would let an admin reject + refund on top of the real payout). Mark it
		// PROCESSING so the reconcile job can finalize the record.
		wd.Status = "PROCESSING"
		if err2 := s.wdRepo.UpdateRequestStatusWithRef(ctx, wd.ID, "PROCESSING", txHash, "Payout broadcast sent; status update deferred to reconciliation"); err2 != nil {
			return nil, fmt.Errorf("payout broadcast sent but status could not be persisted: %w", err2)
		}
	} else {
		s.recordTDS(ctx, wd.ID, userID, wd.TDSAmount)
	}

	return wd, nil
}

// reconcileThreshold is how long a PROCESSING withdrawal must be absent from the
// chain before we refund it. This is far beyond mempool drop windows, so a
// legitimately-broadcast tx will always be confirmed as PROCESSED instead.
const reconcileThreshold = 24 * time.Hour

// recordTDS writes the withheld TDS for a finalized withdrawal into the
// tds_income_log ledger (M16). Failures are logged but never block the payout
// finalization — the ledger is auditable platform income, not user funds.
func (s *withdrawalService) recordTDS(ctx context.Context, withdrawalID, userID uuid.UUID, tdsAmount float64) {
	if tdsAmount <= 0 {
		return
	}
	if _, err := s.dbPool.Exec(ctx, `
		INSERT INTO tds_income_log (withdrawal_id, user_id, amount)
		VALUES ($1, $2, $3)
		ON CONFLICT (withdrawal_id) DO NOTHING
	`, withdrawalID, userID, tdsAmount); err != nil {
		log.Printf("WITHDRAWAL: failed to record TDS for %s: %v", withdrawalID, err)
	}
}

// ReconcilePendingWithdrawals checks every PROCESSING withdrawal's tx hash on
// chain. Mined/successful txs are finalized as PROCESSED. A hash that the node
// does not know about for over reconcileThreshold is refunded atomically.
func (s *withdrawalService) ReconcilePendingWithdrawals(ctx context.Context) error {
	pending, err := s.wdRepo.GetProcessing(ctx)
	if err != nil {
		return err
	}
	for _, wd := range pending {
		if wd.PaymentRef == "" {
			continue
		}
		mined, err := s.usdtService.IsTransactionMined(ctx, wd.PaymentRef)
		if err != nil {
			continue // RPC hiccup; retry next cycle
		}
		if mined {
			if err := s.wdRepo.UpdateRequestStatusWithRef(ctx, wd.ID, "PROCESSED", wd.PaymentRef, "Automatic BEP-20 payout verified on-chain by reconciliation"); err != nil {
				continue
			}
			s.recordTDS(ctx, wd.ID, wd.UserID, wd.TDSAmount)
			continue
		}

		known, err := s.usdtService.IsTransactionKnown(ctx, wd.PaymentRef)
		if err != nil {
			continue
		}
		if known {
			continue // still in mempool; keep waiting
		}
		if time.Since(wd.CreatedAt) < reconcileThreshold {
			continue
		}
		if refundErr := s.refundFailedWithdrawal(ctx, wd.ID, wd.UserID, wd.AmountRequested, "payout not found on chain after reconciliation window"); refundErr != nil {
			continue
		}
	}
	return nil
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
		WHERE id = $2 AND status IN ('PENDING', 'PROCESSING')
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
