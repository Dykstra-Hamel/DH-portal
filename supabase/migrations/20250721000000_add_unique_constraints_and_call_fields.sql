-- Add unique constraints to customers table for email and phone
-- Note: Remove any duplicate emails/phones manually before running this

-- Add unique constraints
ALTER TABLE customers 
ADD CONSTRAINT customers_email_unique UNIQUE (email);

ALTER TABLE customers 
ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

-- Note: New fields are now included in the original table creation
-- This section is no longer needed as fields are created with the table

-- Remove unnecessary fields from call_records table
ALTER TABLE call_records 
DROP COLUMN IF EXISTS budget_range,
DROP COLUMN IF EXISTS timeline,
DROP COLUMN IF EXISTS pain_points;

-- Note: Indexes for new fields are now created with the original table
-- This section is no longer needed as indexes are created with the table