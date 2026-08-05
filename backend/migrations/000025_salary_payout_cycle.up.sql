-- Add a payout cycle month column to salary_payout_logs so each user can only
-- be paid once per calendar month (prevents double-payout on repeated triggers).
ALTER TABLE salary_payout_logs
    ADD COLUMN IF NOT EXISTS cycle_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_TIMESTAMP)::date;

CREATE UNIQUE INDEX IF NOT EXISTS salary_payout_logs_once_per_cycle_idx
    ON salary_payout_logs (user_id, cycle_month);
