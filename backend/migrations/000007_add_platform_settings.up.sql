CREATE TABLE platform_settings (
    id SERIAL PRIMARY KEY,
    daily_roi_pct NUMERIC(5,4) NOT NULL DEFAULT 0.3333,
    withdrawal_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    withdrawal_min_amount NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
    
    level1_to_5_directs INT NOT NULL DEFAULT 2,
    level1_to_5_business NUMERIC(15,2) NOT NULL DEFAULT 100000.00,
    level1_to_10_directs INT NOT NULL DEFAULT 3,
    level1_to_10_business NUMERIC(15,2) NOT NULL DEFAULT 200000.00,
    level1_to_15_directs INT NOT NULL DEFAULT 5,
    level1_to_15_business NUMERIC(15,2) NOT NULL DEFAULT 300000.00,
    
    ref_reward_l1_pct NUMERIC(5,2) NOT NULL DEFAULT 4.00,
    ref_reward_l2_pct NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    ref_reward_l3_pct NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    
    level_income_l1_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    level_income_l2_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    level_income_l3_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    level_income_l4_to_l10_pct NUMERIC(5,2) NOT NULL DEFAULT 2.50,
    level_income_l11_to_l15_pct NUMERIC(5,2) NOT NULL DEFAULT 3.00,
    
    non_working_cap_multiplier NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    working_cap_multiplier NUMERIC(5,2) NOT NULL DEFAULT 3.00,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_settings (id) VALUES (1);
