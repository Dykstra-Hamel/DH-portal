-- Make project_id optional in project_tasks
-- This allows tasks to be created without being associated with a project

-- Make project_id nullable
ALTER TABLE project_tasks
ALTER COLUMN project_id DROP NOT NULL;

-- Note: The foreign key constraint with ON DELETE CASCADE should already handle nulls correctly
-- If the constraint needs to be recreated:
-- ALTER TABLE project_tasks
-- DROP CONSTRAINT IF EXISTS project_tasks_project_id_fkey;
--
-- ALTER TABLE project_tasks
-- ADD CONSTRAINT project_tasks_project_id_fkey
-- FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add an index for querying tasks without a project
CREATE INDEX IF NOT EXISTS idx_project_tasks_standalone ON project_tasks(created_at DESC) WHERE project_id IS NULL;
