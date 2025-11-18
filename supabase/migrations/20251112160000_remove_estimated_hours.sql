-- Remove estimated_hours from project_tasks table

ALTER TABLE project_tasks DROP COLUMN IF EXISTS estimated_hours;
