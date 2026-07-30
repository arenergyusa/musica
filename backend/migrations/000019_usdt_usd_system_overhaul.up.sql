-- 000019_usdt_usd_system_overhaul.up.sql

-- 1. Rename and adjust platform_settings for USD & Monthly ROI %
ALTER TABLE platform_settings RENAME COLUMN daily_reward_pct TO monthly_reward_pct;
ALTER TABLE platform_settings ALTER COLUMN monthly_reward_pct TYPE NUMERIC(5,2);
ALTER TABLE platform_settings ALTER COLUMN monthly_reward_pct SET DEFAULT 10.00;

ALTER TABLE platform_settings ALTER COLUMN withdrawal_min_amount SET DEFAULT 10.00;
ALTER TABLE platform_settings ALTER COLUMN level1_to_5_business SET DEFAULT 1000.00;
ALTER TABLE platform_settings ALTER COLUMN level1_to_10_business SET DEFAULT 2000.00;
ALTER TABLE platform_settings ALTER COLUMN level1_to_15_business SET DEFAULT 3000.00;

UPDATE platform_settings SET 
    monthly_reward_pct = 10.00,
    withdrawal_min_amount = 10.00,
    level1_to_5_business = 1000.00,
    level1_to_10_business = 2000.00,
    level1_to_15_business = 3000.00
WHERE id = 1;

-- 2. Add USDT Address to Users & Remove KYC Documents Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS usdt_address VARCHAR(255) DEFAULT '';
DROP TABLE IF EXISTS kyc_documents CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS kyc_status;

-- 3. Add Salary Income to Reward Wallet
ALTER TABLE reward_wallet ADD COLUMN IF NOT EXISTS salary_income DECIMAL(15, 2) DEFAULT 0.00;

-- 4. Create Table for On-Demand HD Wallet Deposit Addresses
CREATE TABLE IF NOT EXISTS user_deposit_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255) UNIQUE NOT NULL,
    derivation_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS user_deposit_addresses_user_id_idx ON user_deposit_addresses(user_id);
CREATE INDEX IF NOT EXISTS user_deposit_addresses_address_idx ON user_deposit_addresses(address);

-- 5. Create Table for Transaction Audit Logs
CREATE TABLE IF NOT EXISTS transaction_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    amount_usd DECIMAL(15, 2) DEFAULT 0.00,
    usdt_amount DECIMAL(15, 2) DEFAULT 0.00,
    tx_hash VARCHAR(255) DEFAULT '',
    status VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS transaction_audit_logs_user_id_idx ON transaction_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS transaction_audit_logs_action_idx ON transaction_audit_logs(action);
