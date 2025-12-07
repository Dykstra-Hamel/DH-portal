-- Add scheduled_date and scheduled_time fields to leads table
-- These fields store the confirmed appointment date and time for won leads

-- Add scheduled_date column (date only)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Add scheduled_time column (time only)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add comment to explain the purpose of these fields
COMMENT ON COLUMN leads.scheduled_date IS 'The confirmed date for the scheduled appointment (for won leads)';
COMMENT ON COLUMN leads.scheduled_time IS 'The confirmed time for the scheduled appointment (for won leads)';

-- Create an index on scheduled_date for efficient querying of upcoming appointments
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_date ON leads(scheduled_date)
WHERE scheduled_date IS NOT NULL;

-- Create a composite index for date and time together
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_datetime ON leads(scheduled_date, scheduled_time)
WHERE scheduled_date IS NOT NULL AND scheduled_time IS NOT NULL;
