-- Add 'technician' to user_departments department CHECK constraint
ALTER TABLE user_departments
  DROP CONSTRAINT IF EXISTS user_departments_department_check;

ALTER TABLE user_departments
  ADD CONSTRAINT user_departments_department_check
  CHECK (department IN ('sales', 'support', 'scheduling', 'technician'));
