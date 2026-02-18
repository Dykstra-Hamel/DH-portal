-- Remove is_internal column (replaced by scope column)
-- The 'scope' column now handles internal/external/both categorization

-- First, drop all policies that depend on is_internal column

-- Drop project_category_assignments policies
DROP POLICY IF EXISTS "View project category assignments" ON project_category_assignments;
DROP POLICY IF EXISTS "Create project category assignments" ON project_category_assignments;
DROP POLICY IF EXISTS "Delete project category assignments" ON project_category_assignments;

-- Drop projects policies
DROP POLICY IF EXISTS "View projects" ON projects;
DROP POLICY IF EXISTS "Create projects" ON projects;
DROP POLICY IF EXISTS "Update projects" ON projects;

-- Now drop the column
ALTER TABLE projects DROP COLUMN IF EXISTS is_internal;

-- Remove any index on is_internal if it exists
DROP INDEX IF EXISTS idx_projects_internal;

-- Recreate policies using scope column instead of is_internal

-- Projects policies
CREATE POLICY "View projects" ON projects
  FOR SELECT
  USING (
    -- Admins can see all projects
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    OR
    -- Users can see projects for their company (external or both scope)
    (
      scope IN ('external', 'both')
      AND company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR
    -- Users can see projects they created or are assigned to
    requested_by = auth.uid()
    OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Create projects" ON projects
  FOR INSERT
  WITH CHECK (
    -- Admins can create any project
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    OR
    -- Users can create projects for their company
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Update projects" ON projects
  FOR UPDATE
  USING (
    -- Admins can update any project
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    OR
    -- Users can update projects they created or are assigned to
    requested_by = auth.uid()
    OR
    assigned_to = auth.uid()
  );

-- Project category assignments policies
CREATE POLICY "View project category assignments" ON project_category_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_category_assignments.project_id
      AND (
        -- Admins can see all
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin')
        )
        OR
        -- Users can see for their company's projects
        p.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        OR
        -- Users can see for projects they're involved with
        p.requested_by = auth.uid()
        OR
        p.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Create project category assignments" ON project_category_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_category_assignments.project_id
      AND (
        -- Admins can create
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin')
        )
        OR
        -- Project creator can add categories
        p.requested_by = auth.uid()
      )
    )
  );

CREATE POLICY "Delete project category assignments" ON project_category_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_category_assignments.project_id
      AND (
        -- Admins can delete
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin')
        )
        OR
        -- Project creator can remove categories
        p.requested_by = auth.uid()
      )
    )
  );
