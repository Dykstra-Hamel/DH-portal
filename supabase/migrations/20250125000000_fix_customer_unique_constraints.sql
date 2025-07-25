-- Fix customer unique constraints to be company-specific
-- This resolves the issue where customer creation fails due to global unique constraints

-- Drop existing global unique constraints
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_email_unique;

ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_phone_unique;

-- Add company-specific unique constraints
-- This allows the same email/phone to exist across different companies
ALTER TABLE customers 
ADD CONSTRAINT customers_company_email_unique UNIQUE (company_id, email);

ALTER TABLE customers 
ADD CONSTRAINT customers_company_phone_unique UNIQUE (company_id, phone);