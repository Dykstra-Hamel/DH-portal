-- Add call_direction column to tickets table to distinguish inbound/outbound calls
-- This supports the updated filter structure for tickets page

-- Add call_direction column
ALTER TABLE tickets ADD COLUMN call_direction TEXT;

-- Add check constraint to ensure valid values
ALTER TABLE tickets ADD CONSTRAINT tickets_call_direction_check
CHECK (call_direction IN ('inbound', 'outbound') OR call_direction IS NULL);

-- Create index for performance on filtering by call direction
CREATE INDEX idx_tickets_call_direction ON tickets(call_direction);

-- Create composite index for efficient call filtering (type + direction)
CREATE INDEX idx_tickets_type_direction ON tickets(type, call_direction);

-- Add comment explaining the column usage
COMMENT ON COLUMN tickets.call_direction IS 'Direction of call: inbound, outbound, or null for non-call tickets (forms, etc)';

-- Note: Existing tickets will have call_direction = NULL
-- Webhook handlers will be updated to set this for new call tickets
-- Existing call tickets can be updated based on webhook source patterns if needed