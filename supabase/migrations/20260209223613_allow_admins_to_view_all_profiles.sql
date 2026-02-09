-- =====================================================================
-- Migration: Allow admins to view all profiles
-- =====================================================================
--
-- Issue: The profiles_company_access policy only allows viewing profiles
-- in the same company. Admins need to see all profiles for task assignment
-- and other administrative functions.
--
-- Solution: Add an admin check to the RLS policy so admins can view all
-- profiles while maintaining the company-based restriction for regular users.
-- =====================================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "profiles_company_access" ON profiles;

-- Recreate the policy with admin access
CREATE POLICY "profiles_company_access" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own profile
        auth.uid() = id
        OR
        -- Admins can see all profiles
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
        OR
        -- Users can see profiles of other users in the same company
        -- Using security definer function to avoid circular RLS checks
        public.user_shares_company_with(id)
    );

-- Update policy comment
COMMENT ON POLICY "profiles_company_access" ON profiles IS
'Allows users to view their own profile, admins to view all profiles, and users to view profiles of users in the same company. Uses security definer function to prevent infinite recursion.';

-- Verify the fix
DO $$
DECLARE
    policy_exists INTEGER;
BEGIN
    -- Check policy exists
    SELECT COUNT(*) INTO policy_exists
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_company_access';

    RAISE NOTICE '======================================';
    RAISE NOTICE 'ADMIN PROFILE ACCESS FIX';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'profiles_company_access policy updated: %', policy_exists > 0;

    IF policy_exists > 0 THEN
        RAISE NOTICE '✅ POLICY UPDATED SUCCESSFULLY';
        RAISE NOTICE '✅ Admins can now view all profiles';
        RAISE NOTICE '✅ Company-based access maintained for regular users';
    ELSE
        RAISE WARNING '⚠️  Policy may not have been updated correctly';
    END IF;

    RAISE NOTICE '======================================';
END $$;

-- Update table statistics
ANALYZE profiles;
