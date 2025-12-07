-- Migration: Add Broadcast System for Support Cases
-- Purpose: Replace postgres_changes subscriptions with broadcast for better scalability
-- Pattern: Consistent with ticket and lead broadcast systems

-- Create function to broadcast support case updates
CREATE OR REPLACE FUNCTION broadcast_support_case_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  case_id_value UUID;
  status_value TEXT;
BEGIN
  -- Determine values based on operation
  IF TG_OP = 'DELETE' THEN
    company_id_value := OLD.company_id;
    case_id_value := OLD.id;
    status_value := OLD.status;
  ELSE
    company_id_value := NEW.company_id;
    case_id_value := NEW.id;
    status_value := NEW.status;
  END IF;

  -- Skip if no company_id (orphaned records)
  IF company_id_value IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Broadcast to company-specific support cases channel
  -- Format: company:{company_id}:support_cases
  -- Event: support_case_update
  -- Payload: minimal metadata for client-side filtering and fetching
  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'support_cases',
      'company_id', company_id_value,
      'action', TG_OP,
      'record_id', case_id_value,
      'case_id', case_id_value,
      'status', status_value,
      'timestamp', extract(epoch from now())
    ),
    'support_case_update',
    'company:' || company_id_value || ':support_cases',
    false  -- FALSE = PUBLIC messages (not private)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS support_cases_broadcast_trigger ON support_cases;

-- Create trigger for support_cases table
-- Fires AFTER INSERT, UPDATE, or DELETE to broadcast changes
CREATE TRIGGER support_cases_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON support_cases
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_support_case_update();

-- Add comment for documentation
COMMENT ON FUNCTION broadcast_support_case_update() IS
  'Broadcasts support case changes via Supabase Realtime broadcast. Used instead of postgres_changes subscriptions for better scalability. Sends minimal payload to channel: company:{company_id}:support_cases';
