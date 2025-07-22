-- Add parent_call_id field to call_records table to track follow-up calls
ALTER TABLE call_records 
ADD COLUMN parent_call_id VARCHAR(255);

-- Add index for efficient querying of parent-child call relationships
CREATE INDEX idx_call_records_parent_call_id ON call_records(parent_call_id);

-- Add comment to explain the field
COMMENT ON COLUMN call_records.parent_call_id IS 'References the call_id of the original call for follow-up calls. NULL for initial calls.';