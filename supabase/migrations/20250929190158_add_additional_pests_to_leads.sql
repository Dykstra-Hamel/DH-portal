-- Add additional_pests array column to leads table
-- Stores pest_type IDs for additional pests beyond the primary pest_type

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS additional_pests TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for querying leads by additional pests
CREATE INDEX IF NOT EXISTS idx_leads_additional_pests ON leads USING GIN(additional_pests);

-- Add comment for documentation
COMMENT ON COLUMN leads.additional_pests IS 'Array of additional pest_type IDs beyond the primary pest_type';