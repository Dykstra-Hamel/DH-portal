-- Insert default system departments
INSERT INTO project_departments (name, sort_order, company_id, is_system_default)
VALUES
  ('Software', 1, NULL, TRUE),
  ('Design', 2, NULL, TRUE),
  ('Development', 3, NULL, TRUE),
  ('Content', 4, NULL, TRUE),
  ('Project Manager', 5, NULL, TRUE);
