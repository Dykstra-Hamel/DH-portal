-- Update lead status system with new statuses and additional columns
-- Add lost_reason and lost_stage columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lost_reason TEXT,
ADD COLUMN IF NOT EXISTS lost_stage VARCHAR(50);

-- Drop the existing constraint first to allow updates
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_lead_status_check;

-- Update existing data to map old statuses to new ones
UPDATE leads
SET lead_status = CASE
    WHEN lead_status = 'new' THEN
        CASE
            -- If unassigned (assigned to sales team), set to 'unassigned'
            WHEN assigned_to IS NULL THEN 'unassigned'
            -- If assigned, set to 'contacting'
            ELSE 'contacting'
        END
    WHEN lead_status = 'contacted' THEN 'contacting'
    WHEN lead_status = 'qualified' THEN 'contacting' -- Map qualified to contacting as intermediate step
    WHEN lead_status = 'quoted' THEN 'quoted'
    WHEN lead_status = 'won' THEN 'won'
    WHEN lead_status = 'lost' THEN 'lost'
    WHEN lead_status = 'unqualified' THEN 'lost' -- Map unqualified to lost
    ELSE lead_status -- Keep any other statuses as-is
END
WHERE lead_status IN ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'unqualified');

-- Now add the new constraint with updated valid values
ALTER TABLE leads
ADD CONSTRAINT leads_lead_status_check
CHECK (lead_status IN ('unassigned', 'contacting', 'quoted', 'ready_to_schedule', 'scheduled', 'won', 'lost'));

-- Update default status for new leads
ALTER TABLE leads
ALTER COLUMN lead_status SET DEFAULT 'unassigned';

-- Add index on lost_reason for performance
CREATE INDEX IF NOT EXISTS idx_leads_lost_reason ON leads(lost_reason);
CREATE INDEX IF NOT EXISTS idx_leads_lost_stage ON leads(lost_stage);