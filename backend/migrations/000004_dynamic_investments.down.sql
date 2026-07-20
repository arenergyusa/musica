CREATE TABLE investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    min_amount DECIMAL(15, 2) NOT NULL,
    daily_rate_pct DECIMAL(5, 4) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE investments ADD COLUMN plan_id UUID REFERENCES investment_plans(id);
ALTER TABLE investments DROP COLUMN daily_rate_pct;
