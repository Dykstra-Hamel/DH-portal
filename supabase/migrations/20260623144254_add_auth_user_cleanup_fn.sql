-- Pre-cleanup for auth schema tables before supabase.auth.admin.deleteUser().
--
-- GoTrue handles auth.sessions / identities / mfa_factors internally, but
-- auth.flow_state (added in newer GoTrue) sometimes isn't cleaned up before
-- the DELETE auth.users is attempted, leaving a RESTRICT FK blocker.
--
-- This SECURITY DEFINER function clears every auth-schema row for the user so
-- that GoTrue's own DELETE auth.users cascade succeeds regardless of version.

CREATE OR REPLACE FUNCTION public.cleanup_auth_user_before_delete(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'auth, public, pg_temp'
AS $$
BEGIN
  -- Sessions (refresh_tokens cascade from sessions)
  DELETE FROM auth.sessions WHERE user_id = p_user_id;

  -- Identities
  DELETE FROM auth.identities WHERE user_id = p_user_id;

  -- MFA factors (challenges and amr_claims cascade from factors)
  DELETE FROM auth.mfa_factors WHERE user_id = p_user_id;

  -- flow_state — present in newer GoTrue; may have RESTRICT FK to auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'flow_state'
  ) THEN
    EXECUTE 'DELETE FROM auth.flow_state WHERE user_id = $1' USING p_user_id;
  END IF;

  -- saml_relay_states references flow_state; clean up if present
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'saml_relay_states'
  ) THEN
    EXECUTE 'DELETE FROM auth.saml_relay_states WHERE user_id = $1' USING p_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.cleanup_auth_user_before_delete(UUID) IS
  'Manually removes auth-schema rows for the user before GoTrue deleteUser is called, '
  'working around cases where auth.flow_state or similar tables block the auth.users DELETE.';
