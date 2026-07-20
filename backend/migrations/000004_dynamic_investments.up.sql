ALTER TABLE investments ADD COLUMN daily_rate_pct DECIMAL(5, 4) NOT NULL DEFAULT 0.3333;
ALTER TABLE investments DROP COLUMN plan_id;
-- Drop investment_plans table if it exists
DROP TABLE IF EXISTS investment_plans CASCADE;
