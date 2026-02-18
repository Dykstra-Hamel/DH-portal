-- Project Status Updates Migration
-- This migration updates project status values from design-specific workflow to general project management

-- ============================================================================
-- STEP 1: Remove old status constraint
-- ============================================================================

-- Remove old status constraint so we can update the data
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- ============================================================================
-- STEP 2: Disable user triggers to prevent activity logging during migration
-- ============================================================================

-- Temporarily disable USER triggers on projects table to avoid project_activity constraint violations
-- during bulk status updates (no user context in migration)
-- Note: Using USER instead of ALL to avoid disabling system triggers (foreign keys, etc.)
ALTER TABLE projects DISABLE TRIGGER USER;

-- ============================================================================
-- STEP 3: DATA MIGRATION - Map old status values to new status values
-- ============================================================================

-- Migrate existing project status values to new schema
-- This must happen BEFORE adding the new constraint
UPDATE projects SET status = CASE
  -- Map old statuses to new statuses
  WHEN status = 'coming_up' THEN 'pending_approval'
  WHEN status = 'design' THEN 'in_progress'
  WHEN status = 'development' THEN 'in_progress'
  WHEN status = 'out_to_client' THEN 'out_to_client' -- Keep as-is
  WHEN status = 'waiting_on_client' THEN 'on_hold'
  WHEN status = 'bill_client' THEN 'complete'
  -- Default to in_progress for any unknown statuses
  ELSE 'in_progress'
END
WHERE status IN ('coming_up', 'design', 'development', 'waiting_on_client', 'bill_client');

-- ============================================================================
-- STEP 4: Re-enable user triggers
-- ============================================================================

-- Re-enable USER triggers on projects table
ALTER TABLE projects ENABLE TRIGGER USER;

-- ============================================================================
-- STEP 5: Add new status constraint with updated values
-- ============================================================================

-- Now that all data is updated, add the new constraint
ALTER TABLE projects ADD CONSTRAINT projects_status_check
CHECK (status IN (
  'in_progress',
  'blocked',
  'on_hold',
  'pending_approval',
  'out_to_client',
  'complete'
));

-- ============================================================================
-- COMMENTS: Document new status values
-- ============================================================================

COMMENT ON COLUMN projects.status IS 'Project status: in_progress, blocked, on_hold, pending_approval, out_to_client, complete';
