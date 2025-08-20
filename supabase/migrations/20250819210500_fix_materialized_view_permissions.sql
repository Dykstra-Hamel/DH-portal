-- Fix Materialized View Permissions for Service Role
-- This fixes the error "must be owner of materialized view company_lead_stats" 
-- that occurs when the Retell webhook tries to create leads

-- 1. Grant SELECT permissions to the service role on the materialized view
-- Note: REFRESH privilege doesn't exist in PostgreSQL, so we handle permissions via ownership
GRANT SELECT ON company_lead_stats TO service_role;

-- 2. Make the auto_refresh_company_lead_stats function more resilient to permission errors
-- This prevents webhook failures while maintaining performance benefits
CREATE OR REPLACE FUNCTION auto_refresh_company_lead_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the materialized view when leads are modified
    -- Only refresh if the materialized view exists and we have permissions
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
            -- Use SECURITY DEFINER to ensure we have the necessary permissions
            REFRESH MATERIALIZED VIEW CONCURRENTLY company_lead_stats;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission on the refresh function to service role
GRANT EXECUTE ON FUNCTION auto_refresh_company_lead_stats() TO service_role;

-- 4. Also make the refresh_company_lead_stats function more resilient
CREATE OR REPLACE FUNCTION refresh_company_lead_stats()
RETURNS void AS $$
BEGIN
    BEGIN
        -- Check if materialized view exists before refreshing
        IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY company_lead_stats;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permission on the manual refresh function to service role
GRANT EXECUTE ON FUNCTION refresh_company_lead_stats() TO service_role;

-- 6. Ensure the service role can access the underlying tables for the materialized view
-- These should already be accessible via RLS policies, but let's be explicit
GRANT SELECT ON companies TO service_role;
GRANT SELECT ON leads TO service_role;

-- 7. Set the functions to run with elevated privileges
-- The SECURITY DEFINER functions will run with the privileges of their owner
-- This allows the materialized view refresh to work regardless of the caller's permissions

-- 8. Add comment for documentation
COMMENT ON FUNCTION auto_refresh_company_lead_stats() IS 'Auto-refresh trigger for company_lead_stats materialized view with error handling to prevent webhook failures';
COMMENT ON FUNCTION refresh_company_lead_stats() IS 'Manual refresh function for company_lead_stats materialized view with improved error handling';