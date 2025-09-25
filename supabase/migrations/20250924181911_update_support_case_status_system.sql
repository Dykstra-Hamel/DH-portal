-- Update support case status system to simplified values
-- New statuses: unassigned, in_progress, awaiting_response, resolved

-- Step 1: Drop the old constraint first (if it exists)
DO $$ BEGIN
    ALTER TABLE support_cases DROP CONSTRAINT IF EXISTS support_cases_status_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Step 2: Update existing data to map to new status values
UPDATE support_cases
SET status = CASE
    WHEN status = 'new' THEN 'unassigned'
    WHEN status IN ('assigned', 'in_progress') THEN 'in_progress'
    WHEN status IN ('awaiting_customer', 'awaiting_internal') THEN 'awaiting_response'
    WHEN status IN ('resolved', 'closed') THEN 'resolved'
    ELSE status
END;

-- Step 3: For cases that are now 'unassigned', ensure they have no assignment
UPDATE support_cases
SET assigned_to = NULL
WHERE status = 'unassigned';

-- Step 4: Add the new constraint with updated status values
ALTER TABLE support_cases
ADD CONSTRAINT support_cases_status_check
CHECK (status IN ('unassigned', 'in_progress', 'awaiting_response', 'resolved'));