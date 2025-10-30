-- =====================================================================
-- Migration: Fix user_departments RLS to allow same-company user visibility
-- =====================================================================
--
-- Issue: Non-admin users cannot see other users' department assignments
-- because the user_departments RLS policy only allows viewing own departments.
-- This causes the API to return users with empty departments arrays, which
-- get filtered out by the frontend, breaking assignment dropdowns.
--
-- Solution: Update the user_departments RLS policy to allow users to see
-- department assignments of other users in the same company.
-- =====================================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own departments" ON user_departments;
DROP POLICY IF EXISTS "user_departments_self_only" ON user_departments;
DROP POLICY IF EXISTS "user_departments_select" ON user_departments;

-- Create a new policy that allows users to see departments of same-company users
-- This reuses the user_shares_company_with function created in the profiles fix
CREATE POLICY "user_departments_company_access" ON user_departments
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own departments
        auth.uid() = user_id
        OR
        -- Users can see departments of other users in the same company
        -- Reuses the security definer function from profiles RLS fix
        public.user_shares_company_with(user_id)
    );

-- Keep restrictive policies for modifications
-- Only company admins/managers should be able to modify departments
DROP POLICY IF EXISTS "user_departments_insert" ON user_departments;
DROP POLICY IF EXISTS "user_departments_update" ON user_departments;
DROP POLICY IF EXISTS "user_departments_delete" ON user_departments;

CREATE POLICY "user_departments_modify" ON user_departments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Only admins/managers can assign departments
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'manager')
        )
        OR
        -- Or the user is assigning to themselves (self-service)
        auth.uid() = user_id
    );

CREATE POLICY "user_departments_update_policy" ON user_departments
    FOR UPDATE
    TO authenticated
    USING (
        -- Only admins/managers can update departments
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'manager')
        )
    )
    WITH CHECK (
        -- Only admins/managers can update departments
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

CREATE POLICY "user_departments_delete_policy" ON user_departments
    FOR DELETE
    TO authenticated
    USING (
        -- Only admins/managers can delete departments
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

-- Verify the fix
DO $$
DECLARE
    select_policy_count INTEGER;
    modify_policy_count INTEGER;
BEGIN
    -- Check that SELECT policy exists
    SELECT COUNT(*) INTO select_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_departments'
    AND policyname = 'user_departments_company_access';

    -- Check that modify policies exist
    SELECT COUNT(*) INTO modify_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_departments'
    AND policyname IN ('user_departments_modify', 'user_departments_update_policy', 'user_departments_delete_policy');

    RAISE NOTICE '======================================';
    RAISE NOTICE 'USER_DEPARTMENTS RLS FIX APPLIED';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'user_departments_company_access policy created: %', select_policy_count = 1;
    RAISE NOTICE 'Modify policies created: %', modify_policy_count = 3;

    IF select_policy_count = 1 AND modify_policy_count = 3 THEN
        RAISE NOTICE '✅ ALL POLICIES APPLIED SUCCESSFULLY';
        RAISE NOTICE '✅ Non-admin users can now see company users departments';
        RAISE NOTICE '✅ Assignment dropdowns should show all company users';
    ELSE
        RAISE WARNING '⚠️  Some policies may not have been created correctly';
        RAISE WARNING '    SELECT policies: % (expected: 1)', select_policy_count;
        RAISE WARNING '    Modify policies: % (expected: 3)', modify_policy_count;
    END IF;

    RAISE NOTICE '======================================';
END $$;

-- Update table statistics
ANALYZE user_departments;

-- Add documentation comments
COMMENT ON POLICY "user_departments_company_access" ON user_departments IS
'Allows users to view department assignments for themselves and other users in the same company. Uses security definer function to avoid infinite recursion.';

COMMENT ON POLICY "user_departments_modify" ON user_departments IS
'Only admins, managers, or the user themselves can add department assignments';

COMMENT ON POLICY "user_departments_update_policy" ON user_departments IS
'Only admins and managers can update department assignments';

COMMENT ON POLICY "user_departments_delete_policy" ON user_departments IS
'Only admins and managers can delete department assignments';
