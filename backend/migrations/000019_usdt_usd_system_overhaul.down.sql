-- 000019_usdt_usd_system_overhaul.down.sql

DROP TABLE IF EXISTS transaction_audit_logs CASCADE;
DROP TABLE IF EXISTS user_deposit_addresses CASCADE;

ALTER TABLE reward_wallet DROP COLUMN IF EXISTS salary_income;
ALTER TABLE users DROP COLUMN IF EXISTS usdt_address;

ALTER TABLE platform_settings RENAME COLUMN monthly_reward_pct TO daily_reward_pct;
ALTER TABLE platform_settings ALTER COLUMN daily_reward_pct TYPE NUMERIC(5,4);
ALTER TABLE platform_settings ALTER COLUMN daily_reward_pct SET DEFAULT 0.3333;
