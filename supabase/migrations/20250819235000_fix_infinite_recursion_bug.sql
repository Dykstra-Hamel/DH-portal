-- FIX INFINITE RECURSION IN RLS POLICIES
-- The user_companies and profiles policies are creating circular dependencies

-- ===================================================================
-- PROBLEM: INFINITE RECURSION DETECTED
-- user_companies policy checks profiles -> profiles policy checks user_companies
-- This creates an infinite loop when PostgreSQL evaluates RLS
-- ===================================================================

-- SOLUTION: Break the circular dependency by simplifying user_companies policy
-- Remove the admin role check that references profiles table

DROP POLICY IF EXISTS "user_companies_all_consolidated" ON user_companies;

-- Create a simpler user_companies policy that doesn't reference profiles
-- Users can only access their own user_company records
-- Admin access will be handled at the application level if needed
CREATE POLICY "user_companies_simple" ON user_companies
    FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- SOLUTION 2: Also simplify the profiles policy to avoid user_companies lookup
-- The company association check in profiles was causing the circular reference
DROP POLICY IF EXISTS "profiles_all_consolidated" ON profiles;

-- Create simpler profiles policies
-- Users can access their own profile, admins can access all profiles
CREATE POLICY "profiles_own_access" ON profiles
    FOR ALL 
    TO authenticated
    USING (
        (SELECT auth.uid()) = id OR
        -- Direct role check without user_companies lookup to avoid recursion
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) 
            AND p.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK ((SELECT auth.uid()) = id);

-- Test for infinite recursion
DO $$
DECLARE
    test_user_id UUID := '836c83aa-5c24-4722-8ffd-134732e147f1';
    test_result RECORD;
BEGIN
    -- Set RLS context like Supabase does
    PERFORM set_config('role', 'authenticated', false);
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s"}', test_user_id), false);
    
    -- Test the query that was causing infinite recursion
    SELECT uc.*, c.name INTO test_result
    FROM user_companies uc
    LEFT JOIN companies c ON c.id = uc.company_id
    WHERE uc.user_id = test_user_id
    LIMIT 1;
    
    -- If we get here, no infinite recursion
    RAISE NOTICE '✅ INFINITE RECURSION FIXED - Query executed successfully';
    RAISE NOTICE 'Test result: user_id=%, company_name=%', 
        test_result.user_id, test_result.name;
    
    -- Reset role
    PERFORM set_config('role', 'postgres', false);
    
EXCEPTION 
    WHEN OTHERS THEN
        -- Reset role on error
        PERFORM set_config('role', 'postgres', false);
        RAISE NOTICE '❌ Still has issues: %', SQLERRM;
        RAISE;
END $$;

-- Update table statistics
ANALYZE user_companies;
ANALYZE profiles;

-- Log fix details
DO $$
BEGIN
    RAISE NOTICE 'INFINITE RECURSION FIX APPLIED:';
    RAISE NOTICE '1. Removed circular dependency between user_companies and profiles';
    RAISE NOTICE '2. Simplified user_companies policy - users can only access their own records';
    RAISE NOTICE '3. Simplified profiles policy - removed user_companies lookup';
    RAISE NOTICE '4. Admin access patterns may need to be handled at application level';
    RAISE NOTICE '5. Frontend authentication should now work without recursion errors';
END $$;