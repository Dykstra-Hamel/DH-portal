-- Create table for project template task category assignments
CREATE TABLE IF NOT EXISTS project_template_task_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_task_id UUID NOT NULL REFERENCES project_template_tasks(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a template task can only be assigned to a category once
  UNIQUE(template_task_id, category_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_template_task_categories_task ON project_template_task_category_assignments(template_task_id);
CREATE INDEX IF NOT EXISTS idx_template_task_categories_category ON project_template_task_category_assignments(category_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_template_task_category_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_task_category_assignment_updated_at
  BEFORE UPDATE ON project_template_task_category_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_template_task_category_assignment_updated_at();

-- Add comment
COMMENT ON TABLE project_template_task_category_assignments IS 'Links project template tasks to categories';
