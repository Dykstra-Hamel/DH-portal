-- Add recurring task support to project_tasks table

-- Add recurring fields
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(20);
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS is_recurring_template BOOLEAN DEFAULT FALSE;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS next_recurrence_date DATE;

-- Add constraint for recurring frequency values
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_recurring_frequency_check
    CHECK (
        recurring_frequency IN ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')
        OR recurring_frequency IS NULL
    );

-- Index for finding recurring tasks that need generation (cron job queries)
CREATE INDEX idx_project_tasks_recurring_generation
    ON project_tasks(is_recurring_template, recurring_frequency, next_recurrence_date)
    WHERE is_recurring_template = TRUE AND recurring_frequency IS NOT NULL;

-- Index for finding instances of a recurring task
CREATE INDEX idx_project_tasks_parent_recurring
    ON project_tasks(parent_recurring_task_id)
    WHERE parent_recurring_task_id IS NOT NULL;

-- Index for finding recurring templates by project
CREATE INDEX idx_project_tasks_recurring_by_project
    ON project_tasks(project_id, is_recurring_template)
    WHERE is_recurring_template = TRUE;

-- Add helpful comments
COMMENT ON COLUMN project_tasks.recurring_frequency IS 'How often this task recurs: none, daily, weekly, biweekly, monthly, quarterly, yearly';
COMMENT ON COLUMN project_tasks.recurring_end_date IS 'Date when recurring task series should end (null = no end date, recurs indefinitely)';
COMMENT ON COLUMN project_tasks.parent_recurring_task_id IS 'For recurring task instances, references the original/template task';
COMMENT ON COLUMN project_tasks.is_recurring_template IS 'True if this is the template/original task that generates recurring instances';
COMMENT ON COLUMN project_tasks.next_recurrence_date IS 'Date when the next instance should be generated (only used for template tasks)';
