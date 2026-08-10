-- Per-user HD-wallet deposit addresses are gone. All users now deposit to the
-- single shared address configured via DEPOSIT_ADDRESS (env), so the
-- user_deposit_addresses table and its indexes are unused and are dropped.

DROP TABLE IF EXISTS user_deposit_addresses CASCADE;
