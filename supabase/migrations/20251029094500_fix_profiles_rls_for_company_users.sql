-- =====================================================================
-- Migration: Fix profiles RLS to allow same-company user visibility
-- =====================================================================
--
-- Issue: The profiles_self_only policy blocks non-admin users from seeing
-- other users in their company, breaking assignment dropdowns and user lists.
--
-- This fix allows users to see profiles of other users in the same company
-- without creating the circular dependency that caused infinite recursion.
-- =====================================================================

-- Drop the overly restrictive profiles_self_only policy
DROP POLICY IF EXISTS "profiles_self_only" ON profiles;

-- Create a new policy that allows users to see profiles in their company
-- WITHOUT creating circular dependency by NOT referencing profiles table within itself
CREATE POLICY "profiles_company_access" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own profile
        (SELECT auth.uid()) = id
        OR
        -- Users can see profiles of other users in the same company
        -- Check if the requesting user shares a company with the target profile
        EXISTS (
            SELECT 1
            FROM user_companies uc1
            INNER JOIN user_companies uc2 ON uc1.company_id = uc2.company_id
            WHERE uc1.user_id = (SELECT auth.uid())  -- requesting user
            AND uc2.user_id = profiles.id            -- target profile
        )
    );

-- Keep the restrictive WITH CHECK for INSERT/UPDATE/DELETE
-- Users can only modify their own profile
CREATE POLICY "profiles_self_modify" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_self_update" ON profiles
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_self_delete" ON profiles
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = id);

-- Verify the fixes
DO $$
DECLARE
    select_policy_count INTEGER;
    insert_policy_count INTEGER;
    update_policy_count INTEGER;
    delete_policy_count INTEGER;
BEGIN
    -- Check that SELECT policy exists
    SELECT COUNT(*) INTO select_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_company_access';

    -- Check that modify policies exist
    SELECT COUNT(*) INTO insert_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_self_modify';

    SELECT COUNT(*) INTO update_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_self_update';

    SELECT COUNT(*) INTO delete_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_self_delete';

    RAISE NOTICE '======================================';
    RAISE NOTICE 'PROFILES RLS FIX COMPLETE';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'profiles_company_access policy created: %', select_policy_count;
    RAISE NOTICE 'profiles_self_modify policy created: %', insert_policy_count;
    RAISE NOTICE 'profiles_self_update policy created: %', update_policy_count;
    RAISE NOTICE 'profiles_self_delete policy created: %', delete_policy_count;

    IF select_policy_count = 1 AND insert_policy_count = 1 AND update_policy_count = 1 AND delete_policy_count = 1 THEN
        RAISE NOTICE '✅ ALL POLICIES APPLIED SUCCESSFULLY';
        RAISE NOTICE '✅ Non-admin users can now see company users';
        RAISE NOTICE '✅ Assignment dropdowns should work for all users';
    ELSE
        RAISE NOTICE '⚠️  Some policies may not have been created correctly';
    END IF;

    RAISE NOTICE '======================================';
END $$;

-- Update table statistics
ANALYZE profiles;

-- Add documentation comments
COMMENT ON POLICY "profiles_company_access" ON profiles IS 'Allows users to view profiles of other users in the same company without circular dependency';
COMMENT ON POLICY "profiles_self_modify" ON profiles IS 'Users can only insert their own profile';
COMMENT ON POLICY "profiles_self_update" ON profiles IS 'Users can only update their own profile';
COMMENT ON POLICY "profiles_self_delete" ON profiles IS 'Users can only delete their own profile';
