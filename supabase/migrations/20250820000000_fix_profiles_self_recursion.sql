-- FIX PROFILES SELF-RECURSION
-- The profiles policy is checking the profiles table within itself, causing infinite recursion

DROP POLICY IF EXISTS "profiles_own_access" ON profiles;

-- Create a profiles policy that doesn't reference itself
-- Simple approach: users can only access their own profile
-- Admin logic will need to be handled differently at the application level
CREATE POLICY "profiles_self_only" ON profiles
    FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Test the fix
DO $$
DECLARE
    test_user_id UUID := '0930606f-c4b1-435b-beee-5d10f7c0ec5a';
    profile_role TEXT;
BEGIN
    -- Test profiles access
    PERFORM set_config('role', 'authenticated', false);
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s"}', test_user_id), false);
    
    -- This should work without recursion
    SELECT role INTO profile_role FROM profiles WHERE id = test_user_id;
    
    RAISE NOTICE '✅ PROFILES RECURSION FIXED - Query executed successfully';
    RAISE NOTICE 'User role: %', profile_role;
    
    -- Reset
    PERFORM set_config('role', 'postgres', false);
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM set_config('role', 'postgres', false);
        RAISE NOTICE '❌ Still has profiles recursion: %', SQLERRM;
        RAISE;
END $$;

-- Update statistics
ANALYZE profiles;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'PROFILES SELF-RECURSION FIX COMPLETE:';
    RAISE NOTICE '1. Removed self-referential admin check in profiles policy';
    RAISE NOTICE '2. Users can now only access their own profile';
    RAISE NOTICE '3. Admin access patterns need to be handled at application level';
    RAISE NOTICE '4. Both user_companies and profiles queries should work now';
END $$;