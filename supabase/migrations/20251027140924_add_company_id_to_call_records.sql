-- Add company_id to call_records table for better query performance and data integrity
-- This allows direct filtering by company without complex joins through leads/customers

-- Step 1: Add company_id column (nullable initially for backfill)
ALTER TABLE call_records
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Step 2: Backfill company_id from existing lead_id and customer_id relationships
-- Prioritize lead_id over customer_id if both exist
UPDATE call_records
SET company_id = COALESCE(
  (SELECT company_id FROM leads WHERE leads.id = call_records.lead_id),
  (SELECT company_id FROM customers WHERE customers.id = call_records.customer_id)
)
WHERE company_id IS NULL;

-- Step 3: Create index for query performance (company_id remains nullable for spam/employee calls)
CREATE INDEX idx_call_records_company_id ON call_records(company_id);

-- Step 4: Create composite index for common query patterns (company + date range)
CREATE INDEX idx_call_records_company_created ON call_records(company_id, created_at DESC);

-- Step 5: Add RLS policy for company-scoped access
CREATE POLICY "call_records_company_access" ON call_records
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_companies.user_id = auth.uid()
    )
  );

-- Step 6: Create trigger function to auto-populate company_id on insert/update
CREATE OR REPLACE FUNCTION set_call_record_company_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If company_id is not already set
  IF NEW.company_id IS NULL THEN
    -- Try to get from lead first
    IF NEW.lead_id IS NOT NULL THEN
      SELECT company_id INTO NEW.company_id
      FROM leads
      WHERE id = NEW.lead_id;
    END IF;

    -- If still null, try customer
    IF NEW.company_id IS NULL AND NEW.customer_id IS NOT NULL THEN
      SELECT company_id INTO NEW.company_id
      FROM customers
      WHERE id = NEW.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to auto-populate company_id
CREATE TRIGGER trigger_set_call_record_company_id
  BEFORE INSERT OR UPDATE ON call_records
  FOR EACH ROW
  EXECUTE FUNCTION set_call_record_company_id();

-- Add comment for documentation
COMMENT ON COLUMN call_records.company_id IS 'Company that owns this call record, auto-populated from lead_id or customer_id. Nullable for spam/employee calls.';
