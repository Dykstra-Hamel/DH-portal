-- Migration: Add Broadcast System for Activity Log
-- Purpose: Replace postgres_changes subscriptions with broadcast for better scalability
-- Pattern: Consistent with existing broadcast systems (tickets, leads, support_cases)

-- Create function to broadcast activity_log updates
CREATE OR REPLACE FUNCTION broadcast_activity_log_change()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  record_id_value UUID;
  entity_type_value TEXT;
  entity_id_value UUID;
  activity_type_value TEXT;
BEGIN
  -- Determine values based on operation
  IF TG_OP = 'DELETE' THEN
    company_id_value := OLD.company_id;
    record_id_value := OLD.id;
    entity_type_value := OLD.entity_type;
    entity_id_value := OLD.entity_id;
    activity_type_value := OLD.activity_type;
  ELSE
    company_id_value := NEW.company_id;
    record_id_value := NEW.id;
    entity_type_value := NEW.entity_type;
    entity_id_value := NEW.entity_id;
    activity_type_value := NEW.activity_type;
  END IF;

  -- Skip if no company_id (should not happen due to NOT NULL constraint)
  IF company_id_value IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Broadcast to company-specific activity channel
  -- Format: company:{company_id}:activity
  -- Event: activity_update
  -- Payload: minimal metadata for client-side filtering and fetching
  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'activity_log',
      'company_id', company_id_value,
      'action', TG_OP,
      'record_id', record_id_value,
      'entity_type', entity_type_value,
      'entity_id', entity_id_value,
      'activity_type', activity_type_value,
      'timestamp', extract(epoch from now())
    ),
    'activity_update',
    'company:' || company_id_value || ':activity',
    false  -- FALSE = PUBLIC messages (not private)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS activity_log_broadcast_trigger ON activity_log;

-- Create trigger for activity_log table
-- Fires AFTER INSERT, UPDATE, or DELETE to broadcast changes
CREATE TRIGGER activity_log_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_activity_log_change();

-- Add comment for documentation
COMMENT ON FUNCTION broadcast_activity_log_change() IS
  'Broadcasts activity_log changes via Supabase Realtime broadcast. Used instead of postgres_changes subscriptions for better scalability. Sends minimal payload to channel: company:{company_id}:activity';
