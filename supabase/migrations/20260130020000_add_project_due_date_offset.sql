-- Add default due date offset for projects created from templates
-- This allows templates to specify how many days after the start date the project should be due

ALTER TABLE project_templates
ADD COLUMN default_due_date_offset_days INTEGER DEFAULT 30;

-- Add helpful comment
COMMENT ON COLUMN project_templates.default_due_date_offset_days IS 'Default number of days from project start date to set the due date (e.g., 30 = due 30 days after start)';
