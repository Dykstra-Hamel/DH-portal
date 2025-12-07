-- Populate avatar_url for existing users who don't have one but have avatar data in auth.users metadata
UPDATE profiles
SET avatar_url = COALESCE(
    (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = profiles.id),
    (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE id = profiles.id),
    (SELECT raw_user_meta_data->>'profile_image' FROM auth.users WHERE id = profiles.id),
    (SELECT raw_user_meta_data->>'profile_picture_url' FROM auth.users WHERE id = profiles.id)
),
updated_at = NOW()
WHERE avatar_url IS NULL
AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = profiles.id
    AND (
        raw_user_meta_data->>'avatar_url' IS NOT NULL OR
        raw_user_meta_data->>'picture' IS NOT NULL OR
        raw_user_meta_data->>'profile_image' IS NOT NULL OR
        raw_user_meta_data->>'profile_picture_url' IS NOT NULL
    )
);