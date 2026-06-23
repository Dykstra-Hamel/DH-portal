-- Diagnostic: attempt DELETE FROM auth.users inside a PL/pgSQL subblock
-- (which creates an implicit savepoint) and report the exact Postgres error.
-- If the delete would succeed, the subblock raises a sentinel exception to roll
-- back the row change, and the function returns an "OK" message.
-- The calling code logs the result so we can see the actual SQLSTATE / SQLERRM
-- instead of GoTrue's generic "unexpected_failure".

CREATE OR REPLACE FUNCTION public.diagnose_auth_user_delete(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
  v_msg TEXT;
BEGIN
  BEGIN
    DELETE FROM auth.users WHERE id = p_user_id;
    -- Deletion would succeed; raise sentinel to roll back the subblock's work
    RAISE EXCEPTION 'DIAGNOSE_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM = 'DIAGNOSE_ROLLBACK' THEN
        RETURN 'DELETE would succeed - no FK violations detected';
      ELSE
        v_msg := 'DELETE blocked [' || SQLSTATE || ']: ' || SQLERRM;
        RETURN v_msg;
      END IF;
  END;
END;
$$;

COMMENT ON FUNCTION public.diagnose_auth_user_delete(UUID) IS
  'Dry-run DELETE FROM auth.users in a subblock; returns the actual Postgres '
  'error if an FK or trigger blocks it, or an OK message if it would succeed. '
  'Never permanently deletes the user — the implicit savepoint is always rolled back.';
