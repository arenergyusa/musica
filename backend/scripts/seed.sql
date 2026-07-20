-- Seed Investment Plans
INSERT INTO investment_plans (id, name, min_amount, daily_rate_pct, description, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Starter', 50.00, 0.3333, 'Starter Package', TRUE),
('22222222-2222-2222-2222-222222222222', 'Silver', 250.00, 0.3333, 'Silver Package', TRUE),
('33333333-3333-3333-3333-333333333333', 'Gold', 1000.00, 0.3333, 'Gold Package', TRUE)
ON CONFLICT DO NOTHING;

-- Seed Admin User
-- Password is 'admin123' bcrypt hash: $2a$10$T... (we will use a generated hash for admin123)
-- Hash for 'admin123' is $2a$10$w8THTlP4h6iEaZzE3/oE7.s94jOqW3wQ4aG1uB4oF.9J1R7L6R/uG
INSERT INTO users (id, name, email, phone, password_hash, referral_code, status) VALUES
('00000000-0000-0000-0000-000000000000', 'Admin', 'admin@musica.com', '+10000000000', '$2a$10$w8THTlP4h6iEaZzE3/oE7.s94jOqW3wQ4aG1uB4oF.9J1R7L6R/uG', 'ADMIN_REF', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Insert Admin into Referral Tree (Root node, no upline)
INSERT INTO referral_tree (user_id, upline_id, level, path) VALUES
('00000000-0000-0000-0000-000000000000', NULL, 0, '00000000_0000_0000_0000_000000000000')
ON CONFLICT DO NOTHING;
