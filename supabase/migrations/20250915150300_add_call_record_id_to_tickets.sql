-- Create bidirectional relationship between tickets and call_records
-- This creates direct relationships in both directions, similar to the existing lead_id pattern

-- Add ticket_id foreign key to call_records table (primary relationship) - only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'call_records' AND column_name = 'ticket_id'
    ) THEN
        ALTER TABLE call_records
        ADD COLUMN ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_call_records_ticket_id ON call_records(ticket_id);

-- Add call_record_id foreign key to tickets table (reverse relationship for convenience) - only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tickets' AND column_name = 'call_record_id'
    ) THEN
        ALTER TABLE tickets
        ADD COLUMN call_record_id UUID REFERENCES call_records(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tickets_call_record_id ON tickets(call_record_id);

-- Add comments for documentation
COMMENT ON COLUMN call_records.ticket_id IS 'Reference to the ticket created from this call (NULL for calls that did not generate tickets)';
COMMENT ON COLUMN tickets.call_record_id IS 'Direct reference to the call record that created this ticket (NULL for non-call tickets like forms, chats, etc.)';

-- Update table comments to reflect the new relationships
COMMENT ON TABLE tickets IS 'Tickets table for tracking all customer interactions and internal tasks. For call tickets, call_record_id provides direct access to call details, transcript, and analysis.';
COMMENT ON TABLE call_records IS 'Call records from Retell AI containing call details, transcripts, and analysis. For inbound calls that create tickets, ticket_id provides the link to the generated ticket.';