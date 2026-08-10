CREATE TABLE IF NOT EXISTS user_deposit_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255) UNIQUE NOT NULL,
    derivation_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS user_deposit_addresses_user_id_idx ON user_deposit_addresses(user_id);
CREATE INDEX IF NOT EXISTS user_deposit_addresses_address_idx ON user_deposit_addresses(address);
