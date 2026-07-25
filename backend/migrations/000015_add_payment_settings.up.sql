ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS payment_upi_id VARCHAR(255) DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS payment_bank_name VARCHAR(255) DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS payment_account_name VARCHAR(255) DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS payment_account_number VARCHAR(255) DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS payment_ifsc VARCHAR(255) DEFAULT '';
