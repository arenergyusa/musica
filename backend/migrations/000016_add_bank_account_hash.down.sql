DROP INDEX IF EXISTS idx_users_bank_account_hash;
ALTER TABLE users DROP COLUMN IF EXISTS bank_account_hash;

-- Column size reductions are omitted to preserve encrypted PII integrity
