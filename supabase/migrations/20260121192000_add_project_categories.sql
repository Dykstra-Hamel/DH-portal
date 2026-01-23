-- Add default project categories
-- These are system-wide categories (company_id = NULL, is_system_default = true)

-- Remove unused color and icon columns from project_categories
ALTER TABLE project_categories DROP COLUMN IF EXISTS color;
ALTER TABLE project_categories DROP COLUMN IF EXISTS icon;

-- First, clear any existing system default categories to avoid duplicates
DELETE FROM project_categories WHERE is_system_default = true AND company_id IS NULL;

-- Insert the new project categories
INSERT INTO project_categories (name, description, sort_order, is_system_default, company_id)
VALUES
  ('New Project Requests', 'Newly submitted project requests awaiting review', 1, true, NULL),
  ('Design', 'Design and creative projects', 2, true, NULL),
  ('Content & SEO', 'Content creation and SEO optimization projects', 3, true, NULL),
  ('Development', 'Web and software development projects', 4, true, NULL),
  ('Print', 'Print media and collateral projects', 5, true, NULL),
  ('Out To Customer', 'Projects sent to customer for review', 6, true, NULL),
  ('Billing', 'Projects ready for billing or invoicing', 7, true, NULL);
