-- Add leg column to users table for downline placement (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS leg TEXT;
