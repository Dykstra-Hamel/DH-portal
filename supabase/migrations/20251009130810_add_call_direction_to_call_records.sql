-- Add call_direction column to call_records table
-- This allows us to track whether a call is inbound or outbound directly on the call record

-- Add call_direction column
ALTER TABLE call_records ADD COLUMN call_direction TEXT;

-- Add check constraint to ensure valid values
ALTER TABLE call_records ADD CONSTRAINT call_records_call_direction_check
CHECK (call_direction IN ('inbound', 'outbound') OR call_direction IS NULL);

-- Create index for performance on filtering by call direction
CREATE INDEX idx_call_records_call_direction ON call_records(call_direction);

-- Add comment explaining the column usage
COMMENT ON COLUMN call_records.call_direction IS 'Direction of call: inbound or outbound. NULL for existing records without direction set.';
