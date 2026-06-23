-- Performs a hard delete of an auth.users row directly from the database,
-- bypassing GoTrue's adminDeleteUser API call.  GoTrue's own admin delete
-- runs internal pre-cleanup steps inside a single transaction; if any of
-- those internal steps fail (e.g. because of a schema mismatch on a newer
-- auth table like one_time_tokens), the whole call returns unexpected_failure
-- even though the final DELETE FROM auth.users would succeed.
--
-- This function:
--   1. Pre-cleans every auth-schema table that references auth.users.
--      Each statement runs inside its own EXCEPTION block so a missing column
--      or missing table is logged and skipped, not fatal.
--   2. Deletes auth.users directly.
--
-- The caller (Next.js route) must have already deleted/nulled all public-schema
-- FK rows before calling this function.
--
-- Returns TEXT: 'OK' on success, or the Postgres SQLSTATE + SQLERRM on failure.

CREATE OR REPLACE FUNCTION public.admin_hard_delete_auth_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
  v_sql TEXT;
BEGIN
  -- Sessions (refresh_tokens, mfa_amr_claims cascade from sessions)
  BEGIN
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'admin_hard_delete_auth_user: sessions cleanup: % %', SQLSTATE, SQLERRM;
  END;

  -- Identities
  BEGIN
    DELETE FROM auth.identities WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'admin_hard_delete_auth_user: identities cleanup: % %', SQLSTATE, SQLERRM;
  END;

  -- MFA factors (challenges and amr_claims cascade)
  BEGIN
    DELETE FROM auth.mfa_factors WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'admin_hard_delete_auth_user: mfa_factors cleanup: % %', SQLSTATE, SQLERRM;
  END;

  -- one_time_tokens (added in newer GoTrue)
  BEGIN
    v_sql := NULL;
    SELECT 1 INTO v_sql
    FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name   = 'one_time_tokens'
      AND column_name  = 'user_id';
    IF v_sql IS NOT NULL THEN
      EXECUTE 'DELETE FROM auth.one_time_tokens WHERE user_id = $1' USING p_user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'admin_hard_delete_auth_user: one_time_tokens cleanup: % %', SQLSTATE, SQLERRM;
  END;

  -- flow_state (user_id column may or may not exist depending on GoTrue version)
  BEGIN
    v_sql := NULL;
    SELECT 1 INTO v_sql
    FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name   = 'flow_state'
      AND column_name  = 'user_id';
    IF v_sql IS NOT NULL THEN
      EXECUTE 'DELETE FROM auth.flow_state WHERE user_id = $1' USING p_user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'admin_hard_delete_auth_user: flow_state cleanup: % %', SQLSTATE, SQLERRM;
  END;

  -- saml_relay_states — does NOT have user_id; references flow_state_id.
  -- Rows cascade when flow_state rows are deleted above, so nothing to do here.

  -- Hard delete the user
  BEGIN
    DELETE FROM auth.users WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN 'DELETE blocked [' || SQLSTATE || ']: ' || SQLERRM;
  END;

  RETURN 'OK';
END;
$$;

COMMENT ON FUNCTION public.admin_hard_delete_auth_user(UUID) IS
  'Hard-deletes an auth.users row directly, pre-cleaning auth-schema dependent '
  'rows first. Used when GoTrue adminDeleteUser returns unexpected_failure due '
  'to internal pre-cleanup failures unrelated to FK constraints.';
