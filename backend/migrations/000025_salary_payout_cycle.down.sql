DROP INDEX IF EXISTS salary_payout_logs_once_per_cycle_idx;

ALTER TABLE salary_payout_logs DROP COLUMN IF EXISTS cycle_month;
