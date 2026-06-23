-- Helper function called by the admin user-deletion API route to null out
-- storage.objects.owner (and owner_id if present) before calling
-- supabase.auth.admin.deleteUser().
--
-- Background: storage.objects.owner references auth.users(id) with no
-- ON DELETE clause (RESTRICT by Postgres default). PostgREST blocks
-- direct access to non-public schemas (PGRST106), so the route cannot
-- UPDATE storage.objects directly. A SECURITY DEFINER function in the
-- public schema can reach across schemas.
--
-- owner_id was added in newer Supabase storage releases alongside owner;
-- we null it out with a conditional block so this migration is safe on
-- both old and new storage versions.

CREATE OR REPLACE FUNCTION public.clear_user_storage_owner(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'storage, public, pg_temp'
AS $$
BEGIN
  -- Clear the legacy owner column (UUID, references auth.users RESTRICT)
  UPDATE storage.objects
  SET owner = NULL
  WHERE owner = p_user_id;

  -- Clear owner_id if the column exists (added in newer Supabase storage)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name  = 'objects'
      AND column_name = 'owner_id'
  ) THEN
    EXECUTE 'UPDATE storage.objects SET owner_id = NULL WHERE owner_id = $1'
      USING p_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.clear_user_storage_owner(UUID) IS
  'Nulls out storage.objects.owner (and owner_id if present) for the given user. '
  'Called by the admin user-deletion route before supabase.auth.admin.deleteUser() '
  'to avoid the RESTRICT FK blocking auth user removal.';
