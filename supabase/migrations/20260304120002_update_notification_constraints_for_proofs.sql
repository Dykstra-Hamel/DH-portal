-- Extend notification type and reference_type constraints to include proof_feedback / proof

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'assignment','department_lead','department_ticket','department_project',
  'new_ticket','new_lead_unassigned','new_lead_assigned',
  'new_support_case_unassigned','new_support_case_assigned',
  'quote_signed','mention','proof_feedback'
));

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_reference_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_reference_type_check CHECK (reference_type IN (
  'ticket','lead','project','customer','quote',
  'project_comment','task_comment','monthly_service_comment','proof'
));

-- Update broadcast function to also send proof_feedback notifications to personal channel
-- (same pattern as 'mention' in 20260224120000)
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

  -- For mention and proof_feedback notifications, also broadcast to the user's personal channel
  IF notification_type IN ('mention', 'proof_feedback') AND notification_user_id IS NOT NULL THEN
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
