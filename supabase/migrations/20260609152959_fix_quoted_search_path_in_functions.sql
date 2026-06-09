-- Fix functions whose search_path was set via the quoted form
-- (`SET search_path = 'public, pg_temp'`). Postgres treats the single-quoted
-- form as a single identifier `"public, pg_temp"` instead of two schemas,
-- so any function body that references unqualified names (e.g. `contact_lists`
-- instead of `public.contact_lists`) fails with `relation ... does not exist`.
--
-- Concrete symptom this fixes: uploading a CSV to create a new contact list
-- silently produces a list with 0 members because the AFTER INSERT trigger
-- `update_contact_list_total` on `contact_list_members` aborts every row.

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proconfig IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS cfg
        WHERE cfg LIKE 'search_path="%, %"'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      fn.schema_name, fn.func_name, fn.args
    );
  END LOOP;
END
$$;
