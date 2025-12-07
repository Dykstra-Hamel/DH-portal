-- Add broadcast system for notifications with dedicated channel
-- Uses separate channel: company:{company_id}:notifications

-- Create function to broadcast notification updates to company-specific channels
CREATE OR REPLACE FUNCTION broadcast_notification_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine the company_id and notification data from the record
  DECLARE
    company_id_value UUID;
    action_value TEXT;
    notification_data JSONB;
  BEGIN
    -- Get company_id from NEW or OLD record depending on operation
    IF TG_OP = 'DELETE' THEN
      company_id_value := OLD.company_id;
      notification_data := to_jsonb(OLD);
    ELSE
      company_id_value := NEW.company_id;
      notification_data := to_jsonb(NEW);
    END IF;
    
    -- Skip if no company_id (shouldn't happen but safety check)
    IF company_id_value IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    
    action_value := TG_OP;
    
    -- Broadcast the notification update to company-specific notifications channel
    -- Channel format: company:{company_id}:notifications
    -- Use PUBLIC channel (false) to match successful counts implementation
    PERFORM realtime.send(
      jsonb_build_object(
        'table', 'notifications',
        'company_id', company_id_value,
        'action', action_value,
        'notification', notification_data,
        'timestamp', extract(epoch from now())
      ),
      'notification_update',
      'company:' || company_id_value || ':notifications',
      false  -- FALSE = PUBLIC messages for consistency with counts
    );
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION broadcast_notification_update() IS 'Broadcasts notification updates to company-specific notification channels when notifications are inserted, updated, or deleted.';

-- Create trigger for the notifications table
DROP TRIGGER IF EXISTS notifications_broadcast_trigger ON notifications;
CREATE TRIGGER notifications_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_notification_update();

COMMENT ON TRIGGER notifications_broadcast_trigger ON notifications IS 'Broadcasts notification updates when notifications are inserted, updated, or deleted';