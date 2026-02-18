-- Add category support to project tasks
-- This allows tasks to be assigned categories from the same project_categories table used by projects

-- Create junction table for task-category assignments
CREATE TABLE IF NOT EXISTS project_task_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a task can only be assigned to a category once
  UNIQUE (task_id, category_id)
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_task_category_assignments_task ON project_task_category_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_category_assignments_category ON project_task_category_assignments(category_id);

-- Enable RLS
ALTER TABLE project_task_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Users can view task category assignments for tasks in their company's projects
CREATE POLICY "Users can view task category assignments in their company"
  ON project_task_category_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      JOIN user_companies uc ON p.company_id = uc.company_id
      WHERE pt.id = project_task_category_assignments.task_id
        AND uc.user_id = auth.uid()
    )
  );

-- Policy 2: Users can create task category assignments for tasks in their company's projects
CREATE POLICY "Users can create task category assignments in their company"
  ON project_task_category_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      JOIN user_companies uc ON p.company_id = uc.company_id
      WHERE pt.id = project_task_category_assignments.task_id
        AND uc.user_id = auth.uid()
    )
  );

-- Policy 3: Users can delete task category assignments for tasks in their company's projects
CREATE POLICY "Users can delete task category assignments in their company"
  ON project_task_category_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      JOIN user_companies uc ON p.company_id = uc.company_id
      WHERE pt.id = project_task_category_assignments.task_id
        AND uc.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_category_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_category_assignment_updated_at
  BEFORE UPDATE ON project_task_category_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_category_assignment_updated_at();

-- Add constraint to ensure task categories match project categories
-- This function validates that the category being assigned to a task
-- is also assigned to the task's parent project
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

  -- Check if the category is assigned to the project
  SELECT EXISTS (
    SELECT 1
    FROM project_category_assignments
    WHERE project_id = v_project_id
      AND category_id = NEW.category_id
  ) INTO v_category_exists;

  -- If the category is not assigned to the project, raise an error
  IF NOT v_category_exists THEN
    RAISE EXCEPTION 'Category must be assigned to the project before it can be assigned to a task';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_task_category_trigger
  BEFORE INSERT OR UPDATE ON project_task_category_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_category();
