-- Migration: Add Broadcast System for Leads
-- Purpose: Replace postgres_changes subscriptions with broadcast for better scalability
-- Pattern: Consistent with ticket broadcast system (20251028154843)

-- Create function to broadcast lead updates
CREATE OR REPLACE FUNCTION broadcast_lead_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  lead_id_value UUID;
  status_value TEXT;
BEGIN
  -- Determine values based on operation
  IF TG_OP = 'DELETE' THEN
    company_id_value := OLD.company_id;
    lead_id_value := OLD.id;
    status_value := OLD.lead_status;
  ELSE
    company_id_value := NEW.company_id;
    lead_id_value := NEW.id;
    status_value := NEW.lead_status;
  END IF;

  -- Skip if no company_id (orphaned records)
  IF company_id_value IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Broadcast to company-specific leads channel
  -- Format: company:{company_id}:leads
  -- Event: lead_update
  -- Payload: minimal metadata for client-side filtering and fetching
  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'leads',
      'company_id', company_id_value,
      'action', TG_OP,
      'record_id', lead_id_value,
      'lead_id', lead_id_value,
      'status', status_value,
      'timestamp', extract(epoch from now())
    ),
    'lead_update',
    'company:' || company_id_value || ':leads',
    false  -- FALSE = PUBLIC messages (not private)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS leads_broadcast_trigger ON leads;

-- Create trigger for leads table
-- Fires AFTER INSERT, UPDATE, or DELETE to broadcast changes
CREATE TRIGGER leads_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_lead_update();

-- Add comment for documentation
COMMENT ON FUNCTION broadcast_lead_update() IS
  'Broadcasts lead changes via Supabase Realtime broadcast. Used instead of postgres_changes subscriptions for better scalability. Sends minimal payload to channel: company:{company_id}:leads';
