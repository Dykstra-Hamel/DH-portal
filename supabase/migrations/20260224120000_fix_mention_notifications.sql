-- Fix mention notification system
-- 1. Add monthly_service_comment to reference_type constraint
-- 2. Update broadcast function to also send to user-specific channel for mentions

-- A) Fix reference_type constraint to include monthly_service_comment
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_reference_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_reference_type_check
    CHECK (reference_type IN (
        'ticket', 'lead', 'project', 'customer', 'quote',
        'project_comment', 'task_comment', 'monthly_service_comment'
    ));

-- B) Update broadcast_notification_update to also broadcast mention notifications
--    to the mentioned user's personal channel so they receive it regardless of
--    which company context they are currently viewing
CREATE OR REPLACE FUNCTION broadcast_notification_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  action_value TEXT;
  notification_data JSONB;
  notification_type TEXT;
  notification_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    company_id_value  := OLD.company_id;
    notification_data := to_jsonb(OLD);
    notification_type := OLD.type;
    notification_user_id := OLD.user_id;
  ELSE
    company_id_value  := NEW.company_id;
    notification_data := to_jsonb(NEW);
    notification_type := NEW.type;
    notification_user_id := NEW.user_id;
  END IF;

  IF company_id_value IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  action_value := TG_OP;

  -- Always broadcast to the company channel (existing behaviour)
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
    false
  );

  -- For mention notifications, also broadcast to the user's personal channel
  -- so they receive it regardless of which company context they are currently viewing
  IF notification_type = 'mention' AND notification_user_id IS NOT NULL THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'table', 'notifications',
        'company_id', company_id_value,
        'action', action_value,
        'notification', notification_data,
        'timestamp', extract(epoch from now())
      ),
      'notification_update',
      'user:' || notification_user_id || ':notifications',
      false
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
