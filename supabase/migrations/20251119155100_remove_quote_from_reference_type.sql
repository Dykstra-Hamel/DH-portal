-- Remove 'quote' from notifications reference_type constraint
-- Previous migration (20251119155000) changed quote_signed notifications to reference 'lead' instead
-- The 'quote' reference_type is no longer used anywhere in the system

-- First, migrate any existing notifications with reference_type='quote' to 'lead'
-- These were created during testing before the function was updated
UPDATE notifications
SET reference_type = 'lead'
WHERE reference_type = 'quote';

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_reference_type_check;

-- Recreate the constraint without 'quote'
ALTER TABLE notifications ADD CONSTRAINT notifications_reference_type_check
    CHECK (reference_type IN ('ticket', 'lead', 'project', 'customer'));

-- Add comment for documentation
COMMENT ON CONSTRAINT notifications_reference_type_check ON notifications IS
    'Validates reference_type values: ticket, lead, project, customer';
