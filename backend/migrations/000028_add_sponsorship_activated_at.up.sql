-- 000028_add_sponsorship_activated_at.up.sql
-- H9: salary cycle volume must be measured on when a sponsorship became active,
-- not when its row was created. PENDING-created sponsorships activated in a
-- cycle and sponsorships that later closed both need to count toward that
-- cycle's new business.

ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Backfill from the deposit-confirmation timestamp (or creation as a fallback).
UPDATE sponsorships
SET activated_at = COALESCE(deposit_confirmed_at, created_at)
WHERE activated_at IS NULL;
