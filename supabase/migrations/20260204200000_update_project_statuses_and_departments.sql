-- Migration to update project statuses and set all projects to Project Manager department
-- 1. Drop old status check constraint
-- 2. Migrate old statuses to new ones
-- 3. Set all projects to Project Manager department
-- 4. Add new status check constraint

-- Step 1: Drop the old status check constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Step 2: Ensure we have a Project Manager department (create if doesn't exist)
INSERT INTO project_departments (name, icon, sort_order, is_system_default, company_id)
SELECT 'Project Manager', '📋', 0, true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM project_departments WHERE name = 'Project Manager' AND company_id IS NULL
);

-- Get the Project Manager department ID (will be used below)
DO $$
DECLARE
  project_manager_dept_id UUID;
BEGIN
  -- Get the Project Manager department ID
  SELECT id INTO project_manager_dept_id
  FROM project_departments
  WHERE name = 'Project Manager' AND company_id IS NULL
  LIMIT 1;

  -- If Project Manager doesn't exist, get the first available department
  IF project_manager_dept_id IS NULL THEN
    SELECT id INTO project_manager_dept_id
    FROM project_departments
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;
  END IF;

  -- Update all projects to use Project Manager department
  UPDATE projects
  SET current_department_id = project_manager_dept_id
  WHERE project_manager_dept_id IS NOT NULL;

  -- Migrate old 'pending_approval' status to 'internal_review'
  UPDATE projects
  SET status = 'internal_review'
  WHERE status = 'pending_approval';

  -- Migrate old 'blocked' status to 'on_hold'
  UPDATE projects
  SET status = 'on_hold'
  WHERE status = 'blocked';

END $$;

-- Step 3: Add new status check constraint with updated values (after data migration)
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('new', 'in_progress', 'on_hold', 'internal_review', 'out_to_client', 'ready_to_print', 'printing', 'bill_client', 'complete'));

-- Add comment documenting the change
COMMENT ON TABLE projects IS 'Projects table - Updated 2026-02-04: Removed blocked status, renamed pending_approval to internal_review, updated status colors';
