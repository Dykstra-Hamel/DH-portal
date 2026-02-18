-- Add current_department_id column to projects
ALTER TABLE projects
ADD COLUMN current_department_id UUID REFERENCES project_departments(id) ON DELETE RESTRICT;

-- Index for filtering/grouping by department
CREATE INDEX idx_projects_current_department ON projects(current_department_id);

-- Function to prevent department deletion if in use
CREATE OR REPLACE FUNCTION prevent_department_deletion_if_in_use()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM projects WHERE current_department_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete department: it is currently assigned to one or more projects';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce no-deletion rule
CREATE TRIGGER check_department_usage_before_delete
  BEFORE DELETE ON project_departments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_department_deletion_if_in_use();
