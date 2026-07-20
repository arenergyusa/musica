ALTER TABLE platform_settings
    DROP CONSTRAINT IF EXISTS chk_daily_roi_pct,
    DROP CONSTRAINT IF EXISTS chk_withdrawal_fee_pct,
    DROP CONSTRAINT IF EXISTS chk_withdrawal_min_amount,
    
    DROP CONSTRAINT IF EXISTS chk_level1_to_5_directs,
    DROP CONSTRAINT IF EXISTS chk_level1_to_5_business,
    DROP CONSTRAINT IF EXISTS chk_level1_to_10_directs,
    DROP CONSTRAINT IF EXISTS chk_level1_to_10_business,
    DROP CONSTRAINT IF EXISTS chk_level1_to_15_directs,
    DROP CONSTRAINT IF EXISTS chk_level1_to_15_business,
    
    DROP CONSTRAINT IF EXISTS chk_ref_reward_pct,
    DROP CONSTRAINT IF EXISTS chk_level_income_pct,
                                             
    DROP CONSTRAINT IF EXISTS chk_non_working_cap_multiplier,
    DROP CONSTRAINT IF EXISTS chk_working_cap_multiplier;
