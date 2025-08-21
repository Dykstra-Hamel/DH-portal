-- Add archived column to leads table for soft delete functionality
ALTER TABLE leads 
ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance when filtering archived leads
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(archived);

-- Add comment for documentation
COMMENT ON COLUMN leads.archived IS 'Soft delete flag - archived leads are hidden from main views but preserved in database';

-- Update existing records to ensure they are not archived by default
UPDATE leads 
SET archived = FALSE 
WHERE archived IS NULL;