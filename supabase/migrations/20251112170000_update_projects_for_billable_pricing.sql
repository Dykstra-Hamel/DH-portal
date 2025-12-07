-- Update projects table for billable pricing and new project types

-- Add new columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_subtype VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quoted_price DECIMAL(12,2);

-- Drop old columns
ALTER TABLE projects DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE projects DROP COLUMN IF EXISTS actual_hours;
ALTER TABLE projects DROP COLUMN IF EXISTS budget_amount;

-- Drop the old status constraint BEFORE updating data
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Migrate existing status values to new workflow stages
-- Map old statuses to new ones
UPDATE projects
SET status = CASE
  WHEN status = 'pending' THEN 'coming_up'
  WHEN status = 'in_progress' THEN 'development'
  WHEN status = 'on_hold' THEN 'waiting_on_client'
  WHEN status = 'completed' THEN 'bill_client'
  WHEN status = 'cancelled' THEN 'waiting_on_client'
  ELSE 'coming_up'
END
WHERE status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled');

-- Add the new status constraint with new workflow stages
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('coming_up', 'design', 'development', 'out_to_client', 'waiting_on_client', 'bill_client'));

-- Update project_type constraint for hierarchical types
-- Note: We're keeping it flexible as VARCHAR(100) to allow for the main types
-- The subtype will be stored in project_subtype column

-- Add comments for new fields
COMMENT ON COLUMN projects.project_subtype IS 'Subtype of project (e.g., Business Cards for Print, Logo Design for Digital)';
COMMENT ON COLUMN projects.is_billable IS 'Whether this project is billable to the client';
COMMENT ON COLUMN projects.quoted_price IS 'Quoted price for billable projects';
