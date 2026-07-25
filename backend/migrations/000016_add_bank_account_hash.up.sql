ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_hash VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_bank_account_hash ON users (bank_account_hash) WHERE bank_account_hash IS NOT NULL AND bank_account_hash != '';

ALTER TABLE users ALTER COLUMN bank_account TYPE TEXT;
ALTER TABLE users ALTER COLUMN ifsc TYPE TEXT;
ALTER TABLE users ALTER COLUMN pan TYPE TEXT;
ALTER TABLE users ALTER COLUMN aadhaar TYPE TEXT;
