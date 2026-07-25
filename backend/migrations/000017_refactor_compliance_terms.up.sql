-- 000017_refactor_compliance_terms.up.sql

-- 1. Rename Tables
ALTER TABLE IF EXISTS investment_plans RENAME TO sponsorship_plans;
ALTER TABLE investments RENAME TO sponsorships;
ALTER TABLE referral_tree RENAME TO invite_tree;
ALTER TABLE daily_roi_log RENAME TO daily_reward_log;
ALTER TABLE referral_reward_log RENAME TO invite_reward_log;

-- 2. Update Foreign Key references in child tables
ALTER TABLE level_income_log RENAME COLUMN source_investment_id TO source_sponsorship_id;
ALTER TABLE invite_reward_log RENAME COLUMN from_investment_id TO from_sponsorship_id;
ALTER TABLE income_cap_tracker RENAME COLUMN investment_id TO sponsorship_id;

-- 3. Rename columns in users table
ALTER TABLE users RENAME COLUMN referral_code TO invite_code;
ALTER TABLE users RENAME COLUMN referred_by TO invited_by;

-- 4. Rename columns in platform_settings
ALTER TABLE platform_settings RENAME COLUMN daily_roi_pct TO daily_reward_pct;
ALTER TABLE platform_settings RENAME COLUMN ref_reward_l1_pct TO invite_reward_l1_pct;
ALTER TABLE platform_settings RENAME COLUMN ref_reward_l2_pct TO invite_reward_l2_pct;
ALTER TABLE platform_settings RENAME COLUMN ref_reward_l3_pct TO invite_reward_l3_pct;

-- 5. Update transactions table source column
ALTER TABLE transactions ALTER COLUMN source TYPE VARCHAR(50);

UPDATE transactions SET source = 'DAILY_REWARD' WHERE source = 'DAILY_ROI';
UPDATE transactions SET source = 'INVITE' WHERE source = 'REFERRAL';

-- Update withdrawal fee percentage default to 10% (TDS only)
UPDATE platform_settings SET withdrawal_fee_pct = 10.00 WHERE id = 1;
