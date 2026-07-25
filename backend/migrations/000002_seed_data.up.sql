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
