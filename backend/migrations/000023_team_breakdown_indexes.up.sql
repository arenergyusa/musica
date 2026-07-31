CREATE INDEX IF NOT EXISTS sponsorships_user_status_idx
    ON sponsorships (user_id, status);

CREATE INDEX IF NOT EXISTS transactions_user_type_idx
    ON transactions (user_id, type);
