-- Add initial_department_id to project_templates
ALTER TABLE project_templates
ADD COLUMN initial_department_id UUID REFERENCES project_departments(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX idx_project_templates_initial_department ON project_templates(initial_department_id);

COMMENT ON COLUMN project_templates.initial_department_id IS 'Default department to assign when applying this template';
