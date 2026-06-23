-- Diagnostic function: returns every FK constraint in the public schema that
-- (a) references auth.users(id) and (b) still has at least one row pointing at
-- the supplied user ID. Used by the admin deletion route to identify remaining
-- blockers without scanning every migration file manually.

CREATE OR REPLACE FUNCTION public.find_auth_user_fk_blockers(p_user_id UUID)
RETURNS TABLE(
  table_name   TEXT,
  column_name  TEXT,
  constraint_name TEXT,
  row_count    BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
DECLARE
  r RECORD;
  v_sql TEXT;
  v_count BIGINT;
BEGIN
  FOR r IN
    SELECT
      kcu.table_name,
      kcu.column_name,
      kcu.constraint_name
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = rc.constraint_name
      AND kcu.constraint_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
      AND ccu.constraint_schema = rc.unique_constraint_schema
    WHERE rc.constraint_schema = 'public'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
  LOOP
    v_sql := format(
      'SELECT COUNT(*) FROM public.%I WHERE %I::text = $1::text',
      r.table_name,
      r.column_name
    );
    BEGIN
      EXECUTE v_sql INTO v_count USING p_user_id;
      IF v_count > 0 THEN
        table_name      := r.table_name;
        column_name     := r.column_name;
        constraint_name := r.constraint_name;
        row_count       := v_count;
        RETURN NEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Column exists in schema but query failed; report with -1 so we can see it
      table_name      := r.table_name;
      column_name     := r.column_name;
      constraint_name := r.constraint_name;
      row_count       := -1;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.find_auth_user_fk_blockers(UUID) IS
  'Returns every public-schema FK that references auth.users(id) and still has '
  'rows pointing at the given user. Useful for diagnosing deleteUser failures.';
