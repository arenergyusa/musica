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

	// Update wallet atomically
	walletQuery := `
		UPDATE reward_wallet 
		SET balance = balance + $1, total_credited = total_credited + $1, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2
	`
	res, err := tx.Exec(ctx, walletQuery, amount, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("wallet not found")
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
