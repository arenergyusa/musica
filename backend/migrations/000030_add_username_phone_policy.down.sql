ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
DROP INDEX IF EXISTS users_username_key;
ALTER TABLE users DROP COLUMN IF EXISTS username_email_sent_at;
ALTER TABLE users DROP COLUMN IF EXISTS username;
