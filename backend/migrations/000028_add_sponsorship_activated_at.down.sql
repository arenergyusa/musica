-- 000028_add_sponsorship_activated_at.down.sql

ALTER TABLE sponsorships DROP COLUMN IF EXISTS activated_at;
