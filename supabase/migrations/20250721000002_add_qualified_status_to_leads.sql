-- Add 'qualified' status to leads table
-- Update the CHECK constraint to include the new 'qualified' status

-- Drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_status_check;

-- Add the new constraint with 'qualified' status included
ALTER TABLE leads 
ADD CONSTRAINT leads_lead_status_check 
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'unqualified'));

-- Add comment to explain the new status
COMMENT ON CONSTRAINT leads_lead_status_check ON leads IS 'Valid lead statuses: new (initial), contacted (reached but not qualified), qualified (successful conversation), quoted (proposal sent), won (closed-won), lost (closed-lost), unqualified (not suitable)';