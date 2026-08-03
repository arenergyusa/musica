package repository

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type walletRepository struct {
	db *pgxpool.Pool
}

func NewWalletRepository(db *pgxpool.Pool) WalletRepository {
	return &walletRepository{db: db}
}

func (r *walletRepository) GetBalance(ctx context.Context, userID uuid.UUID) (*domain.RewardWallet, error) {
	query := `SELECT id, user_id, balance, total_credited, total_withdrawn FROM reward_wallet WHERE user_id = $1`
	var w domain.RewardWallet
	err := r.db.QueryRow(ctx, query, userID).Scan(&w.ID, &w.UserID, &w.Balance, &w.TotalCredited, &w.TotalWithdrawn)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *walletRepository) CreditReward(ctx context.Context, userID uuid.UUID, amount float64, txType string, source string, refID string, desc string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Ensure wallet exists or update atomically
	walletQuery := `
		INSERT INTO reward_wallet (id, user_id, balance, total_credited, total_withdrawn)
		VALUES (uuid_generate_v4(), $2, $1, $1, 0)
		ON CONFLICT (user_id) DO UPDATE
		SET balance = reward_wallet.balance + EXCLUDED.balance,
		    total_credited = reward_wallet.total_credited + EXCLUDED.total_credited,
		    updated_at = CURRENT_TIMESTAMP
	`
	_, err = tx.Exec(ctx, walletQuery, amount, userID)
	if err != nil {
		return err
	}

	// Insert transaction log
	txQuery := `
		INSERT INTO transactions (user_id, type, amount, source, reference_id, description)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	// Handle empty refID correctly if UUID
	var ref interface{} = refID
	if refID == "" {
		ref = nil
	}

	_, err = tx.Exec(ctx, txQuery, userID, txType, amount, source, ref, desc)
	if err != nil {
		return err
	}

	// Insert daily_reward_log entry for idempotency and tracking if source is DAILY_REWARD
	if source == "DAILY_REWARD" && ref != nil {
		logQuery := `
			INSERT INTO daily_reward_log (investment_id, user_id, amount, date, processed_at)
			VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIMESTAMP)
			ON CONFLICT DO NOTHING
		`
		_, _ = tx.Exec(ctx, logQuery, ref, userID, amount)
	}

	return tx.Commit(ctx)
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

func (r *walletRepository) GetTotalPaid(ctx context.Context) (float64, error) {
	var total float64
	err := r.db.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'CREDIT'").Scan(&total)
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
