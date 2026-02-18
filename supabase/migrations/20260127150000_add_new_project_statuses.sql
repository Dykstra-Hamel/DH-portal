-- Add New Project Statuses Migration
-- This migration adds three new status values: ready_to_print, printing, bill_client

-- ============================================================================
-- STEP 1: Remove old status constraint
-- ============================================================================

-- Remove old status constraint so we can add new status values
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- ============================================================================
-- STEP 2: Add new status constraint with updated values
-- ============================================================================

-- Add the new constraint with all status values including the new ones
ALTER TABLE projects ADD CONSTRAINT projects_status_check
CHECK (status IN (
  'in_progress',
  'blocked',
  'on_hold',
  'pending_approval',
  'out_to_client',
  'ready_to_print',
  'printing',
  'bill_client',
  'complete'
));

-- ============================================================================
-- COMMENTS: Document new status values
-- ============================================================================

COMMENT ON COLUMN projects.status IS 'Project status: in_progress, blocked, on_hold, pending_approval, out_to_client, ready_to_print (Print category only), printing (Print category only), bill_client (billable projects only), complete';
