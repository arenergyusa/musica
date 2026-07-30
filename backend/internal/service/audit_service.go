package service

import (
	"context"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuditService interface {
	Log(ctx context.Context, userID *uuid.UUID, action string, amountUSD, usdtAmount float64, txHash, status, detailsJSON string) error
	GetLogsForUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.TransactionAuditLog, error)
}

type auditService struct {
	db *pgxpool.Pool
}

func NewAuditService(db *pgxpool.Pool) AuditService {
	return &auditService{db: db}
}

func (s *auditService) Log(ctx context.Context, userID *uuid.UUID, action string, amountUSD, usdtAmount float64, txHash, status, detailsJSON string) error {
	query := `
		INSERT INTO transaction_audit_logs 
			(id, user_id, action, amount_usd, usdt_amount, tx_hash, status, details, created_at)
		VALUES 
			(uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7::jsonb, CURRENT_TIMESTAMP)
	`
	if detailsJSON == "" {
		detailsJSON = "{}"
	}
	_, err := s.db.Exec(ctx, query, userID, action, amountUSD, usdtAmount, txHash, status, detailsJSON)
	return err
}

func (s *auditService) GetLogsForUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.TransactionAuditLog, error) {
	query := `
		SELECT id, user_id, action, amount_usd, usdt_amount, tx_hash, status, details, created_at
		FROM transaction_audit_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := s.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*domain.TransactionAuditLog
	for rows.Next() {
		logItem := &domain.TransactionAuditLog{}
		if err := rows.Scan(
			&logItem.ID, &logItem.UserID, &logItem.Action, &logItem.AmountUSD,
			&logItem.UsdtAmount, &logItem.TxHash, &logItem.Status, &logItem.Details, &logItem.CreatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, logItem)
	}
	return logs, nil
}
