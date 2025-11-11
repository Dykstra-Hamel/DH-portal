-- Make source_id nullable in pest_pressure_data_points
-- This allows backfilling historical data without creating form_submission records

ALTER TABLE pest_pressure_data_points
ALTER COLUMN source_id DROP NOT NULL;

-- Update UNIQUE constraint to handle NULL source_id
-- Drop the old constraint
ALTER TABLE pest_pressure_data_points
DROP CONSTRAINT IF EXISTS pest_pressure_data_points_source_type_source_id_pest_type_key;

-- Add new constraint that treats NULL as unique (multiple NULL values allowed)
-- For backfilled data without source records, we'll use a combination of location + timestamp + pest_type
CREATE UNIQUE INDEX pest_pressure_unique_with_source
ON pest_pressure_data_points (source_type, source_id, pest_type)
WHERE source_id IS NOT NULL;

-- Update comments
COMMENT ON COLUMN pest_pressure_data_points.source_id IS 'ID of source record (call_record, form_submission, or lead). NULL for backfilled historical data.';

-- NOTE: Historical data backfill migrations (20251106214336 through 20251107203708) were
-- run directly in production and have been moved to backups/ directory. These migrations
-- contained ~8MB of INSERT statements for pest_pressure_data_points and are not needed
-- for local development. The data exists in production only.
