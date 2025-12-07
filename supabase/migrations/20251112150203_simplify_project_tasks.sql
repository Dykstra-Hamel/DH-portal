-- Simplify project_tasks table by removing PM fields and replacing status with is_completed

-- Add is_completed column
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Migrate existing status data to is_completed
UPDATE project_tasks SET is_completed = TRUE WHERE status = 'completed';

-- Drop columns we no longer need
ALTER TABLE project_tasks DROP COLUMN IF EXISTS labels;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS milestone;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS sprint;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS story_points;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS kanban_column;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS status;

-- Update the comments to reflect new structure
COMMENT ON COLUMN project_tasks.is_completed IS 'Whether the task has been completed (simple checkbox)';
