-- Add 'quote' to the notifications reference_type constraint
-- This was missing when the quote_signed notification feature was added in migration 20251119150841

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_reference_type_check;

-- Recreate the constraint with 'quote' included
ALTER TABLE notifications ADD CONSTRAINT notifications_reference_type_check
    CHECK (reference_type IN ('ticket', 'lead', 'project', 'customer', 'quote'));

-- Add comment for documentation
COMMENT ON CONSTRAINT notifications_reference_type_check ON notifications IS
    'Validates reference_type values: ticket, lead, project, customer, quote';
