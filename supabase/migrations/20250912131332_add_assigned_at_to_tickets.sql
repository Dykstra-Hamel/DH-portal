-- Add assigned_at column to tickets table to track when tickets are assigned
ALTER TABLE tickets 
ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_at ON tickets(assigned_at);

-- Create function to update assigned_at when assigned_to changes
CREATE OR REPLACE FUNCTION update_ticket_assigned_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If assigned_to is being set for the first time or changed
    IF (OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL) OR 
       (OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NOT NULL AND OLD.assigned_to != NEW.assigned_to) THEN
        NEW.assigned_at = NOW();
    -- If assigned_to is being cleared
    ELSIF OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
        NEW.assigned_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update assigned_at
DROP TRIGGER IF EXISTS trigger_update_ticket_assigned_at ON tickets;
CREATE TRIGGER trigger_update_ticket_assigned_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_assigned_at();

-- Backfill assigned_at for existing assigned tickets (use updated_at as best estimate)
UPDATE tickets 
SET assigned_at = updated_at 
WHERE assigned_to IS NOT NULL 
AND assigned_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN tickets.assigned_at IS 'Timestamp when ticket was assigned to a user';