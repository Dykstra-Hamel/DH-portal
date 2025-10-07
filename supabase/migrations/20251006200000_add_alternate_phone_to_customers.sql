-- Add alternate_phone column to customers table
-- This allows customers to have a secondary phone number for contact purposes

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);

COMMENT ON COLUMN customers.alternate_phone IS 'Optional secondary phone number for customer contact';
