-- Add foreign key relationship from user_companies to profiles
-- This allows Supabase queries to join user_companies with profiles

-- First, drop the existing foreign key to auth.users if it exists
-- We'll keep it for now since profiles.id references auth.users.id anyway

-- Add foreign key from user_companies.user_id to profiles.id
-- Note: This will work because profiles.id is already a foreign key to auth.users.id
ALTER TABLE user_companies
DROP CONSTRAINT IF EXISTS user_companies_user_id_fkey;

ALTER TABLE user_companies
ADD CONSTRAINT user_companies_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Recreate the index for performance
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
