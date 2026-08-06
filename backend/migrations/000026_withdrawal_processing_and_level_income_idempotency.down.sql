-- 000026_withdrawal_processing_and_level_income_idempotency.down.sql

-- Best-effort rollback: return PROCESSING withdrawals to PENDING (admin can
-- re-approve/reject them). The enum VALUE cannot be dropped in Postgres
-- without recreating the type, so PROCESSING remains a valid-but-unused value.

UPDATE withdrawals SET status = 'PENDING' WHERE status = 'PROCESSING';

DROP INDEX IF EXISTS level_income_log_once_idx;
