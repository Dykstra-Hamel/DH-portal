-- Fix foreign key constraints for tasks table with explicit constraint names
-- This allows Supabase PostgREST to properly resolve relationships for joins

-- First, drop the existing foreign key constraints if they exist
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_company_id_fkey;

-- Add foreign key constraints with explicit names
ALTER TABLE tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Add helpful comments for the constraint names
COMMENT ON CONSTRAINT tasks_assigned_to_fkey ON tasks IS 'Foreign key constraint for assigned_to field referencing profiles table';
COMMENT ON CONSTRAINT tasks_created_by_fkey ON tasks IS 'Foreign key constraint for created_by field referencing profiles table';
COMMENT ON CONSTRAINT tasks_company_id_fkey ON tasks IS 'Foreign key constraint for company_id field referencing companies table';