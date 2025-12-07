-- =====================================================================
-- Migration: Fix infinite recursion in profiles RLS policy
-- =====================================================================
--
-- Issue: The profiles_company_access policy creates infinite recursion
-- when querying notifications because of circular dependencies:
-- notifications → profiles (FK) → user_companies (RLS check) → profiles (FK) → LOOP
--
-- Solution: Use a security definer function to bypass RLS when checking
-- company membership, breaking the circular dependency chain.
-- =====================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_company_access" ON profiles;

-- Create a security definer function to check company membership
-- This function runs with elevated privileges and bypasses RLS checks
CREATE OR REPLACE FUNCTION public.user_shares_company_with(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the current user shares any company with the target user
    RETURN EXISTS (
        SELECT 1
        FROM user_companies uc1
        INNER JOIN user_companies uc2 ON uc1.company_id = uc2.company_id
        WHERE uc1.user_id = auth.uid()
        AND uc2.user_id = target_user_id
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_shares_company_with(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.user_shares_company_with IS
'Security definer function to check if current user shares a company with target user. Bypasses RLS to prevent infinite recursion.';

-- Create the new profiles policy using the security definer function
-- This prevents infinite recursion by using a function that bypasses RLS
CREATE POLICY "profiles_company_access" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own profile
        auth.uid() = id
        OR
        -- Users can see profiles of other users in the same company
        -- Using security definer function to avoid circular RLS checks
        public.user_shares_company_with(id)
    );

-- Keep the restrictive policies for modifications
-- These were already created in the previous migration, but we'll recreate them for safety
DROP POLICY IF EXISTS "profiles_self_modify" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_self_delete" ON profiles;

CREATE POLICY "profiles_self_modify" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_delete" ON profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- Verify the fix
DO $$
DECLARE
    function_exists INTEGER;
    policy_exists INTEGER;
BEGIN
    -- Check function exists
    SELECT COUNT(*) INTO function_exists
    FROM pg_proc
    WHERE proname = 'user_shares_company_with';

    -- Check policy exists
    SELECT COUNT(*) INTO policy_exists
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_company_access';

    RAISE NOTICE '======================================';
    RAISE NOTICE 'INFINITE RECURSION FIX APPLIED';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Security definer function created: %', function_exists > 0;
    RAISE NOTICE 'profiles_company_access policy created: %', policy_exists > 0;

    IF function_exists > 0 AND policy_exists > 0 THEN
        RAISE NOTICE '✅ FIX APPLIED SUCCESSFULLY';
        RAISE NOTICE '✅ Circular dependency broken using security definer function';
        RAISE NOTICE '✅ Notifications queries should work without recursion';
    ELSE
        RAISE WARNING '⚠️  Fix may not have been applied correctly';
    END IF;

    RAISE NOTICE '======================================';
END $$;

-- Update table statistics
ANALYZE profiles;
ANALYZE user_companies;

-- Add policy comments
COMMENT ON POLICY "profiles_company_access" ON profiles IS
'Allows users to view their own profile and profiles of users in the same company. Uses security definer function to prevent infinite recursion.';
COMMENT ON POLICY "profiles_self_modify" ON profiles IS
'Users can only insert their own profile';
COMMENT ON POLICY "profiles_self_update" ON profiles IS
'Users can only update their own profile';
COMMENT ON POLICY "profiles_self_delete" ON profiles IS
'Users can only delete their own profile';
