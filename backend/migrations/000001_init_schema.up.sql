CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- ENUMS
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');
CREATE TYPE kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE transaction_type AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE transaction_source AS ENUM ('DAILY_ROI', 'REFERRAL', 'LEVEL_INCOME', 'WITHDRAWAL');
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED');
CREATE TYPE investment_status AS ENUM ('PENDING', 'ACTIVE', 'CLOSED');

-- TABLES

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL, -- AADHAAR, PAN
    file_url TEXT NOT NULL,
    status kyc_status DEFAULT 'PENDING',
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    min_amount DECIMAL(15, 2) NOT NULL,
    daily_rate_pct DECIMAL(5, 4) NOT NULL, -- 0.3333
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES investment_plans(id),
    amount DECIMAL(15, 2) NOT NULL,
    status investment_status DEFAULT 'PENDING',
    total_reward_earned DECIMAL(15, 2) DEFAULT 0.00,
    cap_limit DECIMAL(15, 2) NOT NULL,
    working_cap_at_creation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE reward_wallet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    total_credited DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    source transaction_source NOT NULL,
    reference_id UUID, -- Can refer to investment_id, withdrawal_id, etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE referral_tree (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upline_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level INT NOT NULL,
    path LTREE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX path_gist_idx ON referral_tree USING GIST (path);
CREATE INDEX path_idx ON referral_tree USING BTREE (path);

CREATE TABLE daily_roi_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE level_income_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_investment_id UUID NOT NULL REFERENCES investments(id),
    level INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE referral_reward_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_investment_id UUID NOT NULL REFERENCES investments(id),
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_requested DECIMAL(15, 2) NOT NULL,
    tds_amount DECIMAL(15, 2) NOT NULL,
    net_amount DECIMAL(15, 2) NOT NULL,
    status withdrawal_status DEFAULT 'PENDING',
    payment_ref VARCHAR(255),
    scheduled_date DATE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE income_cap_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID UNIQUE NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    total_reward_earned DECIMAL(15, 2) DEFAULT 0.00,
    cap_limit DECIMAL(15, 2) NOT NULL,
    is_capped BOOLEAN DEFAULT FALSE,
    capped_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE downline_volume_cache (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_active_volume DECIMAL(15, 2) DEFAULT 0.00,
    levels_unlocked INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
