-- Create monthly services departments system
-- Monthly services have different department requirements than projects

-- Create monthly_services_departments table
CREATE TABLE IF NOT EXISTS monthly_services_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_services_departments_sort_order
ON monthly_services_departments(sort_order);

-- Seed default departments
INSERT INTO monthly_services_departments (name, sort_order) VALUES
    ('Content', 1),
    ('SEO', 2),
    ('Design', 3),
    ('Development', 4),
    ('Account Management', 5),
    ('Social Media', 6)
ON CONFLICT (name) DO NOTHING;

-- Add department_id to monthly_service_task_templates
ALTER TABLE monthly_service_task_templates
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES monthly_services_departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_service_task_templates_department
ON monthly_service_task_templates(department_id);

-- Create join table for task-department assignments
-- This allows tasks to be associated with monthly services departments
CREATE TABLE IF NOT EXISTS monthly_service_task_department_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES monthly_services_departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_ms_task_department UNIQUE(task_id, department_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ms_task_dept_task_id
ON monthly_service_task_department_assignments(task_id);

CREATE INDEX IF NOT EXISTS idx_ms_task_dept_department_id
ON monthly_service_task_department_assignments(department_id);

-- Enable Row Level Security
ALTER TABLE monthly_services_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_service_task_department_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view departments
CREATE POLICY "Authenticated users can view MS departments"
ON monthly_services_departments
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policy: Only admins can manage departments
CREATE POLICY "Admins can manage MS departments"
ON monthly_services_departments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policy: Admins can view all task department assignments
CREATE POLICY "Admins can view MS task dept assignments"
ON monthly_service_task_department_assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policy: Admins can manage task department assignments
CREATE POLICY "Admins can manage MS task dept assignments"
ON monthly_service_task_department_assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Grant permissions
GRANT SELECT ON monthly_services_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_services_departments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_task_department_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_task_department_assignments TO service_role;

-- Add helpful comments
COMMENT ON TABLE monthly_services_departments IS 'Departments responsible for monthly service tasks (Content, SEO, Design, etc.)';
COMMENT ON TABLE monthly_service_task_department_assignments IS 'Join table linking project_tasks to monthly services departments';
COMMENT ON COLUMN monthly_service_task_templates.department_id IS 'Default department for tasks generated from this template';
