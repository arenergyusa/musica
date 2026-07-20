package repository

import (
	"context"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type withdrawalRepository struct {
	db *pgxpool.Pool
}

func NewWithdrawalRepository(db *pgxpool.Pool) WithdrawalRepository {
	return &withdrawalRepository{db: db}
}

func (r *withdrawalRepository) CreateRequest(ctx context.Context, req *domain.Withdrawal) error {
	query := `
		INSERT INTO withdrawals (user_id, amount_requested, tds_amount, net_amount, status, scheduled_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(ctx, query,
		req.UserID, req.AmountRequested, req.TDSAmount, req.NetAmount, req.Status, req.ScheduledDate,
	).Scan(&req.ID, &req.CreatedAt)
	return err
}

func (r *withdrawalRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Withdrawal, error) {
	query := `
		SELECT id, user_id, amount_requested, tds_amount, net_amount, status, payment_ref, scheduled_date, processed_at, admin_note
		FROM withdrawals
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanWithdrawals(rows)
}

func (r *withdrawalRepository) GetPending(ctx context.Context) ([]*domain.Withdrawal, error) {
	query := `
		SELECT id, user_id, amount_requested, tds_amount, net_amount, status, payment_ref, scheduled_date, processed_at, admin_note
		FROM withdrawals
		WHERE status = 'PENDING'
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanWithdrawals(rows)
}

func scanWithdrawals(rows pgx.Rows) ([]*domain.Withdrawal, error) {
	var wds []*domain.Withdrawal
	for rows.Next() {
		w := &domain.Withdrawal{}
		if err := rows.Scan(&w.ID, &w.UserID, &w.AmountRequested, &w.TDSAmount, &w.NetAmount, &w.Status, &w.PaymentRef, &w.ScheduledDate, &w.ProcessedAt, &w.AdminNote); err != nil {
			return nil, err
		}
		wds = append(wds, w)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return wds, nil
}

func (r *withdrawalRepository) UpdateRequestStatus(ctx context.Context, id uuid.UUID, status string, adminNote string) error {
	query := `
		UPDATE withdrawals 
		SET status = $1, admin_note = $2, processed_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, status, adminNote, id)
	return err
}

func (r *withdrawalRepository) GetPendingCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM withdrawals WHERE status = 'PENDING'").Scan(&count)
	return count, err
}

func (r *withdrawalRepository) GetAll(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error) {
	query := "SELECT id, user_id, amount_requested, status, admin_note, created_at FROM withdrawals ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wds []*domain.Withdrawal
	for rows.Next() {
		w := &domain.Withdrawal{}
		err := rows.Scan(&w.ID, &w.UserID, &w.AmountRequested, &w.Status, &w.AdminNote, &w.CreatedAt)
		if err != nil {
			return nil, err
		}
		wds = append(wds, w)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return wds, nil
}
