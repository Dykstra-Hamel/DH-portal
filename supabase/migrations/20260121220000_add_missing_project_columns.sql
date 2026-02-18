-- Add missing columns to projects table that are referenced by the activity trigger
-- These columns are defined in the TypeScript types but were missing from the database

-- Add budget_amount column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(10, 2);

-- Add estimated_hours column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(6, 2);

-- Add actual_hours column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(6, 2);

-- Add comments to describe the columns
COMMENT ON COLUMN projects.budget_amount IS 'Budget amount allocated for the project';
COMMENT ON COLUMN projects.estimated_hours IS 'Estimated hours to complete the project';
COMMENT ON COLUMN projects.actual_hours IS 'Actual hours spent on the project';
