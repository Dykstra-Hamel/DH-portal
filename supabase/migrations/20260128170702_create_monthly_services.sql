-- Create monthly_services tables for internal marketing agency operations
-- These tables manage recurring service packages and tasks for client companies

-- Create monthly_services table
CREATE TABLE IF NOT EXISTS monthly_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Service information
    service_name TEXT NOT NULL,
    description TEXT,

    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monthly_service_task_templates table
CREATE TABLE IF NOT EXISTS monthly_service_task_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_service_id UUID NOT NULL REFERENCES monthly_services(id) ON DELETE CASCADE,

    -- Task information
    title TEXT NOT NULL,
    description TEXT,

    -- Assignment
    default_assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Scheduling
    week_of_month INTEGER CHECK (week_of_month >= 1 AND week_of_month <= 4),
    due_day_of_week INTEGER CHECK (due_day_of_week >= 0 AND due_day_of_week <= 6),
    recurrence_frequency TEXT CHECK (recurrence_frequency IN ('weekly', 'biweekly', 'monthly')),

    -- Display
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add monthly_service_id to project_tasks to link generated instances
ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS monthly_service_id UUID REFERENCES monthly_services(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_services_company_id ON monthly_services(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_services_status ON monthly_services(status);
CREATE INDEX IF NOT EXISTS idx_monthly_services_company_status ON monthly_services(company_id, status);

CREATE INDEX IF NOT EXISTS idx_monthly_service_task_templates_service_id ON monthly_service_task_templates(monthly_service_id);
CREATE INDEX IF NOT EXISTS idx_monthly_service_task_templates_week ON monthly_service_task_templates(week_of_month);
CREATE INDEX IF NOT EXISTS idx_monthly_service_task_templates_assigned_to ON monthly_service_task_templates(default_assigned_to);
CREATE INDEX IF NOT EXISTS idx_monthly_service_task_templates_display_order ON monthly_service_task_templates(monthly_service_id, display_order);

CREATE INDEX IF NOT EXISTS idx_project_tasks_monthly_service_id ON project_tasks(monthly_service_id) WHERE monthly_service_id IS NOT NULL;

-- Create triggers for updated_at
CREATE TRIGGER update_monthly_services_updated_at
    BEFORE UPDATE ON monthly_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_service_task_templates_updated_at
    BEFORE UPDATE ON monthly_service_task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_project_task_updated_at();

-- Enable Row Level Security
ALTER TABLE monthly_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_service_task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_services
-- Only super admins can manage monthly services
CREATE POLICY "Super admins have full access to monthly services"
    ON monthly_services
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for monthly_service_task_templates
-- Only super admins can manage task templates
CREATE POLICY "Super admins have full access to monthly service task templates"
    ON monthly_service_task_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_services TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_task_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_task_templates TO service_role;

-- Add helpful comments
COMMENT ON TABLE monthly_services IS 'Monthly service packages for client companies managed by the marketing agency';
COMMENT ON TABLE monthly_service_task_templates IS 'Recurring task templates that define what tasks are generated for each monthly service';

COMMENT ON COLUMN monthly_services.company_id IS 'The client company this service package is for';
COMMENT ON COLUMN monthly_services.service_name IS 'Name of the service package (e.g., "Standard SEO Package", "Social Media Management")';
COMMENT ON COLUMN monthly_services.status IS 'Current status: active, paused, or cancelled';

COMMENT ON COLUMN monthly_service_task_templates.monthly_service_id IS 'The service package this task template belongs to';
COMMENT ON COLUMN monthly_service_task_templates.title IS 'Task title (e.g., "Post Blog 1", "Audit Technical SEO")';
COMMENT ON COLUMN monthly_service_task_templates.week_of_month IS 'Which week of the month (1-4) this task is due';
COMMENT ON COLUMN monthly_service_task_templates.due_day_of_week IS 'Day of week task is due (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN monthly_service_task_templates.recurrence_frequency IS 'How often this task recurs: weekly, biweekly, or monthly';
COMMENT ON COLUMN monthly_service_task_templates.default_assigned_to IS 'Default team member assigned to this task when generated';

COMMENT ON COLUMN project_tasks.monthly_service_id IS 'Links generated task instances back to their monthly service';
