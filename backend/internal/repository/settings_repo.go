package repository

import (
	"context"
	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type settingsRepository struct {
	db *pgxpool.Pool
}

func NewSettingsRepository(db *pgxpool.Pool) SettingsRepository {
	return &settingsRepository{db: db}
}

func (r *settingsRepository) GetSettings(ctx context.Context) (*domain.PlatformSettings, error) {
	query := `
		SELECT 
			id, daily_roi_pct, withdrawal_fee_pct, withdrawal_min_amount,
			level1_to_5_directs, level1_to_5_business,
			level1_to_10_directs, level1_to_10_business,
			level1_to_15_directs, level1_to_15_business,
			ref_reward_l1_pct, ref_reward_l2_pct, ref_reward_l3_pct,
			level_income_l1_pct, level_income_l2_pct, level_income_l3_pct,
			level_income_l4_to_l10_pct, level_income_l11_to_l15_pct,
			non_working_cap_multiplier, working_cap_multiplier, updated_at
		FROM platform_settings WHERE id = 1
	`
	s := &domain.PlatformSettings{}
	err := r.db.QueryRow(ctx, query).Scan(
		&s.ID, &s.DailyROIPct, &s.WithdrawalFeePct, &s.WithdrawalMinAmount,
		&s.Level1To5Directs, &s.Level1To5Business,
		&s.Level1To10Directs, &s.Level1To10Business,
		&s.Level1To15Directs, &s.Level1To15Business,
		&s.RefRewardL1Pct, &s.RefRewardL2Pct, &s.RefRewardL3Pct,
		&s.LevelIncomeL1Pct, &s.LevelIncomeL2Pct, &s.LevelIncomeL3Pct,
		&s.LevelIncomeL4ToL10Pct, &s.LevelIncomeL11ToL15Pct,
		&s.NonWorkingCapMultiplier, &s.WorkingCapMultiplier, &s.UpdatedAt,
	)
	return s, err
}

func (r *settingsRepository) UpdateSettings(ctx context.Context, s *domain.PlatformSettings) error {
	query := `
		UPDATE platform_settings SET
			daily_roi_pct = $1, withdrawal_fee_pct = $2, withdrawal_min_amount = $3,
			level1_to_5_directs = $4, level1_to_5_business = $5,
			level1_to_10_directs = $6, level1_to_10_business = $7,
			level1_to_15_directs = $8, level1_to_15_business = $9,
			ref_reward_l1_pct = $10, ref_reward_l2_pct = $11, ref_reward_l3_pct = $12,
			level_income_l1_pct = $13, level_income_l2_pct = $14, level_income_l3_pct = $15,
			level_income_l4_to_l10_pct = $16, level_income_l11_to_l15_pct = $17,
			non_working_cap_multiplier = $18, working_cap_multiplier = $19,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = 1
	`
	_, err := r.db.Exec(ctx, query,
		s.DailyROIPct, s.WithdrawalFeePct, s.WithdrawalMinAmount,
		s.Level1To5Directs, s.Level1To5Business,
		s.Level1To10Directs, s.Level1To10Business,
		s.Level1To15Directs, s.Level1To15Business,
		s.RefRewardL1Pct, s.RefRewardL2Pct, s.RefRewardL3Pct,
		s.LevelIncomeL1Pct, s.LevelIncomeL2Pct, s.LevelIncomeL3Pct,
		s.LevelIncomeL4ToL10Pct, s.LevelIncomeL11ToL15Pct,
		s.NonWorkingCapMultiplier, s.WorkingCapMultiplier,
	)
	return err
}
