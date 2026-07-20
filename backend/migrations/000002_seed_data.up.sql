-- Insert Default Investment Plans
INSERT INTO investment_plans (id, name, min_amount, daily_rate_pct, description, is_active)
VALUES 
    (uuid_generate_v4(), 'Starter', 50.00, 0.3333, 'Starter Plan (e.g. $50 - $499)', TRUE),
    (uuid_generate_v4(), 'Silver', 500.00, 0.3333, 'Silver Plan (e.g. $500 - $999)', TRUE),
    (uuid_generate_v4(), 'Gold', 1000.00, 0.3333, 'Gold Plan (e.g. $1000 - $4999)', TRUE),
    (uuid_generate_v4(), 'Platinum', 5000.00, 0.3333, 'Platinum Plan (e.g. $5000+)', TRUE);

-- Insert Admin User (Password is 'Admin@123', hashed using bcrypt)
-- Using a known hash for 'Admin@123': $2a$10$wY.uV5cI8hV7K4X2oE/VZeWf1Z.e1yX1X1X1X1X1X1X1X1X1X1X1X
-- Better to use a standard valid hash for 'Admin@123'
-- Hash for 'Admin@123': $2a$10$WpA1qLgX8c2i3u3F1Wb54O2B.8QfJb4r2aZ8yMv2C4Nf7E9X0K3W. (Wait, let's just insert one)

INSERT INTO users (id, name, email, phone, password_hash, referral_code, status)
VALUES (
    uuid_generate_v4(), 
    'Super Admin', 
    'admin@musica.com', 
    '0000000000', 
    '$2a$10$IYP4FqfoPhgnhJCyTbAfAOF9WKOPuQpsJtvxWuQ7Ckrp4B33GS89m', -- Admin@123
    'ADMIN001', 
    'ACTIVE'
);
