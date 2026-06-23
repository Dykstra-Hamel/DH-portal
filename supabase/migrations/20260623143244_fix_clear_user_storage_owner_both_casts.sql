-- Definitive fix: cast BOTH sides of every storage.objects comparison to text.
-- storage.objects.owner may be UUID or text depending on Supabase storage version;
-- casting both operands to text avoids "operator does not exist: uuid=text" and
-- "operator does not exist: text=uuid" in all variants.

CREATE OR REPLACE FUNCTION public.clear_user_storage_owner(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'storage, public, pg_temp'
AS $$
BEGIN
  -- Cast both sides to text: works whether owner is uuid or text
  UPDATE storage.objects
  SET owner = NULL
  WHERE owner::text = p_user_id::text;

  -- owner_id (added in newer Supabase storage): same cast-both-sides approach
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name   = 'objects'
      AND column_name  = 'owner_id'
  ) THEN
    EXECUTE
      'UPDATE storage.objects SET owner_id = NULL WHERE owner_id::text = $1'
      USING p_user_id::text;
  END IF;
END;
$$;
