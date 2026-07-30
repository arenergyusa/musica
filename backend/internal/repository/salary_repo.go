package repository

import (
	"context"
	"math"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SalaryRepository interface {
	SetDownlineLeg(ctx context.Context, sponsorID uuid.UUID, downlineID uuid.UUID, leg string) error
	GetSalaryTiers(ctx context.Context) ([]*domain.SalaryTier, error)
	GetSalaryTierByLevel(ctx context.Context, tierLevel int) (*domain.SalaryTier, error)
	UpdateSalaryTier(ctx context.Context, tier *domain.SalaryTier) error
	GetBinaryLegVolumes(ctx context.Context, userID uuid.UUID) (leftVol, rightVol float64, err error)
	GetSalaryQualification(ctx context.Context, userID uuid.UUID) (*domain.SalaryQualification, error)
	UpsertSalaryQualification(ctx context.Context, qual *domain.SalaryQualification) error
	GetSalaryProgress(ctx context.Context, userID uuid.UUID) (*domain.SalaryProgressResponse, error)
	ProcessMonthlySalaryPayouts(ctx context.Context) (int, float64, error)
}

type salaryRepository struct {
	db *pgxpool.Pool
}

func NewSalaryRepository(db *pgxpool.Pool) SalaryRepository {
	return &salaryRepository{db: db}
}

func (r *salaryRepository) GetSalaryTiers(ctx context.Context) ([]*domain.SalaryTier, error) {
	query := `
		SELECT tier, min_volume_usd, monthly_salary_usd, max_strong_leg_pct, min_weaker_leg_pct, monthly_increment_pct, created_at
		FROM salary_tiers
		ORDER BY tier ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tiers []*domain.SalaryTier
	for rows.Next() {
		t := &domain.SalaryTier{}
		if err := rows.Scan(&t.Tier, &t.MinVolumeUSD, &t.MonthlySalaryUSD, &t.MaxStrongLegPct, &t.MinWeakerLegPct, &t.MonthlyIncrementPct, &t.CreatedAt); err != nil {
			return nil, err
		}
		tiers = append(tiers, t)
	}
	return tiers, rows.Err()
}

func (r *salaryRepository) GetSalaryTierByLevel(ctx context.Context, tierLevel int) (*domain.SalaryTier, error) {
	query := `
		SELECT tier, min_volume_usd, monthly_salary_usd, max_strong_leg_pct, min_weaker_leg_pct, monthly_increment_pct, created_at
		FROM salary_tiers
		WHERE tier = $1
	`
	t := &domain.SalaryTier{}
	err := r.db.QueryRow(ctx, query, tierLevel).Scan(
		&t.Tier, &t.MinVolumeUSD, &t.MonthlySalaryUSD, &t.MaxStrongLegPct, &t.MinWeakerLegPct, &t.MonthlyIncrementPct, &t.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return t, nil
}

func (r *salaryRepository) UpdateSalaryTier(ctx context.Context, tier *domain.SalaryTier) error {
	query := `
		INSERT INTO salary_tiers (tier, min_volume_usd, monthly_salary_usd, max_strong_leg_pct, min_weaker_leg_pct, monthly_increment_pct)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (tier) DO UPDATE SET
			min_volume_usd = EXCLUDED.min_volume_usd,
			monthly_salary_usd = EXCLUDED.monthly_salary_usd,
			max_strong_leg_pct = EXCLUDED.max_strong_leg_pct,
			min_weaker_leg_pct = EXCLUDED.min_weaker_leg_pct,
			monthly_increment_pct = EXCLUDED.monthly_increment_pct
	`
	_, err := r.db.Exec(ctx, query,
		tier.Tier, tier.MinVolumeUSD, tier.MonthlySalaryUSD, tier.MaxStrongLegPct, tier.MinWeakerLegPct, tier.MonthlyIncrementPct,
	)
	return err
}

func (r *salaryRepository) SetDownlineLeg(ctx context.Context, sponsorID uuid.UUID, downlineID uuid.UUID, leg string) error {
    // Update the leg field for the downline user in the users table
    // Assuming the users table has a 'leg' column (LEFT or RIGHT)
    query := `
        UPDATE users
        SET leg = $1
        WHERE invited_by = $2 AND id = $3
    `
    _, err := r.db.Exec(ctx, query, leg, sponsorID, downlineID)
    return err
}

func (r *salaryRepository) GetBinaryLegVolumes(ctx context.Context, userID uuid.UUID) (float64, float64, error) {
	query := `
		WITH direct_referrals AS (
			SELECT id, COALESCE(leg, 'LEFT') AS leg FROM users WHERE invited_by = $1
		),
		leg_volumes AS (
			SELECT 
				dr.leg,
				COALESCE(SUM(s.amount), 0) AS vol
			FROM direct_referrals dr
			JOIN invite_tree sub_tree ON sub_tree.path <@ (
				SELECT path FROM invite_tree WHERE user_id = dr.id
			)
			JOIN sponsorships s ON s.user_id = sub_tree.user_id AND s.status = 'ACTIVE'
			GROUP BY dr.leg
		)
		SELECT 
			COALESCE((SELECT vol FROM leg_volumes WHERE leg = 'LEFT'), 0) AS left_vol,
			COALESCE((SELECT vol FROM leg_volumes WHERE leg = 'RIGHT'), 0) AS right_vol;
	`
	var leftVol, rightVol float64
	err := r.db.QueryRow(ctx, query, userID).Scan(&leftVol, &rightVol)
	if err != nil {
		return 0, 0, err
	}
    // Apply 60:40 split: left leg (junior team) gets 60% of its volume, right leg (big team) gets 40%.
    adjustedLeft := leftVol * 0.6
    adjustedRight := rightVol * 0.4
    return adjustedLeft, adjustedRight, nil
}

func (r *salaryRepository) GetSalaryQualification(ctx context.Context, userID uuid.UUID) (*domain.SalaryQualification, error) {
	query := `
		SELECT id, user_id, tier, left_leg_volume, right_leg_volume, total_volume, cycle_start_date, cycle_new_volume, status, last_payout_at, created_at, updated_at
		FROM salary_qualifications
		WHERE user_id = $1
	`
	q := &domain.SalaryQualification{}
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&q.ID, &q.UserID, &q.Tier, &q.LeftLegVolume, &q.RightLegVolume, &q.TotalVolume,
		&q.CycleStartDate, &q.CycleNewVolume, &q.Status, &q.LastPayoutAt, &q.CreatedAt, &q.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return q, nil
}

func (r *salaryRepository) UpsertSalaryQualification(ctx context.Context, qual *domain.SalaryQualification) error {
	query := `
		INSERT INTO salary_qualifications (user_id, tier, left_leg_volume, right_leg_volume, total_volume, cycle_start_date, cycle_new_volume, status, last_payout_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (user_id) DO UPDATE SET
			tier = EXCLUDED.tier,
			left_leg_volume = EXCLUDED.left_leg_volume,
			right_leg_volume = EXCLUDED.right_leg_volume,
			total_volume = EXCLUDED.total_volume,
			cycle_start_date = EXCLUDED.cycle_start_date,
			cycle_new_volume = EXCLUDED.cycle_new_volume,
			status = EXCLUDED.status,
			last_payout_at = EXCLUDED.last_payout_at,
			updated_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.Exec(ctx, query,
		qual.UserID, qual.Tier, qual.LeftLegVolume, qual.RightLegVolume, qual.TotalVolume,
		qual.CycleStartDate, qual.CycleNewVolume, qual.Status, qual.LastPayoutAt,
	)
	return err
}

func (r *salaryRepository) GetSalaryProgress(ctx context.Context, userID uuid.UUID) (*domain.SalaryProgressResponse, error) {
	tiers, err := r.GetSalaryTiers(ctx)
	if err != nil || len(tiers) == 0 {
		return nil, err
	}

	leftVol, rightVol, err := r.GetBinaryLegVolumes(ctx, userID)
	if err != nil {
		return nil, err
	}

	totalVol := leftVol + rightVol
	strongLegVol := math.Max(leftVol, rightVol)
	weakerLegVol := math.Min(leftVol, rightVol)

	// Determine current qualified tier and next target tier
	currentTier := 0
	currentSalary := 0.0

	for _, t := range tiers {
		weakerReq := t.MinVolumeUSD * (t.MinWeakerLegPct / 100.0)
		if totalVol >= t.MinVolumeUSD && weakerLegVol >= weakerReq {
			currentTier = t.Tier
			currentSalary = t.MonthlySalaryUSD
		}
	}

	var nextTier *domain.SalaryTier
	for _, t := range tiers {
		if t.Tier > currentTier {
			nextTier = t
			break
		}
	}

	// Calculate target tier numbers (either next tier or highest achieved tier)
	targetTier := nextTier
	if targetTier == nil {
		targetTier = tiers[len(tiers)-1]
	}

	targetVolume := targetTier.MinVolumeUSD
	remainingVolume := math.Max(0, targetVolume-totalVol)

	weakerRequired := targetVolume * (targetTier.MinWeakerLegPct / 100.0)
	weakerRemaining := math.Max(0, weakerRequired-weakerLegVol)
	legRatioMet := weakerLegVol >= weakerRequired && totalVol >= targetVolume

	// Calculate 25% monthly incremental business in past 30 days
	var cycleNewVol float64
	incQuery := `
		WITH my_downline AS (
			SELECT user_id FROM invite_tree 
			WHERE path <@ (SELECT path FROM invite_tree WHERE user_id = $1)
			  AND user_id != $1
		)
		SELECT COALESCE(SUM(amount), 0)
		FROM sponsorships
		WHERE user_id IN (SELECT user_id FROM my_downline)
		  AND created_at >= NOW() - INTERVAL '30 days'
	`
	_ = r.db.QueryRow(ctx, incQuery, userID).Scan(&cycleNewVol)

	monthlyIncTarget := targetVolume * (targetTier.MonthlyIncrementPct / 100.0)
	monthlyIncRemaining := math.Max(0, monthlyIncTarget-cycleNewVol)

	// Days remaining in 30 day cycle
	daysRemaining := 30

	status := "IN_PROGRESS"
	if currentTier > 0 {
		status = "QUALIFIED"
	}
	if legRatioMet {
		status = "TARGET_ACHIEVED"
	}

	return &domain.SalaryProgressResponse{
		CurrentTier:               currentTier,
		CurrentSalaryUSD:          currentSalary,
		NextTier:                  nextTier,
		LeftLegVolume:             leftVol,
		RightLegVolume:            rightVol,
		TotalVolume:               totalVol,
		TargetVolumeUSD:           targetVolume,
		RemainingVolumeUSD:        remainingVolume,
		StrongLegVolume:           strongLegVol,
		WeakerLegVolume:           weakerLegVol,
		WeakerLegRequiredUSD:      weakerRequired,
		WeakerLegRemainingUSD:     weakerRemaining,
		LegRatioMet:               legRatioMet,
		MonthlyIncrementTarget:    monthlyIncTarget,
		MonthlyIncrementAchieved:  cycleNewVol,
		MonthlyIncrementRemaining: monthlyIncRemaining,
		DaysRemainingInCycle:      daysRemaining,
		Status:                    status,
	}, nil
}

func (r *salaryRepository) ProcessMonthlySalaryPayouts(ctx context.Context) (int, float64, error) {
	tiers, err := r.GetSalaryTiers(ctx)
	if err != nil || len(tiers) == 0 {
		return 0, 0, err
	}

	// Fetch all users with downline volume >= tier 1 min volume ($50k)
	query := `
		SELECT u.id
		FROM users u
		WHERE u.status = 'ACTIVE'
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return 0, 0, err
	}
	defer rows.Close()

	var userIDs []uuid.UUID
	for rows.Next() {
		var uid uuid.UUID
		if err := rows.Scan(&uid); err == nil {
			userIDs = append(userIDs, uid)
		}
	}
	rows.Close()

	payoutCount := 0
	totalAmount := 0.0

	for _, uid := range userIDs {
		progress, err := r.GetSalaryProgress(ctx, uid)
		if err != nil || progress == nil || progress.CurrentTier == 0 {
			continue
		}

		// Verify 25% monthly increment requirement for existing salary earners
		if progress.MonthlyIncrementAchieved < progress.MonthlyIncrementTarget {
			// Skip if 25% monthly increment target is not met
			continue
		}

		tierObj, err := r.GetSalaryTierByLevel(ctx, progress.CurrentTier)
		if err != nil || tierObj == nil {
			continue
		}

		salaryAmount := tierObj.MonthlySalaryUSD

		// Transaction to credit reward wallet & write salary payout log
		tx, err := r.db.Begin(ctx)
		if err != nil {
			continue
		}

		// Update RewardWallet
		_, err = tx.Exec(ctx, `
			UPDATE reward_wallet
			SET balance = balance + $1,
			    total_credited = total_credited + $1,
			    salary_income = salary_income + $1
			WHERE user_id = $2
		`, salaryAmount, uid)
		if err != nil {
			_ = tx.Rollback(ctx)
			continue
		}

		// Insert Transaction
		_, err = tx.Exec(ctx, `
			INSERT INTO transactions (user_id, type, source, amount, description)
			VALUES ($1, 'CREDIT', 'SALARY_INCOME', $2, $3)
		`, uid, salaryAmount, "Monthly Downline Business Salary Income")
		if err != nil {
			_ = tx.Rollback(ctx)
			continue
		}

		// Insert Salary Payout Log
		_, err = tx.Exec(ctx, `
			INSERT INTO salary_payout_logs (user_id, tier, amount_usd, total_volume, left_leg_volume, right_leg_volume, cycle_new_volume)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, uid, progress.CurrentTier, salaryAmount, progress.TotalVolume, progress.LeftLegVolume, progress.RightLegVolume, progress.MonthlyIncrementAchieved)
		if err != nil {
			_ = tx.Rollback(ctx)
			continue
		}

		// Upsert Salary Qualification
		_, _ = tx.Exec(ctx, `
			INSERT INTO salary_qualifications (user_id, tier, left_leg_volume, right_leg_volume, total_volume, cycle_start_date, cycle_new_volume, status, last_payout_at)
			VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, 'PAYOUT_ACTIVE', CURRENT_TIMESTAMP)
			ON CONFLICT (user_id) DO UPDATE SET
				tier = EXCLUDED.tier,
				left_leg_volume = EXCLUDED.left_leg_volume,
				right_leg_volume = EXCLUDED.right_leg_volume,
				total_volume = EXCLUDED.total_volume,
				cycle_start_date = CURRENT_TIMESTAMP,
				cycle_new_volume = 0.00,
				status = 'PAYOUT_ACTIVE',
				last_payout_at = CURRENT_TIMESTAMP,
				updated_at = CURRENT_TIMESTAMP
		`, uid, progress.CurrentTier, progress.LeftLegVolume, progress.RightLegVolume, progress.TotalVolume, progress.MonthlyIncrementAchieved)

		if err := tx.Commit(ctx); err == nil {
			payoutCount++
			totalAmount += salaryAmount
		}
	}

	return payoutCount, totalAmount, nil
}
