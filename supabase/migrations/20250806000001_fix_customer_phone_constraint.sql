-- Fix customer phone constraint to allow same phone across different companies
-- but maintain uniqueness within each company

-- Drop the existing unique constraint on phone
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_unique;

-- Add composite unique constraint on (phone, company_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_phone_company_unique'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_phone_company_unique UNIQUE (phone, company_id);
    END IF;
END $$;

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT customers_phone_company_unique ON customers IS 'Ensures phone uniqueness per company - same phone can exist across different companies but not within the same company';