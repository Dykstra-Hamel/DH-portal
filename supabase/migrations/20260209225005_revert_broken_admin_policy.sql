-- =====================================================================
-- Migration: Revert broken admin policy
-- =====================================================================
--
-- This reverts the circular RLS dependency introduced in the previous
-- migration and restores the working policy from Oct 29, 2025.
-- =====================================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "profiles_company_access" ON profiles;

-- Recreate the working policy (from 20251029100000)
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

-- Update policy comment
COMMENT ON POLICY "profiles_company_access" ON profiles IS
'Allows users to view their own profile and profiles of users in the same company. Uses security definer function to prevent infinite recursion.';

-- Verify the revert
DO $$
DECLARE
    policy_exists INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_exists
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_company_access';

    RAISE NOTICE '======================================';
    RAISE NOTICE 'REVERT BROKEN ADMIN POLICY';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Policy reverted: %', policy_exists > 0;

    IF policy_exists > 0 THEN
        RAISE NOTICE '✅ WORKING POLICY RESTORED';
        RAISE NOTICE '✅ Circular dependency removed';
    ELSE
        RAISE WARNING '⚠️  Revert may not have completed correctly';
    END IF;

    RAISE NOTICE '======================================';
END $$;

-- Update table statistics
ANALYZE profiles;
