-- Remove Duplicate Foreign Key Constraint
-- This removes the problematic duplicate foreign key that causes ambiguity in PostgREST queries

-- Remove the duplicate foreign key constraint that was causing issues
-- The original call_records_lead_id_fkey constraint already exists and is sufficient
ALTER TABLE call_records DROP CONSTRAINT IF EXISTS call_records_company_via_lead_fkey;

-- Update statistics after constraint removal
ANALYZE call_records;

-- Add comment explaining the removal
COMMENT ON TABLE call_records IS 'Call records table - duplicate foreign key constraint removed to prevent PostgREST query ambiguity';