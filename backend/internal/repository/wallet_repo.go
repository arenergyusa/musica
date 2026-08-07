package repository

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrAlreadyProcessed is returned by CreditReward when a DAILY_REWARD credit for
// the same investment+date was already applied. Callers should treat it as a
// benign duplicate, never as a failure.
var ErrAlreadyProcessed = errors.New("reward already processed for this investment and day")

type walletRepository struct {
	db *pgxpool.Pool
}

func NewWalletRepository(db *pgxpool.Pool) WalletRepository {
	return &walletRepository{db: db}
}

func (r *walletRepository) GetBalance(ctx context.Context, userID uuid.UUID) (*domain.RewardWallet, error) {
	query := `SELECT id, user_id, balance, total_credited, total_withdrawn, COALESCE(salary_income, 0) FROM reward_wallet WHERE user_id = $1`
	var w domain.RewardWallet
	err := r.db.QueryRow(ctx, query, userID).Scan(&w.ID, &w.UserID, &w.Balance, &w.TotalCredited, &w.TotalWithdrawn, &w.SalaryIncome)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *walletRepository) CreditReward(ctx context.Context, userID uuid.UUID, amount float64, txType string, source string, refID string, rewardDate string, desc string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// For DAILY_REWARD the idempotency log insert gates the credit: if this
	// investment+date was already processed (concurrent cron run, restart, etc.)
	// the insert conflicts, no row is returned and the whole transaction aborts
	// before the wallet or transactions tables are touched.
	//
	// rewardDate is the reward day in IST (e.g. "2006-01-02"), the same value
	// used by HasDailyRewardBeenProcessed and the description. It must NOT use
	// the DB's UTC CURRENT_DATE, otherwise the gate and the check can disagree
	// around midnight and double credits (or skipped credits) slip through.
	if source == "DAILY_REWARD" && refID != "" {
		logQuery := `
			INSERT INTO daily_reward_log (investment_id, user_id, amount, date, processed_at)
			VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
			ON CONFLICT (investment_id, date) DO NOTHING
			RETURNING id
		`
		var logID uuid.UUID
		if err := tx.QueryRow(ctx, logQuery, refID, userID, amount, rewardDate).Scan(&logID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrAlreadyProcessed
			}
			return err
		}
	}

	if err := creditWalletTx(ctx, tx, userID, amount, txType, source, refID, desc); err != nil {
		return err
	}

	// C4: consume the investment's income cap in the SAME transaction as the
	// wallet credit so a crash can never leave a credited reward without cap
	// accounting (previously the cron updated income_cap_tracker in a separate
	// transaction, which could desync). The daily_reward_log gate above already
	// guarantees this credit runs exactly once, and ConsumeCapInTx locks the
	// sponsorship row so concurrent cap updates serialize.
	if source == "DAILY_REWARD" && refID != "" {
		invID, uuidErr := uuid.Parse(refID)
		if uuidErr == nil {
			if err := ConsumeCapInTx(ctx, tx, invID, amount); err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}

// creditWalletTx atomically upserts the wallet balance and appends a
// transaction row inside an already-open transaction.
func creditWalletTx(ctx context.Context, tx pgx.Tx, userID uuid.UUID, amount float64, txType string, source string, refID string, desc string) error {
	var ref interface{} = refID
	if refID == "" {
		ref = nil
	}

	// Ensure wallet exists or update atomically
	walletQuery := `
		INSERT INTO reward_wallet (id, user_id, balance, total_credited, total_withdrawn)
		VALUES (uuid_generate_v4(), $2, $1, $1, 0)
		ON CONFLICT (user_id) DO UPDATE
		SET balance = reward_wallet.balance + EXCLUDED.balance,
		    total_credited = reward_wallet.total_credited + EXCLUDED.total_credited,
		    updated_at = CURRENT_TIMESTAMP
	`
	if _, err := tx.Exec(ctx, walletQuery, amount, userID); err != nil {
		return err
	}

	// Insert transaction log
	txQuery := `
		INSERT INTO transactions (user_id, type, amount, source, reference_id, description)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := tx.Exec(ctx, txQuery, userID, txType, amount, source, ref, desc)
	return err
}

// CreditLevelIncomeWithLog credits level income to a beneficiary's wallet and
// records the payout in level_income_log atomically. The unique index on
// (beneficiary_user_id, source_sponsorship_id, level, date) makes the credit
// idempotent: a retry of the same cron run (restart, concurrent replica)
// returns ErrAlreadyProcessed instead of double-crediting the wallet or
// double-consuming the upline's cap (C5).
func (r *walletRepository) CreditLevelIncomeWithLog(ctx context.Context, beneficiaryID uuid.UUID, sourceUserID uuid.UUID, sourceInvID uuid.UUID, level int, amount float64, date string, desc string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	logQuery := `
		INSERT INTO level_income_log (beneficiary_user_id, source_user_id, source_sponsorship_id, level, amount, date)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (beneficiary_user_id, source_sponsorship_id, level, date) DO NOTHING
		RETURNING id
	`
	var logID uuid.UUID
	if err := tx.QueryRow(ctx, logQuery, beneficiaryID, sourceUserID, sourceInvID, level, amount, date).Scan(&logID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrAlreadyProcessed
		}
		return err
	}

	if err := creditWalletTx(ctx, tx, beneficiaryID, amount, "CREDIT", "LEVEL_INCOME", sourceInvID.String(), desc); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ConsumeCapInTx adds `amount` to an investment's income cap inside an
// already-open transaction. It locks the sponsorship row so concurrent cap
// updates serialize, then keeps income_cap_tracker.total_reward_earned and
// sponsorships.total_reward_earned in sync (bounded at cap_limit) and flips
// the investment to CLOSED once the cap is reached.
//
// The tracker row may be missing for legacy investments that predate cap
// tracking (e.g. d0527ca0): in that case it is seeded from the sponsorship so
// cap accounting always runs. Previously ErrNoRows was treated as a silent
// no-op, which let such investments earn past their cap forever.
func ConsumeCapInTx(ctx context.Context, tx pgx.Tx, investmentID uuid.UUID, amount float64) error {
	var total, cap float64
	err := tx.QueryRow(ctx, `
		SELECT COALESCE(ic.total_reward_earned, s.total_reward_earned), s.cap_limit
		FROM sponsorships s
		LEFT JOIN income_cap_tracker ic ON ic.sponsorship_id = s.id
		WHERE s.id = $1
		FOR UPDATE OF s
	`, investmentID).Scan(&total, &cap)
	if err != nil {
		return err
	}

	newTotal := total + amount
	if newTotal > cap {
		newTotal = cap
	}
	capped := newTotal >= cap && cap > 0

	// Upsert the tracker so a missing row is created (seeded from the
	// sponsorship) rather than silently skipped.
	if _, err := tx.Exec(ctx, `
		INSERT INTO income_cap_tracker (sponsorship_id, cap_limit, total_reward_earned, is_capped, capped_at)
		VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE NULL END)
		ON CONFLICT (sponsorship_id) DO UPDATE
		SET total_reward_earned = $3,
		    is_capped = $4,
		    capped_at = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE income_cap_tracker.capped_at END,
		    updated_at = CURRENT_TIMESTAMP
	`, investmentID, cap, newTotal, capped); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE sponsorships
		SET total_reward_earned = $1,
		    status = CASE WHEN $2 THEN 'CLOSED' ELSE status END,
		    closed_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE closed_at END
		WHERE id = $3
	`, newTotal, capped, investmentID); err != nil {
		return err
	}
	return nil
}

func (r *walletRepository) DebitWithdrawal(ctx context.Context, userID uuid.UUID, amount float64, refID string, desc string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update wallet atomically
	walletQuery := `
		UPDATE reward_wallet 
		SET balance = balance - $1, total_withdrawn = total_withdrawn + $1, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2 AND balance >= $1
	`
	res, err := tx.Exec(ctx, walletQuery, amount, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("insufficient balance")
	}

	// Insert transaction log
	txQuery := `
		INSERT INTO transactions (user_id, type, amount, source, reference_id, description)
		VALUES ($1, 'DEBIT', $2, 'WITHDRAWAL', $3, $4)
	`
	var ref interface{} = refID
	if refID == "" {
		ref = nil
	}

	_, err = tx.Exec(ctx, txQuery, userID, amount, ref, desc)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *walletRepository) GetTransactions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Transaction, error) {
	query := `
		SELECT id, user_id, type, amount, source, reference_id, description, created_at
		FROM transactions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
		`
	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []*domain.Transaction
	for rows.Next() {
		t := &domain.Transaction{}
		var refID *string
		var desc *string
		if err := rows.Scan(&t.ID, &t.UserID, &t.Type, &t.Amount, &t.Source, &refID, &desc, &t.CreatedAt); err != nil {
			return nil, err
		}
		if refID != nil {
			t.ReferenceID = *refID
		}
		if desc != nil {
			t.Description = *desc
		}
		txs = append(txs, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return txs, nil
}

func (r *walletRepository) GetIncomeChartData(ctx context.Context, userID uuid.UUID, days int) ([]map[string]interface{}, error) {
	query := `
		SELECT TO_CHAR(DATE(created_at), 'Mon DD') as date, SUM(amount) as amount
		FROM transactions
		WHERE user_id = $1 AND type = 'CREDIT' AND created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
		GROUP BY DATE(created_at)
		ORDER BY DATE(created_at) ASC
	`
	rows, err := r.db.Query(ctx, query, userID, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var date string
		var amount float64
		if err := rows.Scan(&date, &amount); err != nil {
			return nil, err
		}
		data = append(data, map[string]interface{}{
			"date":   date,
			"amount": amount,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return data, nil
}

// GetTotalPaid returns total platform income paid to users. Only genuine income
// sources count — withdrawal refunds (CREDIT + source WITHDRAWAL) and any other
// non-income credits are excluded so the admin "total paid" figure is not
// inflated (H11).
func (r *walletRepository) GetTotalPaid(ctx context.Context) (float64, error) {
	var total float64
	err := r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount), 0)
		FROM transactions
		WHERE type = 'CREDIT'
		  AND source IN ('DAILY_REWARD', 'LEVEL_INCOME', 'INVITE', 'SALARY_INCOME')
	`).Scan(&total)
	return total, err
}

// GetDailyIncomeBySource returns daily totals for a specific transaction source over the last N days (admin analytics).
func (r *walletRepository) GetDailyIncomeBySource(ctx context.Context, source string, days int) ([]map[string]interface{}, error) {
	query := `
		WITH date_series AS (
			SELECT generate_series(
				((now() AT TIME ZONE 'Asia/Kolkata')::date - (INTERVAL '1 day' * ($2 - 1)))::date,
				(now() AT TIME ZONE 'Asia/Kolkata')::date,
				INTERVAL '1 day'
			)::date AS d
		)
		SELECT TO_CHAR(ds.d, 'Mon DD') AS date,
		       COALESCE(SUM(t.amount), 0) AS amount
		FROM date_series ds
		LEFT JOIN transactions t ON DATE(t.created_at AT TIME ZONE 'Asia/Kolkata') = ds.d
		                        AND t.source = $1
		                        AND t.type = 'CREDIT'
		GROUP BY ds.d
		ORDER BY ds.d ASC
	`
	rows, err := r.db.Query(ctx, query, source, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var date string
		var amount float64
		if err := rows.Scan(&date, &amount); err != nil {
			return nil, err
		}
		data = append(data, map[string]interface{}{"date": date, "amount": amount})
	}
	return data, rows.Err()
}

func (r *walletRepository) GetLifetimeIncomeBySource(ctx context.Context, userID uuid.UUID, source string) (float64, error) {
	var total float64
	var query string
	if source == "INVITE" {
		query = `
		SELECT COALESCE(SUM(amount), 0)
		FROM transactions
		WHERE user_id = $1
		  AND type = 'CREDIT'
		  AND source = $2
		  AND description ~ '^L[1-3] invite bonus'`
	} else {
		query = `
		SELECT COALESCE(SUM(amount), 0)
		FROM transactions
		WHERE user_id = $1
		  AND type = 'CREDIT'
		  AND source = $2`
	}
	err := r.db.QueryRow(ctx, query, userID, source).Scan(&total)
	return total, err
}

func (r *walletRepository) HasDailyRewardBeenProcessed(ctx context.Context, investmentID uuid.UUID, dateStr string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM daily_reward_log WHERE investment_id = $1 AND date = $2)`
	err := r.db.QueryRow(ctx, query, investmentID, dateStr).Scan(&exists)
	return exists, err
}
