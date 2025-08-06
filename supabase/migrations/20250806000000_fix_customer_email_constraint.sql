-- Fix customer email and phone constraints to allow same email/phone across different companies
-- but maintain uniqueness within each company

-- First, drop the existing unique constraint on email
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_unique;

-- Drop the existing unique constraint on phone
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_unique;

-- Add composite unique constraint on (email, company_id)
ALTER TABLE customers ADD CONSTRAINT customers_email_company_unique UNIQUE (email, company_id);

-- Add composite unique constraint on (phone, company_id)
ALTER TABLE customers ADD CONSTRAINT customers_phone_company_unique UNIQUE (phone, company_id);

-- Add comments to explain the constraints
COMMENT ON CONSTRAINT customers_email_company_unique ON customers IS 'Ensures email uniqueness per company - same email can exist across different companies but not within the same company';
COMMENT ON CONSTRAINT customers_phone_company_unique ON customers IS 'Ensures phone uniqueness per company - same phone can exist across different companies but not within the same company';