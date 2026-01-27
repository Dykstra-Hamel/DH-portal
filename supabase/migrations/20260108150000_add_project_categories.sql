-- Project Categories System Migration
-- This migration adds customizable project categories with multi-tenant support

-- ============================================================================
-- TABLE: project_categories
-- ============================================================================
-- Stores project categories (both internal admin categories and company-specific)
CREATE TABLE IF NOT EXISTS project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color for UI display (#RRGGBB)
  icon VARCHAR(50), -- Icon identifier (optional)
  sort_order INTEGER DEFAULT 0, -- For manual ordering of categories (lower = first)
  is_system_default BOOLEAN DEFAULT FALSE, -- Prevent deletion of system categories
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = internal/system category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_category_name_per_scope UNIQUE(name, company_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_project_categories_company ON project_categories(company_id);
CREATE INDEX idx_project_categories_system ON project_categories(is_system_default);
CREATE INDEX idx_project_categories_sort_order ON project_categories(sort_order);

-- Comments for documentation
COMMENT ON TABLE project_categories IS 'Customizable project categories for internal admin and per-company use';
COMMENT ON COLUMN project_categories.company_id IS 'NULL = internal system category (admin use), UUID = company-specific category';
COMMENT ON COLUMN project_categories.sort_order IS 'Lower values appear first. Allows drag-and-drop reordering in UI';
COMMENT ON COLUMN project_categories.is_system_default IS 'System default categories cannot be deleted by users';

-- ============================================================================
-- TABLE: project_category_assignments
-- ============================================================================
-- Junction table for many-to-many relationship (projects can have multiple categories)
CREATE TABLE IF NOT EXISTS project_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_project_category UNIQUE(project_id, category_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_project_category_assignments_project ON project_category_assignments(project_id);
CREATE INDEX idx_project_category_assignments_category ON project_category_assignments(category_id);

COMMENT ON TABLE project_category_assignments IS 'Many-to-many: Projects can have multiple categories';

-- ============================================================================
-- UPDATE: projects table
-- ============================================================================
-- Add is_internal column to distinguish between internal (admin) and client projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_projects_internal ON projects(is_internal);

COMMENT ON COLUMN projects.is_internal IS 'TRUE = internal agency project visible to admins, FALSE = client project visible to company';

-- ============================================================================
-- SEED: Default Internal Categories
-- ============================================================================
-- Insert system default categories for internal admin use
INSERT INTO project_categories (name, description, color, sort_order, is_system_default, company_id) VALUES
  ('Design', 'Design and creative work', '#8b5cf6', 1, TRUE, NULL),
  ('Development', 'Technical development and implementation', '#3b82f6', 2, TRUE, NULL),
  ('Content', 'Content creation and copywriting', '#f59e0b', 3, TRUE, NULL),
  ('Bill Client', 'Ready to bill or invoicing', '#10b981', 4, TRUE, NULL)
ON CONFLICT (name, company_id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES: project_categories
-- ============================================================================

-- Enable RLS on project_categories table
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

-- Policy: View internal categories (admins) OR company-specific categories (company members)
CREATE POLICY "View project categories" ON project_categories FOR SELECT
USING (
  -- Admins can see internal categories (company_id IS NULL)
  (company_id IS NULL AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  ))
  OR
  -- Users can see their company's categories
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = project_categories.company_id
  ))
);

-- Policy: Create internal categories (admins only) OR company categories (company members)
CREATE POLICY "Create project categories" ON project_categories FOR INSERT
WITH CHECK (
  -- Admins can create internal categories
  (company_id IS NULL AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  ))
  OR
  -- Company users can create categories for their company
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = project_categories.company_id
  ))
);

-- Policy: Update internal categories (admins only) OR company categories (company members)
CREATE POLICY "Update project categories" ON project_categories FOR UPDATE
USING (
  -- Admins can update internal categories
  (company_id IS NULL AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  ))
  OR
  -- Company users can update their company's categories
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = project_categories.company_id
  ))
);

-- Policy: Delete non-system categories (admins for internal, company users for company categories)
CREATE POLICY "Delete project categories" ON project_categories FOR DELETE
USING (
  -- Cannot delete system default categories
  is_system_default = FALSE
  AND (
    -- Admins can delete internal categories
    (company_id IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    ))
    OR
    -- Company users can delete their company's categories
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid() AND uc.company_id = project_categories.company_id
    ))
  )
);

-- ============================================================================
-- RLS POLICIES: project_category_assignments
-- ============================================================================

-- Enable RLS on project_category_assignments table
ALTER TABLE project_category_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: View category assignments if user can view the project
CREATE POLICY "View project category assignments" ON project_category_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      -- Admins can see internal projects
      (p.is_internal = TRUE AND EXISTS (
        SELECT 1 FROM public.profiles prof
        WHERE prof.id = auth.uid() AND prof.role IN ('admin', 'super_admin')
      ))
      OR
      -- Users can see their company's projects
      (p.is_internal = FALSE AND EXISTS (
        SELECT 1 FROM public.user_companies uc
        WHERE uc.user_id = auth.uid() AND uc.company_id = p.company_id
      ))
      OR
      -- Assigned or requested by user
      p.assigned_to = auth.uid()
      OR
      p.requested_by = auth.uid()
    )
  )
);

-- Policy: Create category assignments if user can update the project
CREATE POLICY "Create project category assignments" ON project_category_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      -- Admins can assign to internal projects
      (p.is_internal = TRUE AND EXISTS (
        SELECT 1 FROM public.profiles prof
        WHERE prof.id = auth.uid() AND prof.role IN ('admin', 'super_admin')
      ))
      OR
      -- Users can assign to their company's projects
      (p.is_internal = FALSE AND EXISTS (
        SELECT 1 FROM public.user_companies uc
        WHERE uc.user_id = auth.uid() AND uc.company_id = p.company_id
      ))
    )
  )
);

-- Policy: Delete category assignments if user can update the project
CREATE POLICY "Delete project category assignments" ON project_category_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      -- Admins can remove from internal projects
      (p.is_internal = TRUE AND EXISTS (
        SELECT 1 FROM public.profiles prof
        WHERE prof.id = auth.uid() AND prof.role IN ('admin', 'super_admin')
      ))
      OR
      -- Users can remove from their company's projects
      (p.is_internal = FALSE AND EXISTS (
        SELECT 1 FROM public.user_companies uc
        WHERE uc.user_id = auth.uid() AND uc.company_id = p.company_id
      ))
    )
  )
);

-- ============================================================================
-- UPDATE RLS POLICIES: projects table
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view projects" ON projects;

-- New SELECT policy with is_internal logic
CREATE POLICY "View projects" ON projects FOR SELECT
USING (
  -- Admins can view internal projects
  (is_internal = TRUE AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  ))
  OR
  -- Users can view their company's projects (non-internal)
  (is_internal = FALSE AND EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = projects.company_id
  ))
  OR
  -- User is assigned to or requested the project
  assigned_to = auth.uid()
  OR
  requested_by = auth.uid()
);

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create projects" ON projects;

-- New INSERT policy with is_internal logic
CREATE POLICY "Create projects" ON projects FOR INSERT
WITH CHECK (
  -- Admins can create internal projects
  (is_internal = TRUE AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  ))
  OR
  -- Company users can create company projects
  (is_internal = FALSE AND EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = projects.company_id
  ))
);

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update projects" ON projects;

-- New UPDATE policy with is_internal logic
CREATE POLICY "Update projects" ON projects FOR UPDATE
USING (
  -- Admins can update internal projects
  (is_internal = TRUE AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  ))
  OR
  -- Company users can update their company's projects
  (is_internal = FALSE AND (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid() AND uc.company_id = projects.company_id
    )
    OR
    assigned_to = auth.uid()
    OR
    requested_by = auth.uid()
  ))
);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to automatically update updated_at on project_categories
CREATE TRIGGER update_project_categories_timestamp
  BEFORE UPDATE ON project_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_project_categories_updated_at();
