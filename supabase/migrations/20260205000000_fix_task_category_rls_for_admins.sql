-- Fix RLS policies for project_task_category_assignments to allow global admins
-- Global admins (profiles.role = 'admin') should be able to manage task categories
-- for all projects, not just projects in companies they're members of

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view task category assignments in their company" ON project_task_category_assignments;
DROP POLICY IF EXISTS "Users can create task category assignments in their company" ON project_task_category_assignments;
DROP POLICY IF EXISTS "Users can delete task category assignments in their company" ON project_task_category_assignments;

-- Recreate SELECT policy with admin support
CREATE POLICY "Users can view task category assignments in their company"
  ON project_task_category_assignments
  FOR SELECT
  USING (
    -- Allow if user is a global admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Allow if user is in the company that owns the project
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      JOIN user_companies uc ON p.company_id = uc.company_id
      WHERE pt.id = project_task_category_assignments.task_id
        AND uc.user_id = auth.uid()
    )
  );

-- Recreate INSERT policy with admin support
CREATE POLICY "Users can create task category assignments in their company"
  ON project_task_category_assignments
  FOR INSERT
  WITH CHECK (
    -- Allow if user is a global admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Allow if user is in the company that owns the project
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      JOIN user_companies uc ON p.company_id = uc.company_id
      WHERE pt.id = project_task_category_assignments.task_id
        AND uc.user_id = auth.uid()
    )
  );

-- Recreate DELETE policy with admin support
CREATE POLICY "Users can delete task category assignments in their company"
  ON project_task_category_assignments
  FOR DELETE
  USING (
    -- Allow if user is a global admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Allow if user is in the company that owns the project
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      JOIN user_companies uc ON p.company_id = uc.company_id
      WHERE pt.id = project_task_category_assignments.task_id
        AND uc.user_id = auth.uid()
    )
  );
