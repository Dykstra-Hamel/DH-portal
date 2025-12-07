-- Add furthest_completed_stage column to leads table to track the furthest point in the workflow
-- This allows us to detect when a user goes back to edit a previously completed stage

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS furthest_completed_stage VARCHAR(50);

-- Add a comment to explain the column
COMMENT ON COLUMN leads.furthest_completed_stage IS 'Tracks the furthest stage the lead has reached in the workflow (assign, communication, quoted, ready_to_schedule, scheduled, completed). Used to detect when editing previously completed stages.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_furthest_completed_stage ON leads(furthest_completed_stage);

-- Backfill existing leads with their current lead_status as the furthest stage
-- This ensures existing leads start with a baseline
UPDATE leads
SET furthest_completed_stage = lead_status
WHERE furthest_completed_stage IS NULL;
