-- Pin search_path on broadcast_ticket_update() so the unqualified
-- "tickets" table reference resolves correctly when the function runs
-- as SECURITY DEFINER. Without this, PostgreSQL cannot find "tickets"
-- if public is not in the function-owner's search_path.
-- See CLAUDE.md rule 13 for context.

ALTER FUNCTION public.broadcast_ticket_update()
  SET search_path = 'public, pg_temp';
