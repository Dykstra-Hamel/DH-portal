-- FIX REDUNDANT ALL+SELECT POLICY OVERLAPS
-- Remove SELECT policies that are identical to ALL policies to eliminate redundant evaluation

-- ===================================================================
-- REMOVE IDENTICAL SELECT POLICIES (12 tables)
-- These have SELECT policies with identical logic to their ALL policies
-- ===================================================================

-- 1. AB_TEST_CAMPAIGNS - Identical policies
DROP POLICY IF EXISTS "ab_test_campaigns_select_optimized" ON ab_test_campaigns;
-- Keeping: ab_test_campaigns_all_optimized

-- 2. AB_TEST_VARIANTS - Identical policies  
DROP POLICY IF EXISTS "ab_test_variants_select_optimized" ON ab_test_variants;
-- Keeping: ab_test_variants_all_optimized

-- 3. AUTOMATION_WORKFLOWS - Identical policies
DROP POLICY IF EXISTS "automation_workflows_select_optimized" ON automation_workflows;
-- Keeping: automation_workflows_all_optimized

-- 4. COMPANY_PEST_OPTIONS - Identical policies
DROP POLICY IF EXISTS "company_pest_options_select_optimized" ON company_pest_options;
-- Keeping: company_pest_options_all_optimized

-- 5. COMPANY_SETTINGS - Identical policies
DROP POLICY IF EXISTS "company_settings_select_optimized" ON company_settings;
-- Keeping: company_settings_all_optimized

-- 6. CUSTOMERS - Identical policies
DROP POLICY IF EXISTS "customers_select_optimized" ON customers;
-- Keeping: customers_all_optimized

-- 7. EMAIL_TEMPLATES - Identical policies
DROP POLICY IF EXISTS "email_templates_select_optimized" ON email_templates;
-- Keeping: email_templates_all_optimized

-- 8. PARTIAL_LEADS - Identical policies
DROP POLICY IF EXISTS "partial_leads_select_optimized" ON partial_leads;
-- Keeping: partial_leads_all_optimized

-- 9. SERVICE_AREAS - Identical policies
DROP POLICY IF EXISTS "service_areas_select_optimized" ON service_areas;
-- Keeping: service_areas_all_optimized

-- 10. SERVICE_PLANS - Identical policies
DROP POLICY IF EXISTS "service_plans_select_optimized" ON service_plans;
-- Keeping: service_plans_all_optimized

-- 11. SYSTEM_SETTINGS - Identical policies
DROP POLICY IF EXISTS "system_settings_select_optimized" ON system_settings;
-- Keeping: system_settings_all_optimized

-- 12. WIDGET_SESSIONS - Identical policies
DROP POLICY IF EXISTS "widget_sessions_select_optimized" ON widget_sessions;
-- Keeping: widget_sessions_all_optimized

-- ===================================================================
-- KEEP DIFFERENT SELECT POLICIES (4 tables)
-- These have intentionally different permission logic and should be preserved
-- ===================================================================

-- BRANDS: SELECT=public (true), ALL=admin only - KEEP BOTH
-- PEST_TYPES: SELECT=public (true), ALL=admin only - KEEP BOTH  
-- EMAIL_TEMPLATE_LIBRARY: SELECT=is_active check, ALL=admin only - KEEP BOTH
-- PROJECTS: SELECT=user-specific logic, ALL=company logic - KEEP BOTH

-- Verification and logging
DO $$
DECLARE
    remaining_overlaps INTEGER;
BEGIN
    -- Count remaining ALL+SELECT overlaps
    SELECT COUNT(*) INTO remaining_overlaps
    FROM (
        SELECT tablename
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND cmd IN ('ALL', 'SELECT')
        GROUP BY tablename
        HAVING COUNT(*) = 2
    ) subquery;
    
    RAISE NOTICE 'REDUNDANT SELECT POLICY CLEANUP COMPLETE:';
    RAISE NOTICE 'Removed 12 redundant SELECT policies';
    RAISE NOTICE 'Remaining intentional ALL+SELECT overlaps: %', remaining_overlaps;
    RAISE NOTICE 'Kept policies with different permission logic:';
    RAISE NOTICE '- brands: Public read, admin write';
    RAISE NOTICE '- pest_types: Public read, admin write';  
    RAISE NOTICE '- email_template_library: Active templates read, admin write';
    RAISE NOTICE '- projects: User-specific read, company write';
END $$;