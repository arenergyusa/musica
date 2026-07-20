ALTER TABLE platform_settings
    ADD CONSTRAINT chk_daily_roi_pct CHECK (daily_roi_pct >= 0 AND daily_roi_pct <= 100),
    ADD CONSTRAINT chk_withdrawal_fee_pct CHECK (withdrawal_fee_pct >= 0 AND withdrawal_fee_pct <= 100),
    ADD CONSTRAINT chk_withdrawal_min_amount CHECK (withdrawal_min_amount >= 0),
    
    ADD CONSTRAINT chk_level1_to_5_directs CHECK (level1_to_5_directs >= 0),
    ADD CONSTRAINT chk_level1_to_5_business CHECK (level1_to_5_business >= 0),
    ADD CONSTRAINT chk_level1_to_10_directs CHECK (level1_to_10_directs >= level1_to_5_directs),
    ADD CONSTRAINT chk_level1_to_10_business CHECK (level1_to_10_business >= level1_to_5_business),
    ADD CONSTRAINT chk_level1_to_15_directs CHECK (level1_to_15_directs >= level1_to_10_directs),
    ADD CONSTRAINT chk_level1_to_15_business CHECK (level1_to_15_business >= level1_to_10_business),
    
    ADD CONSTRAINT chk_ref_reward_pct CHECK (ref_reward_l1_pct >= 0 AND ref_reward_l1_pct <= 100 AND
                                           ref_reward_l2_pct >= 0 AND ref_reward_l2_pct <= 100 AND
                                           ref_reward_l3_pct >= 0 AND ref_reward_l3_pct <= 100),
                                           
    ADD CONSTRAINT chk_level_income_pct CHECK (level_income_l1_pct >= 0 AND level_income_l1_pct <= 100 AND
                                             level_income_l2_pct >= 0 AND level_income_l2_pct <= 100 AND
                                             level_income_l3_pct >= 0 AND level_income_l3_pct <= 100 AND
                                             level_income_l4_to_l10_pct >= 0 AND level_income_l4_to_l10_pct <= 100 AND
                                             level_income_l11_to_l15_pct >= 0 AND level_income_l11_to_l15_pct <= 100),
                                             
    ADD CONSTRAINT chk_non_working_cap_multiplier CHECK (non_working_cap_multiplier >= 1),
    ADD CONSTRAINT chk_working_cap_multiplier CHECK (working_cap_multiplier >= 1);
