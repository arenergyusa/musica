package repository

import (
	"context"
	"errors"
	"math"
	"time"

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

// ErrDownlineLegLocked is returned by SetDownlineLeg when the downline belongs
// to the sponsor but already carries active business (an ACTIVE sponsorship or a
// salary qualification), so its leg can no longer be rearranged.
var ErrDownlineLegLocked = errors.New("leg assignment locked: downline already has active business")

func (r *salaryRepository) SetDownlineLeg(ctx context.Context, sponsorID uuid.UUID, downlineID uuid.UUID, leg string) error {
	// Distinguish a missing/mismatched downline (no lock exists) from a genuine
	// active-business lock before claiming one.
	var belongs bool
	if err := r.db.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM users WHERE id = $1 AND invited_by = $2)`,
		downlineID, sponsorID,
	).Scan(&belongs); err != nil {
		return err
	}
	if !belongs {
		return errors.New("downline not found under this sponsor")
	}

	// Legs are locked once the downline has an ACTIVE sponsorship or a salary
	// qualification — otherwise a sponsor could keep re-arranging legs to game
	// the 60:40 leg ratio after business has accumulated.
	query := `
		UPDATE users
		SET leg = $1
		WHERE invited_by = $2 AND id = $3
		  AND NOT EXISTS (
			SELECT 1 FROM sponsorships s
			WHERE s.user_id = $3 AND s.status = 'ACTIVE'
		  )
		  AND NOT EXISTS (
			SELECT 1 FROM salary_qualifications sq
			WHERE sq.user_id = $3
		  )
	`
	res, err := r.db.Exec(ctx, query, leg, sponsorID, downlineID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrDownlineLegLocked
	}
	return nil
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
	// Return RAW leg volumes. The 60:40 / max-strong-leg rule is NOT applied
	// here — it is enforced per-tier in GetSalaryProgress using the qualified
	// tier's min_weaker_leg_pct / max_strong_leg_pct (M14). Hardcoding 0.6/0.4
	// here double-applied the split and left the config dead.
	return leftVol, rightVol, nil
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
	if err != nil {
		return nil, err
	}
	if len(tiers) == 0 {
		return nil, errors.New("salary tiers not configured")
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
	var currentTierObj *domain.SalaryTier

	for _, t := range tiers {
		// Leg-balance rule driven by the tier config (M14): the weaker leg must
		// hold at least min_weaker_leg_pct of the target volume. When that value
		// is unset, it falls back to the complement of max_strong_leg_pct (e.g.
		// 60% strong → 40% weaker) so the configured 60/40 is honoured.
		weakerPct := t.MinWeakerLegPct
		if weakerPct <= 0 {
			weakerPct = 100.0 - t.MaxStrongLegPct
		}
		weakerReq := t.MinVolumeUSD * (weakerPct / 100.0)
		if totalVol >= t.MinVolumeUSD && weakerLegVol >= weakerReq {
			currentTier = t.Tier
			currentSalary = t.MonthlySalaryUSD
			currentTierObj = t
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

	// Calculate 25% monthly incremental business: target is based on the CURRENT
	// qualified tier's min volume (not the next tier's), so a tier-1 earner needs
	// 25% of $50k = $12.5k of new ACTIVE downline business per month to continue.
	monthlyIncTarget := 0.0
	if currentTierObj != nil {
		monthlyIncTarget = currentTierObj.MinVolumeUSD * (currentTierObj.MonthlyIncrementPct / 100.0)
	}

	// The payout cycle is the current calendar month, matching the cycle_month
	// key used by salary_payout_logs. Measure new ACTIVE downline business from
	// the first day of the month so cycle start, cycle end, remaining days and
	// the increment volume all refer to the same boundaries.
	now := time.Now().UTC()
	cycleStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	cycleEnd := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)

	// Measure new downline business activated within the cycle, including
	// sponsorships that were active this cycle and have since CLOSED — closing
	// must not erase business that was already earned (H9).
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
		  AND status IN ('ACTIVE', 'CLOSED')
		  AND COALESCE(activated_at, created_at) >= $2
	`
	if err := r.db.QueryRow(ctx, incQuery, userID, cycleStart).Scan(&cycleNewVol); err != nil {
		return nil, err
	}

	monthlyIncRemaining := math.Max(0, monthlyIncTarget-cycleNewVol)

	// Days remaining in the current calendar month (cycle_month boundary)
	daysInMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
	daysRemaining := int(math.Ceil(cycleEnd.Sub(now).Hours() / 24))
	if daysRemaining < 0 {
		daysRemaining = 0
	}
	if daysRemaining > daysInMonth {
		daysRemaining = daysInMonth
	}

	status := "IN_PROGRESS"
	if currentTier > 0 {
		status = "QUALIFIED"
	}
	if legRatioMet {
		status = "TARGET_ACHIEVED"
	}

	// True once this user has received at least one salary payout. Before that,
	// the 25% monthly growth tracker has nothing to measure, so the frontend
	// hides it until the first salary actually lands.
	var hasReceivedSalary bool
	if err := r.db.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM salary_payout_logs WHERE user_id = $1)`,
		userID,
	).Scan(&hasReceivedSalary); err != nil {
		hasReceivedSalary = false
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
		HasReceivedSalary:         hasReceivedSalary,
	}, nil
}

func (r *salaryRepository) ProcessMonthlySalaryPayouts(ctx context.Context) (int, float64, error) {
	tiers, err := r.GetSalaryTiers(ctx)
	if err != nil || len(tiers) == 0 {
		return 0, 0, err
	}

	// Fetch users whose downline has ACTIVE volume >= tier 1 min volume, plus
	// users who already hold a salary qualification (past earners can still be
	// re-qualified). This avoids calling GetSalaryProgress for every active user.
	query := `
		SELECT DISTINCT u.id
		FROM users u
		WHERE u.status = 'ACTIVE'
		  AND (
			EXISTS (SELECT 1 FROM salary_qualifications sq WHERE sq.user_id = u.id)
			OR COALESCE((
				SELECT SUM(s.amount)
				FROM invite_tree my_node
				JOIN invite_tree sub_tree ON sub_tree.path <@ my_node.path AND sub_tree.user_id != u.id
				JOIN sponsorships s ON s.user_id = sub_tree.user_id AND s.status = 'ACTIVE'
				WHERE my_node.user_id = u.id
			), 0) >= $1
		  )
	`
	rows, err := r.db.Query(ctx, query, tiers[0].MinVolumeUSD)
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

		// Verify 25% monthly increment requirement for existing salary earners.
		// First-time qualifiers (no prior payout) are paid without the growth
		// requirement — they only need to meet the tier's volume/leg criteria.
		qual, qualErr := r.GetSalaryQualification(ctx, uid)
		isExistingEarner := qualErr == nil && qual != nil && qual.LastPayoutAt != nil
		if isExistingEarner && progress.MonthlyIncrementAchieved < progress.MonthlyIncrementTarget {
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

		// Idempotency guard: reserve this user's payout for the current calendar
		// month first. If a previous trigger already paid them this cycle, the
		// insert conflicts and the whole transaction aborts before any credit.
		var logID uuid.UUID
		err = tx.QueryRow(ctx, `
			INSERT INTO salary_payout_logs (user_id, tier, amount_usd, total_volume, left_leg_volume, right_leg_volume, cycle_new_volume, cycle_month)
			VALUES ($1, $2, $3, $4, $5, $6, $7, date_trunc('month', CURRENT_TIMESTAMP)::date)
			ON CONFLICT (user_id, cycle_month) DO NOTHING
			RETURNING id
		`, uid, progress.CurrentTier, salaryAmount, progress.TotalVolume, progress.LeftLegVolume, progress.RightLegVolume, progress.MonthlyIncrementAchieved).Scan(&logID)
		if err != nil {
			if err == pgx.ErrNoRows {
				_ = tx.Rollback(ctx)
				continue // already paid this cycle
			}
			_ = tx.Rollback(ctx)
			continue
		}

		// Update RewardWallet (upsert so a missing wallet row is created, and
		// verify the credit actually applied)
		res, err := tx.Exec(ctx, `
			INSERT INTO reward_wallet (id, user_id, balance, total_credited, total_withdrawn, salary_income)
			VALUES (uuid_generate_v4(), $1, $2, $2, 0, $2)
			ON CONFLICT (user_id) DO UPDATE
			SET balance = reward_wallet.balance + EXCLUDED.balance,
			    total_credited = reward_wallet.total_credited + EXCLUDED.total_credited,
			    salary_income = reward_wallet.salary_income + EXCLUDED.salary_income,
			    updated_at = CURRENT_TIMESTAMP
		`, uid, salaryAmount)
		if err != nil || res.RowsAffected() != 1 {
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

		// Upsert Salary Qualification. A failure here would silently leave the
		// user looking like a first-time earner next cycle (25% increment bypass),
		// so the whole payout transaction rolls back (H10).
		if _, err := tx.Exec(ctx, `
			INSERT INTO salary_qualifications (user_id, tier, left_leg_volume, right_leg_volume, total_volume, cycle_start_date, cycle_new_volume, status, last_payout_at)
			VALUES ($1, $2, $3, $4, $5, date_trunc('month', CURRENT_TIMESTAMP), $6, 'PAYOUT_ACTIVE', CURRENT_TIMESTAMP)
			ON CONFLICT (user_id) DO UPDATE SET
				tier = EXCLUDED.tier,
				left_leg_volume = EXCLUDED.left_leg_volume,
				right_leg_volume = EXCLUDED.right_leg_volume,
				total_volume = EXCLUDED.total_volume,
				cycle_start_date = date_trunc('month', CURRENT_TIMESTAMP),
				cycle_new_volume = 0.00,
				status = 'PAYOUT_ACTIVE',
				last_payout_at = CURRENT_TIMESTAMP,
				updated_at = CURRENT_TIMESTAMP
		`, uid, progress.CurrentTier, progress.LeftLegVolume, progress.RightLegVolume, progress.TotalVolume, progress.MonthlyIncrementAchieved); err != nil {
			_ = tx.Rollback(ctx)
			continue
		}

		if err := tx.Commit(ctx); err == nil {
			payoutCount++
			totalAmount += salaryAmount
		}
	}

	return payoutCount, totalAmount, nil
}
