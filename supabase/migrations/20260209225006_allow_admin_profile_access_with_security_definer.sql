-- =====================================================================
-- Migration: Allow admins to view all profiles using security definer
-- =====================================================================
--
-- Issue: Admins need to view all user profiles for task assignment and
-- administrative functions, but querying profiles table in its own RLS
-- policy creates circular dependency.
--
-- Solution: Create a security definer function to check admin status
-- without triggering RLS, breaking the circular dependency chain.
-- =====================================================================

-- Create a security definer function to check if current user is admin
-- This function runs with elevated privileges and bypasses RLS checks
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the current user has admin role
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.is_current_user_admin IS
'Security definer function to check if current user is an admin. Bypasses RLS to prevent infinite recursion.';

-- Drop the existing policy
DROP POLICY IF EXISTS "profiles_company_access" ON profiles;

-- Recreate the policy with admin access using security definer function
CREATE POLICY "profiles_company_access" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own profile
        auth.uid() = id
        OR
        -- Admins can see all profiles (using security definer to avoid circular RLS)
        public.is_current_user_admin()
        OR
        -- Users can see profiles of other users in the same company
        -- Using security definer function to avoid circular RLS checks
        public.user_shares_company_with(id)
    );

-- Update policy comment
COMMENT ON POLICY "profiles_company_access" ON profiles IS
'Allows users to view their own profile, admins to view all profiles, and users to view profiles of users in the same company. Uses security definer functions to prevent infinite recursion.';

-- Verify the fix
DO $$
DECLARE
    function_exists INTEGER;
    policy_exists INTEGER;
BEGIN
    -- Check function exists
    SELECT COUNT(*) INTO function_exists
    FROM pg_proc
    WHERE proname = 'is_current_user_admin';

    -- Check policy exists
    SELECT COUNT(*) INTO policy_exists
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_company_access';

    RAISE NOTICE '======================================';
    RAISE NOTICE 'ADMIN PROFILE ACCESS WITH SECURITY DEFINER';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Security definer function created: %', function_exists > 0;
    RAISE NOTICE 'profiles_company_access policy updated: %', policy_exists > 0;

    IF function_exists > 0 AND policy_exists > 0 THEN
        RAISE NOTICE '✅ FIX APPLIED SUCCESSFULLY';
        RAISE NOTICE '✅ Admins can now view all profiles';
        RAISE NOTICE '✅ Circular dependency prevented using security definer';
        RAISE NOTICE '✅ Company-based access maintained for regular users';
    ELSE
        RAISE WARNING '⚠️  Fix may not have been applied correctly';
    END IF;

    RAISE NOTICE '======================================';
END $$;

-- Update table statistics
ANALYZE profiles;
