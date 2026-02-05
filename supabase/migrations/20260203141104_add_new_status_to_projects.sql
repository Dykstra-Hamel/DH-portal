-- Add 'new' status to projects table
-- This status will be the default when projects are created

-- First, check if we have an enum or a check constraint
-- If it's an enum type, we need to add the new value
-- If it's a check constraint, we need to modify it

-- Add 'new' to the status column allowed values
-- This assumes the status column uses a check constraint or varchar
-- If you're using an enum type, this might need adjustment

-- Update the check constraint if it exists
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'projects_status_check'
    ) THEN
        ALTER TABLE projects DROP CONSTRAINT projects_status_check;
    END IF;

    -- Add the new constraint with 'new' status
    ALTER TABLE projects ADD CONSTRAINT projects_status_check
    CHECK (status IN ('new', 'in_progress', 'blocked', 'on_hold', 'pending_approval', 'out_to_client', 'ready_to_print', 'printing', 'bill_client', 'complete'));
END $$;

-- Update the default value for status column to 'new'
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'new';

-- Optional: Update existing projects with 'in_progress' status to 'new' if they were recently created
-- Uncomment the following line if you want to migrate recent projects
-- UPDATE projects SET status = 'new' WHERE status = 'in_progress' AND created_at > NOW() - INTERVAL '1 day';

COMMENT ON COLUMN projects.status IS 'Project status: new (default), in_progress, blocked, on_hold, pending_approval, out_to_client, ready_to_print, printing, bill_client, complete';
