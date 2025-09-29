-- Implement Broadcast-based realtime count system
-- This replaces the problematic Postgres Changes approach with more reliable Broadcast messaging
-- Based on Supabase documentation: Broadcast is recommended over Postgres Changes for scalability

-- Create function to broadcast count updates to company-specific channels
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
    PERFORM realtime.send(
      jsonb_build_object(
        'table', table_name_value,
        'company_id', company_id_value,
        'action', action_value,
        'timestamp', extract(epoch from now())
      ),
      'count_update',
      'company:' || company_id_value || ':counts',
      true
    );
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the function
COMMENT ON FUNCTION broadcast_count_update() IS 'Broadcasts count updates to company-specific realtime channels when table records change. Used to replace Postgres Changes subscriptions with more reliable Broadcast messaging.';

-- Create triggers for the tasks table
DROP TRIGGER IF EXISTS tasks_count_broadcast_trigger ON tasks;
CREATE TRIGGER tasks_count_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_count_update();

COMMENT ON TRIGGER tasks_count_broadcast_trigger ON tasks IS 'Broadcasts count updates when tasks are inserted, updated, or deleted';

-- Create triggers for other count-related tables
-- Tickets
DROP TRIGGER IF EXISTS tickets_count_broadcast_trigger ON tickets;
CREATE TRIGGER tickets_count_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_count_update();

COMMENT ON TRIGGER tickets_count_broadcast_trigger ON tickets IS 'Broadcasts count updates when tickets are inserted, updated, or deleted';

-- Leads
DROP TRIGGER IF EXISTS leads_count_broadcast_trigger ON leads;
CREATE TRIGGER leads_count_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_count_update();

COMMENT ON TRIGGER leads_count_broadcast_trigger ON leads IS 'Broadcasts count updates when leads are inserted, updated, or deleted';

-- Support Cases
DROP TRIGGER IF EXISTS support_cases_count_broadcast_trigger ON support_cases;
CREATE TRIGGER support_cases_count_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON support_cases
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_count_update();

COMMENT ON TRIGGER support_cases_count_broadcast_trigger ON support_cases IS 'Broadcasts count updates when support cases are inserted, updated, or deleted';

-- Customers
DROP TRIGGER IF EXISTS customers_count_broadcast_trigger ON customers;
CREATE TRIGGER customers_count_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_count_update();

COMMENT ON TRIGGER customers_count_broadcast_trigger ON customers IS 'Broadcasts count updates when customers are inserted, updated, or deleted';