-- Add category_type support for dual categorization (internal vs external)
-- This migration enables projects with scope='both' to have separate categorizations
-- for agency staff (internal) and company users (external)

-- Step 1: Add category_type to project_category_assignments
ALTER TABLE project_category_assignments
ADD COLUMN category_type TEXT DEFAULT 'internal'
CHECK (category_type IN ('internal', 'external'));

-- Add index for filtering by category_type
CREATE INDEX idx_project_category_assignments_type ON project_category_assignments(category_type);

-- Update unique constraint to allow same category with different types
ALTER TABLE project_category_assignments
DROP CONSTRAINT IF EXISTS unique_project_category;

ALTER TABLE project_category_assignments
ADD CONSTRAINT unique_project_category_type UNIQUE(project_id, category_id, category_type);

-- Step 2: Add category_type to task category assignments
ALTER TABLE project_task_category_assignments
ADD COLUMN category_type TEXT DEFAULT 'internal'
CHECK (category_type IN ('internal', 'external'));

-- Add index for filtering by category_type
CREATE INDEX idx_task_category_assignments_type ON project_task_category_assignments(category_type);

-- Update unique constraint to allow same category with different types
ALTER TABLE project_task_category_assignments
DROP CONSTRAINT IF EXISTS unique_task_category;

ALTER TABLE project_task_category_assignments
ADD CONSTRAINT unique_task_category_type UNIQUE(task_id, category_id, category_type);

-- Step 3: Create validation trigger for project category scope
CREATE OR REPLACE FUNCTION validate_project_category_scope()
RETURNS TRIGGER AS $$
DECLARE
  v_scope TEXT;
  v_project_company_id UUID;
  v_category_company_id UUID;
BEGIN
  -- Get project details
  SELECT scope, company_id INTO v_scope, v_project_company_id
  FROM projects
  WHERE id = NEW.project_id;

  -- Get category company_id
  SELECT company_id INTO v_category_company_id
  FROM project_categories
  WHERE id = NEW.category_id;

  -- Validation logic based on project scope and category type
  IF v_scope = 'internal' THEN
    -- Internal projects can ONLY have internal category assignments
    IF NEW.category_type != 'internal' THEN
      RAISE EXCEPTION 'Internal projects (scope=internal) can only have internal category assignments';
    END IF;
    -- Internal categories must be system categories
    IF v_category_company_id IS NOT NULL THEN
      RAISE EXCEPTION 'Internal category assignments must use system categories (company_id IS NULL)';
    END IF;

  ELSIF v_scope = 'external' THEN
    -- External projects can ONLY have external category assignments
    IF NEW.category_type != 'external' THEN
      RAISE EXCEPTION 'External projects (scope=external) can only have external category assignments';
    END IF;
    -- External categories must be company categories matching the project
    IF v_category_company_id IS NULL THEN
      RAISE EXCEPTION 'External category assignments cannot use system categories';
    END IF;
    IF v_category_company_id != v_project_company_id THEN
      RAISE EXCEPTION 'External category company_id (%) must match project company_id (%)',
        v_category_company_id, v_project_company_id;
    END IF;

  ELSIF v_scope = 'both' THEN
    -- Both projects can have both internal AND external category assignments
    IF NEW.category_type = 'internal' THEN
      -- Internal category assignments must use system categories
      IF v_category_company_id IS NOT NULL THEN
        RAISE EXCEPTION 'Internal category assignments must use system categories (company_id IS NULL)';
      END IF;
    ELSIF NEW.category_type = 'external' THEN
      -- External category assignments must use company categories
      IF v_category_company_id IS NULL THEN
        RAISE EXCEPTION 'External category assignments cannot use system categories';
      END IF;
      IF v_category_company_id != v_project_company_id THEN
        RAISE EXCEPTION 'External category company_id (%) must match project company_id (%)',
          v_category_company_id, v_project_company_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_project_category_scope_trigger
  BEFORE INSERT OR UPDATE ON project_category_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_project_category_scope();

-- Step 4: Update task category validation to check category_type matches
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

  -- Check if the category (with matching type) is assigned to the project
  SELECT EXISTS (
    SELECT 1
    FROM project_category_assignments
    WHERE project_id = v_project_id
      AND category_id = NEW.category_id
      AND category_type = NEW.category_type
  ) INTO v_category_exists;

  -- If the category is not assigned to the project with same type, raise error
  IF NOT v_category_exists THEN
    RAISE EXCEPTION 'Category (type: %) must be assigned to the project before assigning to task',
      NEW.category_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_task_category_trigger
  BEFORE INSERT OR UPDATE ON project_task_category_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_category();
