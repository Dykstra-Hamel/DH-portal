-- Update lead status constraint to new simplified statuses
-- New statuses: new, in_process, quoted, scheduling, won, lost

-- Drop the existing constraint first to allow updates
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_lead_status_check;

-- Update existing data to map old statuses to new ones
UPDATE leads
SET lead_status = CASE
    WHEN lead_status = 'unassigned' THEN 'new'
    WHEN lead_status = 'contacting' THEN 'in_process'
    WHEN lead_status = 'quoted' THEN 'quoted'
    WHEN lead_status = 'ready_to_schedule' THEN 'scheduling'
    WHEN lead_status = 'scheduled' THEN 'won'
    WHEN lead_status = 'won' THEN 'won'
    WHEN lead_status = 'lost' THEN 'lost'
    ELSE lead_status -- Keep any other statuses as-is
END
WHERE lead_status IN ('unassigned', 'contacting', 'quoted', 'ready_to_schedule', 'scheduled', 'won', 'lost');

-- Add the new constraint with updated valid values
ALTER TABLE leads
ADD CONSTRAINT leads_lead_status_check
CHECK (lead_status IN ('new', 'in_process', 'quoted', 'scheduling', 'won', 'lost'));

-- Update default status for new leads
ALTER TABLE leads
ALTER COLUMN lead_status SET DEFAULT 'new';

-- Add comment to explain the new statuses
COMMENT ON CONSTRAINT leads_lead_status_check ON leads IS 'Valid lead statuses: new (unassigned/initial), in_process (actively working/contacting), quoted (proposal sent), scheduling (ready to schedule appointment), won (closed-won/scheduled), lost (closed-lost)';
