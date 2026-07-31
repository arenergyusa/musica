DROP INDEX IF EXISTS invite_reward_log_once_idx;
DROP INDEX IF EXISTS sponsorships_deposit_tx_hash_idx;
ALTER TABLE sponsorships
    DROP COLUMN IF EXISTS deposit_confirmed_at,
    DROP COLUMN IF EXISTS deposit_tx_hash;
