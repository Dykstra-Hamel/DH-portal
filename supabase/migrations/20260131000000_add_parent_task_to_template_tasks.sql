-- Add parent_task_id to project_template_tasks for subtasks
ALTER TABLE project_template_tasks
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES project_template_tasks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_project_template_tasks_parent_task_id
  ON project_template_tasks(parent_task_id);
