-- Add unique constraint to ensure one quote per lead
-- This prevents duplicate quotes and enables the one-to-one relationship

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_lead_id_unique ON quotes(lead_id);

-- Add comment
COMMENT ON INDEX idx_quotes_lead_id_unique IS 'Ensures each lead can only have one quote (one-to-one relationship)';