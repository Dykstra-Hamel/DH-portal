-- Fix public/private channel alignment issue
-- Database was sending private messages while frontend listens on public channels
-- This aligns both to use public channels consistently

CREATE OR REPLACE FUNCTION broadcast_count_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine the company_id from the record
  DECLARE
    company_id_value UUID;
    table_name_value TEXT;
    action_value TEXT;
  BEGIN
    -- Get company_id from NEW or OLD record depending on operation
    IF TG_OP = 'DELETE' THEN
      company_id_value := OLD.company_id;
    ELSE
      company_id_value := NEW.company_id;
    END IF;
    
    -- Skip if no company_id (shouldn't happen but safety check)
    IF company_id_value IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    
    table_name_value := TG_TABLE_NAME;
    action_value := TG_OP;
    
    -- Broadcast the count update to company-specific channel
    -- Channel format: company:{company_id}:counts
    -- Use PUBLIC channel (false) to match frontend public subscription
    -- false = public messages (private = f in realtime.messages)
    PERFORM realtime.send(
      jsonb_build_object(
        'table', table_name_value,
        'company_id', company_id_value,
        'action', action_value,
        'timestamp', extract(epoch from now())
      ),
      'count_update',
      'company:' || company_id_value || ':counts',
      false  -- FALSE = PUBLIC messages (private = f)
    );
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION broadcast_count_update() IS 'Broadcasts count updates to company-specific PUBLIC realtime channels. Uses false flag to create public messages (private = f) that match frontend public subscription.';