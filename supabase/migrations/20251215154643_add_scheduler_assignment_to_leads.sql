-- Add assigned_scheduler column to leads table for separating sales and scheduling responsibilities
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_scheduler UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_scheduler ON leads(assigned_scheduler);

-- Add comment for documentation
COMMENT ON COLUMN leads.assigned_scheduler IS 'User assigned to handle scheduling for this lead (separate from salesperson in assigned_to)';
