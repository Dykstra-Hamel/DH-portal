-- Create default template tables for monthly services
-- These allow admins to create reusable template sets that can be loaded when creating new monthly services

-- Create monthly_service_default_templates table
CREATE TABLE IF NOT EXISTS monthly_service_default_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monthly_service_default_template_tasks table
CREATE TABLE IF NOT EXISTS monthly_service_default_template_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    default_template_id UUID NOT NULL REFERENCES monthly_service_default_templates(id) ON DELETE CASCADE,

    -- Task information
    title TEXT NOT NULL,
    description TEXT,

    -- Assignment
    default_assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    department_id UUID REFERENCES monthly_services_departments(id) ON DELETE SET NULL,

    -- Scheduling
    week_of_month INTEGER CHECK (week_of_month >= 1 AND week_of_month <= 4),
    due_day_of_week INTEGER CHECK (due_day_of_week >= 0 AND due_day_of_week <= 6),

    -- Display
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_service_default_templates_active
    ON monthly_service_default_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_monthly_service_default_templates_created_by
    ON monthly_service_default_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_monthly_service_default_template_tasks_template_id
    ON monthly_service_default_template_tasks(default_template_id);
CREATE INDEX IF NOT EXISTS idx_monthly_service_default_template_tasks_order
    ON monthly_service_default_template_tasks(default_template_id, display_order);

-- Create triggers for updated_at
CREATE TRIGGER update_monthly_service_default_templates_updated_at
    BEFORE UPDATE ON monthly_service_default_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_service_default_template_tasks_updated_at
    BEFORE UPDATE ON monthly_service_default_template_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE monthly_service_default_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_service_default_template_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_service_default_templates
-- Only super admins can manage default templates
CREATE POLICY "Super admins have full access to monthly service default templates"
    ON monthly_service_default_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for monthly_service_default_template_tasks
-- Only super admins can manage default template tasks
CREATE POLICY "Super admins have full access to monthly service default template tasks"
    ON monthly_service_default_template_tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_default_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_default_templates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_default_template_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_default_template_tasks TO service_role;

-- Add helpful comments
COMMENT ON TABLE monthly_service_default_templates IS 'Reusable template sets for monthly service task templates';
COMMENT ON TABLE monthly_service_default_template_tasks IS 'Task definitions within default templates that can be loaded when creating a new monthly service';

COMMENT ON COLUMN monthly_service_default_templates.name IS 'Template name (e.g., "Standard SEO Package", "Social Media Management")';
COMMENT ON COLUMN monthly_service_default_templates.description IS 'Description of what this template includes';
COMMENT ON COLUMN monthly_service_default_templates.is_active IS 'Whether this template is available for selection';

COMMENT ON COLUMN monthly_service_default_template_tasks.default_template_id IS 'The default template this task belongs to';
COMMENT ON COLUMN monthly_service_default_template_tasks.title IS 'Task title (e.g., "Post Blog 1", "Audit Technical SEO")';
COMMENT ON COLUMN monthly_service_default_template_tasks.week_of_month IS 'Which week of the month (1-4) this task is due';
COMMENT ON COLUMN monthly_service_default_template_tasks.due_day_of_week IS 'Day of week task is due (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN monthly_service_default_template_tasks.default_assigned_to IS 'Default team member assigned to this task';
COMMENT ON COLUMN monthly_service_default_template_tasks.department_id IS 'Department this task belongs to';
