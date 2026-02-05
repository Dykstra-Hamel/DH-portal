-- Migration: Add department_id to tasks and implement bidirectional dependency sync
-- Description: Enables task-department associations and automatic two-way dependency updates

-- Add department_id to project_tasks
ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES project_departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_tasks_department_id ON project_tasks(department_id);

-- Add department_id to project_template_tasks for consistency
ALTER TABLE project_template_tasks
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES project_departments(id) ON DELETE SET NULL;

-- Create bidirectional sync trigger function
CREATE OR REPLACE FUNCTION sync_bidirectional_task_dependencies()
RETURNS TRIGGER AS $$
DECLARE
  recursion_guard BOOLEAN;
  old_blocks_id UUID;
  old_blocked_by_id UUID;
BEGIN
  -- Check if we're already in a recursive call to prevent infinite loops
  BEGIN
    recursion_guard := current_setting('app.in_dependency_sync', TRUE)::BOOLEAN;
  EXCEPTION
    WHEN OTHERS THEN
      recursion_guard := FALSE;
  END;

  IF recursion_guard IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Set guard to prevent recursion
  PERFORM set_config('app.in_dependency_sync', 'true', TRUE);

  -- Handle INSERT vs UPDATE - OLD is NULL during INSERT
  IF TG_OP = 'INSERT' THEN
    old_blocks_id := NULL;
    old_blocked_by_id := NULL;
  ELSE
    old_blocks_id := OLD.blocks_task_id;
    old_blocked_by_id := OLD.blocked_by_task_id;
  END IF;

  -- Handle blocks_task_id changes
  IF NEW.blocks_task_id IS DISTINCT FROM old_blocks_id THEN
    -- Clear old blocked task's blocked_by_task_id if it pointed to this task
    IF old_blocks_id IS NOT NULL THEN
      UPDATE project_tasks
      SET blocked_by_task_id = NULL
      WHERE id = old_blocks_id AND blocked_by_task_id = NEW.id;
    END IF;

    -- Set new blocked task's blocked_by_task_id to this task
    IF NEW.blocks_task_id IS NOT NULL THEN
      UPDATE project_tasks
      SET blocked_by_task_id = NEW.id
      WHERE id = NEW.blocks_task_id;
    END IF;
  END IF;

  -- Handle blocked_by_task_id changes
  IF NEW.blocked_by_task_id IS DISTINCT FROM old_blocked_by_id THEN
    -- Clear old blocking task's blocks_task_id if it pointed to this task
    IF old_blocked_by_id IS NOT NULL THEN
      UPDATE project_tasks
      SET blocks_task_id = NULL
      WHERE id = old_blocked_by_id AND blocks_task_id = NEW.id;
    END IF;

    -- Set new blocking task's blocks_task_id to this task
    IF NEW.blocked_by_task_id IS NOT NULL THEN
      UPDATE project_tasks
      SET blocks_task_id = NEW.id
      WHERE id = NEW.blocked_by_task_id;
    END IF;
  END IF;

  -- Clear guard
  PERFORM set_config('app.in_dependency_sync', 'false', TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bidirectional sync
DROP TRIGGER IF EXISTS sync_bidirectional_task_dependencies_trigger ON project_tasks;

CREATE TRIGGER sync_bidirectional_task_dependencies_trigger
AFTER INSERT OR UPDATE OF blocks_task_id, blocked_by_task_id ON project_tasks
FOR EACH ROW
EXECUTE FUNCTION sync_bidirectional_task_dependencies();

-- Helper function to get all tasks blocked by a specific task
CREATE OR REPLACE FUNCTION get_all_blocked_tasks(task_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  is_completed BOOLEAN,
  assigned_to UUID,
  project_id UUID,
  department_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT pt.id, pt.title, pt.is_completed, pt.assigned_to, pt.project_id, pt.department_id
  FROM project_tasks pt
  WHERE pt.blocked_by_task_id = task_uuid
    AND pt.is_completed = FALSE;
END;
$$ LANGUAGE plpgsql;
