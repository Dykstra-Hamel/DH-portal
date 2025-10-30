-- Migration: Add Broadcast System for Tickets and Call Records
-- Purpose: Replace postgres_changes subscriptions with broadcast for better scalability
-- Pattern: Consistent with existing count broadcast system (20250927190000)

-- Create function to broadcast ticket/call_record updates
CREATE OR REPLACE FUNCTION broadcast_ticket_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  ticket_id_value UUID;
  status_value TEXT;
  record_id_value UUID;
BEGIN
  -- Determine company_id, ticket_id, status, and record_id based on table
  IF TG_TABLE_NAME = 'tickets' THEN
    IF TG_OP = 'DELETE' THEN
      company_id_value := OLD.company_id;
      ticket_id_value := OLD.id;
      status_value := OLD.status;
      record_id_value := OLD.id;
    ELSE
      company_id_value := NEW.company_id;
      ticket_id_value := NEW.id;
      status_value := NEW.status;
      record_id_value := NEW.id;
    END IF;
  ELSIF TG_TABLE_NAME = 'call_records' THEN
    -- For call_records, get company via ticket relationship
    IF TG_OP = 'DELETE' THEN
      SELECT company_id INTO company_id_value
      FROM tickets WHERE id = OLD.ticket_id;
      ticket_id_value := OLD.ticket_id;
      record_id_value := OLD.id;
      status_value := NULL;
    ELSE
      SELECT company_id INTO company_id_value
      FROM tickets WHERE id = NEW.ticket_id;
      ticket_id_value := NEW.ticket_id;
      record_id_value := NEW.id;
      status_value := NULL;
    END IF;
  END IF;

  -- Skip if no company_id (orphaned records or no ticket relationship)
  IF company_id_value IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Broadcast to company-specific tickets channel
  -- Format: company:{company_id}:tickets
  -- Event: ticket_update
  -- Payload: minimal metadata for client-side filtering and fetching
  PERFORM realtime.send(
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'company_id', company_id_value,
      'action', TG_OP,
      'record_id', record_id_value,
      'ticket_id', ticket_id_value,
      'status', status_value,
      'timestamp', extract(epoch from now())
    ),
    'ticket_update',
    'company:' || company_id_value || ':tickets',
    false  -- FALSE = PUBLIC messages (not private)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tickets_broadcast_trigger ON tickets;
DROP TRIGGER IF EXISTS call_records_broadcast_trigger ON call_records;

-- Create trigger for tickets table
-- Fires AFTER INSERT, UPDATE, or DELETE to broadcast changes
CREATE TRIGGER tickets_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_ticket_update();

-- Create trigger for call_records table
-- Fires AFTER INSERT, UPDATE, or DELETE to broadcast changes
CREATE TRIGGER call_records_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON call_records
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_ticket_update();

-- Add comment for documentation
COMMENT ON FUNCTION broadcast_ticket_update() IS
  'Broadcasts ticket and call_record changes via Supabase Realtime broadcast. Used instead of postgres_changes subscriptions for better scalability. Sends minimal payload to channel: company:{company_id}:tickets';
