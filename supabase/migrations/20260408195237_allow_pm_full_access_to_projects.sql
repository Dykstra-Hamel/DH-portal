-- Allow project_manager role to view and update all projects.
-- Uses the existing is_admin_or_pm() SECURITY DEFINER function to avoid RLS recursion.

DROP POLICY IF EXISTS "View projects" ON projects;

CREATE POLICY "View projects" ON projects
  FOR SELECT
  USING (
    -- Admins and project managers can see all projects
    public.is_admin_or_pm()
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

DROP POLICY IF EXISTS "Update projects" ON projects;

CREATE POLICY "Update projects" ON projects
  FOR UPDATE
  USING (
    -- Admins and project managers can update any project
    public.is_admin_or_pm()
    OR
    -- Users can update projects they created or are assigned to
    requested_by = auth.uid()
    OR
    assigned_to = auth.uid()
  );
