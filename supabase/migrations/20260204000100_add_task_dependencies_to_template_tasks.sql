-- Add task dependency columns to project_template_tasks
ALTER TABLE project_template_tasks
ADD COLUMN blocks_task_id UUID REFERENCES project_template_tasks(id) ON DELETE SET NULL,
ADD COLUMN blocked_by_task_id UUID REFERENCES project_template_tasks(id) ON DELETE SET NULL;

-- Indexes for faster lookups
CREATE INDEX idx_project_template_tasks_blocks ON project_template_tasks(blocks_task_id);
CREATE INDEX idx_project_template_tasks_blocked_by ON project_template_tasks(blocked_by_task_id);

-- Constraint: A task cannot block itself
ALTER TABLE project_template_tasks
ADD CONSTRAINT check_task_not_block_self
CHECK (blocks_task_id IS NULL OR blocks_task_id != id);

-- Constraint: A task cannot be blocked by itself
ALTER TABLE project_template_tasks
ADD CONSTRAINT check_task_not_blocked_by_self
CHECK (blocked_by_task_id IS NULL OR blocked_by_task_id != id);

COMMENT ON COLUMN project_template_tasks.blocks_task_id IS 'ID of the template task that this task blocks (one-to-one)';
COMMENT ON COLUMN project_template_tasks.blocked_by_task_id IS 'ID of the template task that blocks this task (one-to-one)';
