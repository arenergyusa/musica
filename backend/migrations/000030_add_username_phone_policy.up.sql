-- Users now log in with a system-generated username (prefix "MU" + 8 digits)
-- that is emailed to them after registration. Existing rows are backfilled
-- with deterministic unique usernames. Phone numbers are no longer unique: the
-- same mobile number may be used across multiple accounts.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_email_sent_at TIMESTAMPTZ;

-- Unique only where populated so the migration can add the column to existing
-- rows first and backfill them afterwards.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username)
  WHERE username IS NOT NULL AND username <> '';

-- Deterministic, collision-free usernames for every existing user.
WITH numbered AS (
    SELECT id, ('MU' || LPAD((1000000 + ROW_NUMBER() OVER (ORDER BY created_at, id))::text, 8, '0')) AS uname
    FROM users
    WHERE username IS NULL OR username = ''
)
UPDATE users u SET username = n.uname FROM numbered n WHERE u.id = n.id;

-- One phone number may be shared by multiple accounts.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
