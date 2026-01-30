-- Add default is_billable flag for project templates
ALTER TABLE project_templates
ADD COLUMN IF NOT EXISTS default_is_billable BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN project_templates.default_is_billable IS 'Default billable flag for projects created from this template';
