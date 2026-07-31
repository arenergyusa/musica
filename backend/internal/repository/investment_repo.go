package repository

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type investmentRepository struct {
	db *pgxpool.Pool
}

func NewInvestmentRepository(db *pgxpool.Pool) InvestmentRepository {
	return &investmentRepository{db: db}
}

func (r *investmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Sponsorship, error) {
	query := `
		SELECT id, user_id, amount, daily_rate_pct, status, total_reward_earned, cap_limit, working_cap_at_creation, deposit_tx_hash, deposit_confirmed_at, created_at, closed_at
		FROM sponsorships
		WHERE id = $1
	`
	i := &domain.Sponsorship{}
	err := r.db.QueryRow(ctx, query, id).Scan(&i.ID, &i.UserID, &i.Amount, &i.DailyRatePct, &i.Status, &i.TotalRewardEarned, &i.CapLimit, &i.WorkingCapAtCreation, &i.DepositTxHash, &i.DepositConfirmedAt, &i.CreatedAt, &i.ClosedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return i, nil
}

func (r *investmentRepository) GetPlans(ctx context.Context) ([]*domain.SponsorshipPlan, error) {
	// Returning a static dynamic plan since we removed the table
	plans := []*domain.SponsorshipPlan{
		{
			ID:           uuid.New(),
			Name:         "Dynamic Music Sponsorship Pool",
			MinAmount:    10000,
			DailyRatePct: 0.3333,
			Description:  "Sponsor in multiples of 10,000 INR",
			IsActive:     true,
		},
	}
	return plans, nil
}

func (r *investmentRepository) CreateInvestment(ctx context.Context, inv *domain.Sponsorship) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO sponsorships (user_id, amount, daily_rate_pct, status, cap_limit, working_cap_at_creation)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	err = tx.QueryRow(ctx, query,
		inv.UserID, inv.Amount, inv.DailyRatePct, inv.Status, inv.CapLimit, inv.WorkingCapAtCreation,
	).Scan(&inv.ID, &inv.CreatedAt)
	if err != nil {
		return err
	}

	capQuery := `
		INSERT INTO income_cap_tracker (sponsorship_id, cap_limit)
		VALUES ($1, $2)
	`
	_, err = tx.Exec(ctx, capQuery, inv.ID, inv.CapLimit)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *investmentRepository) GetInvestmentsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Sponsorship, error) {
	query := `
		SELECT id, user_id, amount, daily_rate_pct, status, total_reward_earned, cap_limit, working_cap_at_creation, deposit_tx_hash, deposit_confirmed_at, created_at, closed_at
		FROM sponsorships
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invs []*domain.Sponsorship
	for rows.Next() {
		i := &domain.Sponsorship{}
		if err := rows.Scan(&i.ID, &i.UserID, &i.Amount, &i.DailyRatePct, &i.Status, &i.TotalRewardEarned, &i.CapLimit, &i.WorkingCapAtCreation, &i.DepositTxHash, &i.DepositConfirmedAt, &i.CreatedAt, &i.ClosedAt); err != nil {
			return nil, err
		}
		invs = append(invs, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return invs, nil
}

func (r *investmentRepository) GetActiveInvestments(ctx context.Context) ([]*domain.Sponsorship, error) {
	query := `
		SELECT id, user_id, amount, daily_rate_pct, status, total_reward_earned, cap_limit, working_cap_at_creation, deposit_tx_hash, deposit_confirmed_at, created_at, closed_at
		FROM sponsorships
		WHERE status = 'ACTIVE'
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invs []*domain.Sponsorship
	for rows.Next() {
		i := &domain.Sponsorship{}
		if err := rows.Scan(&i.ID, &i.UserID, &i.Amount, &i.DailyRatePct, &i.Status, &i.TotalRewardEarned, &i.CapLimit, &i.WorkingCapAtCreation, &i.DepositTxHash, &i.DepositConfirmedAt, &i.CreatedAt, &i.ClosedAt); err != nil {
			return nil, err
		}
		invs = append(invs, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return invs, nil
}

func (r *investmentRepository) UpdateInvestmentStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `UPDATE sponsorships SET status = $1 WHERE id = $2`
	if status == "CLOSED" {
		query = `UPDATE sponsorships SET status = $1, closed_at = CURRENT_TIMESTAMP WHERE id = $2`
	}
	_, err := r.db.Exec(ctx, query, status, id)
	return err
}

func (r *investmentRepository) UpdateInvestmentStatusAtomic(ctx context.Context, id uuid.UUID, fromStatus, toStatus string) (int64, error) {
	query := `UPDATE sponsorships SET status = $1 WHERE id = $2 AND status = $3`
	if toStatus == "CLOSED" {
		query = `UPDATE sponsorships SET status = $1, closed_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = $3`
	}
	tag, err := r.db.Exec(ctx, query, toStatus, id, fromStatus)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *investmentRepository) ConfirmDepositAtomic(ctx context.Context, id, userID uuid.UUID, txHash string) (int64, error) {
	tag, err := r.db.Exec(ctx, `
		UPDATE sponsorships
		SET status = 'ACTIVE', deposit_tx_hash = $1, deposit_confirmed_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND user_id = $3 AND status = 'PENDING'`, txHash, id, userID)
	if err != nil { return 0, err }
	return tag.RowsAffected(), nil
}

func (r *investmentRepository) UpdateCapTracker(ctx context.Context, investmentID uuid.UUID, rewardAmount float64) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		UPDATE income_cap_tracker 
		SET total_reward_earned = total_reward_earned + $1, updated_at = CURRENT_TIMESTAMP
		WHERE sponsorship_id = $2
		RETURNING total_reward_earned, cap_limit
	`
	var total, cap float64
	err = tx.QueryRow(ctx, query, rewardAmount, investmentID).Scan(&total, &cap)
	if err != nil {
		return err
	}

	// Sync sponsorship total_reward_earned
	_, err = tx.Exec(ctx, `UPDATE sponsorships SET total_reward_earned = $1 WHERE id = $2`, total, investmentID)
	if err != nil {
		return err
	}

	if total >= cap {
		// Mark as capped
		_, err = tx.Exec(ctx, `UPDATE income_cap_tracker SET is_capped = TRUE, capped_at = CURRENT_TIMESTAMP WHERE sponsorship_id = $1`, investmentID)
		if err != nil {
			return err
		}
		
		// Mark sponsorship as closed
		_, err = tx.Exec(ctx, `UPDATE sponsorships SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = $1`, investmentID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *investmentRepository) GetActiveCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM sponsorships WHERE status = 'ACTIVE'").Scan(&count)
	return count, err
}

func (r *investmentRepository) GetPendingCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM sponsorships WHERE status = 'PENDING'").Scan(&count)
	return count, err
}

func (r *investmentRepository) GetTotalActiveInvested(ctx context.Context) (float64, error) {
	var total float64
	err := r.db.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM sponsorships WHERE status = 'ACTIVE'").Scan(&total)
	return total, err
}

// GetActiveInvestmentsByUserID returns all ACTIVE sponsorships for a specific user (used for cap tracking).
func (r *investmentRepository) GetActiveInvestmentsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Sponsorship, error) {
	query := `
		SELECT id, user_id, amount, daily_rate_pct, status, total_reward_earned, cap_limit, working_cap_at_creation, deposit_tx_hash, deposit_confirmed_at, created_at, closed_at
		FROM sponsorships
		WHERE user_id = $1 AND status = 'ACTIVE'
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invs []*domain.Sponsorship
	for rows.Next() {
		i := &domain.Sponsorship{}
		if err := rows.Scan(&i.ID, &i.UserID, &i.Amount, &i.DailyRatePct, &i.Status, &i.TotalRewardEarned, &i.CapLimit, &i.WorkingCapAtCreation, &i.DepositTxHash, &i.DepositConfirmedAt, &i.CreatedAt, &i.ClosedAt); err != nil {
			return nil, err
		}
		invs = append(invs, i)
	}
	return invs, rows.Err()
}

// GetAllWithFilters returns sponsorships with optional status filter for admin views.
func (r *investmentRepository) GetAllWithFilters(ctx context.Context, limit, offset int, status string) ([]*domain.Sponsorship, error) {
	query := `
		SELECT id, user_id, amount, daily_rate_pct, status, total_reward_earned, cap_limit, working_cap_at_creation, deposit_tx_hash, deposit_confirmed_at, created_at, closed_at
		FROM sponsorships
		WHERE ($1 = '' OR status = NULLIF($1, '')::investment_status)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Query(ctx, query, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invs []*domain.Sponsorship
	for rows.Next() {
		i := &domain.Sponsorship{}
		if err := rows.Scan(&i.ID, &i.UserID, &i.Amount, &i.DailyRatePct, &i.Status, &i.TotalRewardEarned, &i.CapLimit, &i.WorkingCapAtCreation, &i.DepositTxHash, &i.DepositConfirmedAt, &i.CreatedAt, &i.ClosedAt); err != nil {
			return nil, err
		}
		invs = append(invs, i)
	}
	return invs, rows.Err()
}
