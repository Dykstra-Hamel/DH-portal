-- Add archived and billable_duration_seconds columns to call_records table
ALTER TABLE call_records 
ADD COLUMN archived BOOLEAN DEFAULT FALSE,
ADD COLUMN billable_duration_seconds INTEGER;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_call_records_archived ON call_records(archived);
CREATE INDEX IF NOT EXISTS idx_call_records_billable_duration ON call_records(billable_duration_seconds);

-- Update existing records to set archived = false and calculate billable duration
-- Billable duration rounds up to nearest 30 seconds
UPDATE call_records 
SET 
    archived = FALSE,
    billable_duration_seconds = CASE 
        WHEN duration_seconds IS NULL OR duration_seconds <= 0 THEN 30
        ELSE CEILING(duration_seconds::FLOAT / 30.0) * 30
    END
WHERE archived IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN call_records.archived IS 'Soft delete flag - archived calls are hidden from main views but preserved in database';
COMMENT ON COLUMN call_records.billable_duration_seconds IS 'Call duration rounded up to nearest 30 seconds for billing purposes';