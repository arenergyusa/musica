-- Deduplicate any legacy duplicate daily reward log rows (created by the
-- previous non-atomic double-credit race) before adding the unique index.
DELETE FROM daily_reward_log a
USING daily_reward_log b
WHERE a.id > b.id
  AND a.investment_id = b.investment_id
  AND a.date = b.date;

-- Enforce exactly one daily reward per investment per day. This unique index is
-- what makes the idempotent credit in CreditReward() truly atomic.
CREATE UNIQUE INDEX IF NOT EXISTS daily_reward_log_once_idx
    ON daily_reward_log (investment_id, date);
