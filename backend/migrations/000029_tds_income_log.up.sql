-- 000029_tds_income_log.up.sql
-- M16: TDS (10%) is withheld on every payout but was never tracked as platform
-- income, and total_withdrawn counts the gross amount. This ledger records the
-- withheld TDS per finalized withdrawal so platform TDS income is auditable and
-- total_withdrawn can be reconciled to net payouts.

CREATE TABLE tds_income_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    withdrawal_id UUID NOT NULL UNIQUE REFERENCES withdrawals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Backfill TDS for withdrawals that were already finalized (PROCESSED).
INSERT INTO tds_income_log (withdrawal_id, user_id, amount)
SELECT id, user_id, tds_amount
FROM withdrawals
WHERE status = 'PROCESSED' AND tds_amount > 0
ON CONFLICT (withdrawal_id) DO NOTHING;
