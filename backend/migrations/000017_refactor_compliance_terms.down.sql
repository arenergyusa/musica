-- 000017_refactor_compliance_terms.down.sql

ALTER TABLE sponsorship_plans RENAME TO investment_plans;
ALTER TABLE sponsorships RENAME TO investments;
ALTER TABLE invite_tree RENAME TO referral_tree;
ALTER TABLE daily_reward_log RENAME TO daily_roi_log;
ALTER TABLE invite_reward_log RENAME TO referral_reward_log;

ALTER TABLE level_income_log RENAME COLUMN source_sponsorship_id TO source_investment_id;
ALTER TABLE referral_reward_log RENAME COLUMN from_sponsorship_id TO from_investment_id;
ALTER TABLE income_cap_tracker RENAME COLUMN sponsorship_id TO investment_id;

ALTER TABLE users RENAME COLUMN invite_code TO referral_code;
ALTER TABLE users RENAME COLUMN invited_by TO referred_by;

ALTER TABLE platform_settings RENAME COLUMN daily_reward_pct TO daily_roi_pct;
ALTER TABLE platform_settings RENAME COLUMN invite_reward_l1_pct TO ref_reward_l1_pct;
ALTER TABLE platform_settings RENAME COLUMN invite_reward_l2_pct TO ref_reward_l2_pct;
ALTER TABLE platform_settings RENAME COLUMN invite_reward_l3_pct TO ref_reward_l3_pct;

UPDATE transactions SET source = 'DAILY_ROI' WHERE source = 'DAILY_REWARD';
UPDATE transactions SET source = 'REFERRAL' WHERE source = 'INVITE';
