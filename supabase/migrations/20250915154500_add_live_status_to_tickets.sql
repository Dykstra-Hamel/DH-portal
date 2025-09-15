-- Add 'live' status to ticket status constraint
-- This allows tickets to have a 'live' status for active calls

-- Update the CHECK constraint to include 'live' status
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE tickets
ADD CONSTRAINT tickets_status_check
CHECK (status IN ('live', 'new', 'contacted', 'qualified', 'quoted', 'in_progress', 'resolved', 'closed', 'won', 'lost', 'unqualified'));

-- Add comment for documentation
COMMENT ON COLUMN tickets.status IS 'Current status of ticket. Use "live" for active phone calls, "new" for completed calls awaiting contact.';

-- Create index for efficient querying of live tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status_live ON tickets(status) WHERE status = 'live';