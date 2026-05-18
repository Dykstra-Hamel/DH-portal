-- Rewrite broadcast_ticket_update() with two fixes:
--
-- 1. Embed SET search_path in the function declaration (not just ALTER FUNCTION).
--    The previously deployed ALTER FUNCTION migration (20260518194511) did not
--    resolve the "relation tickets does not exist" error, so a full CREATE OR
--    REPLACE is needed to guarantee the search_path is applied.
--
-- 2. For call_records, read company_id directly from the row instead of doing
--    a cross-table lookup via ticket_id. ticket_id is NULL during call_started
--    and call_ended, so the lookup always returned NULL and those events were
--    silently skipped. company_id has been populated at INSERT time since
--    migration 20251027140924.

CREATE OR REPLACE FUNCTION public.broadcast_ticket_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  ticket_id_value  UUID;
  status_value     TEXT;
  record_id_value  UUID;
BEGIN
  IF TG_TABLE_NAME = 'tickets' THEN
    IF TG_OP = 'DELETE' THEN
      company_id_value := OLD.company_id;
      ticket_id_value  := OLD.id;
      status_value     := OLD.status;
      record_id_value  := OLD.id;
    ELSE
      company_id_value := NEW.company_id;
      ticket_id_value  := NEW.id;
      status_value     := NEW.status;
      record_id_value  := NEW.id;
    END IF;

  ELSIF TG_TABLE_NAME = 'call_records' THEN
    -- Read company_id directly from the row — no tickets lookup needed.
    IF TG_OP = 'DELETE' THEN
      company_id_value := OLD.company_id;
      ticket_id_value  := OLD.ticket_id;
      record_id_value  := OLD.id;
      status_value     := NULL;
    ELSE
      company_id_value := NEW.company_id;
      ticket_id_value  := NEW.ticket_id;
      record_id_value  := NEW.id;
      status_value     := NULL;
    END IF;
  END IF;

  -- Skip orphaned records (no company association)
  IF company_id_value IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM realtime.send(
    jsonb_build_object(
      'table',      TG_TABLE_NAME,
      'company_id', company_id_value,
      'action',     TG_OP,
      'record_id',  record_id_value,
      'ticket_id',  ticket_id_value,
      'status',     status_value,
      'timestamp',  extract(epoch from now())
    ),
    'ticket_update',
    'company:' || company_id_value || ':tickets',
    false
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp';
