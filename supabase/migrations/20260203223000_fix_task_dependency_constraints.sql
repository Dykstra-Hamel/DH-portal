-- Migration: Fix task dependency foreign key constraint names for Supabase/PostgREST
-- This ensures the self-referencing relationships are properly recognized

-- Drop existing unnamed constraints if they exist
-- PostgreSQL auto-generates constraint names, so we need to find and drop them
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find and drop the blocks_task_id constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'project_tasks'::regclass
    AND contype = 'f'
    AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'project_tasks'::regclass AND attname = 'blocks_task_id');

  IF constraint_name IS NOT NULL AND constraint_name != 'project_tasks_blocks_task_id_fkey' THEN
    EXECUTE format('ALTER TABLE project_tasks DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Find and drop the blocked_by_task_id constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'project_tasks'::regclass
    AND contype = 'f'
    AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'project_tasks'::regclass AND attname = 'blocked_by_task_id');

  IF constraint_name IS NOT NULL AND constraint_name != 'project_tasks_blocked_by_task_id_fkey' THEN
    EXECUTE format('ALTER TABLE project_tasks DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Add the foreign key constraints with explicit names for Supabase/PostgREST
-- Only add if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_tasks_blocks_task_id_fkey'
  ) THEN
    ALTER TABLE project_tasks
    ADD CONSTRAINT project_tasks_blocks_task_id_fkey
      FOREIGN KEY (blocks_task_id)
      REFERENCES project_tasks(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_tasks_blocked_by_task_id_fkey'
  ) THEN
    ALTER TABLE project_tasks
    ADD CONSTRAINT project_tasks_blocked_by_task_id_fkey
      FOREIGN KEY (blocked_by_task_id)
      REFERENCES project_tasks(id)
      ON DELETE SET NULL;
  END IF;
END $$;
