-- Create project_departments table
CREATE TABLE project_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: name must be unique within scope (internal OR per company)
  CONSTRAINT unique_department_name_per_scope UNIQUE NULLS NOT DISTINCT (name, company_id)
);

-- Indexes
CREATE INDEX idx_project_departments_company ON project_departments(company_id);
CREATE INDEX idx_project_departments_sort_order ON project_departments(sort_order);

-- RLS policies
ALTER TABLE project_departments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view departments from their company or system departments
CREATE POLICY "Users can view departments" ON project_departments
  FOR SELECT
  USING (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Only admins can modify system departments (company_id IS NULL)
CREATE POLICY "Admins can manage system departments" ON project_departments
  FOR ALL
  USING (
    company_id IS NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Company admins can manage their own departments
CREATE POLICY "Company admins can manage company departments" ON project_departments
  FOR ALL
  USING (
    company_id IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'company_admin')
    )
  );
