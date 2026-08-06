-- 000026_withdrawal_processing_and_level_income_idempotency.up.sql

-- 1. Add PROCESSING state to withdrawal_status so ambiguous broadcasts are
--    tracked as in-flight instead of being silently PENDING (C1/C2 fix).
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'PROCESSING';

-- 2. Enforce exactly one level income payout per (beneficiary, source
--    sponsorship, level, date) so a restart/manual re-run can never double-pay
--    (C5 fix). Atomic credit is gated on this index in wallet_repo.
DELETE FROM level_income_log a
USING level_income_log b
WHERE a.id > b.id
  AND a.beneficiary_user_id = b.beneficiary_user_id
  AND a.source_sponsorship_id = b.source_sponsorship_id
  AND a.level = b.level
  AND a.date = b.date;

CREATE UNIQUE INDEX IF NOT EXISTS level_income_log_once_idx
    ON level_income_log (beneficiary_user_id, source_sponsorship_id, level, date);
