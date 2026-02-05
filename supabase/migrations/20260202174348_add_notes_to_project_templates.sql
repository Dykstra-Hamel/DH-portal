-- Add notes column to project_templates table
ALTER TABLE project_templates ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to document the field
COMMENT ON COLUMN project_templates.notes IS 'Default notes to be copied to projects created from this template';
