-- 1. Backfill any existing profiles with NULL avatar_url
--    where auth.users already has avatar data in metadata
UPDATE public.profiles p
SET
  avatar_url = COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    u.raw_user_meta_data->>'profile_image',
    u.raw_user_meta_data->>'profile_picture_url'
  ),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND p.avatar_url IS NULL
  AND (
    u.raw_user_meta_data->>'avatar_url'          IS NOT NULL OR
    u.raw_user_meta_data->>'picture'             IS NOT NULL OR
    u.raw_user_meta_data->>'profile_image'       IS NOT NULL OR
    u.raw_user_meta_data->>'profile_picture_url' IS NOT NULL
  );

-- 2. Add a trigger to keep avatar_url in sync whenever auth.users metadata changes
CREATE OR REPLACE FUNCTION public.sync_avatar_on_user_update()
RETURNS TRIGGER AS $$
DECLARE
  new_avatar TEXT;
BEGIN
  -- Only proceed if raw_user_meta_data actually changed
  IF NEW.raw_user_meta_data IS NOT DISTINCT FROM OLD.raw_user_meta_data THEN
    RETURN NEW;
  END IF;

  new_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'profile_image',
    NEW.raw_user_meta_data->>'profile_picture_url'
  );

  -- Only update if there is a new avatar value and it differs from current
  IF new_avatar IS NOT NULL THEN
    UPDATE public.profiles
    SET avatar_url = new_avatar,
        updated_at = NOW()
    WHERE id = NEW.id
      AND (avatar_url IS NULL OR avatar_url IS DISTINCT FROM new_avatar);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_avatar_on_user_update();
