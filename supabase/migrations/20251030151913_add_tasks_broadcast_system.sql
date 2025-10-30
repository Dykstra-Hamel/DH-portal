-- Migration: Add Broadcast System for Tasks
-- Purpose: Replace postgres_changes subscriptions with broadcast for better scalability
-- Pattern: Consistent with ticket, lead, and support case broadcast systems

-- Create function to broadcast task updates
CREATE OR REPLACE FUNCTION broadcast_task_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  task_id_value UUID;
  status_value TEXT;
BEGIN
  -- Determine values based on operation
  IF TG_OP = 'DELETE' THEN
    company_id_value := OLD.company_id;
    task_id_value := OLD.id;
    status_value := OLD.status;
  ELSE
    company_id_value := NEW.company_id;
    task_id_value := NEW.id;
    status_value := NEW.status;
  END IF;

  -- Skip if no company_id (orphaned records)
  IF company_id_value IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Broadcast to company-specific tasks channel
  -- Format: company:{company_id}:tasks
  -- Event: task_update
  -- Payload: minimal metadata for client-side filtering and fetching
  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'tasks',
      'company_id', company_id_value,
      'action', TG_OP,
      'record_id', task_id_value,
      'task_id', task_id_value,
      'status', status_value,
      'timestamp', extract(epoch from now())
    ),
    'task_update',
    'company:' || company_id_value || ':tasks',
    false  -- FALSE = PUBLIC messages (not private)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tasks_broadcast_trigger ON tasks;

-- Create trigger for tasks table
-- Fires AFTER INSERT, UPDATE, or DELETE to broadcast changes
CREATE TRIGGER tasks_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_task_update();

-- Add comment for documentation
COMMENT ON FUNCTION broadcast_task_update() IS
  'Broadcasts task changes via Supabase Realtime broadcast. Used instead of postgres_changes subscriptions for better scalability. Sends minimal payload to channel: company:{company_id}:tasks';
