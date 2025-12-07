-- Add foreign key relationship between profiles and user_departments
-- This enables Supabase PostgREST to understand the relationship for joins

-- Add foreign key constraint if it doesn't exist
-- Note: This assumes profiles.id corresponds to auth.users.id (which is standard in Supabase)
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_departments_user_id_profiles_fkey'
        AND table_name = 'user_departments'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE user_departments
        ADD CONSTRAINT user_departments_user_id_profiles_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT user_departments_user_id_profiles_fkey ON user_departments
IS 'Foreign key relationship to enable PostgREST joins between profiles and user_departments tables';