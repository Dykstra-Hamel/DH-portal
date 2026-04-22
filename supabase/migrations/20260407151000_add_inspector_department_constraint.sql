-- Add 'inspector' as a valid user_departments department value
ALTER TABLE user_departments
  DROP CONSTRAINT IF EXISTS user_departments_department_check;

ALTER TABLE user_departments
  ADD CONSTRAINT user_departments_department_check
  CHECK (department IN ('sales', 'support', 'scheduling', 'technician', 'inspector'));
