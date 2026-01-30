-- Add default_assigned_to field to project_template_tasks
-- This allows templates to specify a default assignee for each task

ALTER TABLE project_template_tasks
ADD COLUMN default_assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_project_template_tasks_assigned_to ON project_template_tasks(default_assigned_to);

-- Add helpful comment
COMMENT ON COLUMN project_template_tasks.default_assigned_to IS 'Default user to assign this task to when applying the template (optional)';
