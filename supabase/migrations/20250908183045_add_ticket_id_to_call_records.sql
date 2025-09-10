-- Add ticket_id column to call_records table to support ticket workflow
-- This allows call_records to be associated with either leads or tickets

-- Add ticket_id column with foreign key reference
ALTER TABLE call_records 
ADD COLUMN ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_call_records_ticket_id ON call_records(ticket_id);

-- Add comment to clarify the relationship
COMMENT ON COLUMN call_records.ticket_id IS 'References tickets table - call_records can be associated with either leads or tickets';