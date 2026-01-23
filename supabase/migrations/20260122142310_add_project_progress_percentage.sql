-- Add progress_percentage column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Add constraint to ensure progress is between 0 and 100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'progress_percentage_range'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT progress_percentage_range
      CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

-- Create function to calculate and update project progress
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_progress INTEGER;
BEGIN
  -- Determine which project_id to update
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  -- Skip if no project_id (tasks can exist without projects)
  IF v_project_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Count total and completed tasks for this project
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO v_total_tasks, v_completed_tasks
  FROM project_tasks
  WHERE project_id = v_project_id;

  -- Calculate progress percentage
  IF v_total_tasks > 0 THEN
    v_progress := ROUND((v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100);
  ELSE
    v_progress := 0;
  END IF;

  -- Update the project's progress_percentage
  UPDATE projects
  SET progress_percentage = v_progress
  WHERE id = v_project_id;

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on project_tasks table
DROP TRIGGER IF EXISTS trigger_update_project_progress ON project_tasks;
CREATE TRIGGER trigger_update_project_progress
  AFTER INSERT OR UPDATE OR DELETE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();

-- Also handle when a task's project_id changes (need to update both old and new project)
CREATE OR REPLACE FUNCTION update_project_progress_on_move()
RETURNS TRIGGER AS $$
DECLARE
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_progress INTEGER;
BEGIN
  -- Only run if project_id actually changed
  IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
    -- Update old project's progress (if it had a project)
    IF OLD.project_id IS NOT NULL THEN
      SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE is_completed = true)
      INTO v_total_tasks, v_completed_tasks
      FROM project_tasks
      WHERE project_id = OLD.project_id;

      IF v_total_tasks > 0 THEN
        v_progress := ROUND((v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100);
      ELSE
        v_progress := 0;
      END IF;

      UPDATE projects
      SET progress_percentage = v_progress
      WHERE id = OLD.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_progress_on_move ON project_tasks;
CREATE TRIGGER trigger_update_project_progress_on_move
  AFTER UPDATE OF project_id ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress_on_move();

-- Initialize progress for existing projects using a CTE
WITH task_counts AS (
  SELECT
    project_id,
    COUNT(*) AS total_tasks,
    COUNT(*) FILTER (WHERE is_completed = true) AS completed_tasks
  FROM project_tasks
  WHERE project_id IS NOT NULL
  GROUP BY project_id
)
UPDATE projects p
SET progress_percentage = CASE
  WHEN tc.total_tasks > 0 THEN ROUND((tc.completed_tasks::NUMERIC / tc.total_tasks::NUMERIC) * 100)
  ELSE 0
END
FROM task_counts tc
WHERE p.id = tc.project_id;
