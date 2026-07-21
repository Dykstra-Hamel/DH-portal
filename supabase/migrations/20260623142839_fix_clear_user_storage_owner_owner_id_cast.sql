-- Fix clear_user_storage_owner: owner_id in this Supabase storage version is also
-- stored as TEXT (not UUID), so comparing it to a UUID parameter needs a cast on
-- both sides. Use owner_id::text = $1 with p_user_id::text to avoid type mismatch.

CREATE OR REPLACE FUNCTION public.clear_user_storage_owner(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'storage, public, pg_temp'
AS $$
BEGIN
  -- owner is TEXT — cast UUID param to text
  UPDATE storage.objects
  SET owner = NULL
  WHERE owner = p_user_id::text;

  -- owner_id may be TEXT or UUID depending on storage version; cast both sides to text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name   = 'objects'
      AND column_name  = 'owner_id'
  ) THEN
    EXECUTE 'UPDATE storage.objects SET owner_id = NULL WHERE owner_id::text = $1'
      USING p_user_id::text;
  END IF;
END;
$$;
