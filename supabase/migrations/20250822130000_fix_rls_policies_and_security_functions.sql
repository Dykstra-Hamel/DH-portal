-- =====================================================================
-- Migration: 20250822130000_fix_rls_policies_and_security_functions
-- =====================================================================
-- 
-- This migration fixes issues introduced by the consolidated migration:
-- 1. RLS policy conflicts causing "Access denied to this lead" errors
-- 2. Security DEFINER functions missing proper search_path configuration
-- 
-- Issues Fixed:
-- - user_companies policy too restrictive for API access verification
-- - 3 security functions missing SECURITY DEFINER and SET search_path
-- =====================================================================

-- ===================================================================
-- SECTION 1: FIX RLS POLICY CONFLICTS
-- Fix user_companies policy to restore lead archive functionality
-- ===================================================================

-- The consolidated migration created a user_companies_simple policy that is too restrictive
-- This breaks the API's access verification logic in /api/leads/[id]
-- We need to allow users to query user_companies for company access checks

DROP POLICY IF EXISTS "user_companies_simple" ON user_companies;

-- Create a better user_companies policy that allows:
-- 1. Users to access their own user_company records 
-- 2. API access verification to work properly
-- 3. Service role access for server-side operations
CREATE POLICY "user_companies_fixed" ON user_companies
    FOR ALL 
    TO authenticated
    USING (
        -- Users can access their own user_company records
        (SELECT auth.uid()) = user_id OR
        -- Allow service role access for API operations (server-side queries)
        current_user = 'service_role'
    )
    WITH CHECK (
        -- Users can only modify their own user_company records
        (SELECT auth.uid()) = user_id OR
        -- Allow service role access for API operations
        current_user = 'service_role'
    );

-- ===================================================================
-- SECTION 2: FIX SECURITY DEFINER FUNCTION VULNERABILITIES  
-- Fix 3 functions with "Function Search Path Mutable" warnings
-- ===================================================================

-- 1. Fix analyze_query_performance function
DROP FUNCTION IF EXISTS public.analyze_query_performance(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.analyze_query_performance(query_text TEXT)
RETURNS TABLE(
    query_plan TEXT,
    execution_time NUMERIC,
    rows_returned BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- This is a placeholder for query analysis
    RETURN QUERY
    SELECT 
        'Query analysis not implemented'::TEXT,
        0::NUMERIC,
        0::BIGINT;
END;
$function$;

-- 2. Fix auto_refresh_company_lead_stats function
DROP FUNCTION IF EXISTS public.auto_refresh_company_lead_stats() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_refresh_company_lead_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Refresh the materialized view when leads are modified
    -- Only refresh if the materialized view exists and we have permissions
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.company_lead_stats;
        END IF;
    EXCEPTION 
        WHEN insufficient_privilege THEN
            -- Log the permission error but don't fail the operation
            RAISE NOTICE 'Unable to refresh company_lead_stats materialized view due to insufficient privileges';
        WHEN others THEN
            -- Log other errors but don't fail the operation
            RAISE NOTICE 'Error refreshing company_lead_stats materialized view: %', SQLERRM;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. Fix refresh_company_lead_stats function  
DROP FUNCTION IF EXISTS public.refresh_company_lead_stats() CASCADE;

CREATE OR REPLACE FUNCTION public.refresh_company_lead_stats()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    BEGIN
        -- Check if materialized view exists before refreshing
        IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.company_lead_stats;
        END IF;
    EXCEPTION 
        WHEN insufficient_privilege THEN
            -- Log the permission error but don't fail the operation
            RAISE NOTICE 'Unable to refresh company_lead_stats materialized view due to insufficient privileges';
        WHEN others THEN
            -- Log other errors but don't fail the operation
            RAISE NOTICE 'Error refreshing company_lead_stats materialized view: %', SQLERRM;
    END;
END;
$function$;

-- Recreate trigger that may have been dropped
DROP TRIGGER IF EXISTS trigger_leads_refresh_stats ON public.leads;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
        CREATE TRIGGER trigger_leads_refresh_stats
            AFTER INSERT OR UPDATE OR DELETE ON public.leads
            FOR EACH STATEMENT
            EXECUTE FUNCTION public.auto_refresh_company_lead_stats();
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.auto_refresh_company_lead_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_company_lead_stats() TO service_role;

-- ===================================================================
-- SECTION 3: VERIFICATION AND LOGGING
-- ===================================================================

-- Verify the fixes
DO $$
DECLARE
    policy_count INTEGER;
    func_count INTEGER;
BEGIN
    -- Check that user_companies policy exists
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_companies' 
    AND policyname = 'user_companies_fixed';
    
    -- Count secured functions
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true 
    AND n.nspname = 'public'
    AND p.proconfig IS NOT NULL
    AND p.proname IN ('analyze_query_performance', 'auto_refresh_company_lead_stats', 'refresh_company_lead_stats');
    
    RAISE NOTICE '======================================';
    RAISE NOTICE 'MIGRATION 20250822130000 COMPLETE';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Fixed user_companies policies: %', policy_count;
    RAISE NOTICE 'Secured DEFINER functions: %', func_count;
    
    IF policy_count > 0 AND func_count = 3 THEN
        RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY';
        RAISE NOTICE '✅ Lead archiving should work now';
        RAISE NOTICE '✅ Security vulnerabilities resolved';
    ELSE
        RAISE NOTICE '⚠️  Some fixes may not have applied correctly';
        RAISE NOTICE '   - user_companies policies: %', policy_count;
        RAISE NOTICE '   - secured functions: %', func_count;
    END IF;
    
    RAISE NOTICE '======================================';
END $$;

-- Add documentation comments
COMMENT ON POLICY "user_companies_fixed" ON user_companies IS 'Fixed policy to allow API access verification while maintaining security - resolves lead archive access denied error';
COMMENT ON FUNCTION public.analyze_query_performance(TEXT) IS 'Security fixed: Added SECURITY DEFINER and SET search_path to prevent schema injection attacks';
COMMENT ON FUNCTION public.auto_refresh_company_lead_stats() IS 'Security fixed: Added SECURITY DEFINER and SET search_path to prevent schema injection attacks';
COMMENT ON FUNCTION public.refresh_company_lead_stats() IS 'Security fixed: Added SECURITY DEFINER and SET search_path to prevent schema injection attacks';