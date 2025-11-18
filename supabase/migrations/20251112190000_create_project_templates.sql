-- Create project templates table for admin-created templates

CREATE TABLE project_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100) NOT NULL, -- 'print' or 'digital'
    project_subtype VARCHAR(100), -- specific subtype like 'business_cards', 'logo_design', etc.
    is_active BOOLEAN DEFAULT TRUE,
    template_data JSONB, -- Store default project settings (priority, tags, etc.)
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for tasks within templates
CREATE TABLE project_template_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date_offset_days INTEGER, -- Days offset from project start (negative = before start, positive = after)
    display_order INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_project_templates_type ON project_templates(project_type);
CREATE INDEX idx_project_templates_subtype ON project_templates(project_subtype);
CREATE INDEX idx_project_templates_active ON project_templates(is_active);
CREATE INDEX idx_project_templates_created_by ON project_templates(created_by);
CREATE INDEX idx_project_template_tasks_template_id ON project_template_tasks(template_id);
CREATE INDEX idx_project_template_tasks_order ON project_template_tasks(template_id, display_order);

-- Enable Row Level Security
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_template_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_templates

-- Admins have full access to all templates
CREATE POLICY "Admins full access to templates"
    ON project_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- All authenticated users can view active templates (for template selection)
CREATE POLICY "Users can view active templates"
    ON project_templates
    FOR SELECT
    USING (
        is_active = TRUE
        AND auth.uid() IS NOT NULL
    );

-- RLS Policies for project_template_tasks

-- Admins have full access to all template tasks
CREATE POLICY "Admins full access to template tasks"
    ON project_template_tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- All authenticated users can view tasks of active templates
CREATE POLICY "Users can view tasks of active templates"
    ON project_template_tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_templates
            WHERE project_templates.id = project_template_tasks.template_id
            AND project_templates.is_active = TRUE
        )
        AND auth.uid() IS NOT NULL
    );

-- Triggers for updated_at
CREATE TRIGGER update_project_templates_updated_at
    BEFORE UPDATE ON project_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_template_tasks_updated_at
    BEFORE UPDATE ON project_template_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON project_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_templates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_template_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_template_tasks TO service_role;

-- Add helpful comments
COMMENT ON TABLE project_templates IS 'Admin-created templates for creating projects with pre-defined settings and tasks';
COMMENT ON TABLE project_template_tasks IS 'Default tasks that get created when applying a project template';
COMMENT ON COLUMN project_templates.project_type IS 'Main project type: print or digital';
COMMENT ON COLUMN project_templates.project_subtype IS 'Specific subtype like business_cards, logo_design, etc.';
COMMENT ON COLUMN project_templates.is_active IS 'Whether this template is active and available for selection';
COMMENT ON COLUMN project_templates.template_data IS 'JSONB storing default project settings (priority, tags, etc.)';
COMMENT ON COLUMN project_template_tasks.due_date_offset_days IS 'Days offset from project start date (negative = before start, positive = after start, 0 = same day)';
COMMENT ON COLUMN project_template_tasks.display_order IS 'Order in which tasks should be displayed/created';
