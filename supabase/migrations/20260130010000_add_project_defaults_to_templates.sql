-- Add default project-level fields to project_templates
-- This allows templates to specify default assignee and scope for the project

ALTER TABLE project_templates
ADD COLUMN default_assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN default_scope VARCHAR(20) DEFAULT 'internal' CHECK (default_scope IN ('internal', 'external', 'both'));

-- Add index for performance
CREATE INDEX idx_project_templates_assigned_to ON project_templates(default_assigned_to);

-- Add helpful comments
COMMENT ON COLUMN project_templates.default_assigned_to IS 'Default user to assign the project to when applying the template (optional)';
COMMENT ON COLUMN project_templates.default_scope IS 'Default scope for projects created from this template: internal (agency-only), external (client-only), or both (mixed work)';
