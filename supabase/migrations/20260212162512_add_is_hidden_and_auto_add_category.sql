-- Step 1: Add is_hidden column to project_categories
ALTER TABLE project_categories ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Replace validate_task_category() trigger to auto-add category to project
-- instead of raising an exception when the category isn't assigned to the project.
DROP TRIGGER IF EXISTS validate_task_category_trigger ON project_task_category_assignments;
DROP FUNCTION IF EXISTS validate_task_category();

CREATE OR REPLACE FUNCTION validate_task_category()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_category_exists BOOLEAN;
BEGIN
  -- Get the project_id for this task
  SELECT project_id INTO v_project_id
  FROM project_tasks
  WHERE id = NEW.task_id;

  -- If the task has no project, allow any category
  IF v_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if the category (with matching type) is assigned to the project
  SELECT EXISTS (
    SELECT 1
    FROM project_category_assignments
    WHERE project_id = v_project_id
      AND category_id = NEW.category_id
      AND category_type = NEW.category_type
  ) INTO v_category_exists;

  -- If the category is not assigned to the project, auto-add it
  IF NOT v_category_exists THEN
    INSERT INTO project_category_assignments (project_id, category_id, category_type)
    VALUES (v_project_id, NEW.category_id, NEW.category_type)
    ON CONFLICT ON CONSTRAINT unique_project_category_type DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_task_category_trigger
  BEFORE INSERT OR UPDATE ON project_task_category_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_category();
