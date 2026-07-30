-- 000020_binary_salary_system.down.sql

DROP TABLE IF EXISTS salary_payout_logs CASCADE;
DROP TABLE IF EXISTS salary_qualifications CASCADE;
DROP TABLE IF EXISTS salary_tiers CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS leg;
