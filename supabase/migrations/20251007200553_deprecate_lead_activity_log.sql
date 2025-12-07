-- =====================================================
-- Deprecate lead_activity_log Table
-- =====================================================
-- The lead_activity_log table is being replaced by the unified activity_log table
-- This migration renames it to indicate it's deprecated
-- We keep it temporarily in case we need to reference old data

-- Rename the table to indicate it's deprecated
ALTER TABLE IF EXISTS lead_activity_log
RENAME TO _deprecated_lead_activity_log;

-- Add comment explaining why it's deprecated
COMMENT ON TABLE _deprecated_lead_activity_log IS 'DEPRECATED: This table has been replaced by the unified activity_log table. Kept temporarily for reference. Do not use for new features.';
