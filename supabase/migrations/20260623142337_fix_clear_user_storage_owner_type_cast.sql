-- Fix clear_user_storage_owner: storage.objects.owner is type TEXT (not UUID),
-- so comparing it to a UUID parameter requires an explicit cast.
-- Also handle owner_id (UUID, added in newer Supabase storage versions) which
-- may reference auth.users(id) with RESTRICT and block deleteUser.

CREATE OR REPLACE FUNCTION public.clear_user_storage_owner(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'storage, public, pg_temp'
AS $$
BEGIN
  -- owner is type TEXT in storage.objects — cast UUID to text for the comparison
  UPDATE storage.objects
  SET owner = NULL
  WHERE owner = p_user_id::text;

  -- owner_id is UUID and may reference auth.users(id); null it out if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name   = 'objects'
      AND column_name  = 'owner_id'
  ) THEN
    EXECUTE 'UPDATE storage.objects SET owner_id = NULL WHERE owner_id = $1'
      USING p_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.clear_user_storage_owner(UUID) IS
  'Nulls out storage.objects.owner (text) and owner_id (uuid, if present) for the '
  'given user before supabase.auth.admin.deleteUser() to avoid RESTRICT FK violations.';
