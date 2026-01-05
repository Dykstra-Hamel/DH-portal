-- Migration: Add Broadcast System for Campaign Executions
-- Purpose: Replace page-level realtime subscriptions with granular broadcast
-- Pattern: Consistent with leads (20251028160000) and tickets (20251028154843) broadcast systems

-- Create function to broadcast campaign execution changes
CREATE OR REPLACE FUNCTION broadcast_campaign_execution_change()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
  v_execution_id UUID;
  v_status TEXT;
  v_current_step INT;
  v_action TEXT;
BEGIN
  -- Determine the action type
  IF TG_OP = 'DELETE' THEN
    v_campaign_id := OLD.campaign_id;
    v_execution_id := OLD.id;
    v_status := OLD.execution_status;
    v_current_step := NULL;
    v_action := 'DELETE';
  ELSE
    v_campaign_id := NEW.campaign_id;
    v_execution_id := NEW.id;
    v_status := NEW.execution_status;
    -- Try to get current_step from automation_execution if available
    v_current_step := NULL;
    v_action := TG_OP; -- 'INSERT' or 'UPDATE'
  END IF;

  -- Skip if no campaign_id (orphaned records)
  IF v_campaign_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Broadcast to campaign-specific channel
  -- Format: campaign:{campaign_id}:executions
  -- Event: execution_update
  -- Payload: minimal metadata for client-side filtering and fetching
  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'campaign_executions',
      'campaign_id', v_campaign_id,
      'action', v_action,
      'record_id', v_execution_id,
      'execution_id', v_execution_id,
      'status', v_status,
      'current_step', v_current_step,
      'timestamp', extract(epoch from now())
    ),
    'execution_update',
    'campaign:' || v_campaign_id || ':executions',
    false  -- FALSE = PUBLIC messages (not private)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT, UPDATE, and DELETE operations
DROP TRIGGER IF EXISTS campaign_execution_broadcast_trigger ON campaign_executions;
CREATE TRIGGER campaign_execution_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON campaign_executions
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_campaign_execution_change();

-- Add comment explaining the trigger
COMMENT ON FUNCTION broadcast_campaign_execution_change() IS
  'Broadcasts campaign execution changes via Supabase Realtime broadcast. Used instead of postgres_changes subscriptions for better scalability and to prevent full page refreshes. Sends minimal payload to channel: campaign:{campaign_id}:executions';

COMMENT ON TRIGGER campaign_execution_broadcast_trigger ON campaign_executions IS
  'Broadcasts changes to campaign_executions via realtime.send() for real-time UI updates without causing full page refreshes';
