-- Add 'pending' status to tasks table and clean up constraint
-- This migration updates the status CHECK constraint to include 'pending' 
-- and removes the outdated 'cancelled' and 'on_hold' statuses

-- Drop the existing CHECK constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add the new CHECK constraint with 'pending' included and old statuses removed  
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('new', 'pending', 'in_progress', 'completed'));

-- Update the comment to reflect the current status options
COMMENT ON COLUMN tasks.status IS 'Current status of the task workflow: new, pending, in_progress, completed';