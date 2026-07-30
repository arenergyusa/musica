-- 000020_binary_salary_system.up.sql

-- 1. Add binary leg assignment to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS leg VARCHAR(10) DEFAULT 'LEFT';

-- Backfill alternating legs for existing users under each inviter
WITH ranked_users AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY invited_by ORDER BY created_at ASC) as rnum
    FROM users
    WHERE invited_by IS NOT NULL
)
UPDATE users
SET leg = CASE WHEN ranked_users.rnum % 2 = 1 THEN 'LEFT' ELSE 'RIGHT' END
FROM ranked_users
WHERE users.id = ranked_users.id;

-- 2. Create Salary Tiers Table (Database-Driven Config)
CREATE TABLE IF NOT EXISTS salary_tiers (
    tier INT PRIMARY KEY,
    min_volume_usd DECIMAL(15, 2) NOT NULL,
    monthly_salary_usd DECIMAL(15, 2) NOT NULL,
    max_strong_leg_pct DECIMAL(5, 2) DEFAULT 60.00,
    min_weaker_leg_pct DECIMAL(5, 2) DEFAULT 40.00,
    monthly_increment_pct DECIMAL(5, 2) DEFAULT 25.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO salary_tiers (tier, min_volume_usd, monthly_salary_usd) VALUES
(1, 50000.00, 100.00),
(2, 150000.00, 250.00),
(3, 350000.00, 500.00),
(4, 750000.00, 700.00),
(5, 1000000.00, 1000.00),
(6, 2500000.00, 2500.00),
(7, 5000000.00, 5000.00),
(8, 10000000.00, 11000.00)
ON CONFLICT (tier) DO UPDATE SET
  min_volume_usd = EXCLUDED.min_volume_usd,
  monthly_salary_usd = EXCLUDED.monthly_salary_usd;

-- 3. Create Salary Qualifications Table
CREATE TABLE IF NOT EXISTS salary_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier INT NOT NULL REFERENCES salary_tiers(tier),
    left_leg_volume DECIMAL(15, 2) DEFAULT 0.00,
    right_leg_volume DECIMAL(15, 2) DEFAULT 0.00,
    total_volume DECIMAL(15, 2) DEFAULT 0.00,
    cycle_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cycle_new_volume DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'QUALIFIED',
    last_payout_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_salary_qualification UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS salary_qualifications_user_id_idx ON salary_qualifications(user_id);
CREATE INDEX IF NOT EXISTS salary_qualifications_status_idx ON salary_qualifications(status);

-- 4. Create Salary Payout Logs Table
CREATE TABLE IF NOT EXISTS salary_payout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier INT NOT NULL,
    amount_usd DECIMAL(15, 2) NOT NULL,
    total_volume DECIMAL(15, 2) NOT NULL,
    left_leg_volume DECIMAL(15, 2) NOT NULL,
    right_leg_volume DECIMAL(15, 2) NOT NULL,
    cycle_new_volume DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS salary_payout_logs_user_id_idx ON salary_payout_logs(user_id);
