-- Add a payout cycle month column to salary_payout_logs so each user can only
-- be paid once per calendar month (prevents double-payout on repeated triggers).
-- The default is the current month for future inserts.
ALTER TABLE salary_payout_logs
    ADD COLUMN IF NOT EXISTS cycle_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_TIMESTAMP)::date;

-- Backfill cycle_month from each row's own creation timestamp (truncated to the
-- month) instead of leaving historical rows stamped with CURRENT_TIMESTAMP, so
-- every payout keeps the calendar month it actually belongs to.
UPDATE salary_payout_logs
SET cycle_month = date_trunc('month', created_at)::date;

CREATE UNIQUE INDEX IF NOT EXISTS salary_payout_logs_once_per_cycle_idx
    ON salary_payout_logs (user_id, cycle_month);
