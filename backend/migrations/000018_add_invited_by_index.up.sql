CREATE INDEX IF NOT EXISTS users_invited_by_created_at_idx
ON users (invited_by, created_at DESC);
