-- CONSOLIDATE GRANULAR CRUD POLICIES
-- Replace multiple separate CRUD policies with single ALL policies for better performance

-- ===================================================================
-- CONSOLIDATE USER TABLE POLICIES  
-- These tables have separate SELECT, INSERT, UPDATE, DELETE policies with identical logic
-- ===================================================================

-- 1. LEADS TABLE - Replace 4 separate policies with 1 ALL policy
DROP POLICY IF EXISTS "leads_select_optimized" ON leads;
DROP POLICY IF EXISTS "leads_insert_optimized" ON leads;
DROP POLICY IF EXISTS "leads_update_optimized" ON leads;  
DROP POLICY IF EXISTS "leads_delete_optimized" ON leads;

CREATE POLICY "leads_all_consolidated" ON leads
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = leads.company_id
        ) OR
        assigned_to = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- 2. USER_COMPANIES TABLE - Replace 4 separate policies with 1 ALL policy
DROP POLICY IF EXISTS "user_companies_select_optimized" ON user_companies;
DROP POLICY IF EXISTS "user_companies_insert_optimized" ON user_companies;
DROP POLICY IF EXISTS "user_companies_update_optimized" ON user_companies;
DROP POLICY IF EXISTS "user_companies_delete_optimized" ON user_companies;

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

-- 3. PROFILES TABLE - Add missing DELETE and consolidate to single ALL policy
DROP POLICY IF EXISTS "profiles_select_optimized" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_optimized" ON profiles;
DROP POLICY IF EXISTS "profiles_update_optimized" ON profiles;

CREATE POLICY "profiles_all_consolidated" ON profiles
    FOR ALL 
    TO authenticated
    USING (
        (SELECT auth.uid()) = id OR
        EXISTS (
            SELECT 1 FROM user_companies uc1
            JOIN user_companies uc2 ON uc1.company_id = uc2.company_id
            WHERE uc1.user_id = (SELECT auth.uid()) AND uc2.user_id = profiles.id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- ===================================================================
-- LEAVE SYSTEM TABLES UNCHANGED
-- These are managed by Supabase and may require separate policies
-- ===================================================================

-- ROLES TABLE - Leave unchanged (system managed)
-- USERS_ROLES TABLE - Leave unchanged (system managed)  
-- CALL_RECORDS TABLE - Leave unchanged (external system managed)

-- Update table statistics after policy changes
ANALYZE leads;
ANALYZE user_companies;
ANALYZE profiles;

-- Verification and logging
DO $$
DECLARE
    granular_crud_count INTEGER;
    total_multi_policy_count INTEGER;
BEGIN
    -- Count remaining tables with 3+ policies (granular CRUD pattern)
    SELECT COUNT(*) INTO granular_crud_count
    FROM (
        SELECT tablename
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND permissive = 'PERMISSIVE'
        GROUP BY tablename
        HAVING COUNT(*) >= 3
    ) subquery;
    
    -- Count total tables with multiple policies
    SELECT COUNT(*) INTO total_multi_policy_count
    FROM (
        SELECT tablename
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND permissive = 'PERMISSIVE'
        GROUP BY tablename
        HAVING COUNT(*) > 1
    ) subquery;
    
    RAISE NOTICE 'GRANULAR CRUD POLICY CONSOLIDATION COMPLETE:';
    RAISE NOTICE 'Consolidated policies for 3 user tables: leads, user_companies, profiles';
    RAISE NOTICE 'Remaining tables with 3+ policies: %', granular_crud_count;
    RAISE NOTICE 'Total tables with multiple policies: %', total_multi_policy_count;
    RAISE NOTICE 'System tables (roles, users_roles, call_records) left unchanged';
END $$;