-- =====================================================================
-- Migration: 20250822140000_revert_user_companies_policy_consolidation_error
-- =====================================================================
-- 
-- REVERT CONSOLIDATION ERROR: Restore correct user_companies RLS policy
-- 
-- Issue: During the consolidation migration 20250821120000, I incorrectly 
-- replaced the proper "user_companies_all_consolidated" policy with a 
-- restrictive "user_companies_simple" policy that broke API access verification.
-- 
-- This migration reverts to the exact policy from the original migration
-- 20250819220500_consolidate_crud_policies.sql lines 36-45
-- =====================================================================

-- Remove the incorrect policy I created during consolidation
DROP POLICY IF EXISTS "user_companies_simple" ON user_companies;

-- Remove the attempted fix policy as well (it wasn't working)
DROP POLICY IF EXISTS "user_companies_fixed" ON user_companies;

-- Recreate the EXACT policy from the original migration 20250819220500_consolidate_crud_policies.sql
-- This is the correct consolidated policy that was supposed to be copied exactly
CREATE POLICY "user_companies_all_consolidated" ON user_companies
    FOR ALL 
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- Verify the correct policy was created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Check that the correct policy exists
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_companies' 
    AND policyname = 'user_companies_all_consolidated';
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'POLICY REVERSION COMPLETE';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Restored user_companies_all_consolidated policy: %', policy_count;
    
    IF policy_count = 1 THEN
        RAISE NOTICE '✅ CORRECT POLICY RESTORED';
        RAISE NOTICE '✅ Lead archiving API access should work now';
        RAISE NOTICE '✅ Reverted consolidation error successfully';
    ELSE
        RAISE NOTICE '⚠️  Policy may not have been created correctly';
    END IF;
    
    RAISE NOTICE '====================================';
END $$;

-- Add documentation comment explaining the fix
COMMENT ON POLICY "user_companies_all_consolidated" ON user_companies IS 'Restored correct consolidated policy from original migration 20250819220500 - fixes API access verification for lead archiving';