ALTER TABLE sponsorships
    ADD COLUMN IF NOT EXISTS deposit_tx_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS deposit_confirmed_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS sponsorships_deposit_tx_hash_idx
    ON sponsorships (deposit_tx_hash)
    WHERE deposit_tx_hash IS NOT NULL;

DELETE FROM invite_reward_log a
USING invite_reward_log b
WHERE a.id > b.id
  AND a.from_sponsorship_id = b.from_sponsorship_id
  AND a.to_user_id = b.to_user_id
  AND a.level = b.level;

CREATE UNIQUE INDEX IF NOT EXISTS invite_reward_log_once_idx
    ON invite_reward_log (from_sponsorship_id, to_user_id, level);
