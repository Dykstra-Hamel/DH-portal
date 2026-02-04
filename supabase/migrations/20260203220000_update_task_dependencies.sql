-- Migration: Update task dependencies to use direct foreign keys
-- Each task can only block ONE other task and be blocked by ONE other task

-- Add new columns to project_tasks for one-to-one relationships
ALTER TABLE project_tasks
ADD COLUMN blocks_task_id UUID,
ADD COLUMN blocked_by_task_id UUID;

-- Add foreign key constraints with explicit names for Supabase/PostgREST
ALTER TABLE project_tasks
ADD CONSTRAINT project_tasks_blocks_task_id_fkey
  FOREIGN KEY (blocks_task_id)
  REFERENCES project_tasks(id)
  ON DELETE SET NULL;

ALTER TABLE project_tasks
ADD CONSTRAINT project_tasks_blocked_by_task_id_fkey
  FOREIGN KEY (blocked_by_task_id)
  REFERENCES project_tasks(id)
  ON DELETE SET NULL;

-- Add constraints to prevent a task from blocking itself
ALTER TABLE project_tasks
ADD CONSTRAINT task_cannot_block_itself CHECK (blocks_task_id IS NULL OR blocks_task_id != id);

ALTER TABLE project_tasks
ADD CONSTRAINT task_cannot_be_blocked_by_itself CHECK (blocked_by_task_id IS NULL OR blocked_by_task_id != id);

-- Create indexes for efficient lookups
CREATE INDEX idx_project_tasks_blocks_task_id ON project_tasks(blocks_task_id);
CREATE INDEX idx_project_tasks_blocked_by_task_id ON project_tasks(blocked_by_task_id);

-- Migrate existing data from TEXT[] columns to new columns
-- Note: If there are multiple blocking/blocked_by relationships, only the first one will be migrated
DO $$
DECLARE
  task_record RECORD;
  blocking_task_id UUID;
BEGIN
  -- Migrate blocked_by relationships (first item in array)
  FOR task_record IN
    SELECT id, blocked_by[1] as first_blocked_by
    FROM project_tasks
    WHERE blocked_by IS NOT NULL
    AND array_length(blocked_by, 1) > 0
    AND blocked_by[1] IS NOT NULL
  LOOP
    -- Try to cast to UUID and update
    BEGIN
      blocking_task_id := task_record.first_blocked_by::UUID;

      UPDATE project_tasks
      SET blocked_by_task_id = blocking_task_id
      WHERE id = task_record.id;
    EXCEPTION
      WHEN invalid_text_representation THEN
        -- Skip non-UUID values
        CONTINUE;
      WHEN foreign_key_violation THEN
        -- Skip if the referenced task doesn't exist
        CONTINUE;
    END;
  END LOOP;

  -- Migrate blocking relationships (first item in array)
  FOR task_record IN
    SELECT id, blocking[1] as first_blocking
    FROM project_tasks
    WHERE blocking IS NOT NULL
    AND array_length(blocking, 1) > 0
    AND blocking[1] IS NOT NULL
  LOOP
    -- Try to cast to UUID and update
    BEGIN
      blocking_task_id := task_record.first_blocking::UUID;

      UPDATE project_tasks
      SET blocks_task_id = blocking_task_id
      WHERE id = task_record.id;
    EXCEPTION
      WHEN invalid_text_representation THEN
        -- Skip non-UUID values
        CONTINUE;
      WHEN foreign_key_violation THEN
        -- Skip if the referenced task doesn't exist
        CONTINUE;
    END;
  END LOOP;
END $$;

-- Drop the old TEXT[] columns
ALTER TABLE project_tasks DROP COLUMN IF EXISTS blocked_by;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS blocking;

-- Create function to prevent circular dependencies
-- This ensures Task A blocks Task B, Task B can't also block Task A
CREATE OR REPLACE FUNCTION prevent_circular_task_dependencies()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the task we're blocking is also blocking us (direct circular dependency)
  IF NEW.blocks_task_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM project_tasks
      WHERE id = NEW.blocks_task_id
      AND blocks_task_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular dependency detected: Task % is already blocking this task', NEW.blocks_task_id;
    END IF;
  END IF;

  -- Check if the task blocking us is also blocked by us (direct circular dependency)
  IF NEW.blocked_by_task_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM project_tasks
      WHERE id = NEW.blocked_by_task_id
      AND blocked_by_task_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular dependency detected: This task is already blocking task %', NEW.blocked_by_task_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce no circular dependencies
CREATE TRIGGER check_circular_dependencies
  BEFORE INSERT OR UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_task_dependencies();

-- Create helper function to check if a task has a blocking dependency
CREATE OR REPLACE FUNCTION has_blocking_dependency(task_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM project_tasks
    WHERE id = (
      SELECT blocked_by_task_id
      FROM project_tasks
      WHERE id = task_uuid
    )
    AND status NOT IN ('completed', 'cancelled')
  );
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get the blocking task for a task
CREATE OR REPLACE FUNCTION get_blocking_task(task_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  status VARCHAR,
  assigned_to UUID,
  due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.title,
    pt.status,
    pt.assigned_to,
    pt.due_date
  FROM project_tasks pt
  WHERE pt.id = (
    SELECT blocked_by_task_id
    FROM project_tasks
    WHERE id = task_uuid
  )
  AND pt.status NOT IN ('completed', 'cancelled');
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get the task that this task is blocking
CREATE OR REPLACE FUNCTION get_blocked_task(task_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  status VARCHAR,
  assigned_to UUID,
  due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.title,
    pt.status,
    pt.assigned_to,
    pt.due_date
  FROM project_tasks pt
  WHERE pt.id = (
    SELECT blocks_task_id
    FROM project_tasks
    WHERE id = task_uuid
  );
END;
$$ LANGUAGE plpgsql;
