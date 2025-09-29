-- Fix broadcast system to use private channels with RLS
-- Private channels are required when using RLS policies on realtime.messages

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
    -- Use PRIVATE channel (false) for RLS-enabled broadcasts
    PERFORM realtime.send(
      jsonb_build_object(
        'table', table_name_value,
        'company_id', company_id_value,
        'action', action_value,
        'timestamp', extract(epoch from now())
      ),
      'count_update',
      'company:' || company_id_value || ':counts',
      false  -- PRIVATE channel for RLS-enabled broadcasts
    );
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION broadcast_count_update() IS 'Broadcasts count updates to company-specific private realtime channels when table records change. Uses private channels for RLS authorization.';