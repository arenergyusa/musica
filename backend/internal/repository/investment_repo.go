package repository

import (
	"context"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type investmentRepository struct {
	db *pgxpool.Pool
}

func NewInvestmentRepository(db *pgxpool.Pool) InvestmentRepository {
	return &investmentRepository{db: db}
}

func (r *investmentRepository) GetPlans(ctx context.Context) ([]*domain.InvestmentPlan, error) {
	// Returning a static dynamic plan since we removed the table
	plans := []*domain.InvestmentPlan{
		{
			ID:           uuid.New(),
			Name:         "Dynamic RBF Pool",
			MinAmount:    10000,
			DailyRatePct: 0.3333,
			Description:  "Invest in multiples of 10,000 INR",
			IsActive:     true,
		},
	}
	return plans, nil
}

func (r *investmentRepository) CreateInvestment(ctx context.Context, inv *domain.Investment) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO investments (user_id, amount, daily_rate_pct, status, cap_limit, working_cap_at_creation)
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
		INSERT INTO income_cap_tracker (investment_id, cap_limit)
		VALUES ($1, $2)
	`
	_, err = tx.Exec(ctx, capQuery, inv.ID, inv.CapLimit)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *investmentRepository) GetInvestmentsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Investment, error) {
	query := `
		SELECT id, user_id, amount, daily_rate_pct, status, total_reward_earned, cap_limit, working_cap_at_creation, created_at, closed_at
		FROM investments
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invs []*domain.Investment
	for rows.Next() {
		i := &domain.Investment{}
		if err := rows.Scan(&i.ID, &i.UserID, &i.Amount, &i.DailyRatePct, &i.Status, &i.TotalRewardEarned, &i.CapLimit, &i.WorkingCapAtCreation, &i.CreatedAt, &i.ClosedAt); err != nil {
			return nil, err
		}
		invs = append(invs, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return invs, nil
}

func (r *investmentRepository) GetActiveInvestments(ctx context.Context) ([]*domain.Investment, error) {
	query := `
		SELECT id, user_id, amount, daily_rate_pct, status, total_reward_earned, cap_limit, working_cap_at_creation, created_at, closed_at
		FROM investments
		WHERE status = 'ACTIVE'
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invs []*domain.Investment
	for rows.Next() {
		i := &domain.Investment{}
		if err := rows.Scan(&i.ID, &i.UserID, &i.Amount, &i.DailyRatePct, &i.Status, &i.TotalRewardEarned, &i.CapLimit, &i.WorkingCapAtCreation, &i.CreatedAt, &i.ClosedAt); err != nil {
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
	query := `UPDATE investments SET status = $1 WHERE id = $2`
	if status == "CLOSED" {
		query = `UPDATE investments SET status = $1, closed_at = CURRENT_TIMESTAMP WHERE id = $2`
	}
	_, err := r.db.Exec(ctx, query, status, id)
	return err
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
		WHERE investment_id = $2
		RETURNING total_reward_earned, cap_limit
	`
	var total, cap float64
	err = tx.QueryRow(ctx, query, rewardAmount, investmentID).Scan(&total, &cap)
	if err != nil {
		return err
	}

	// Sync investment total_reward_earned
	_, err = tx.Exec(ctx, `UPDATE investments SET total_reward_earned = $1 WHERE id = $2`, total, investmentID)
	if err != nil {
		return err
	}

	if total >= cap {
		// Mark as capped
		_, err = tx.Exec(ctx, `UPDATE income_cap_tracker SET is_capped = TRUE, capped_at = CURRENT_TIMESTAMP WHERE investment_id = $1`, investmentID)
		if err != nil {
			return err
		}
		
		// Mark investment as closed
		_, err = tx.Exec(ctx, `UPDATE investments SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = $1`, investmentID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *investmentRepository) GetActiveCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM investments WHERE status = 'ACTIVE'").Scan(&count)
	return count, err
}

func (r *investmentRepository) GetTotalActiveInvested(ctx context.Context) (float64, error) {
	var total float64
	err := r.db.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM investments WHERE status = 'ACTIVE'").Scan(&total)
	return total, err
}
