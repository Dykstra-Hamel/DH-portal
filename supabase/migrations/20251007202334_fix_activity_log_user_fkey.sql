-- =====================================================
-- Fix Activity Log User Foreign Key
-- =====================================================
-- This migration fixes the foreign key constraint on activity_log.user_id
-- to reference profiles(id) instead of auth.users(id), which allows
-- Supabase to properly join with the profiles table using the hint
-- activity_log_user_id_fkey

-- Drop the existing foreign key constraint to auth.users
ALTER TABLE activity_log
DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;

-- Add new foreign key constraint to profiles(id)
-- This creates the activity_log_user_id_fkey constraint that the API expects
ALTER TABLE activity_log
ADD CONSTRAINT activity_log_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT activity_log_user_id_fkey ON activity_log IS
'Foreign key to profiles table for user attribution. Using profiles instead of auth.users allows proper joins in Supabase queries.';
