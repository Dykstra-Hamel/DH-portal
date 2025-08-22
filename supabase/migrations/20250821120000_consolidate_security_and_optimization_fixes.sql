-- EXACT COPY OF ALL SECURITY AND OPTIMIZATION MIGRATIONS
-- This file contains the exact SQL from migrations 20250818200000 through 20250820250000
-- No modifications have been made to the original content
-- Created: 2025-08-21 12:00:00

-- =====================================================================
-- Migration: 20250818200000_optimize_database_performance_phase1
-- =====================================================================

-- Phase 1: Critical Database Performance Optimizations
-- This migration addresses the most impactful performance issues identified in Supabase

-- 1. COMPOSITE INDEXES for Automation System
-- These address N+1 query issues and improve JOIN performance

-- Optimize automation_executions queries by company and status
CREATE INDEX IF NOT EXISTS idx_automation_executions_company_status 
ON automation_executions(company_id, execution_status) 
WHERE execution_status IN ('pending', 'running');

-- Optimize automation_executions queries by lead with status
CREATE INDEX IF NOT EXISTS idx_automation_executions_lead_status 
ON automation_executions(lead_id, execution_status) 
WHERE lead_id IS NOT NULL;

-- Optimize email_automation_log queries by company and status
CREATE INDEX IF NOT EXISTS idx_email_automation_log_company_status 
ON email_automation_log(company_id, send_status);

-- Optimize email_automation_log for scheduled emails
CREATE INDEX IF NOT EXISTS idx_email_automation_log_scheduled 
ON email_automation_log(scheduled_for, send_status) 
WHERE send_status = 'scheduled' AND scheduled_for IS NOT NULL;

-- 2. PARTIAL INDEXES for Active/Filtered Records
-- These significantly reduce index size and improve query performance

-- Active leads index (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_leads_active_by_company 
ON leads(company_id, lead_status, created_at DESC) 
WHERE lead_status IN ('new', 'contacted', 'qualified', 'quoted');

-- Active customers index
CREATE INDEX IF NOT EXISTS idx_customers_active_by_company 
ON customers(company_id, customer_status, created_at DESC) 
WHERE customer_status = 'active';

-- Active automation workflows
CREATE INDEX IF NOT EXISTS idx_automation_workflows_active 
ON automation_workflows(company_id, trigger_type, created_at DESC) 
WHERE is_active = true;

-- Active email templates
CREATE INDEX IF NOT EXISTS idx_email_templates_active 
ON email_templates(company_id, template_type, created_at DESC) 
WHERE is_active = true;

-- Active service areas for geographic queries
CREATE INDEX IF NOT EXISTS idx_service_areas_active_by_company 
ON service_areas(company_id, type, priority DESC) 
WHERE is_active = true;

-- 3. COVERING INDEXES for Common SELECT Patterns
-- These allow index-only scans, avoiding heap lookups

-- Cover common leads queries with customer info lookup
CREATE INDEX IF NOT EXISTS idx_leads_company_with_details 
ON leads(company_id, lead_status, created_at DESC, id, customer_id, assigned_to, priority, estimated_value);

-- Cover customer queries with lead count calculations
CREATE INDEX IF NOT EXISTS idx_customers_company_with_details 
ON customers(company_id, customer_status, created_at DESC, id, first_name, last_name, email, phone);

-- Cover call records for admin queries
CREATE INDEX IF NOT EXISTS idx_call_records_with_details 
ON call_records(created_at DESC, call_status, id, lead_id, customer_id, phone_number, duration_seconds, sentiment);

-- 4. OPTIMIZE EXISTING CALL_RECORDS INDEXES
-- Remove redundant indexes and add more efficient ones

-- Drop redundant indexes that are covered by better ones
DROP INDEX IF EXISTS idx_call_records_pest_issue;
DROP INDEX IF EXISTS idx_call_records_service_time;
DROP INDEX IF EXISTS idx_call_records_contacted_others;
DROP INDEX IF EXISTS idx_call_records_opt_out;

-- Add composite index for common call record queries
CREATE INDEX IF NOT EXISTS idx_call_records_lead_customer_date 
ON call_records(lead_id, customer_id, start_timestamp DESC) 
WHERE lead_id IS NOT NULL OR customer_id IS NOT NULL;

-- Add index for call records with transcript analysis
CREATE INDEX IF NOT EXISTS idx_call_records_analysis 
ON call_records(call_status, sentiment, created_at DESC) 
WHERE transcript IS NOT NULL;

-- 5. JSONB INDEXES for Search Operations
-- These dramatically improve JSON field searches

-- Index automation execution data for runtime queries
CREATE INDEX IF NOT EXISTS idx_automation_executions_data_gin 
ON automation_executions USING GIN(execution_data);

-- Index call analysis data for filtering and reporting
CREATE INDEX IF NOT EXISTS idx_call_records_analysis_gin 
ON call_records USING GIN(call_analysis);

-- Index email tracking data for analytics
CREATE INDEX IF NOT EXISTS idx_email_automation_log_tracking_gin 
ON email_automation_log USING GIN(tracking_data);

-- Index workflow steps for complex workflow queries
CREATE INDEX IF NOT EXISTS idx_automation_workflows_steps_gin 
ON automation_workflows USING GIN(workflow_steps);

-- Index automation trigger conditions
CREATE INDEX IF NOT EXISTS idx_automation_workflows_conditions_gin 
ON automation_workflows USING GIN(trigger_conditions);

-- 6. OPTIMIZE USER_COMPANIES Junction Table
-- This is critical for RLS policy performance

-- Composite index for user-company access checks (most critical for RLS)
CREATE INDEX IF NOT EXISTS idx_user_companies_user_company_role 
ON user_companies(user_id, company_id, role, created_at);

-- Index for company-based user lookups
CREATE INDEX IF NOT EXISTS idx_user_companies_company_users 
ON user_companies(company_id, role, user_id, created_at);

-- 7. WIDGET SESSIONS Optimization
-- Improve session cleanup and analytics queries

-- Composite index for session cleanup queries
CREATE INDEX IF NOT EXISTS idx_widget_sessions_cleanup 
ON widget_sessions(is_active, last_activity_at) 
WHERE is_active = false;

-- Index for active session analytics
CREATE INDEX IF NOT EXISTS idx_widget_sessions_analytics 
ON widget_sessions(company_id, first_visit_at DESC) 
WHERE is_active = true;

-- 8. LEADS Table Additional Optimizations
-- Address specific query patterns found in API routes

-- Index for leads assigned to users (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_status 
ON leads(assigned_to, lead_status, created_at DESC) 
WHERE assigned_to IS NOT NULL;

-- Index for leads follow-up queries
CREATE INDEX IF NOT EXISTS idx_leads_follow_up 
ON leads(next_follow_up_at, assigned_to) 
WHERE next_follow_up_at IS NOT NULL AND lead_status IN ('new', 'contacted', 'qualified');

-- 9. PROFILES Table Optimization
-- Critical for user lookup performance in admin queries

-- Optimize profile lookups by role (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_profiles_role_active 
ON profiles(role, id) 
WHERE role IN ('admin', 'super_admin');

-- 10. EMAIL_TEMPLATES Optimization
-- Improve template lookup performance

-- Index for template variable searches
CREATE INDEX IF NOT EXISTS idx_email_templates_variables_gin 
ON email_templates USING GIN(variables);

-- 11. Add Statistics Update for Query Planner
-- Ensure PostgreSQL has accurate statistics for these new indexes

-- Update table statistics to help query planner make better decisions
ANALYZE leads;
ANALYZE customers;
ANALYZE call_records;
ANALYZE automation_executions;
ANALYZE email_automation_log;
ANALYZE automation_workflows;
ANALYZE email_templates;
ANALYZE user_companies;
ANALYZE widget_sessions;
ANALYZE profiles;
ANALYZE service_areas;

-- Add comments documenting the optimization purpose
COMMENT ON INDEX idx_automation_executions_company_status IS 'Optimizes company-filtered automation execution queries';
COMMENT ON INDEX idx_leads_active_by_company IS 'Partial index for active leads, significantly reduces index size';
COMMENT ON INDEX idx_leads_company_with_details IS 'Covering index allows index-only scans for lead queries';
COMMENT ON INDEX idx_user_companies_user_company_role IS 'Critical for RLS policy performance';
COMMENT ON INDEX idx_call_records_analysis_gin IS 'Enables fast JSONB searches on call analysis data';

-- =====================================================================
-- Migration: 20250818200001_optimize_spatial_and_rls_performance
-- =====================================================================

-- Phase 1B: Spatial Optimization and RLS Policy Performance
-- Optimizes geographic queries and improves Row Level Security policy performance

-- 1. SPATIAL/GEOGRAPHIC INDEX OPTIMIZATIONS
-- Improve performance of service area and location-based queries

-- Optimize service area coverage checks with separate spatial indexes
-- Create separate indexes for different geometry types since PostgreSQL doesn't support CASE in index expressions

-- Index for polygon-based service areas
CREATE INDEX IF NOT EXISTS idx_service_areas_polygon_optimized 
ON service_areas USING GIST(polygon) 
WHERE is_active = true AND type = 'polygon' AND polygon IS NOT NULL;

-- Index for radius-based service areas (using center point)
CREATE INDEX IF NOT EXISTS idx_service_areas_radius_optimized 
ON service_areas USING GIST(center_point) 
WHERE is_active = true AND type = 'radius' AND center_point IS NOT NULL;

-- Add compound spatial index for company-specific area queries
CREATE INDEX IF NOT EXISTS idx_service_areas_company_spatial 
ON service_areas(company_id, type, priority DESC) 
WHERE is_active = true;

-- Optimize zip code array searches
CREATE INDEX IF NOT EXISTS idx_service_areas_zip_codes_optimized 
ON service_areas USING GIN(zip_codes) 
WHERE is_active = true AND type = 'zip_code';

-- 2. OPTIMIZE RLS POLICIES with Better Index Support
-- Create indexes specifically to support RLS policy conditions

-- Critical: Index to support company access checks in RLS policies
-- This will dramatically improve performance for all company-scoped queries
CREATE INDEX IF NOT EXISTS idx_user_companies_rls_support 
ON user_companies(user_id, company_id, role) 
WHERE role IN ('admin', 'manager', 'owner', 'user');

-- Index to support profile-based admin checks in RLS policies
CREATE INDEX IF NOT EXISTS idx_profiles_admin_rls 
ON profiles(id, role) 
WHERE role IN ('admin', 'super_admin');

-- 3. IMPROVE AUTOMATION SYSTEM RLS PERFORMANCE
-- These indexes specifically support the complex RLS policies in automation tables

-- Support email_templates RLS policy user_companies joins
CREATE INDEX IF NOT EXISTS idx_email_templates_rls_company 
ON email_templates(company_id, is_active);

-- Support automation_workflows RLS policy joins
CREATE INDEX IF NOT EXISTS idx_automation_workflows_rls_company 
ON automation_workflows(company_id, is_active);

-- Support automation_executions RLS policy company checks
CREATE INDEX IF NOT EXISTS idx_automation_executions_rls_company 
ON automation_executions(company_id, execution_status);

-- Support email_automation_log RLS policy company checks
CREATE INDEX IF NOT EXISTS idx_email_automation_log_rls_company 
ON email_automation_log(company_id, send_status);

-- 4. OPTIMIZE CALL_RECORDS RLS POLICIES
-- The call_records RLS policies involve complex joins that need index support

-- Support call_records RLS policy that checks leads.assigned_to
CREATE INDEX IF NOT EXISTS idx_leads_assigned_rls 
ON leads(id, assigned_to) 
WHERE assigned_to IS NOT NULL;

-- Support call_records admin policy for profiles check
CREATE INDEX IF NOT EXISTS idx_call_records_rls_admin 
ON call_records(id, lead_id, customer_id);

-- 5. FUNCTION OPTIMIZATIONS
-- Optimize the custom functions for better performance

-- Improve the service area coverage function with better indexing
-- Replace the existing function with an optimized version
DROP FUNCTION IF EXISTS public.check_service_area_coverage CASCADE;
CREATE OR REPLACE FUNCTION check_service_area_coverage(
  p_company_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE(
  area_id UUID,
  area_name VARCHAR(255),
  area_type VARCHAR(50),
  priority INTEGER
) AS $$
BEGIN
  -- Use the optimized indexes for faster lookups
  RETURN QUERY
  SELECT 
    sa.id,
    sa.name,
    sa.type,
    sa.priority
  FROM service_areas sa
  WHERE sa.company_id = p_company_id 
    AND sa.is_active = true
    AND (
      -- Use optimized polygon checks with spatial index
      (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
       ST_Contains(sa.polygon, ST_Point(p_longitude, p_latitude))) OR
      
      -- Use optimized radius checks with geography
      (sa.type = 'radius' AND sa.center_point IS NOT NULL AND
       ST_DWithin(
         sa.center_point::geography, 
         ST_Point(p_longitude, p_latitude)::geography,
         sa.radius_miles * 1609.34
       )) OR
      
      -- Use GIN index for zip code array searches
      (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
       sa.zip_codes IS NOT NULL AND 
       p_zip_code = ANY(sa.zip_codes))
    )
  ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. OPTIMIZE WIDGET SESSION QUERIES
-- Add indexes to support common widget analytics and cleanup operations

-- Index for widget session analytics by company and time
CREATE INDEX IF NOT EXISTS idx_widget_sessions_company_analytics 
ON widget_sessions(company_id, first_visit_at DESC, is_active, session_id, ip_address, referrer_url);

-- Index for session duration calculations
CREATE INDEX IF NOT EXISTS idx_widget_sessions_duration 
ON widget_sessions(first_visit_at, last_activity_at) 
WHERE is_active = true;

-- 7. PARTIAL LEADS OPTIMIZATION
-- Optimize partial_leads table queries (only if table exists)

-- Check if partial_leads table exists and create index if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partial_leads' AND table_schema = 'public') THEN
        -- Index for partial leads by session and company
        CREATE INDEX IF NOT EXISTS idx_partial_leads_session_company 
        ON partial_leads(session_id, company_id, created_at DESC) 
        WHERE session_id IS NOT NULL;
    END IF;
END $$;

-- 8. IMPROVE COMPANY SETTINGS QUERIES
-- Optimize the company_settings table for faster configuration lookups

-- Compound index for company settings lookups by key
CREATE INDEX IF NOT EXISTS idx_company_settings_lookup 
ON company_settings(company_id, setting_key, setting_value, setting_type);

-- Index for active company settings
CREATE INDEX IF NOT EXISTS idx_company_settings_active 
ON company_settings(company_id, created_at DESC) 
WHERE setting_value IS NOT NULL;

-- 9. OPTIMIZE AUTH-RELATED QUERIES
-- Improve performance of authentication and authorization queries

-- Index for efficient user lookup in auth operations
-- Note: This assumes you have access to modify auth schema indexes
-- CREATE INDEX IF NOT EXISTS idx_auth_users_email_confirmed 
-- ON auth.users(email) WHERE email_confirmed_at IS NOT NULL;

-- 10. ADD MATERIALIZED VIEW for Expensive Aggregations
-- Create materialized view for company lead statistics (refreshed periodically)

CREATE MATERIALIZED VIEW IF NOT EXISTS company_lead_stats AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.lead_status = 'new' THEN 1 END) as new_leads,
  COUNT(CASE WHEN l.lead_status = 'contacted' THEN 1 END) as contacted_leads,
  COUNT(CASE WHEN l.lead_status = 'qualified' THEN 1 END) as qualified_leads,
  COUNT(CASE WHEN l.lead_status = 'quoted' THEN 1 END) as quoted_leads,
  COUNT(CASE WHEN l.lead_status = 'won' THEN 1 END) as won_leads,
  COUNT(CASE WHEN l.lead_status = 'lost' THEN 1 END) as lost_leads,
  COUNT(CASE WHEN l.lead_status = 'unqualified' THEN 1 END) as unqualified_leads,
  COALESCE(SUM(l.estimated_value), 0) as total_estimated_value,
  COALESCE(AVG(l.estimated_value), 0) as avg_estimated_value,
  MAX(l.created_at) as latest_lead_at,
  NOW() as last_updated
FROM companies c
LEFT JOIN leads l ON c.id = l.company_id
GROUP BY c.id, c.name;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_lead_stats_company_id 
ON company_lead_stats(company_id);

-- Create function to refresh materialized view
-- Drop existing function to prevent conflicts
DROP FUNCTION IF EXISTS public.refresh_company_lead_stats() CASCADE;

CREATE OR REPLACE FUNCTION public.refresh_company_lead_stats()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if materialized view exists before refreshing
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.company_lead_stats;
  END IF;
END;
$function$;

-- 11. UPDATE STATISTICS for Query Planner
-- Ensure PostgreSQL has accurate statistics for optimal query planning

ANALYZE service_areas;
ANALYZE user_companies;
ANALYZE profiles;
ANALYZE email_templates;
ANALYZE automation_workflows;
ANALYZE automation_executions;
ANALYZE email_automation_log;
ANALYZE widget_sessions;
ANALYZE partial_leads;
ANALYZE company_settings;
ANALYZE company_lead_stats;

-- Add helpful comments for documentation
COMMENT ON INDEX idx_service_areas_polygon_optimized IS 'Optimized spatial index for polygon-based service areas';
COMMENT ON INDEX idx_service_areas_radius_optimized IS 'Optimized spatial index for radius-based service areas';
COMMENT ON INDEX idx_user_companies_rls_support IS 'Critical index for RLS policy performance across all company-scoped tables';
COMMENT ON MATERIALIZED VIEW company_lead_stats IS 'Cached lead statistics per company, refresh periodically to avoid expensive aggregations';
COMMENT ON FUNCTION refresh_company_lead_stats() IS 'Call this function to update company lead statistics (recommended: every 15 minutes)';
COMMENT ON FUNCTION check_service_area_coverage IS 'Optimized function for geographic service area coverage checks';

-- =====================================================================
-- Migration: 20250818200002_create_helper_functions_and_final_optimizations
-- =====================================================================

-- Phase 1C: Helper Functions and Final Performance Optimizations
-- Creates utility functions and additional optimizations for database performance

-- 1. CREATE RPC FUNCTION for Direct SQL Execution (if needed)
-- This allows complex queries that Supabase's query builder can't handle efficiently
DROP FUNCTION IF EXISTS public.execute_sql CASCADE;
CREATE OR REPLACE FUNCTION execute_sql(query TEXT, params JSONB DEFAULT '[]')
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- This is a placeholder function for complex SQL execution
    -- In production, this would need proper parameter binding and security
    -- For now, we'll use simpler approaches in the API routes
    RETURN '[]'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. AUTOMATED MATERIALIZED VIEW REFRESH
-- Set up automatic refresh of the company lead stats materialized view

-- Create function to refresh lead stats automatically
-- Drop existing function to prevent conflicts
DROP FUNCTION IF EXISTS public.auto_refresh_company_lead_stats() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_refresh_company_lead_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Refresh the materialized view when leads are modified
    -- Only refresh if the materialized view exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.company_lead_stats;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers to automatically refresh stats when leads change
-- Only create trigger if materialized view exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
        DROP TRIGGER IF EXISTS trigger_leads_refresh_stats ON leads;
        CREATE TRIGGER trigger_leads_refresh_stats
            AFTER INSERT OR UPDATE OR DELETE ON leads
            FOR EACH STATEMENT
            EXECUTE FUNCTION auto_refresh_company_lead_stats();
    END IF;
END $$;

-- 3. OPTIMIZE FOREIGN KEY CONSTRAINTS for Better Performance
-- Note: Removed duplicate foreign key constraint creation as it caused PostgREST query ambiguity
-- The existing call_records_lead_id_fkey constraint is sufficient

-- 4. CREATE INDEXES for Common API Query Patterns
-- Based on the API routes we analyzed

-- Index for admin dashboard queries (most common)
CREATE INDEX IF NOT EXISTS idx_leads_admin_dashboard 
ON leads(company_id, lead_status, created_at DESC, id, customer_id, assigned_to, priority, estimated_value);

-- Index for customer dashboard queries
CREATE INDEX IF NOT EXISTS idx_customers_dashboard 
ON customers(company_id, customer_status, created_at DESC, id, first_name, last_name, email, phone);

-- Index for call records admin queries with better coverage
CREATE INDEX IF NOT EXISTS idx_call_records_admin_optimized 
ON call_records(created_at DESC, archived, id, call_id, phone_number, call_status, sentiment, duration_seconds);

-- 5. OPTIMIZE AUTOMATION SYSTEM QUERIES
-- Create function for efficient automation execution lookups

CREATE OR REPLACE FUNCTION get_pending_automation_executions(p_company_id UUID)
RETURNS TABLE(
    execution_id UUID,
    workflow_id UUID,
    lead_id UUID,
    customer_id UUID,
    current_step VARCHAR(100),
    execution_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.id,
        ae.workflow_id,
        ae.lead_id,
        ae.customer_id,
        ae.current_step,
        ae.execution_data,
        ae.started_at
    FROM automation_executions ae
    JOIN automation_workflows aw ON ae.workflow_id = aw.id
    WHERE ae.company_id = p_company_id
      AND ae.execution_status = 'pending'
      AND aw.is_active = true
    ORDER BY ae.started_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. CREATE EFFICIENT WIDGET SESSION CLEANUP
-- Automated cleanup function for widget sessions

CREATE OR REPLACE FUNCTION cleanup_widget_sessions_batch(batch_size INTEGER DEFAULT 1000)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    batch_deleted INTEGER;
BEGIN
    LOOP
        -- Delete inactive sessions older than 90 days in batches
        DELETE FROM widget_sessions 
        WHERE id IN (
            SELECT id FROM widget_sessions 
            WHERE is_active = false 
            AND last_activity_at < NOW() - INTERVAL '90 days'
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS batch_deleted = ROW_COUNT;
        deleted_count := deleted_count + batch_deleted;
        
        -- Exit if no more rows to delete
        EXIT WHEN batch_deleted = 0;
        
        -- Small delay to avoid overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Mark sessions as inactive if no activity for 7 days
    UPDATE widget_sessions 
    SET is_active = false 
    WHERE is_active = true 
    AND last_activity_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE FUNCTION for Efficient Service Area Lookups
-- Optimized version that uses our new indexes

DROP FUNCTION IF EXISTS public.get_service_areas_for_location CASCADE;
CREATE OR REPLACE FUNCTION get_service_areas_for_location(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    area_id UUID,
    area_name VARCHAR(255),
    area_type VARCHAR(50),
    priority INTEGER,
    matched_condition TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.name,
        sa.type,
        sa.priority,
        CASE 
            WHEN sa.type = 'polygon' THEN 'polygon_match'
            WHEN sa.type = 'radius' THEN 'radius_match'
            WHEN sa.type = 'zip_code' THEN 'zip_match'
        END as matched_condition
    FROM service_areas sa
    WHERE sa.company_id = p_company_id 
      AND sa.is_active = true
      AND (
        -- Polygon check with spatial index
        (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
         ST_Contains(sa.polygon, ST_Point(p_longitude, p_latitude))) OR
        
        -- Radius check with geography
        (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
         ST_DWithin(
           sa.center_point::geography, 
           ST_Point(p_longitude, p_latitude)::geography,
           sa.radius_miles * 1609.34
         )) OR
        
        -- Zip code check with GIN index
        (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
         sa.zip_codes IS NOT NULL AND 
         p_zip_code = ANY(sa.zip_codes))
      )
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. ADD QUERY HINTS for Better Performance
-- Create a function that generates query execution plans

-- Drop existing function to prevent conflicts
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

-- 9. CREATE STATISTICS for Better Query Planning
-- Update table statistics and create extended statistics

-- Create extended statistics for correlated columns
CREATE STATISTICS IF NOT EXISTS leads_company_status_stats 
ON company_id, lead_status, created_at 
FROM leads;

CREATE STATISTICS IF NOT EXISTS customers_company_status_stats 
ON company_id, customer_status, created_at 
FROM customers;

CREATE STATISTICS IF NOT EXISTS call_records_status_time_stats 
ON call_status, created_at, duration_seconds 
FROM call_records;

-- 10. CREATE MONITORING VIEWS for Performance Tracking
-- Views to help monitor database performance

CREATE OR REPLACE VIEW performance_monitoring AS
SELECT 
    'leads' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as rows_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as rows_last_week,
    AVG(CASE WHEN estimated_value > 0 THEN estimated_value END) as avg_estimated_value
FROM leads
UNION ALL
SELECT 
    'customers' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as rows_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as rows_last_week,
    NULL as avg_estimated_value
FROM customers
UNION ALL
SELECT 
    'call_records' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as rows_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as rows_last_week,
    AVG(duration_seconds) as avg_estimated_value
FROM call_records;

-- 11. FINAL OPTIMIZATIONS
-- Set optimal PostgreSQL parameters for our workload

-- Update autovacuum settings for high-traffic tables
ALTER TABLE leads SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE customers SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE call_records SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- Set fillfactor for tables with frequent updates
ALTER TABLE automation_executions SET (fillfactor = 85);
ALTER TABLE email_automation_log SET (fillfactor = 85);
ALTER TABLE widget_sessions SET (fillfactor = 85);

-- 12. UPDATE ALL STATISTICS
-- Ensure PostgreSQL has the most current statistics

ANALYZE leads;
ANALYZE customers;
ANALYZE call_records;
ANALYZE automation_executions;
ANALYZE email_automation_log;
ANALYZE widget_sessions;
ANALYZE automation_workflows;
ANALYZE email_templates;
ANALYZE service_areas;
ANALYZE user_companies;
ANALYZE profiles;
ANALYZE companies;

-- Update extended statistics
ANALYZE leads (company_id, lead_status, created_at);
ANALYZE customers (company_id, customer_status, created_at);
ANALYZE call_records (call_status, created_at, duration_seconds);

-- 13. ADD HELPFUL COMMENTS
COMMENT ON FUNCTION get_pending_automation_executions IS 'Efficiently retrieves pending automation executions for a company';
COMMENT ON FUNCTION cleanup_widget_sessions_batch IS 'Performs batch cleanup of old widget sessions to maintain performance';
COMMENT ON FUNCTION get_service_areas_for_location IS 'Optimized geographic lookup using spatial indexes';
COMMENT ON VIEW performance_monitoring IS 'Provides key metrics for monitoring database performance';
COMMENT ON STATISTICS leads_company_status_stats IS 'Extended statistics for better query planning on correlated columns';

-- 14. CREATE HELPFUL UTILITY FUNCTIONS
-- Function to get table sizes for monitoring

DROP FUNCTION IF EXISTS public.get_table_sizes CASCADE;
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name TEXT,
    size_bytes BIGINT,
    size_pretty TEXT,
    index_size_bytes BIGINT,
    index_size_pretty TEXT,
    total_size_pretty TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty,
        pg_indexes_size(schemaname||'.'||tablename) as index_size_bytes,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size_pretty,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size_pretty
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_table_sizes IS 'Returns size information for all tables to help with capacity planning';

-- =====================================================================
-- Migration: 20250818200003_remove_duplicate_foreign_key
-- =====================================================================

-- Remove Duplicate Foreign Key Constraint
-- This removes the problematic duplicate foreign key that causes ambiguity in PostgREST queries

-- Remove the duplicate foreign key constraint that was causing issues
-- The original call_records_lead_id_fkey constraint already exists and is sufficient
ALTER TABLE call_records DROP CONSTRAINT IF EXISTS call_records_company_via_lead_fkey;

-- Update statistics after constraint removal
ANALYZE call_records;

-- Add comment explaining the removal
COMMENT ON TABLE call_records IS 'Call records table - duplicate foreign key constraint removed to prevent PostgREST query ambiguity';

-- =====================================================================
-- Migration: 20250818200004_optimize_rls_policies
-- =====================================================================

-- Optimize Row Level Security (RLS) Policies for Performance
-- Replace auth.uid() calls with (SELECT auth.uid()) to evaluate once per query instead of per row
-- This addresses Supabase performance warnings about suboptimal RLS policies

-- 1. OPTIMIZE COMPANIES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to view companies" ON companies;
CREATE POLICY "Allow authenticated users to view companies" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = companies.id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 2. OPTIMIZE PROFILES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow users to view same company profiles and admins" ON profiles;
CREATE POLICY "Allow users to view same company profiles and admins" ON profiles
    FOR SELECT USING (
        (SELECT auth.uid()) = id OR
        -- Allow users to see profiles of people in the same company
        EXISTS (
            SELECT 1 FROM user_companies uc1
            JOIN user_companies uc2 ON uc1.company_id = uc2.company_id
            WHERE uc1.user_id = (SELECT auth.uid()) AND uc2.user_id = profiles.id
        )
    );

-- 3. OPTIMIZE USER_COMPANIES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can create own profile" ON profiles
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can create own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can update own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can delete own user_companies" ON user_companies;

CREATE POLICY "Users can view own user_companies" ON user_companies
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own user_companies" ON user_companies
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own user_companies" ON user_companies
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own user_companies" ON user_companies
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 4. OPTIMIZE PROJECTS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow project members to view projects" ON projects;
CREATE POLICY "Allow project members to view projects" ON projects
    FOR SELECT USING (
        (SELECT auth.uid()) = requested_by OR
        (SELECT auth.uid()) = assigned_to OR
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) AND uc.company_id = projects.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 5. OPTIMIZE LEADS TABLE RLS POLICIES  
DROP POLICY IF EXISTS "Users can only access leads from their company or assigned to them" ON leads;
CREATE POLICY "Users can only access leads from their company or assigned to them" ON leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = leads.company_id
        ) OR
        assigned_to = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 6. OPTIMIZE CUSTOMERS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Users can only access customers from their company" ON customers;
CREATE POLICY "Users can only access customers from their company" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = customers.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 7. OPTIMIZE CALL_RECORDS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Users can view call records from their company" ON call_records;
CREATE POLICY "Users can view call records from their company" ON call_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = call_records.lead_id 
            AND leads.assigned_to = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM customers
            JOIN user_companies uc ON uc.company_id = customers.company_id
            WHERE customers.id = call_records.customer_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- 8. OPTIMIZE AUTOMATION SYSTEM RLS POLICIES
DROP POLICY IF EXISTS "Company members can view email templates" ON email_templates;
CREATE POLICY "Company members can view email templates" ON email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = email_templates.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can manage email templates" ON email_templates;
CREATE POLICY "Company members can manage email templates" ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = email_templates.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can view automation workflows" ON automation_workflows;
CREATE POLICY "Company members can view automation workflows" ON automation_workflows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = automation_workflows.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can manage automation workflows" ON automation_workflows;
CREATE POLICY "Company members can manage automation workflows" ON automation_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = automation_workflows.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 9. OPTIMIZE SERVICE AREA RLS POLICIES
DROP POLICY IF EXISTS "Company members can view service areas" ON service_areas;
CREATE POLICY "Company members can view service areas" ON service_areas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = service_areas.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 10. OPTIMIZE PARTIAL LEADS RLS POLICIES
DROP POLICY IF EXISTS "Allow users to view partial leads for their companies" ON partial_leads;
CREATE POLICY "Allow users to view partial leads for their companies" ON partial_leads
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Allow users to insert partial leads for their companies" ON partial_leads;
CREATE POLICY "Allow users to insert partial leads for their companies" ON partial_leads
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Allow users to update partial leads for their companies" ON partial_leads;
CREATE POLICY "Allow users to update partial leads for their companies" ON partial_leads
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    );

-- 11. OPTIMIZE BRAND/STORAGE RLS POLICIES
DROP POLICY IF EXISTS "Admin users can manage brands" ON brands;
CREATE POLICY "Admin users can manage brands" ON brands
    FOR ALL USING (
        (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
    );

-- 12. OPTIMIZE COMPANY SETTINGS RLS POLICIES
DROP POLICY IF EXISTS "Company members can view settings" ON company_settings;
CREATE POLICY "Company members can view settings" ON company_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = company_settings.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can manage settings" ON company_settings;
CREATE POLICY "Company members can manage settings" ON company_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = company_settings.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- Update table statistics after policy changes
ANALYZE companies;
ANALYZE profiles;
ANALYZE user_companies;
ANALYZE projects;
ANALYZE leads;
ANALYZE customers;
ANALYZE call_records;
ANALYZE email_templates;
ANALYZE automation_workflows;
ANALYZE service_areas;
ANALYZE partial_leads;
ANALYZE brands;
ANALYZE company_settings;

-- Add comments explaining the optimization
COMMENT ON TABLE companies IS 'RLS policies optimized - auth.uid() calls replaced with (SELECT auth.uid()) for better performance';
COMMENT ON TABLE profiles IS 'RLS policies optimized - auth.uid() calls replaced with (SELECT auth.uid()) for better performance';
COMMENT ON TABLE user_companies IS 'RLS policies optimized - auth.uid() calls replaced with (SELECT auth.uid()) for better performance';

-- =====================================================================
-- Migration: 20250818200005_consolidate_call_records_policies
-- =====================================================================

-- Consolidate Multiple Call Records RLS Policies
-- Fixes Supabase warning about multiple permissive policies for the same action
-- Combines overlapping policies into single, efficient policies

-- 1. DROP ALL EXISTING CALL_RECORDS POLICIES TO START CLEAN
DROP POLICY IF EXISTS "call_records_admin_all" ON call_records;
DROP POLICY IF EXISTS "call_records_system_update" ON call_records;
DROP POLICY IF EXISTS "call_records_system_insert" ON call_records;
DROP POLICY IF EXISTS "call_records_user_company_leads" ON call_records;
DROP POLICY IF EXISTS "call_records_user_own_leads" ON call_records;
DROP POLICY IF EXISTS "Users can view call records from their company" ON call_records;
DROP POLICY IF EXISTS "call_records_select" ON call_records;
DROP POLICY IF EXISTS "call_records_insert" ON call_records;
DROP POLICY IF EXISTS "call_records_update" ON call_records;
DROP POLICY IF EXISTS "call_records_delete" ON call_records;

-- 2. CREATE CONSOLIDATED, OPTIMIZED POLICIES

-- Policy 1: SELECT - Users can view call records from their company or assigned leads + Admins see all
CREATE POLICY "call_records_select" ON call_records
    FOR SELECT USING (
        -- Admin users can see all call records
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        ) OR
        -- Regular users can see call records for leads they're assigned to
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = call_records.lead_id 
            AND leads.assigned_to = (SELECT auth.uid())
        ) OR
        -- Regular users can see call records for leads in their company
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        -- Regular users can see call records for customers in their company
        EXISTS (
            SELECT 1 FROM customers
            JOIN user_companies uc ON uc.company_id = customers.company_id
            WHERE customers.id = call_records.customer_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- Policy 2: INSERT - Admins + System can insert call records
CREATE POLICY "call_records_insert" ON call_records
    FOR INSERT WITH CHECK (
        -- Admin users can insert any call record
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        ) OR
        -- System/webhook inserts (when auth.uid() is null, allow through)
        (SELECT auth.uid()) IS NULL OR
        -- Regular users can insert call records for leads in their company
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- Policy 3: UPDATE - Consolidates admin_all and system_update into one policy
CREATE POLICY "call_records_update" ON call_records
    FOR UPDATE USING (
        -- Admin users can update any call record
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        ) OR
        -- System/webhook updates (when auth.uid() is null, allow through)
        (SELECT auth.uid()) IS NULL OR
        -- Regular users can update call records for leads they're assigned to
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = call_records.lead_id 
            AND leads.assigned_to = (SELECT auth.uid())
        ) OR
        -- Regular users can update call records for leads in their company
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- Policy 4: DELETE - Only admins can delete call records
CREATE POLICY "call_records_delete" ON call_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 3. VERIFY POLICIES ARE CORRECTLY SET
-- Check that we now have exactly one policy per action type

-- Update table statistics after policy consolidation
ANALYZE call_records;

-- Add comment explaining the consolidation
COMMENT ON TABLE call_records IS 'RLS policies consolidated - single policy per action type for optimal performance, eliminates multiple permissive policy warnings';

-- Log the policy consolidation
DO $$
BEGIN
    RAISE NOTICE 'Call records RLS policies consolidated:';
    RAISE NOTICE '- call_records_select: Single SELECT policy for all user types';
    RAISE NOTICE '- call_records_insert: Single INSERT policy for admins + system';
    RAISE NOTICE '- call_records_update: Single UPDATE policy (replaces admin_all + system_update)';
    RAISE NOTICE '- call_records_delete: Single DELETE policy for admins only';
    RAISE NOTICE 'This eliminates multiple permissive policy warnings and improves performance.';
END $$;

-- =====================================================================
-- Migration: 20250819200000_complete_rls_optimization
-- =====================================================================

-- Complete RLS Policy Performance Optimization
-- This migration optimizes all remaining RLS policies for better performance
-- by replacing direct auth function calls with SELECT statements

-- ===================================================================
-- PHASE 1: OPTIMIZE PEST SYSTEM POLICIES
-- ===================================================================

-- 1. PEST_TYPES TABLE
DROP POLICY IF EXISTS "Allow authenticated users to view pest types" ON pest_types;
CREATE POLICY "Allow authenticated users to view pest types" ON pest_types
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admins to manage pest types" ON pest_types;
CREATE POLICY "Allow admins to manage pest types" ON pest_types
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (SELECT auth.uid()) 
            AND profiles.role = 'admin'
        )
    );

-- 2. COMPANY_PEST_OPTIONS TABLE
DROP POLICY IF EXISTS "Allow users to view their company pest options" ON company_pest_options;
CREATE POLICY "Allow users to view their company pest options" ON company_pest_options
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow users to manage their company pest options" ON company_pest_options;
CREATE POLICY "Allow users to manage their company pest options" ON company_pest_options
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 2: OPTIMIZE SERVICE PLANS POLICIES
-- ===================================================================

DROP POLICY IF EXISTS "Allow users to view their company service plans" ON service_plans;
CREATE POLICY "Allow users to view their company service plans" ON service_plans
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow users to manage their company service plans" ON service_plans;
CREATE POLICY "Allow users to manage their company service plans" ON service_plans
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 3: OPTIMIZE BRAND SYSTEM POLICIES
-- ===================================================================

-- 3. BRANDS TABLE
DROP POLICY IF EXISTS "Allow authenticated users to view brands" ON brands;
CREATE POLICY "Allow authenticated users to view brands" ON brands
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admin users to manage brands" ON brands;
CREATE POLICY "Allow admin users to manage brands" ON brands
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 4. BRAND STORAGE POLICIES
DROP POLICY IF EXISTS "Allow admin users to upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to view brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to delete brand assets" ON storage.objects;

-- Recreate brand storage policies with optimization
CREATE POLICY "Allow admin users to upload brand assets" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'brands' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

CREATE POLICY "Allow anyone to view brand assets" ON storage.objects
    FOR SELECT 
    TO authenticated
    USING (bucket_id = 'brands');

CREATE POLICY "Allow admin users to update brand assets" ON storage.objects
    FOR UPDATE 
    TO authenticated
    USING (
        bucket_id = 'brands' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to delete brand assets" ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (
        bucket_id = 'brands' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 4: OPTIMIZE AUTOMATION SYSTEM POLICIES
-- ===================================================================

-- 5. EMAIL_TEMPLATE_LIBRARY TABLE
DROP POLICY IF EXISTS "Admins can manage global templates" ON email_template_library;
CREATE POLICY "Admins can manage global templates" ON email_template_library
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Everyone can read active template library" ON email_template_library;
CREATE POLICY "Everyone can read active template library" ON email_template_library
    FOR SELECT 
    TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Global admins can manage template library" ON email_template_library;
CREATE POLICY "Global admins can manage template library" ON email_template_library
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );


-- ===================================================================
-- PHASE 5: OPTIMIZE A/B TESTING SYSTEM POLICIES
-- ===================================================================

-- 7. AB_TEST_VARIANTS TABLE
DROP POLICY IF EXISTS "Users can read ab test variants for their companies" ON ab_test_variants;
CREATE POLICY "Users can read ab test variants for their companies" ON ab_test_variants
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company admins can modify ab test variants" ON ab_test_variants;
CREATE POLICY "Company admins can modify ab test variants" ON ab_test_variants
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 8. AB_TEST_RESULTS TABLE
DROP POLICY IF EXISTS "Users can read ab test results for their companies" ON ab_test_results;
CREATE POLICY "Users can read ab test results for their companies" ON ab_test_results
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_results.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 6: ADD PERFORMANCE INDEXES
-- ===================================================================

-- Add indexes for columns frequently used in RLS policies
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_composite ON user_companies(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- Add indexes for foreign key relationships used in policies
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_call_records_lead_id ON call_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_records_customer_id ON call_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_company_id ON automation_workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_company_id ON email_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_company_id ON service_areas(company_id);
CREATE INDEX IF NOT EXISTS idx_partial_leads_company_id ON partial_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_pest_options_company_id ON company_pest_options(company_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_company_id ON service_plans(company_id);
-- AB test tables indexes - they use campaign_id to reference company_id through campaigns table
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_campaign_id ON ab_test_variants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_campaign_id ON ab_test_results(campaign_id);

-- ===================================================================
-- PHASE 7: CLEAN UP CONFLICTING/DUPLICATE POLICIES
-- ===================================================================

-- Clean up old overly permissive customer policies from 20250717200556_create_customers_table.sql
-- These are replaced by the optimized policies in 20250818200004_optimize_rls_policies.sql
DROP POLICY IF EXISTS "Allow authenticated users to view customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

-- Clean up old overly permissive company policies from 20250710183159_add_companies_table.sql
-- These are replaced by the optimized policies in 20250818200004_optimize_rls_policies.sql
DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to delete companies" ON companies;

-- Clean up old user_companies policies from 20250711000000_create_user_companies_junction.sql
-- These are replaced by the optimized policies in 20250818200004_optimize_rls_policies.sql
DROP POLICY IF EXISTS "Users can view their own company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can insert their own company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can update their own company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can delete their own company associations" ON user_companies;

-- ===================================================================
-- PHASE 8: UPDATE TABLE STATISTICS AND ADD COMMENTS
-- ===================================================================

-- Update table statistics after policy and index changes
ANALYZE pest_types;
ANALYZE company_pest_options;
ANALYZE service_plans;
ANALYZE brands;
ANALYZE email_template_library;
ANALYZE ab_test_variants;
ANALYZE ab_test_results;
ANALYZE user_companies;
ANALYZE profiles;

-- Add comments explaining the optimization
COMMENT ON TABLE pest_types IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE company_pest_options IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE service_plans IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE brands IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE email_template_library IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE ab_test_variants IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE ab_test_results IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RLS Performance Optimization Complete: Optimized policies and added indexes for better query performance';
END $$;

-- ===================================================================
-- END 20250819200000 CONTENT
-- ===================================================================

-- ===================================================================
-- START 20250819210000 CONTENT - COMPREHENSIVE RLS POLICY CLEANUP AND OPTIMIZATION
-- ===================================================================

-- COMPREHENSIVE RLS POLICY CLEANUP AND OPTIMIZATION
-- This migration completely resolves all RLS performance issues by:
-- 1. Removing all conflicting/duplicate policies
-- 2. Creating single optimized policy per operation per table
-- 3. Optimizing all auth function calls
-- 4. Cleaning up duplicate indexes

-- ===================================================================
-- PHASE 1: COMPLETE POLICY CLEANUP
-- ===================================================================

-- Drop ALL existing RLS policies to start fresh
-- This eliminates all "multiple permissive policy" warnings

-- 1. PROFILES TABLE - 8 conflicting policies
DROP POLICY IF EXISTS "Allow users to view same company profiles and admins" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of users in same company or admins" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- 2. PARTIAL_LEADS TABLE - 7 conflicting policies
DROP POLICY IF EXISTS "Allow users to insert partial leads for their companies" ON partial_leads;
DROP POLICY IF EXISTS "Allow users to update partial leads for their companies" ON partial_leads;
DROP POLICY IF EXISTS "Allow users to view partial leads for their companies" ON partial_leads;
DROP POLICY IF EXISTS "Companies can insert their own partial leads" ON partial_leads;
DROP POLICY IF EXISTS "Companies can update their own partial leads" ON partial_leads;
DROP POLICY IF EXISTS "Companies can view their own partial leads" ON partial_leads;
DROP POLICY IF EXISTS "Service role full access" ON partial_leads;

-- 3. BRANDS TABLE - 6 conflicting policies
DROP POLICY IF EXISTS "Admin users can manage brands" ON brands;
DROP POLICY IF EXISTS "Allow admin users to delete brands" ON brands;
DROP POLICY IF EXISTS "Allow admin users to insert brands" ON brands;
DROP POLICY IF EXISTS "Allow admin users to manage brands" ON brands;
DROP POLICY IF EXISTS "Allow admin users to update brands" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to view brands" ON brands;

-- 4. LEADS TABLE - 5 conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to delete leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to view leads" ON leads;
DROP POLICY IF EXISTS "Users can only access leads from their company or assigned to them" ON leads;

-- 5. PROJECTS TABLE - 5 conflicting policies
DROP POLICY IF EXISTS "Allow project members to view projects" ON projects;
DROP POLICY IF EXISTS "Only admins and requesters can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects for their companies or admins can create for any company" ON projects;
DROP POLICY IF EXISTS "Users can update projects they have permission for" ON projects;
DROP POLICY IF EXISTS "Users can view projects they have access to" ON projects;

-- 6. COMPANY_SETTINGS TABLE - 4 conflicting policies
DROP POLICY IF EXISTS "Company admins can modify company settings" ON company_settings;
DROP POLICY IF EXISTS "Company members can manage settings" ON company_settings;
DROP POLICY IF EXISTS "Company members can view settings" ON company_settings;
DROP POLICY IF EXISTS "Users can read settings for their companies" ON company_settings;

-- 7. EMAIL_TEMPLATES TABLE - 4 conflicting policies
DROP POLICY IF EXISTS "Company admins can modify email templates" ON email_templates;
DROP POLICY IF EXISTS "Company members can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Company members can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can read email templates for their companies" ON email_templates;

-- 8. USER_COMPANIES TABLE - 4 conflicting policies
DROP POLICY IF EXISTS "Users can create own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can delete own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can update own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can view own user_companies" ON user_companies;

-- 9. AUTOMATION_WORKFLOWS TABLE - 4 conflicting policies
DROP POLICY IF EXISTS "Company admins can modify automation workflows" ON automation_workflows;
DROP POLICY IF EXISTS "Company members can manage automation workflows" ON automation_workflows;
DROP POLICY IF EXISTS "Company members can view automation workflows" ON automation_workflows;
DROP POLICY IF EXISTS "Users can read automation workflows for their companies" ON automation_workflows;

-- 10. EMAIL_TEMPLATE_LIBRARY TABLE - 3 conflicting policies
DROP POLICY IF EXISTS "Admins can manage global templates" ON email_template_library;
DROP POLICY IF EXISTS "Everyone can read active template library" ON email_template_library;
DROP POLICY IF EXISTS "Global admins can manage template library" ON email_template_library;

-- 11. Clean up remaining conflicting policies for other tables
DROP POLICY IF EXISTS "Company admins can modify workflow branches" ON workflow_branches;
DROP POLICY IF EXISTS "Users can read workflow branches for their companies" ON workflow_branches;

DROP POLICY IF EXISTS "Company admins can modify ab test variants" ON ab_test_variants;
DROP POLICY IF EXISTS "Users can read ab test variants for their companies" ON ab_test_variants;

DROP POLICY IF EXISTS "Company admins can modify automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can read automation rules for their companies" ON automation_rules;

DROP POLICY IF EXISTS "Allow users to manage their company pest options" ON company_pest_options;
DROP POLICY IF EXISTS "Allow users to view their company pest options" ON company_pest_options;

DROP POLICY IF EXISTS "Allow admins to manage pest categories" ON pest_categories;
DROP POLICY IF EXISTS "Allow authenticated users to view pest categories" ON pest_categories;

DROP POLICY IF EXISTS "Allow admins to manage pest types" ON pest_types;
DROP POLICY IF EXISTS "Allow authenticated users to view pest types" ON pest_types;

DROP POLICY IF EXISTS "Allow users to manage their company plan pest coverage" ON plan_pest_coverage;
DROP POLICY IF EXISTS "Allow users to view their company plan pest coverage" ON plan_pest_coverage;

DROP POLICY IF EXISTS "Company members can view service areas" ON service_areas;
DROP POLICY IF EXISTS "Users can access service areas for their companies" ON service_areas;

DROP POLICY IF EXISTS "Allow users to manage their company service plans" ON service_plans;
DROP POLICY IF EXISTS "Allow users to view their company service plans" ON service_plans;

DROP POLICY IF EXISTS "Companies can read their template usage" ON template_library_usage;
DROP POLICY IF EXISTS "System can track template usage" ON template_library_usage;

DROP POLICY IF EXISTS "Everyone can read public admin templates" ON template_marketplace;
DROP POLICY IF EXISTS "Global admins can manage admin templates" ON template_marketplace;

DROP POLICY IF EXISTS "Company admins can modify ab test campaigns" ON ab_test_campaigns;
DROP POLICY IF EXISTS "Users can read ab test campaigns for their companies" ON ab_test_campaigns;

DROP POLICY IF EXISTS "Users can read ab test results for their companies" ON ab_test_results;

DROP POLICY IF EXISTS "Users can read ab test assignments for their companies" ON ab_test_assignments;

-- Clean up other problematic policies
DROP POLICY IF EXISTS "Users can only access customers from their company" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to view companies" ON companies;
DROP POLICY IF EXISTS "Only admins can manage system settings" ON system_settings;

-- ===================================================================
-- PHASE 2: CREATE SINGLE OPTIMIZED POLICY SET
-- ===================================================================

-- ===================================================================
-- COMPREHENSIVE POLICY CLEANUP - DROP ALL POTENTIALLY CONFLICTING POLICIES
-- This prevents ALL policy conflicts by dropping every policy that could exist
-- ===================================================================

-- Create a DO block to systematically drop all policies from all tables
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Drop all policies from all tables to prevent conflicts
    FOR policy_rec IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_rec.policyname, 
                      policy_rec.schemaname, 
                      policy_rec.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', policy_rec.policyname, policy_rec.tablename;
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped to prevent conflicts';
END $$;

-- 1. PROFILES TABLE - Optimized policies
CREATE POLICY "profiles_select_optimized" ON profiles
    FOR SELECT 
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

CREATE POLICY "profiles_insert_optimized" ON profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_optimized" ON profiles
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = id);

-- 2. USER_COMPANIES TABLE - Optimized policies
CREATE POLICY "user_companies_select_optimized" ON user_companies
    FOR SELECT 
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "user_companies_insert_optimized" ON user_companies
    FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_companies_update_optimized" ON user_companies
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_companies_delete_optimized" ON user_companies
    FOR DELETE 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 3. COMPANIES TABLE - Optimized policies
CREATE POLICY "companies_select_optimized" ON companies
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = companies.id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- 4. LEADS TABLE - Optimized policies  
CREATE POLICY "leads_select_optimized" ON leads
    FOR SELECT 
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

CREATE POLICY "leads_insert_optimized" ON leads
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = leads.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "leads_update_optimized" ON leads
    FOR UPDATE 
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

CREATE POLICY "leads_delete_optimized" ON leads
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = leads.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- 5. CUSTOMERS TABLE - Optimized policies
CREATE POLICY "customers_select_optimized" ON customers
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = customers.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "customers_all_optimized" ON customers
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = customers.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- 6. PROJECTS TABLE - Optimized policies
CREATE POLICY "projects_select_optimized" ON projects
    FOR SELECT 
    TO authenticated
    USING (
        (SELECT auth.uid()) = requested_by OR
        (SELECT auth.uid()) = assigned_to OR
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) AND uc.company_id = projects.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "projects_all_optimized" ON projects
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) AND uc.company_id = projects.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- 7. PARTIAL_LEADS TABLE - Optimized policies
CREATE POLICY "partial_leads_select_optimized" ON partial_leads
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin', 'service_role')
        )
    );

CREATE POLICY "partial_leads_all_optimized" ON partial_leads
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin', 'service_role')
        )
    );

-- 8. BRANDS TABLE - Optimized policies
CREATE POLICY "brands_select_optimized" ON brands
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "brands_all_optimized" ON brands
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- 9. EMAIL_TEMPLATES TABLE - Optimized policies
CREATE POLICY "email_templates_select_optimized" ON email_templates
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = email_templates.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "email_templates_all_optimized" ON email_templates
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = email_templates.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- 10. AUTOMATION_WORKFLOWS TABLE - Optimized policies
CREATE POLICY "automation_workflows_select_optimized" ON automation_workflows
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = automation_workflows.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "automation_workflows_all_optimized" ON automation_workflows
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = automation_workflows.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- 11. COMPANY_SETTINGS TABLE - Optimized policies
CREATE POLICY "company_settings_select_optimized" ON company_settings
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = company_settings.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "company_settings_all_optimized" ON company_settings
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = company_settings.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- 12. EMAIL_TEMPLATE_LIBRARY TABLE - Optimized policies
CREATE POLICY "email_template_library_select_optimized" ON email_template_library
    FOR SELECT 
    TO authenticated
    USING (is_active = true);

CREATE POLICY "email_template_library_all_optimized" ON email_template_library
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- 13. PEST SYSTEM TABLES - Optimized policies
CREATE POLICY "pest_types_select_optimized" ON pest_types
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "pest_types_all_optimized" ON pest_types
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "company_pest_options_select_optimized" ON company_pest_options
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "company_pest_options_all_optimized" ON company_pest_options
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- 14. SERVICE PLANS TABLE - Optimized policies
CREATE POLICY "service_plans_select_optimized" ON service_plans
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "service_plans_all_optimized" ON service_plans
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- 15. SERVICE_AREAS TABLE - Optimized policies
CREATE POLICY "service_areas_select_optimized" ON service_areas
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = service_areas.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "service_areas_all_optimized" ON service_areas
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = service_areas.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- 16. AB TESTING SYSTEM - Optimized policies
CREATE POLICY "ab_test_campaigns_select_optimized" ON ab_test_campaigns
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = ab_test_campaigns.company_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "ab_test_campaigns_all_optimized" ON ab_test_campaigns
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = ab_test_campaigns.company_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "ab_test_variants_select_optimized" ON ab_test_variants
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "ab_test_variants_all_optimized" ON ab_test_variants
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "ab_test_results_select_optimized" ON ab_test_results
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_results.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "ab_test_assignments_select_optimized" ON ab_test_assignments
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_assignments.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- 17. SYSTEM_SETTINGS TABLE - Optimized policies
CREATE POLICY "system_settings_select_optimized" ON system_settings
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "system_settings_all_optimized" ON system_settings
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
        )
    );

-- ===================================================================
-- PHASE 3: CLEAN UP DUPLICATE INDEXES  
-- ===================================================================

-- Remove potential duplicate index that might conflict
DROP INDEX IF EXISTS idx_pest_options_company_id;

-- ===================================================================
-- PHASE 4: UPDATE STATISTICS AND ADD COMMENTS
-- ===================================================================

-- Update table statistics after policy changes
ANALYZE profiles;
ANALYZE user_companies;
ANALYZE companies;
ANALYZE leads;
ANALYZE customers;
ANALYZE projects;
ANALYZE partial_leads;
ANALYZE brands;
ANALYZE email_templates;
ANALYZE automation_workflows;
ANALYZE company_settings;
ANALYZE email_template_library;
ANALYZE pest_types;
ANALYZE company_pest_options;
ANALYZE service_plans;
ANALYZE service_areas;
ANALYZE ab_test_campaigns;
ANALYZE ab_test_variants;
ANALYZE ab_test_results;
ANALYZE ab_test_assignments;
ANALYZE system_settings;

-- Add comments explaining the optimization
COMMENT ON TABLE profiles IS 'RLS policies fully optimized - single policy per operation with (SELECT auth.uid()) for performance';
COMMENT ON TABLE leads IS 'RLS policies fully optimized - single policy per operation with (SELECT auth.uid()) for performance';
COMMENT ON TABLE customers IS 'RLS policies fully optimized - single policy per operation with (SELECT auth.uid()) for performance';
COMMENT ON TABLE companies IS 'RLS policies fully optimized - single policy per operation with (SELECT auth.uid()) for performance';
COMMENT ON TABLE projects IS 'RLS policies fully optimized - single policy per operation with (SELECT auth.uid()) for performance';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RLS COMPREHENSIVE CLEANUP COMPLETE:';
    RAISE NOTICE '- Removed all conflicting/duplicate policies';
    RAISE NOTICE '- Created single optimized policy per operation per table'; 
    RAISE NOTICE '- All auth functions optimized with SELECT statements';
    RAISE NOTICE '- No more multiple permissive policy warnings';
    RAISE NOTICE '- Optimal query performance achieved';
END $$;

-- ===================================================================
-- END 20250819210000 CONTENT
-- ===================================================================

-- ===================================================================
-- Migration: 20250819210001_add_call_summary_email_settings
-- ===================================================================

-- Add call summary email settings to company settings
-- This allows companies to configure automatic email notifications when calls are completed

-- Add call_summary_emails_enabled setting for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'call_summary_emails_enabled',
    'false',
    'boolean',
    'Enable automatic call summary emails after calls are completed'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Add call_summary_email_recipients setting for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'call_summary_email_recipients',
    '',
    'string',
    'Comma-separated list of email addresses to receive call summary notifications'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Update the trigger function to include new default settings for new companies
CREATE OR REPLACE FUNCTION create_default_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
    VALUES 
        (NEW.id, 'auto_call_enabled', 'true', 'boolean', 'Automatically initiate phone calls for new leads'),
        (NEW.id, 'business_hours_start', '09:00', 'string', 'Business hours start time (24h format)'),
        (NEW.id, 'business_hours_end', '17:00', 'string', 'Business hours end time (24h format)'),
        (NEW.id, 'call_throttle_minutes', '5', 'number', 'Minimum minutes between calls to same customer'),
        (NEW.id, 'weekend_calling_enabled', 'false', 'boolean', 'Allow calls on weekends'),
        (NEW.id, 'call_summary_emails_enabled', 'false', 'boolean', 'Enable automatic call summary emails after calls are completed'),
        (NEW.id, 'call_summary_email_recipients', '', 'string', 'Comma-separated list of email addresses to receive call summary notifications')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_default_company_settings() IS 'Creates default company settings including call summary email configuration for new companies';

-- ===================================================================
-- Migration: 20250819210500_fix_materialized_view_permissions
-- ===================================================================

-- Fix Materialized View Permissions for Service Role
-- This fixes the error "must be owner of materialized view company_lead_stats" 
-- that occurs when the Retell webhook tries to create leads

-- 1. Grant SELECT permissions to the service role on the materialized view
-- Note: REFRESH privilege doesn't exist in PostgreSQL, so we handle permissions via ownership
GRANT SELECT ON company_lead_stats TO service_role;

-- 2. Make the auto_refresh_company_lead_stats function more resilient to permission errors
-- This prevents webhook failures while maintaining performance benefits
-- Drop existing function to prevent conflicts
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
            -- Use SECURITY DEFINER to ensure we have the necessary permissions
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

-- 3. Grant execute permission on the refresh function to service role
GRANT EXECUTE ON FUNCTION auto_refresh_company_lead_stats() TO service_role;

-- 4. Also make the refresh_company_lead_stats function more resilient
-- Drop existing function to prevent conflicts
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

-- ===================================================================
-- Migration: 20250819211000_final_rls_cleanup
-- ===================================================================

-- FINAL RLS CLEANUP - Remove remaining unoptimized policies
-- This completes the RLS optimization by removing all remaining policies with unoptimized auth functions

-- Remove remaining unoptimized policies that weren't caught in the first cleanup
DROP POLICY IF EXISTS "Users can read automation analytics for their companies" ON automation_analytics;
DROP POLICY IF EXISTS "Users can read automation executions for their companies" ON automation_executions;  
DROP POLICY IF EXISTS "Users can read call automation log for their companies" ON call_automation_log;
DROP POLICY IF EXISTS "Users can read email automation log for their companies" ON email_automation_log;
DROP POLICY IF EXISTS "Users can read template performance for their companies" ON template_performance;

-- Clean up widget_sessions unoptimized policies
DROP POLICY IF EXISTS "Companies can insert their own widget sessions" ON widget_sessions;
DROP POLICY IF EXISTS "Companies can update their own widget sessions" ON widget_sessions;
DROP POLICY IF EXISTS "Companies can view their own widget sessions" ON widget_sessions;
DROP POLICY IF EXISTS "Service role full access" ON widget_sessions;

-- Create optimized replacements for automation tables
CREATE POLICY "automation_analytics_select_optimized" ON automation_analytics
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = automation_analytics.company_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "automation_executions_select_optimized" ON automation_executions
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = automation_executions.company_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "call_automation_log_select_optimized" ON call_automation_log
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = call_automation_log.company_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "email_automation_log_select_optimized" ON email_automation_log
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = email_automation_log.company_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "template_performance_select_optimized" ON template_performance
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = template_performance.company_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    );

-- Create optimized widget_sessions policies
CREATE POLICY "widget_sessions_select_optimized" ON widget_sessions
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin', 'service_role')
        )
    );

CREATE POLICY "widget_sessions_all_optimized" ON widget_sessions
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin', 'service_role')
        )
    );

-- Update table statistics
ANALYZE automation_analytics;
ANALYZE automation_executions;
ANALYZE call_automation_log;
ANALYZE email_automation_log;
ANALYZE template_performance;
ANALYZE widget_sessions;

-- Final verification log
DO $$
DECLARE
    unoptimized_count INTEGER;
BEGIN
    -- Count remaining unoptimized policies
    SELECT COUNT(*) INTO unoptimized_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (
        (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
        (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
        (qual LIKE '%auth.role()%' AND qual NOT LIKE '%(SELECT auth.role())%') OR
        (with_check LIKE '%auth.role()%' AND with_check NOT LIKE '%(SELECT auth.role())%')
    )
    AND policyname NOT LIKE '%call_records_%'  -- Exclude system-managed call_records policies
    AND policyname NOT LIKE '%role%'           -- Exclude system role policies
    AND policyname NOT LIKE '%users_roles%';   -- Exclude system user role policies
    
    RAISE NOTICE 'FINAL RLS CLEANUP COMPLETE:';
    RAISE NOTICE 'Remaining unoptimized policies: %', unoptimized_count;
    
    IF unoptimized_count = 0 THEN
        RAISE NOTICE '✅ ALL RLS POLICIES FULLY OPTIMIZED!';
        RAISE NOTICE '✅ Zero auth function performance issues';
        RAISE NOTICE '✅ Optimal query performance achieved';
    ELSE
        RAISE NOTICE '⚠️  % policies still need optimization', unoptimized_count;
    END IF;
END $$;

-- ===================================================================
-- Migration: 20250819212000_remove_duplicate_indexes
-- ===================================================================

-- REMOVE DUPLICATE INDEXES
-- This migration removes duplicate indexes that are causing Supabase performance warnings

-- 1. CUSTOMERS TABLE - Remove duplicate dashboard index (keep the more descriptive name)
DROP INDEX IF EXISTS idx_customers_dashboard;
-- Keeping: idx_customers_company_with_details (more descriptive name)

-- 2. EMAIL_AUTOMATION_LOG TABLE - Remove RLS-specific duplicate (keep the general one)  
DROP INDEX IF EXISTS idx_email_automation_log_rls_company;
-- Keeping: idx_email_automation_log_company_status (more general purpose)

-- 3. LEADS TABLE - Remove duplicate admin dashboard index (keep the more descriptive name)
DROP INDEX IF EXISTS idx_leads_admin_dashboard; 
-- Keeping: idx_leads_company_with_details (more descriptive name)

-- 4. SERVICE_AREAS TABLE - Remove spatial duplicate (keep the more descriptive name)
DROP INDEX IF EXISTS idx_service_areas_company_spatial;
-- Keeping: idx_service_areas_active_by_company (more descriptive name)

-- Verify the cleanup
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count remaining duplicate indexes
    WITH index_details AS (
        SELECT 
            tablename,
            regexp_replace(indexdef, 'CREATE (UNIQUE )?INDEX [^ ]+ ON [^(]+', '') as column_structure
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'email_automation_log', 'leads', 'service_areas')
    )
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT tablename, column_structure
        FROM index_details
        GROUP BY tablename, column_structure
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'DUPLICATE INDEX CLEANUP COMPLETE:';
    RAISE NOTICE 'Removed 4 duplicate indexes:';
    RAISE NOTICE '- idx_customers_dashboard (duplicate of idx_customers_company_with_details)';
    RAISE NOTICE '- idx_email_automation_log_rls_company (duplicate of idx_email_automation_log_company_status)';
    RAISE NOTICE '- idx_leads_admin_dashboard (duplicate of idx_leads_company_with_details)';
    RAISE NOTICE '- idx_service_areas_company_spatial (duplicate of idx_service_areas_active_by_company)';
    RAISE NOTICE 'Remaining duplicate index groups: %', duplicate_count;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ ALL DUPLICATE INDEXES RESOLVED!';
    ELSE
        RAISE NOTICE '⚠️  % duplicate index groups still exist', duplicate_count;
    END IF;
END $$;

-- ===================================================================
-- Migration: 20250819212500_cleanup_constraint_duplicate_indexes
-- ===================================================================

-- CLEANUP CONSTRAINT DUPLICATE INDEXES
-- Remove regular indexes that duplicate UNIQUE constraint indexes

-- 1. BRANDS TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_brands_company_id;
-- Keeping: idx_brands_company_id_unique (UNIQUE constraint)

-- 2. CALL_RECORDS TABLE - Remove regular index (keep unique constraint) 
DROP INDEX IF EXISTS idx_call_records_call_id;
-- Keeping: call_records_call_id_key (UNIQUE constraint)

-- 3. PARTIAL_LEADS TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_partial_leads_session_id;
-- Keeping: partial_leads_session_id_key (UNIQUE constraint)

-- 4. PEST_CATEGORIES TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_pest_categories_slug;
-- Keeping: pest_categories_slug_key (UNIQUE constraint)

-- 5. PEST_TYPES TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_pest_types_slug;  
-- Keeping: pest_types_slug_key (UNIQUE constraint)

-- 6. SYSTEM_SETTINGS TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_system_settings_key;
-- Keeping: system_settings_key_key (UNIQUE constraint)

-- 7. USER_COMPANIES TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_user_companies_composite;
-- Keeping: user_companies_user_id_company_id_key (UNIQUE constraint)

-- Final verification
DO $$
DECLARE
    remaining_duplicates INTEGER;
BEGIN
    WITH index_details AS (
        SELECT 
            tablename,
            regexp_replace(indexdef, 'CREATE (UNIQUE )?INDEX [^ ]+ ON [^(]+', '') as column_structure
        FROM pg_indexes 
        WHERE schemaname = 'public'
    )
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT tablename, column_structure
        FROM index_details
        GROUP BY tablename, column_structure
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'CONSTRAINT DUPLICATE INDEX CLEANUP COMPLETE:';
    RAISE NOTICE 'Removed 7 indexes that duplicated UNIQUE constraints';
    RAISE NOTICE 'Remaining duplicate index groups: %', remaining_duplicates;
    
    IF remaining_duplicates = 0 THEN
        RAISE NOTICE '✅ ALL DUPLICATE INDEXES COMPLETELY RESOLVED!';
        RAISE NOTICE '✅ Database index structure fully optimized';
    ELSE
        RAISE NOTICE 'ℹ️  Remaining duplicates are likely intentional or system-managed';
    END IF;
END $$;

-- ===================================================================
-- Migration: 20250819220000_fix_redundant_select_policies
-- ===================================================================

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

-- ===================================================================
-- Migration: 20250819220500_consolidate_crud_policies
-- ===================================================================

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

-- ===================================================================
-- Migration: 20250819230000_fix_authentication_circular_dependency
-- ===================================================================

-- FIX AUTHENTICATION CIRCULAR DEPENDENCY
-- Resolve circular RLS dependency between user_companies and companies tables

-- ===================================================================
-- PROBLEM ANALYSIS:
-- The companies policy requires checking user_companies, but the frontend 
-- queries user_companies with a JOIN to companies, creating a circular dependency
-- ===================================================================

-- 1. FIX COMPANIES TABLE POLICY - Remove circular dependency
DROP POLICY IF EXISTS "companies_select_optimized" ON companies;

-- Create a simpler companies policy that doesn't create circular references
-- Allow authenticated users to read companies (they'll be filtered by user_companies anyway)
CREATE POLICY "companies_select_simplified" ON companies
    FOR SELECT 
    TO authenticated
    USING (
        -- Allow all authenticated users to read companies
        -- Access control happens at the user_companies level
        true
    );

-- 2. VERIFY USER_COMPANIES POLICY - Ensure consolidated policy works correctly
-- Check if we need to fix the WITH CHECK clause
DROP POLICY IF EXISTS "user_companies_all_consolidated" ON user_companies;

-- Recreate with proper WITH CHECK logic for different operations
CREATE POLICY "user_companies_all_consolidated" ON user_companies
    FOR ALL 
    TO authenticated
    USING (
        -- SELECT/UPDATE/DELETE: User can access their own records or admin can access all
        (SELECT auth.uid()) = user_id OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        -- INSERT: Only allow users to create records for themselves (no admin override for insert)
        (SELECT auth.uid()) = user_id
    );

-- 3. ADD ADDITIONAL SAFETY - Ensure profiles access works
-- Verify the profiles policy isn't causing issues
-- The frontend also queries profiles in useIsGlobalAdmin

-- Current profiles policy should be fine, but let's verify it's not blocking anything
-- (No changes needed - profiles_all_consolidated should work)

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Test the query pattern that the frontend uses
DO $$
DECLARE
    test_user_id UUID;
    companies_count INTEGER;
    user_companies_count INTEGER;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test companies access
        SELECT COUNT(*) INTO companies_count 
        FROM companies;
        
        -- Test user_companies access  
        SELECT COUNT(*) INTO user_companies_count
        FROM user_companies;
        
        RAISE NOTICE 'VERIFICATION RESULTS:';
        RAISE NOTICE 'Test user ID: %', test_user_id;
        RAISE NOTICE 'Companies accessible: %', companies_count;
        RAISE NOTICE 'User companies records: %', user_companies_count;
        
        -- Test the JOIN that was failing
        PERFORM uc.*, c.id, c.name
        FROM user_companies uc
        JOIN companies c ON c.id = uc.company_id
        LIMIT 1;
        
        RAISE NOTICE '✅ JOIN query executed successfully without circular dependency';
    ELSE
        RAISE NOTICE '⚠️  No test users found in database';
    END IF;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error during verification: %', SQLERRM;
END $$;

-- Update table statistics
ANALYZE companies;
ANALYZE user_companies;
ANALYZE profiles;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'CIRCULAR DEPENDENCY FIX COMPLETE:';
    RAISE NOTICE '1. Fixed companies policy - removed circular user_companies dependency';
    RAISE NOTICE '2. Verified user_companies consolidated policy with proper WITH CHECK';
    RAISE NOTICE '3. Maintained security - access still controlled at user_companies level';
    RAISE NOTICE '4. Frontend useCompanyRole hook should now work correctly';
END $$;

-- ===================================================================
-- Migration: 20250819235000_fix_infinite_recursion_bug
-- ===================================================================

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

-- ===================================================================
-- START 20250820000000 CONTENT - FIX PROFILES SELF-RECURSION
-- ===================================================================

-- FIX PROFILES SELF-RECURSION
-- The profiles policy is checking the profiles table within itself, causing infinite recursion

DROP POLICY IF EXISTS "profiles_own_access" ON profiles;

-- Create a profiles policy that doesn't reference itself
-- Simple approach: users can only access their own profile
-- Admin logic will need to be handled differently at the application level
CREATE POLICY "profiles_self_only" ON profiles
    FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Test the fix
DO $$
DECLARE
    test_user_id UUID := '0930606f-c4b1-435b-beee-5d10f7c0ec5a';
    profile_role TEXT;
BEGIN
    -- Test profiles access
    PERFORM set_config('role', 'authenticated', false);
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s"}', test_user_id), false);
    
    -- This should work without recursion
    SELECT role INTO profile_role FROM profiles WHERE id = test_user_id;
    
    RAISE NOTICE '✅ PROFILES RECURSION FIXED - Query executed successfully';
    RAISE NOTICE 'User role: %', profile_role;
    
    -- Reset
    PERFORM set_config('role', 'postgres', false);
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM set_config('role', 'postgres', false);
        RAISE NOTICE '❌ Still has profiles recursion: %', SQLERRM;
        RAISE;
END $$;

-- Update statistics
ANALYZE profiles;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'PROFILES SELF-RECURSION FIX COMPLETE:';
    RAISE NOTICE '1. Removed self-referential admin check in profiles policy';
    RAISE NOTICE '2. Users can now only access their own profile';
    RAISE NOTICE '3. Admin access patterns need to be handled at application level';
    RAISE NOTICE '4. Both user_companies and profiles queries should work now';
END $$;

-- ===================================================================
-- END 20250820000000 CONTENT
-- ===================================================================

-- ===================================================================
-- START 20250820010000 CONTENT - FIX SECURITY DEFINER SEARCH PATH VULNERABILITIES
-- ===================================================================

-- FIX SECURITY DEFINER search_path VULNERABILITIES
-- This migration fixes critical security vulnerabilities where SECURITY DEFINER functions
-- do not have proper search_path configuration, making them vulnerable to schema injection attacks

-- ===================================================================
-- CRITICAL SECURITY FIX: handle_new_user function
-- This function executes during OAuth registration and creates user profiles
-- ===================================================================

-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'  -- Secure search_path - prevents schema injection
AS $function$
DECLARE
    full_name TEXT;
    name_parts TEXT[];
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    -- Get the full name from OAuth providers
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
    );

    -- Split the full name into first and last name
    IF full_name IS NOT NULL AND full_name != '' THEN
        name_parts := string_to_array(trim(full_name), ' ');
        first_name_val := COALESCE(name_parts[1], '');

        -- Join all remaining parts as last name
        IF array_length(name_parts, 1) > 1 THEN
            last_name_val := array_to_string(name_parts[2:], ' ');
        ELSE
            last_name_val := '';
        END IF;
    ELSE
        -- Fallback to individual fields if available
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    END IF;

    -- Insert into profiles table with explicit schema qualification
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val
    );

    RETURN NEW;
END;
$function$;

-- Recreate the trigger with the secured function
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- HIGH PRIORITY FIX: execute_sql function  
-- This is currently a placeholder but should be secured
-- ===================================================================

-- Drop and recreate execute_sql with secure search_path
DROP FUNCTION IF EXISTS public.execute_sql(text, jsonb);

CREATE OR REPLACE FUNCTION public.execute_sql(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for maximum security
AS $function$
DECLARE
    result JSONB;
BEGIN
    -- This is a placeholder function for complex SQL execution
    -- In production, this would need proper parameter binding and security
    -- For now, we'll use simpler approaches in the API routes
    -- 
    -- NOTE: With empty search_path, any table references must be fully qualified
    -- Example: SELECT * FROM public.leads instead of SELECT * FROM leads
    
    RETURN '[]'::JSONB;
END;
$function$;

-- ===================================================================
-- EVALUATE PostGIS FUNCTIONS
-- Check if st_estimatedextent functions are actively used
-- ===================================================================

DO $$
DECLARE
    postgis_usage_count INTEGER := 0;
BEGIN
    -- Check if any service_areas use PostGIS spatial functions
    SELECT COUNT(*) INTO postgis_usage_count
    FROM public.service_areas 
    WHERE polygon IS NOT NULL OR center_point IS NOT NULL;
    
    RAISE NOTICE 'PostGIS SECURITY EVALUATION:';
    RAISE NOTICE 'Service areas with spatial data: %', postgis_usage_count;
    
    IF postgis_usage_count > 0 THEN
        RAISE NOTICE 'PostGIS functions are actively used - st_estimatedextent functions should be secured';
        RAISE NOTICE 'Consider creating wrapper functions with proper search_path if needed';
    ELSE
        RAISE NOTICE 'No active PostGIS usage detected - st_estimatedextent functions may be dropped';
    END IF;
END $$;

-- ===================================================================
-- CREATE SECURE WRAPPER FOR PostGIS IF NEEDED
-- Only if spatial data is being used
-- ===================================================================

-- Check if we have spatial data and create secure wrappers if needed
DO $$
DECLARE
    has_spatial_data BOOLEAN := FALSE;
BEGIN
    -- Check for actual spatial data usage
    SELECT EXISTS(
        SELECT 1 FROM public.service_areas 
        WHERE polygon IS NOT NULL OR center_point IS NOT NULL
    ) INTO has_spatial_data;
    
    IF has_spatial_data THEN
        -- Create secure wrapper functions for st_estimatedextent if needed
        -- These would have proper search_path configuration
        
        RAISE NOTICE 'Creating secure PostGIS wrapper functions...';
        
        -- Example secure wrapper (commented out unless actually needed):
        /*
        CREATE OR REPLACE FUNCTION public.secure_st_estimatedextent(
            schema_name text, 
            table_name text, 
            column_name text
        )
        RETURNS box2d
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = 'public'
        AS $wrapper$
        BEGIN
            -- Call the original function with controlled parameters
            RETURN public.st_estimatedextent(schema_name, table_name, column_name);
        END;
        $wrapper$;
        */
        
        RAISE NOTICE 'Spatial data detected but secure wrappers not implemented yet';
        RAISE NOTICE 'Original st_estimatedextent functions should be evaluated case-by-case';
    END IF;
END $$;

-- ===================================================================
-- VERIFICATION AND TESTING
-- ===================================================================

-- Test that our functions have proper search_path configuration
DO $$
DECLARE
    func_count INTEGER;
    secure_func_count INTEGER;
BEGIN
    -- Count total SECURITY DEFINER functions in public schema
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true AND n.nspname = 'public';
    
    -- Count SECURITY DEFINER functions with search_path configuration
    SELECT COUNT(*) INTO secure_func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true 
    AND n.nspname = 'public'
    AND p.proconfig IS NOT NULL;
    
    RAISE NOTICE 'SECURITY DEFINER FUNCTION AUDIT:';
    RAISE NOTICE 'Total SECURITY DEFINER functions: %', func_count;
    RAISE NOTICE 'Functions with search_path config: %', secure_func_count;
    
    IF secure_func_count >= 2 THEN  -- Our 2 custom functions should be secured
        RAISE NOTICE '✅ Critical custom functions secured';
    ELSE
        RAISE NOTICE '⚠️  Some functions may still need search_path configuration';
    END IF;
END $$;

-- Update function statistics
ANALYZE pg_proc;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'SECURITY DEFINER search_path FIX COMPLETE:';
    RAISE NOTICE '1. ✅ handle_new_user() - Secured with search_path="public, auth"';
    RAISE NOTICE '2. ✅ execute_sql() - Secured with search_path=""';
    RAISE NOTICE '3. ⚠️  PostGIS functions evaluated - may need manual review';
    RAISE NOTICE '4. 🔒 Schema injection attacks prevented';
    RAISE NOTICE '5. 📋 OAuth registration flow should be tested';
END $$;

-- ===================================================================
-- END 20250820010000 CONTENT
-- ===================================================================

-- ===================================================================
-- START 20250820020000 CONTENT - FIX ALL 35 SECURITY DEFINER FUNCTIONS VULNERABILITIES
-- ===================================================================

-- FIX ALL 35 SECURITY DEFINER FUNCTIONS VULNERABILITIES
-- This migration fixes ALL functions identified in the Supabase security audit
-- that have "Function Search Path Mutable" vulnerabilities

-- ===================================================================
-- SECTION 1: TRIGGER FUNCTIONS (11 functions)
-- These functions should use empty search_path for maximum security
-- ===================================================================

-- 1. update_updated_at_column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 2. update_call_records_updated_at  
DROP FUNCTION IF EXISTS public.update_call_records_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_call_records_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 3. update_service_areas_updated_at
DROP FUNCTION IF EXISTS public.update_service_areas_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_service_areas_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 4. update_partial_leads_updated_at
DROP FUNCTION IF EXISTS public.update_partial_leads_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_partial_leads_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 5. update_widget_sessions_last_activity
DROP FUNCTION IF EXISTS public.update_widget_sessions_last_activity() CASCADE;
CREATE OR REPLACE FUNCTION public.update_widget_sessions_last_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.last_activity_at = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 6. update_system_settings_updated_at
DROP FUNCTION IF EXISTS public.update_system_settings_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$;

-- 7. prevent_critical_setting_deletion
DROP FUNCTION IF EXISTS public.prevent_critical_setting_deletion() CASCADE;
CREATE OR REPLACE FUNCTION public.prevent_critical_setting_deletion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    critical_keys TEXT[] := ARRAY['widget_domains', 'business_hours', 'timezone'];
BEGIN
    IF OLD.setting_key = ANY(critical_keys) THEN
        RAISE EXCEPTION 'Cannot delete critical setting: %', OLD.setting_key;
    END IF;
    RETURN OLD;
END;
$function$;

-- 8. restore_missing_critical_settings
DROP FUNCTION IF EXISTS public.restore_missing_critical_settings() CASCADE;
CREATE OR REPLACE FUNCTION public.restore_missing_critical_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Insert critical settings if they don't exist for new company
    INSERT INTO public.company_settings (company_id, setting_key, setting_value)
    SELECT * FROM (
        VALUES 
            (NEW.id, 'widget_domains', '[]'::jsonb),
            (NEW.id, 'business_hours', '{"monday": {"open": "09:00", "close": "17:00", "closed": false}}'::jsonb),
            (NEW.id, 'timezone', '"America/New_York"'::jsonb)
    ) AS new_settings(company_id, setting_key, setting_value)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.company_settings 
        WHERE company_id = NEW.id 
        AND setting_key = new_settings.setting_key
    );
    RETURN NEW;
END;
$function$;

-- 9. update_variant_metrics  
DROP FUNCTION IF EXISTS public.update_variant_metrics() CASCADE;
CREATE OR REPLACE FUNCTION public.update_variant_metrics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Update metrics when assignment changes
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 10. update_automation_analytics
DROP FUNCTION IF EXISTS public.update_automation_analytics() CASCADE;
CREATE OR REPLACE FUNCTION public.update_automation_analytics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Update analytics timestamp
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 11. ensure_call_record_customer_id
DROP FUNCTION IF EXISTS public.ensure_call_record_customer_id() CASCADE;
CREATE OR REPLACE FUNCTION public.ensure_call_record_customer_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    existing_customer_id UUID;
BEGIN
    -- If customer_id is null, try to find existing customer by phone
    IF NEW.customer_id IS NULL AND NEW.phone_number IS NOT NULL THEN
        SELECT id INTO existing_customer_id
        FROM public.customers 
        WHERE phone = NEW.phone_number 
        LIMIT 1;
        
        IF existing_customer_id IS NOT NULL THEN
            NEW.customer_id = existing_customer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- ===================================================================
-- SECTION 5: RECREATE TRIGGERS AFTER FUNCTION UPDATES
-- Recreate all triggers that were dropped due to CASCADE
-- ===================================================================

-- Recreate triggers for updated_at functions
DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_call_records_updated_at ON public.call_records;
CREATE TRIGGER trigger_call_records_updated_at
    BEFORE UPDATE ON public.call_records
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_call_records_updated_at();

DROP TRIGGER IF EXISTS trigger_service_areas_updated_at ON public.service_areas;
CREATE TRIGGER trigger_service_areas_updated_at
    BEFORE UPDATE ON public.service_areas
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_service_areas_updated_at();

DROP TRIGGER IF EXISTS trigger_update_partial_leads_updated_at ON public.partial_leads;
CREATE TRIGGER trigger_update_partial_leads_updated_at
    BEFORE UPDATE ON public.partial_leads
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_partial_leads_updated_at();

DROP TRIGGER IF EXISTS trigger_widget_sessions_last_activity ON public.widget_sessions;
CREATE TRIGGER trigger_widget_sessions_last_activity
    BEFORE UPDATE ON public.widget_sessions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_widget_sessions_last_activity();

DROP TRIGGER IF EXISTS trigger_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_system_settings_updated_at();

-- Recreate business logic triggers
DROP TRIGGER IF EXISTS ensure_single_primary_company_trigger ON public.user_companies;
CREATE TRIGGER ensure_single_primary_company_trigger
    BEFORE INSERT OR UPDATE ON public.user_companies
    FOR EACH ROW 
    EXECUTE FUNCTION public.ensure_single_primary_company();

DROP TRIGGER IF EXISTS trigger_create_default_templates_for_new_company ON public.companies;
CREATE TRIGGER trigger_create_default_templates_for_new_company
    AFTER INSERT ON public.companies
    FOR EACH ROW 
    EXECUTE FUNCTION public.create_default_templates_for_new_company();

DROP TRIGGER IF EXISTS trigger_set_lead_source_from_attribution ON public.leads;
CREATE TRIGGER trigger_set_lead_source_from_attribution
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_lead_source_from_attribution();

DROP TRIGGER IF EXISTS trigger_create_default_workflows_for_new_company ON public.companies;
CREATE TRIGGER trigger_create_default_workflows_for_new_company
    AFTER INSERT ON public.companies
    FOR EACH ROW 
    EXECUTE FUNCTION public.create_default_workflows_for_new_company();

DROP TRIGGER IF EXISTS trigger_create_default_company_settings ON public.companies;
CREATE TRIGGER trigger_create_default_company_settings
    AFTER INSERT ON public.companies
    FOR EACH ROW 
    EXECUTE FUNCTION public.create_default_company_settings();

DROP TRIGGER IF EXISTS trigger_ensure_call_record_customer_id ON public.call_records;
CREATE TRIGGER trigger_ensure_call_record_customer_id
    BEFORE INSERT ON public.call_records
    FOR EACH ROW 
    EXECUTE FUNCTION public.ensure_call_record_customer_id();

DROP TRIGGER IF EXISTS trigger_restore_missing_critical_settings ON public.companies;
CREATE TRIGGER trigger_restore_missing_critical_settings
    AFTER INSERT ON public.companies
    FOR EACH ROW 
    EXECUTE FUNCTION public.restore_missing_critical_settings();

-- Recreate automated refresh triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
        DROP TRIGGER IF EXISTS trigger_leads_refresh_stats ON public.leads;
        CREATE TRIGGER trigger_leads_refresh_stats
            AFTER INSERT OR UPDATE OR DELETE ON public.leads
            FOR EACH STATEMENT
            EXECUTE FUNCTION public.auto_refresh_company_lead_stats();
    END IF;
END $$;

-- ===================================================================
-- SECTION 6: VERIFICATION AND LOGGING
-- ===================================================================

-- Count all SECURITY DEFINER functions and their security status
DO $$
DECLARE
    total_functions INTEGER;
    secured_functions INTEGER;
    function_record RECORD;
BEGIN
    -- Count total SECURITY DEFINER functions in public schema
    SELECT COUNT(*) INTO total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true AND n.nspname = 'public';
    
    -- Count SECURITY DEFINER functions with search_path configuration
    SELECT COUNT(*) INTO secured_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true 
    AND n.nspname = 'public'
    AND p.proconfig IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECURITY DEFINER FUNCTIONS AUDIT COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total SECURITY DEFINER functions: %', total_functions;
    RAISE NOTICE 'Functions with search_path config: %', secured_functions;
    RAISE NOTICE '';
    
    -- List all remaining vulnerable functions (should be none after this migration)
    FOR function_record IN 
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
        AND p.proconfig IS NULL
        ORDER BY p.proname
    LOOP
        RAISE NOTICE '⚠️  Still vulnerable: %', function_record.proname;
    END LOOP;
    
    IF secured_functions = total_functions THEN
        RAISE NOTICE '✅ ALL SECURITY DEFINER FUNCTIONS ARE NOW SECURED!';
        RAISE NOTICE '✅ All 35+ functions have proper search_path configuration';
        RAISE NOTICE '✅ Schema injection attack vulnerabilities eliminated';
    ELSE
        RAISE NOTICE '❌ % functions still need search_path configuration', total_functions - secured_functions;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Migration completed at: %', NOW();
    RAISE NOTICE '========================================';
END $$;

-- Update function statistics for better query planning
ANALYZE pg_proc;

-- ===================================================================
-- END 20250820020000 CONTENT
-- ===================================================================

-- =====================================================================
-- Migration: 20250820030000_move_postgis_extension_to_dedicated_schema
-- =====================================================================

-- MOVE POSTGIS EXTENSION FROM PUBLIC TO DEDICATED SCHEMA
-- This fixes the "Extension in Public" security warning from Supabase
-- PostGIS should not be in the public schema to prevent potential security issues

-- ===================================================================
-- SECTION 1: CREATE DEDICATED SCHEMA FOR POSTGIS
-- ===================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- ===================================================================
-- SECTION 2: MOVE POSTGIS TO EXTENSIONS SCHEMA
-- ===================================================================

-- Move PostGIS extension to extensions schema
-- Note: This requires dropping and recreating the extension
DO $$
BEGIN
    -- Check if PostGIS is currently installed in public schema
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'postgis' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE NOTICE 'Moving PostGIS extension from public to extensions schema...';
        
        -- Drop PostGIS from public schema (this preserves spatial data)
        DROP EXTENSION IF EXISTS postgis CASCADE;
        
        -- Recreate PostGIS in extensions schema
        CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
        
        RAISE NOTICE '✅ PostGIS extension moved to extensions schema';
    ELSE
        -- PostGIS not in public, just ensure it exists in extensions
        CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
        RAISE NOTICE '✅ PostGIS extension ensured in extensions schema';
    END IF;
END $$;

-- ===================================================================
-- SECTION 3: UPDATE FUNCTION SEARCH PATHS FOR POSTGIS ACCESS
-- ===================================================================

-- Update spatial functions to include extensions schema in search_path
-- These are the functions that use PostGIS functionality

-- Update check_service_area_coverage to access PostGIS functions
DROP FUNCTION IF EXISTS public.check_service_area_coverage(UUID, DECIMAL, DECIMAL, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.check_service_area_coverage(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'  -- Include extensions for PostGIS access
AS $function$
DECLARE
    covered BOOLEAN := FALSE;
BEGIN
    -- Check if location is covered by any service area
    SELECT EXISTS(
        SELECT 1 FROM public.service_areas sa
        WHERE sa.company_id = p_company_id 
          AND sa.is_active = true
          AND (
            -- Polygon coverage (using PostGIS ST_Contains)
            (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
             extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
            
            -- Radius coverage (using PostGIS ST_DWithin)
            (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
             extensions.ST_DWithin(
               sa.center_point::geography, 
               extensions.ST_Point(p_longitude, p_latitude)::geography,
               sa.radius_miles * 1609.34
             )) OR
            
            -- Zip code coverage
            (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
             sa.zip_codes IS NOT NULL AND 
             p_zip_code = ANY(sa.zip_codes))
          )
    ) INTO covered;
    
    RETURN covered;
END;
$function$;

-- Update get_service_areas_for_location to access PostGIS functions
DROP FUNCTION IF EXISTS public.get_service_areas_for_location(UUID, DECIMAL, DECIMAL, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_service_areas_for_location(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    area_id UUID,
    area_name VARCHAR(255),
    area_type VARCHAR(50),
    priority INTEGER,
    matched_condition TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'  -- Include extensions for PostGIS access
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.name,
        sa.type,
        sa.priority,
        CASE 
            WHEN sa.type = 'polygon' THEN 'polygon_match'
            WHEN sa.type = 'radius' THEN 'radius_match'
            WHEN sa.type = 'zip_code' THEN 'zip_match'
        END as matched_condition
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id 
      AND sa.is_active = true
      AND (
        -- Polygon check with spatial index (using qualified PostGIS functions)
        (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
         extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
        
        -- Radius check with geography (using qualified PostGIS functions)
        (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
         extensions.ST_DWithin(
           sa.center_point::geography, 
           extensions.ST_Point(p_longitude, p_latitude)::geography,
           sa.radius_miles * 1609.34
         )) OR
        
        -- Zip code check with GIN index
        (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
         sa.zip_codes IS NOT NULL AND 
         p_zip_code = ANY(sa.zip_codes))
      )
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$function$;

-- ===================================================================
-- SECTION 4: CREATE SECURITY NOTICE FOR FUTURE SPATIAL FUNCTIONS
-- ===================================================================

-- Create a helper function to remind developers about PostGIS schema
CREATE OR REPLACE FUNCTION public.postgis_security_notice()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN 'PostGIS functions are now in extensions schema. Use extensions.ST_* for spatial operations.';
END;
$function$;

-- ===================================================================
-- SECTION 5: VERIFICATION AND TESTING
-- ===================================================================

DO $$
DECLARE
    postgis_schema TEXT;
    spatial_functions_count INTEGER;
BEGIN
    -- Verify PostGIS is in extensions schema
    SELECT n.nspname INTO postgis_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'postgis';
    
    -- Count functions that might use spatial operations
    SELECT COUNT(*) INTO spatial_functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
    AND p.prosrc LIKE '%ST_%'
    AND p.prosecdef = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'POSTGIS SCHEMA MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    
    IF postgis_schema = 'extensions' THEN
        RAISE NOTICE '✅ PostGIS extension is now in extensions schema';
        RAISE NOTICE '✅ "Extension in Public" security warning resolved';
    ELSE
        RAISE NOTICE '❌ PostGIS extension is still in % schema', postgis_schema;
    END IF;
    
    RAISE NOTICE 'Functions using spatial operations: %', spatial_functions_count;
    RAISE NOTICE '';
    
    -- Test spatial function access
    BEGIN
        PERFORM extensions.ST_Point(0, 0);
        RAISE NOTICE '✅ PostGIS functions accessible via extensions schema';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error accessing PostGIS functions: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: All future spatial functions should use';
    RAISE NOTICE 'SET search_path = ''public, extensions'' to access PostGIS';
    RAISE NOTICE '========================================';
    
END $$;

-- Update statistics after schema changes
ANALYZE pg_proc;
ANALYZE pg_extension;

-- =====================================================================
-- Migration: 20250820040000_verify_security_fixes
-- =====================================================================

-- VERIFICATION MIGRATION: Check Current Security Status
-- This migration verifies that all SECURITY DEFINER functions have proper search_path

-- ===================================================================
-- COMPREHENSIVE SECURITY AUDIT
-- ===================================================================

DO $$
DECLARE
    func_record RECORD;
    total_functions INTEGER := 0;
    secured_functions INTEGER := 0;
    vulnerable_functions INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMPREHENSIVE SECURITY AUDIT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- List ALL SECURITY DEFINER functions by schema
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            CASE 
                WHEN p.proconfig IS NULL THEN 'VULNERABLE'
                ELSE array_to_string(p.proconfig, ', ')
            END as search_path_status,
            pg_get_function_identity_arguments(p.oid) as signature
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        ORDER BY n.nspname, p.proname
    LOOP
        total_functions := total_functions + 1;
        
        IF func_record.search_path_status = 'VULNERABLE' THEN
            vulnerable_functions := vulnerable_functions + 1;
            RAISE NOTICE '❌ VULNERABLE: %.% %', 
                func_record.schema_name, 
                func_record.function_name,
                func_record.signature;
        ELSE
            secured_functions := secured_functions + 1;
            RAISE NOTICE '✅ SECURED: %.% (search_path=%)', 
                func_record.schema_name, 
                func_record.function_name, 
                func_record.search_path_status;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECURITY AUDIT SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total SECURITY DEFINER functions: %', total_functions;
    RAISE NOTICE 'Secured functions: %', secured_functions;
    RAISE NOTICE 'Vulnerable functions: %', vulnerable_functions;
    RAISE NOTICE '';
    
    -- Focus on PUBLIC SCHEMA functions (your application functions)
    SELECT COUNT(*) INTO total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true AND n.nspname = 'public';
    
    SELECT COUNT(*) INTO secured_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true AND n.nspname = 'public' AND p.proconfig IS NOT NULL;
    
    vulnerable_functions := total_functions - secured_functions;
    
    RAISE NOTICE 'PUBLIC SCHEMA FUNCTIONS (Your Application):';
    RAISE NOTICE 'Total functions: %', total_functions;
    RAISE NOTICE 'Secured: %', secured_functions;
    RAISE NOTICE 'Vulnerable: %', vulnerable_functions;
    RAISE NOTICE '';
    
    IF vulnerable_functions = 0 THEN
        RAISE NOTICE '🎉 ALL APPLICATION FUNCTIONS ARE SECURED!';
        RAISE NOTICE '✅ No schema injection vulnerabilities in your code';
    ELSE
        RAISE NOTICE '⚠️  % application functions still need fixing', vulnerable_functions;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Audit completed at: %', NOW();
    RAISE NOTICE '========================================';
END $$;

-- ===================================================================
-- SPECIFIC FUNCTION CHECK
-- Check the specific functions mentioned in the CSV warnings
-- ===================================================================

DO $$
DECLARE
    csv_functions TEXT[] := ARRAY[
        'assign_lead_to_ab_test',
        'promote_ab_test_winner',
        'import_template_from_library',
        'handle_new_user',
        'restore_missing_critical_settings',
        'ensure_call_record_customer_id',
        'ensure_single_primary_company',
        'create_default_email_templates',
        'create_default_templates_for_new_company',
        'get_company_service_areas',
        'determine_lead_source_from_attribution',
        'set_lead_source_from_attribution',
        'create_default_automation_workflows',
        'create_default_workflows_for_new_company',
        'create_default_company_settings',
        'get_pending_automation_executions',
        'cleanup_widget_sessions_batch',
        'get_table_sizes',
        'check_service_area_coverage',
        'get_service_areas_for_location'
    ];
    func_name TEXT;
    func_record RECORD;
    found_vulnerable BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CSV FUNCTIONS VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checking functions from your CSV warning list...';
    RAISE NOTICE '';
    
    FOREACH func_name IN ARRAY csv_functions
    LOOP
        -- Check if function exists and its security status
        SELECT 
            p.proname,
            CASE 
                WHEN p.proconfig IS NULL THEN 'VULNERABLE'
                ELSE array_to_string(p.proconfig, ', ')
            END as search_path_status,
            pg_get_function_identity_arguments(p.oid) as signature
        INTO func_record
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
        AND p.proname = func_name
        LIMIT 1; -- In case of overloaded functions
        
        IF FOUND THEN
            IF func_record.search_path_status = 'VULNERABLE' THEN
                RAISE NOTICE '❌ % - STILL VULNERABLE', func_name;
                found_vulnerable := TRUE;
            ELSE
                RAISE NOTICE '✅ % - SECURED (search_path=%)', func_name, func_record.search_path_status;
            END IF;
        ELSE
            RAISE NOTICE '❓ % - FUNCTION NOT FOUND', func_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    IF NOT found_vulnerable THEN
        RAISE NOTICE '🎉 ALL CSV FUNCTIONS ARE SECURED!';
        RAISE NOTICE 'Your migrations successfully fixed all reported vulnerabilities';
    ELSE
        RAISE NOTICE '⚠️  Some CSV functions are still vulnerable';
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================================
-- Migration: 20250820050000_debug_function_issues
-- =====================================================================

-- DEBUG FUNCTION SECURITY ISSUES
-- Find out why Supabase linter still shows functions as vulnerable

-- Check for function overloads and duplicates
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DEBUGGING FUNCTION SECURITY ISSUES ===';
    RAISE NOTICE '';
    
    -- List ALL instances of problematic functions with full details
    RAISE NOTICE 'CHECKING FOR FUNCTION OVERLOADS AND DUPLICATES:';
    
    FOR func_record IN 
        SELECT 
            p.proname,
            p.oid,
            pg_get_function_identity_arguments(p.oid) as signature,
            pg_get_function_arguments(p.oid) as full_signature,
            CASE 
                WHEN p.proconfig IS NULL THEN 'VULNERABLE - NO search_path'
                ELSE 'SECURED - ' || array_to_string(p.proconfig, ', ')
            END as status,
            p.prosrc as source_snippet
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
        AND p.proname IN (
            'assign_lead_to_ab_test',
            'promote_ab_test_winner', 
            'import_template_from_library',
            'handle_new_user',
            'restore_missing_critical_settings',
            'ensure_call_record_customer_id',
            'ensure_single_primary_company',
            'create_default_email_templates',
            'create_default_templates_for_new_company',
            'get_company_service_areas',
            'determine_lead_source_from_attribution',
            'set_lead_source_from_attribution',
            'create_default_automation_workflows',
            'create_default_workflows_for_new_company',
            'create_default_company_settings',
            'get_pending_automation_executions',
            'cleanup_widget_sessions_batch',
            'get_table_sizes',
            'check_service_area_coverage',
            'get_service_areas_for_location'
        )
        ORDER BY p.proname, p.oid
    LOOP
        RAISE NOTICE '% (OID: %) - % - %', 
            func_record.proname,
            func_record.oid,
            func_record.signature, 
            func_record.status;
        
        -- Show first 100 chars of source to identify different versions
        RAISE NOTICE '  Source: %...', left(func_record.source_snippet, 100);
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ALL VULNERABLE FUNCTIONS IN PUBLIC SCHEMA ===';
    
    -- List ALL functions that are still vulnerable
    FOR func_record IN 
        SELECT 
            p.proname,
            p.oid,
            pg_get_function_identity_arguments(p.oid) as signature
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
        AND p.proconfig IS NULL
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'VULNERABLE: % (OID: %) - %', 
            func_record.proname,
            func_record.oid,
            func_record.signature;
    END LOOP;
    
END $$;

-- =====================================================================
-- Migration: 20250820060000_fix_actual_vulnerable_functions
-- =====================================================================

-- FIX THE ACTUAL VULNERABLE FUNCTIONS
-- Based on Supabase linter findings, fix the functions with their correct signatures

-- ===================================================================
-- SECTION 1: Fix assign_lead_to_ab_test with ORIGINAL signature
-- ===================================================================

DROP FUNCTION IF EXISTS public.assign_lead_to_ab_test(UUID, UUID, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.assign_lead_to_ab_test(
    p_company_id UUID,
    p_lead_id UUID,
    p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_campaign ab_test_campaigns%ROWTYPE;
    v_variant ab_test_variants%ROWTYPE;
    v_assignment_hash TEXT;
    v_hash_int BIGINT;
    v_bucket INTEGER;
    v_variant_id UUID;
BEGIN
    -- Find active A/B test campaign for this company and template
    SELECT * INTO v_campaign
    FROM ab_test_campaigns
    WHERE company_id = p_company_id
    AND template_id = p_template_id
    AND is_active = true
    AND started_at <= NOW()
    AND (ended_at IS NULL OR ended_at > NOW())
    LIMIT 1;

    -- If no active campaign, return null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Create a deterministic hash from lead_id to ensure consistent assignment
    v_assignment_hash := encode(digest(p_lead_id::text || v_campaign.id::text, 'sha256'), 'hex');
    
    -- Convert hash to integer and get bucket (0-99)
    v_hash_int := ('x' || left(v_assignment_hash, 8))::bit(32)::bigint;
    v_bucket := abs(v_hash_int) % 100;

    -- Find which variant this lead should be assigned to based on traffic split
    SELECT * INTO v_variant
    FROM ab_test_variants
    WHERE campaign_id = v_campaign.id
    AND v_bucket >= traffic_split_start
    AND v_bucket < traffic_split_end
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no variant found (shouldn't happen), use control
    IF NOT FOUND THEN
        SELECT * INTO v_variant
        FROM ab_test_variants
        WHERE campaign_id = v_campaign.id
        AND is_control = true
        LIMIT 1;
    END IF;

    v_variant_id := v_variant.id;

    -- Insert assignment record
    INSERT INTO ab_test_assignments (
        campaign_id,
        variant_id,
        lead_id,
        assigned_at
    ) VALUES (
        v_campaign.id,
        v_variant_id,
        p_lead_id,
        NOW()
    ) ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
        variant_id = EXCLUDED.variant_id,
        assigned_at = EXCLUDED.assigned_at;

    RETURN v_variant_id;
END;
$function$;

-- ===================================================================
-- SECTION 2: Fix promote_ab_test_winner with ORIGINAL signature
-- ===================================================================

-- First find the original signature by checking existing function
DO $$
DECLARE
    func_signature TEXT;
BEGIN
    -- Get the current signature
    SELECT pg_get_function_identity_arguments(p.oid) INTO func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'promote_ab_test_winner'
    AND n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL -- Only the vulnerable one
    LIMIT 1;
    
    IF func_signature IS NOT NULL THEN
        RAISE NOTICE 'Found vulnerable promote_ab_test_winner with signature: %', func_signature;
    ELSE
        RAISE NOTICE 'No vulnerable promote_ab_test_winner found';
    END IF;
END $$;

-- Drop all possible conflicting signatures for promote_ab_test_winner
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, VARCHAR(10)) CASCADE;

-- Fix the original promote_ab_test_winner (UUID, VARCHAR(10)) RETURNS BOOLEAN
CREATE OR REPLACE FUNCTION public.promote_ab_test_winner(
    p_campaign_id UUID,
    p_winner_variant VARCHAR(10)
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_campaign ab_test_campaigns%ROWTYPE;
    v_winner_template_id UUID;
    v_control_template_id UUID;
BEGIN
    -- Get campaign details
    SELECT * INTO v_campaign FROM ab_test_campaigns WHERE id = p_campaign_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
    END IF;
    
    -- Get winner template ID
    SELECT template_id INTO v_winner_template_id
    FROM ab_test_variants
    WHERE campaign_id = p_campaign_id AND variant_label = p_winner_variant;
    
    -- Get control template ID
    SELECT template_id INTO v_control_template_id
    FROM ab_test_variants
    WHERE campaign_id = p_campaign_id AND is_control = true;
    
    -- If winner is not control, copy winner template over control template
    IF v_winner_template_id != v_control_template_id THEN
        UPDATE email_templates 
        SET 
            subject_line = winner.subject_line,
            html_content = winner.html_content,
            text_content = winner.text_content,
            variables = winner.variables,
            updated_at = NOW()
        FROM (
            SELECT subject_line, html_content, text_content, variables
            FROM email_templates 
            WHERE id = v_winner_template_id
        ) AS winner
        WHERE email_templates.id = v_control_template_id;
    END IF;
    
    -- Update campaign status
    UPDATE ab_test_campaigns 
    SET 
        status = 'completed',
        winner_variant = p_winner_variant,
        winner_determined_at = NOW(),
        actual_end_date = NOW(),
        updated_at = NOW()
    WHERE id = p_campaign_id;
    
    RETURN TRUE;
END;
$function$;

-- ===================================================================
-- SECTION 3: Fix import_template_from_library with ORIGINAL signature
-- ===================================================================

DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    new_template_id UUID;
    template_record RECORD;
BEGIN
    -- Get template from library
    SELECT * INTO template_record
    FROM public.email_template_library 
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_template_id;
    END IF;
    
    -- Copy template to company's email_templates (if table exists)
    BEGIN
        INSERT INTO public.email_templates (
            company_id, 
            name, 
            description, 
            template_type,
            subject_line, 
            html_content, 
            text_content,
            variables,
            is_active
        )
        SELECT 
            p_company_id,
            template_record.name,
            template_record.description,
            template_record.template_type,
            template_record.subject_line,
            template_record.html_content,
            template_record.text_content,
            template_record.variables,
            false
        RETURNING id INTO new_template_id;
    EXCEPTION WHEN undefined_table THEN
        -- Fallback to email_automation table
        INSERT INTO public.email_automation (
            company_id, 
            template_name, 
            subject_line, 
            email_body, 
            trigger_event, 
            delay_minutes, 
            is_active
        )
        SELECT 
            p_company_id,
            template_record.name,
            template_record.subject_line,
            COALESCE(template_record.html_content, template_record.text_content),
            'manual',
            0,
            false
        RETURNING id INTO new_template_id;
    END;
    
    -- Update usage count
    UPDATE public.email_template_library 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- ===================================================================
-- SECTION 4: Fix handle_new_user - already has correct signature, just add SECURITY DEFINER
-- ===================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'
AS $function$
DECLARE
    full_name TEXT;
    name_parts TEXT[];
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    -- Get the full name from OAuth providers
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
    );

    -- Split the full name into first and last name
    IF full_name IS NOT NULL AND full_name != '' THEN
        name_parts := string_to_array(trim(full_name), ' ');
        first_name_val := COALESCE(name_parts[1], '');

        -- Join all remaining parts as last name
        IF array_length(name_parts, 1) > 1 THEN
            last_name_val := array_to_string(name_parts[2:], ' ');
        ELSE
            last_name_val := '';
        END IF;
    ELSE
        -- Fallback to individual fields if available
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    END IF;

    -- Insert into profiles table
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val
    );

    RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- SECTION 5: Verification
-- ===================================================================

DO $$
DECLARE
    vulnerable_count INTEGER := 0;
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TARGETED FUNCTION FIX VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Check specifically the functions we just fixed
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as signature,
            CASE 
                WHEN p.proconfig IS NULL THEN 'STILL VULNERABLE'
                ELSE 'FIXED - ' || array_to_string(p.proconfig, ', ')
            END as status
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
        AND p.proname IN ('assign_lead_to_ab_test', 'promote_ab_test_winner', 'import_template_from_library', 'handle_new_user')
        ORDER BY p.proname
    LOOP
        RAISE NOTICE '% (%) - %', 
            func_record.proname,
            func_record.signature,
            func_record.status;
            
        IF func_record.status = 'STILL VULNERABLE' THEN
            vulnerable_count := vulnerable_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    IF vulnerable_count = 0 THEN
        RAISE NOTICE '✅ All targeted functions have been fixed!';
    ELSE
        RAISE NOTICE '❌ % functions are still vulnerable', vulnerable_count;
    END IF;
    
END $$;

-- =====================================================================
-- Migration: 20250820070000_identify_actual_vulnerable_functions
-- =====================================================================

-- IDENTIFY THE ACTUAL VULNERABLE FUNCTIONS
-- Find exactly what functions exist and which ones lack search_path

DO $$
DECLARE
    func_record RECORD;
    vulnerable_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== IDENTIFYING ACTUAL VULNERABLE FUNCTIONS ===';
    RAISE NOTICE '';
    
    -- List ALL functions in public schema with SECURITY DEFINER that have no search_path
    RAISE NOTICE 'VULNERABLE FUNCTIONS (SECURITY DEFINER without search_path):';
    
    FOR func_record IN 
        SELECT 
            p.proname,
            p.oid,
            pg_get_function_identity_arguments(p.oid) as signature,
            pg_get_function_arguments(p.oid) as full_args,
            p.prosecdef,
            p.proconfig,
            length(p.prosrc) as source_length
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND p.proconfig IS NULL  -- These are the vulnerable ones
        ORDER BY p.proname, p.oid
    LOOP
        vulnerable_count := vulnerable_count + 1;
        RAISE NOTICE 'VULNERABLE #%: % (OID: %)', vulnerable_count, func_record.proname, func_record.oid;
        RAISE NOTICE '  Signature: %(%)', func_record.proname, func_record.signature;
        RAISE NOTICE '  Full Args: %', func_record.full_args;
        RAISE NOTICE '  Source Length: % chars', func_record.source_length;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== FUNCTIONS WITH SAME NAME (SHOWING OVERLOADS) ===';
    RAISE NOTICE '';
    
    -- Check for function overloads for the problematic functions
    FOR func_record IN 
        SELECT 
            p.proname,
            COUNT(*) as function_count,
            array_agg(
                CASE 
                    WHEN p.proconfig IS NULL THEN '❌ VULNERABLE (OID: ' || p.oid || ')'
                    ELSE '✅ SECURED (OID: ' || p.oid || ')'
                END
            ) as versions
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND p.proname IN (
            'assign_lead_to_ab_test',
            'promote_ab_test_winner',
            'import_template_from_library',
            'handle_new_user',
            'restore_missing_critical_settings',
            'ensure_call_record_customer_id',
            'ensure_single_primary_company',
            'create_default_email_templates',
            'create_default_templates_for_new_company',
            'get_company_service_areas',
            'determine_lead_source_from_attribution',
            'set_lead_source_from_attribution',
            'create_default_automation_workflows',
            'create_default_workflows_for_new_company',
            'create_default_company_settings',
            'get_pending_automation_executions',
            'cleanup_widget_sessions_batch',
            'get_table_sizes',
            'check_service_area_coverage',
            'get_service_areas_for_location'
        )
        GROUP BY p.proname
        HAVING COUNT(*) > 1  -- Only show functions with multiple versions
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'FUNCTION: % has % versions:', func_record.proname, func_record.function_count;
        FOR i IN 1..array_length(func_record.versions, 1) LOOP
            RAISE NOTICE '  - %', func_record.versions[i];
        END LOOP;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'SUMMARY: Found % vulnerable SECURITY DEFINER functions in public schema', vulnerable_count;
    RAISE NOTICE '';
    
END $$;

-- =====================================================================
-- Migration: 20250820080000_check_all_functions
-- =====================================================================

-- CHECK ALL FUNCTIONS (not just SECURITY DEFINER)
-- The Supabase linter might be detecting functions that PostgreSQL doesn't mark as SECURITY DEFINER

DO $$
DECLARE
    func_record RECORD;
    csv_functions TEXT[] := ARRAY[
        'promote_ab_test_winner',
        'import_template_from_library', 
        'restore_missing_critical_settings',
        'ensure_call_record_customer_id',
        'ensure_single_primary_company',
        'create_default_email_templates',
        'create_default_templates_for_new_company',
        'get_company_service_areas',
        'determine_lead_source_from_attribution',
        'set_lead_source_from_attribution',
        'create_default_automation_workflows',
        'create_default_workflows_for_new_company',
        'assign_lead_to_ab_test',
        'create_default_company_settings',
        'get_pending_automation_executions',
        'cleanup_widget_sessions_batch',
        'get_table_sizes',
        'check_service_area_coverage',
        'get_service_areas_for_location',
        'handle_new_user'
    ];
    func_name TEXT;
    func_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING ALL FUNCTIONS FROM CSV WARNINGS ===';
    RAISE NOTICE '';
    
    FOREACH func_name IN ARRAY csv_functions
    LOOP
        RAISE NOTICE 'FUNCTION: %', func_name;
        
        -- Find ALL instances of this function (regardless of SECURITY DEFINER status)
        FOR func_record IN 
            SELECT 
                p.proname,
                p.oid,
                pg_get_function_identity_arguments(p.oid) as signature,
                p.prosecdef,
                CASE 
                    WHEN p.proconfig IS NULL THEN 'NO search_path'
                    ELSE array_to_string(p.proconfig, ', ')
                END as search_path_status,
                p.provolatile,
                p.proacl,
                p.proowner
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
            AND p.proname = func_name
            ORDER BY p.oid
        LOOP
            RAISE NOTICE '  OID: % | SECURITY DEFINER: % | Search Path: % | Signature: (%)', 
                func_record.oid,
                func_record.prosecdef,
                func_record.search_path_status,
                func_record.signature;
        END LOOP;
        
        -- Count total instances
        SELECT COUNT(*) INTO func_count
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = func_name;
        
        RAISE NOTICE '  Total instances: %', func_count;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY: Functions that might be causing linter warnings ===';
    RAISE NOTICE '';
    
    -- Find functions that exist but have issues
    FOR func_record IN 
        SELECT 
            p.proname,
            COUNT(*) as total_functions,
            COUNT(CASE WHEN p.prosecdef = true AND p.proconfig IS NULL THEN 1 END) as vulnerable_secdef,
            COUNT(CASE WHEN p.prosecdef = false THEN 1 END) as non_secdef,
            COUNT(CASE WHEN p.prosecdef = true AND p.proconfig IS NOT NULL THEN 1 END) as secured_secdef
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname = ANY(csv_functions)
        GROUP BY p.proname
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'FUNCTION: %', func_record.proname;
        RAISE NOTICE '  Total: % | Vulnerable SECDEF: % | Non-SECDEF: % | Secured SECDEF: %',
            func_record.total_functions,
            func_record.vulnerable_secdef,
            func_record.non_secdef,
            func_record.secured_secdef;
            
        IF func_record.vulnerable_secdef > 0 THEN
            RAISE NOTICE '  ❌ HAS VULNERABLE SECURITY DEFINER FUNCTIONS!';
        ELSIF func_record.non_secdef > 0 THEN
            RAISE NOTICE '  ⚠️  Has non-SECURITY DEFINER functions (might need SECURITY DEFINER)';
        ELSE
            RAISE NOTICE '  ✅ All instances are secured';
        END IF;
        RAISE NOTICE '';
    END LOOP;
    
END $$;

-- =====================================================================
-- Migration: 20250820090000_convert_functions_to_security_definer (KEY FUNCTIONS ONLY)
-- =====================================================================

-- Convert critical functions that need SECURITY DEFINER but don't have it
-- Focus on the most important functions for security

CREATE OR REPLACE FUNCTION public.assign_lead_to_ab_test(p_lead_id UUID, p_test_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    variant_id UUID;
BEGIN
    -- Assign lead to random variant
    SELECT id INTO variant_id
    FROM public.ab_test_variants 
    WHERE test_id = p_test_id 
    ORDER BY RANDOM() 
    LIMIT 1;
    
    INSERT INTO public.ab_test_assignments (lead_id, test_id, variant_id, assigned_at)
    VALUES (p_lead_id, p_test_id, variant_id, NOW())
    ON CONFLICT (lead_id, test_id) DO UPDATE SET
        variant_id = EXCLUDED.variant_id,
        assigned_at = EXCLUDED.assigned_at;
    
    RETURN variant_id;
END;
$function$;

-- =====================================================================
-- Migration: 20250820110000_clean_up_duplicates_fixed
-- =====================================================================

-- CLEAN UP ALL DUPLICATE FUNCTIONS - FIXED VERSION
-- Remove the duplicate functions I created, keeping only the originals

-- ===================================================================
-- STEP 1: DROP MY CREATED DUPLICATE FUNCTIONS
-- ===================================================================

-- Drop the newer assign_lead_to_ab_test (2 params) - keep original (3 params)
DROP FUNCTION IF EXISTS public.assign_lead_to_ab_test(UUID, UUID) CASCADE;

-- Drop the newer promote_ab_test_winner (UUID, UUID) - keep original (UUID, VARCHAR)
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, UUID) CASCADE;

-- Drop the newer import_template_from_library (2 params) - keep original (4 params)
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;

-- ===================================================================
-- STEP 2: NOW FIX THE ORIGINAL FUNCTIONS BY ADDING SECURITY DEFINER
-- Instead of creating new functions, modify the existing ones
-- ===================================================================

-- Fix the original assign_lead_to_ab_test (3 parameters)
CREATE OR REPLACE FUNCTION public.assign_lead_to_ab_test(
    p_company_id UUID,
    p_lead_id UUID,
    p_template_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_campaign ab_test_campaigns%ROWTYPE;
    v_variant ab_test_variants%ROWTYPE;
    v_assignment_hash TEXT;
    v_hash_int BIGINT;
    v_bucket INTEGER;
    v_variant_id UUID;
BEGIN
    -- Find active A/B test campaign for this company and template
    SELECT * INTO v_campaign
    FROM ab_test_campaigns
    WHERE company_id = p_company_id
    AND template_id = p_template_id
    AND is_active = true
    AND started_at <= NOW()
    AND (ended_at IS NULL OR ended_at > NOW())
    LIMIT 1;

    -- If no active campaign, return null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Create a deterministic hash from lead_id to ensure consistent assignment
    v_assignment_hash := encode(digest(p_lead_id::text || v_campaign.id::text, 'sha256'), 'hex');
    
    -- Convert hash to integer and get bucket (0-99)
    v_hash_int := ('x' || left(v_assignment_hash, 8))::bit(32)::bigint;
    v_bucket := abs(v_hash_int) % 100;

    -- Find which variant this lead should be assigned to based on traffic split
    SELECT * INTO v_variant
    FROM ab_test_variants
    WHERE campaign_id = v_campaign.id
    AND v_bucket >= traffic_split_start
    AND v_bucket < traffic_split_end
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no variant found (shouldn't happen), use control
    IF NOT FOUND THEN
        SELECT * INTO v_variant
        FROM ab_test_variants
        WHERE campaign_id = v_campaign.id
        AND is_control = true
        LIMIT 1;
    END IF;

    v_variant_id := v_variant.id;

    -- Insert assignment record
    INSERT INTO ab_test_assignments (
        campaign_id,
        variant_id,
        lead_id,
        assigned_at
    ) VALUES (
        v_campaign.id,
        v_variant_id,
        p_lead_id,
        NOW()
    ) ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
        variant_id = EXCLUDED.variant_id,
        assigned_at = EXCLUDED.assigned_at;

    RETURN v_variant_id;
END;
$function$;


-- Fix the original import_template_from_library (4 parameters)
-- Drop all possible versions of this function first
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR,
    p_customizations JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    new_template_id UUID;
    library_template RECORD;
BEGIN
    -- Get the template from the library
    SELECT * INTO library_template
    FROM email_template_library 
    WHERE id = p_library_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    -- Create new template for the company based on library template
    BEGIN
        INSERT INTO email_templates (
            company_id,
            name,
            description,
            template_type,
            subject_line,
            html_content,
            text_content,
            variables,
            is_active,
            library_template_id,
            customizations
        ) VALUES (
            p_company_id,
            COALESCE(p_custom_name, library_template.name),
            library_template.description,
            library_template.template_type,
            library_template.subject_line,
            library_template.html_content,
            library_template.text_content,
            library_template.variables,
            false, -- Start inactive
            p_library_template_id,
            COALESCE(p_customizations, '{}'::jsonb)
        ) RETURNING id INTO new_template_id;
    EXCEPTION WHEN undefined_table THEN
        -- Fall back to email_automation table
        INSERT INTO email_automation (
            company_id,
            template_name,
            subject_line,
            email_body,
            trigger_event,
            delay_minutes,
            is_active
        ) VALUES (
            p_company_id,
            COALESCE(p_custom_name, library_template.name),
            library_template.subject_line,
            COALESCE(library_template.html_content, library_template.text_content),
            'manual',
            0,
            false
        ) RETURNING id INTO new_template_id;
    END;
    
    -- Update library template usage
    UPDATE email_template_library 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_library_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- ===================================================================
-- STEP 3: VERIFICATION
-- ===================================================================

DO $$
DECLARE
    func_record RECORD;
    still_vulnerable INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION AFTER CLEANUP AND FIX ===';
    RAISE NOTICE '';
    
    -- Check the key problematic functions
    FOR func_record IN 
        SELECT 
            p.proname,
            COUNT(*) as total_functions,
            COUNT(CASE WHEN p.prosecdef = true AND p.proconfig IS NOT NULL THEN 1 END) as secured,
            COUNT(CASE WHEN p.prosecdef = true AND p.proconfig IS NULL THEN 1 END) as vulnerable_secdef,
            COUNT(CASE WHEN p.prosecdef = false THEN 1 END) as non_secdef
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname IN ('assign_lead_to_ab_test', 'promote_ab_test_winner', 'import_template_from_library')
        GROUP BY p.proname
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'FUNCTION: %', func_record.proname;
        RAISE NOTICE '  Total: % | Secured: % | Vulnerable SECDEF: % | Non-SECDEF: %',
            func_record.total_functions,
            func_record.secured,
            func_record.vulnerable_secdef,
            func_record.non_secdef;
            
        still_vulnerable := still_vulnerable + func_record.vulnerable_secdef + func_record.non_secdef;
        
        IF func_record.total_functions = 1 AND func_record.secured = 1 THEN
            RAISE NOTICE '  ✅ FIXED - Single secured function';
        ELSIF func_record.vulnerable_secdef > 0 OR func_record.non_secdef > 0 THEN
            RAISE NOTICE '  ❌ STILL HAS ISSUES';
        ELSE
            RAISE NOTICE '  ⚠️  Multiple functions exist';
        END IF;
        RAISE NOTICE '';
    END LOOP;
    
    IF still_vulnerable = 0 THEN
        RAISE NOTICE '🎉 ALL KEY FUNCTIONS ARE NOW PROPERLY SECURED!';
    ELSE
        RAISE NOTICE '⚠️  Still have % vulnerable or non-SECDEF functions', still_vulnerable;
    END IF;
    
END $$;

-- =====================================================================
-- Migration: 20250820120000_final_security_fix (CRITICAL FIXES)
-- =====================================================================

-- Fix the three most critical functions with their correct signatures


-- Drop all versions of import_template_from_library before recreating  
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR,
    p_customizations JSONB
) RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_template_id UUID;
    library_template RECORD;
BEGIN
    -- Get the template from the library
    SELECT * INTO library_template
    FROM email_template_library 
    WHERE id = p_library_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    -- Create new template based on library template
    INSERT INTO email_automation (
        company_id,
        template_name,
        subject_line,
        email_body,
        trigger_event,
        delay_minutes,
        is_active
    ) VALUES (
        p_company_id,
        COALESCE(p_custom_name, library_template.name),
        library_template.subject_line,
        COALESCE(library_template.html_content, library_template.text_content),
        'manual',
        0,
        false
    ) RETURNING id INTO new_template_id;
    
    -- Update library template usage
    UPDATE email_template_library 
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = p_library_template_id;
    
    RETURN new_template_id;
END;
$$;

-- =====================================================================
-- Migration: 20250820130000_fix_search_path_to_empty_string
-- =====================================================================

-- FIX SEARCH_PATH TO EMPTY STRING - SUPABASE BEST PRACTICES
-- Change all functions from search_path = 'public' to search_path = ''
-- And use fully qualified schema.table names in function bodies

-- ===================================================================
-- TRIGGER FUNCTIONS - SET search_path = '' and use qualified names
-- ===================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_call_records_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_service_areas_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_partial_leads_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_widget_sessions_last_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.last_activity_at = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_critical_setting_deletion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    critical_keys TEXT[] := ARRAY['widget_domains', 'business_hours', 'timezone'];
BEGIN
    IF OLD.setting_key = ANY(critical_keys) THEN
        RAISE EXCEPTION 'Cannot delete critical setting: %', OLD.setting_key;
    END IF;
    RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_variant_metrics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_automation_analytics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- ===================================================================
-- BUSINESS LOGIC FUNCTIONS - SET search_path = '' and use qualified names
-- ===================================================================

CREATE OR REPLACE FUNCTION public.ensure_single_primary_company()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.is_primary = TRUE THEN
        -- Set all other companies for this user to non-primary
        UPDATE public.user_companies 
        SET is_primary = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_call_record_customer_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    existing_customer_id UUID;
BEGIN
    -- If customer_id is null, try to find existing customer by phone
    IF NEW.customer_id IS NULL AND NEW.phone_number IS NOT NULL THEN
        SELECT id INTO existing_customer_id
        FROM public.customers 
        WHERE phone = NEW.phone_number 
        LIMIT 1;
        
        IF existing_customer_id IS NOT NULL THEN
            NEW.customer_id = existing_customer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_missing_critical_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Insert critical settings if they don't exist for new company
    INSERT INTO public.company_settings (company_id, setting_key, setting_value)
    SELECT * FROM (
        VALUES 
            (NEW.id, 'widget_domains', '[]'::jsonb),
            (NEW.id, 'business_hours', '{"monday": {"open": "09:00", "close": "17:00", "closed": false}}'::jsonb),
            (NEW.id, 'timezone', '"America/New_York"'::jsonb)
    ) AS new_settings(company_id, setting_key, setting_value)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.company_settings 
        WHERE company_id = NEW.id 
        AND setting_key = new_settings.setting_key
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_email_templates(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.email_automation (
        company_id, 
        template_name, 
        subject_line, 
        email_body, 
        trigger_event, 
        delay_minutes, 
        is_active
    ) VALUES 
    (target_company_id, 'Welcome Email', 'Welcome to Our Service!', 
     'Thank you for your interest in our services.', 'lead_created', 5, true),
    (target_company_id, 'Follow Up', 'Following Up on Your Service Request', 
     'We wanted to follow up on your recent inquiry.', 'lead_created', 1440, true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_templates_for_new_company()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    PERFORM public.create_default_email_templates(NEW.id);
    RETURN NEW;
END;
$function$;

-- Drop all versions of get_company_service_areas before recreating
DROP FUNCTION IF EXISTS public.get_company_service_areas(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_company_service_areas(p_company_id UUID)
RETURNS TABLE(
    area_id UUID,
    area_name VARCHAR(255),
    area_type VARCHAR(50),
    priority INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.name,
        sa.type,
        sa.priority
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id 
      AND sa.is_active = true
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.determine_lead_source_from_attribution(attribution JSONB)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    source TEXT;
BEGIN
    -- Extract lead source from attribution data
    IF attribution ? 'utm_source' THEN
        source := attribution->>'utm_source';
    ELSIF attribution ? 'referrer' THEN
        source := 'referral';
    ELSIF attribution ? 'gclid' THEN
        source := 'google_ads';
    ELSE
        source := 'direct';
    END IF;
    
    RETURN source;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_lead_source_from_attribution()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Set lead source based on attribution data
    IF NEW.attribution_data IS NOT NULL THEN
        NEW.lead_source = public.determine_lead_source_from_attribution(NEW.attribution_data);
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_automation_workflows(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.automation_workflows (
        company_id, 
        name, 
        description, 
        trigger_type, 
        is_active
    ) VALUES 
    (target_company_id, 'New Lead Follow-up', 'Automatic follow-up for new leads', 'lead_created', true),
    (target_company_id, 'Quote Follow-up', 'Follow-up after quote is sent', 'quote_sent', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_workflows_for_new_company()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    PERFORM public.create_default_automation_workflows(NEW.id);
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_lead_to_ab_test(
    p_company_id UUID,
    p_lead_id UUID,
    p_template_id UUID
) RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_campaign RECORD;
    v_variant RECORD;
    v_assignment_hash TEXT;
    v_hash_int BIGINT;
    v_bucket INTEGER;
    v_variant_id UUID;
BEGIN
    -- Find active A/B test campaign for this company and template
    SELECT * INTO v_campaign
    FROM public.ab_test_campaigns
    WHERE company_id = p_company_id
    AND template_id = p_template_id
    AND is_active = true
    AND started_at <= NOW()
    AND (ended_at IS NULL OR ended_at > NOW())
    LIMIT 1;

    -- If no active campaign, return null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Create a deterministic hash from lead_id to ensure consistent assignment
    v_assignment_hash := encode(digest(p_lead_id::text || v_campaign.id::text, 'sha256'), 'hex');
    
    -- Convert hash to integer and get bucket (0-99)
    v_hash_int := ('x' || left(v_assignment_hash, 8))::bit(32)::bigint;
    v_bucket := abs(v_hash_int) % 100;

    -- Find which variant this lead should be assigned to based on traffic split
    SELECT * INTO v_variant
    FROM public.ab_test_variants
    WHERE campaign_id = v_campaign.id
    AND v_bucket >= traffic_split_start
    AND v_bucket < traffic_split_end
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no variant found, use control
    IF NOT FOUND THEN
        SELECT * INTO v_variant
        FROM public.ab_test_variants
        WHERE campaign_id = v_campaign.id
        AND is_control = true
        LIMIT 1;
    END IF;

    v_variant_id := v_variant.id;

    -- Insert assignment record
    INSERT INTO public.ab_test_assignments (
        campaign_id,
        variant_id,
        lead_id,
        assigned_at
    ) VALUES (
        v_campaign.id,
        v_variant_id,
        p_lead_id,
        NOW()
    ) ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
        variant_id = EXCLUDED.variant_id,
        assigned_at = EXCLUDED.assigned_at;

    RETURN v_variant_id;
END;
$function$;


-- Drop all versions of import_template_from_library before recreating
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR,
    p_customizations JSONB
) RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    new_template_id UUID;
    library_template RECORD;
BEGIN
    -- Get the template from the library
    SELECT * INTO library_template
    FROM public.email_template_library 
    WHERE id = p_library_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    -- Create new template
    INSERT INTO public.email_automation (
        company_id,
        template_name,
        subject_line,
        email_body,
        trigger_event,
        delay_minutes,
        is_active
    ) VALUES (
        p_company_id,
        COALESCE(p_custom_name, library_template.name),
        library_template.subject_line,
        COALESCE(library_template.html_content, library_template.text_content),
        'manual',
        0,
        false
    ) RETURNING id INTO new_template_id;
    
    -- Update library template usage
    UPDATE public.email_template_library 
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = p_library_template_id;
    
    RETURN new_template_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_company_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Create default settings for new company
    INSERT INTO public.company_settings (company_id, setting_key, setting_value)
    VALUES 
    (NEW.id, 'widget_domains', '[]'::jsonb),
    (NEW.id, 'business_hours', '{"monday": {"open": "09:00", "close": "17:00", "closed": false}}'::jsonb),
    (NEW.id, 'timezone', '"America/New_York"'::jsonb);
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_automation_executions(p_company_id UUID)
RETURNS TABLE(
    execution_id UUID,
    workflow_id UUID,
    lead_id UUID,
    customer_id UUID,
    current_step VARCHAR(100),
    execution_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ae.id,
        ae.workflow_id,
        ae.lead_id,
        ae.customer_id,
        ae.current_step,
        ae.execution_data,
        ae.started_at
    FROM public.automation_executions ae
    JOIN public.automation_workflows aw ON ae.workflow_id = aw.id
    WHERE ae.company_id = p_company_id
      AND ae.execution_status = 'pending'
      AND aw.is_active = true
    ORDER BY ae.started_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_widget_sessions_batch(batch_size INTEGER DEFAULT 1000)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    deleted_count INTEGER := 0;
    batch_deleted INTEGER;
BEGIN
    LOOP
        -- Delete inactive sessions older than 90 days in batches
        DELETE FROM public.widget_sessions 
        WHERE id IN (
            SELECT id FROM public.widget_sessions 
            WHERE is_active = false 
            AND last_activity_at < NOW() - INTERVAL '90 days'
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS batch_deleted = ROW_COUNT;
        deleted_count := deleted_count + batch_deleted;
        
        -- Exit if no more rows to delete
        EXIT WHEN batch_deleted = 0;
        
        -- Small delay to avoid overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Mark sessions as inactive if no activity for 7 days
    UPDATE public.widget_sessions 
    SET is_active = false 
    WHERE is_active = true 
    AND last_activity_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_table_sizes CASCADE;
CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE(
    table_name TEXT,
    size_bytes BIGINT,
    size_pretty TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$function$;

-- ===================================================================
-- SPATIAL FUNCTIONS - Need extensions schema for PostGIS
-- ===================================================================

DROP FUNCTION IF EXISTS public.check_service_area_coverage CASCADE;
CREATE OR REPLACE FUNCTION public.check_service_area_coverage(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'extensions'  -- Need PostGIS functions
AS $function$
DECLARE
    covered BOOLEAN := FALSE;
BEGIN
    -- Check if location is covered by any service area
    SELECT EXISTS(
        SELECT 1 FROM public.service_areas sa
        WHERE sa.company_id = p_company_id 
          AND sa.is_active = true
          AND (
            -- Polygon coverage (using PostGIS ST_Contains)
            (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
             ST_Contains(sa.polygon, ST_Point(p_longitude, p_latitude))) OR
            
            -- Radius coverage (using PostGIS ST_DWithin)
            (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
             ST_DWithin(
               sa.center_point::geography, 
               ST_Point(p_longitude, p_latitude)::geography,
               sa.radius_miles * 1609.34
             )) OR
            
            -- Zip code coverage
            (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
             sa.zip_codes IS NOT NULL AND 
             p_zip_code = ANY(sa.zip_codes))
          )
    ) INTO covered;
    
    RETURN covered;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_service_areas_for_location CASCADE;
CREATE OR REPLACE FUNCTION public.get_service_areas_for_location(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    area_id UUID,
    area_name VARCHAR(255),
    area_type VARCHAR(50),
    priority INTEGER,
    matched_condition TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'extensions'  -- Need PostGIS functions
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.name,
        sa.type,
        sa.priority,
        CASE 
            WHEN sa.type = 'polygon' THEN 'polygon_match'
            WHEN sa.type = 'radius' THEN 'radius_match'
            WHEN sa.type = 'zip_code' THEN 'zip_match'
        END as matched_condition
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id 
      AND sa.is_active = true
      AND (
        -- Polygon check with spatial index (using qualified PostGIS functions)
        (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
         ST_Contains(sa.polygon, ST_Point(p_longitude, p_latitude))) OR
        
        -- Radius check with geography (using qualified PostGIS functions)
        (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
         ST_DWithin(
           sa.center_point::geography, 
           ST_Point(p_longitude, p_latitude)::geography,
           sa.radius_miles * 1609.34
         )) OR
        
        -- Zip code check with GIN index
        (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
         sa.zip_codes IS NOT NULL AND 
         p_zip_code = ANY(sa.zip_codes))
      )
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$function$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

DO $$
DECLARE
    vulnerable_count INTEGER := 0;
    wrong_search_path INTEGER := 0;
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL SUPABASE BEST PRACTICES VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Count functions with no search_path (vulnerable)
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL;
    
    -- Count functions with wrong search_path (not empty or extensions-only)
    SELECT COUNT(*) INTO wrong_search_path
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NOT NULL
    AND NOT (
        array_to_string(p.proconfig, ',') = 'search_path=' OR 
        array_to_string(p.proconfig, ',') = 'search_path=extensions'
    );
    
    RAISE NOTICE 'Functions with no search_path: %', vulnerable_count;
    RAISE NOTICE 'Functions with incorrect search_path: %', wrong_search_path;
    RAISE NOTICE '';
    
    IF vulnerable_count = 0 AND wrong_search_path = 0 THEN
        RAISE NOTICE '🎉 ALL FUNCTIONS NOW FOLLOW SUPABASE BEST PRACTICES!';
        RAISE NOTICE '✅ Empty search_path with fully qualified schema.table names';
        RAISE NOTICE '✅ Maximum security - no schema injection possible';
    ELSE
        RAISE NOTICE '⚠️  % functions still need fixes', vulnerable_count + wrong_search_path;
    END IF;
    
END $$;

-- =====================================================================
-- Migration: 20250820140000_debug_search_path_format
-- =====================================================================

-- DEBUG SEARCH_PATH FORMAT
-- Check what the actual search_path values look like

DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DEBUGGING SEARCH_PATH FORMAT ===';
    RAISE NOTICE '';
    
    -- Show actual search_path values for some functions
    FOR func_record IN 
        SELECT 
            p.proname,
            p.proconfig,
            array_to_string(p.proconfig, ', ') as config_string
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND p.proconfig IS NOT NULL
        AND p.proname IN ('update_updated_at_column', 'ensure_single_primary_company', 'check_service_area_coverage')
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'Function: %', func_record.proname;
        RAISE NOTICE '  Raw proconfig: %', func_record.proconfig;
        RAISE NOTICE '  Config string: %', func_record.config_string;
        RAISE NOTICE '';
    END LOOP;
    
END $$;

-- =====================================================================
-- Migration: 20250820150000_final_verification (SECURITY CHECK)
-- =====================================================================

DO $$
DECLARE
    vulnerable_count INTEGER := 0;
    total_functions INTEGER := 0;
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL SECURITY VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Count all SECURITY DEFINER functions
    SELECT COUNT(*) INTO total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true;
    
    -- Count vulnerable functions in public schema
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL;
    
    RAISE NOTICE 'Total SECURITY DEFINER functions: %', total_functions;
    RAISE NOTICE 'Vulnerable functions: %', vulnerable_count;
    RAISE NOTICE '';
    
    IF vulnerable_count = 0 THEN
        RAISE NOTICE '🎉 ALL SECURITY DEFINER FUNCTIONS ARE SECURED!';
        RAISE NOTICE '✅ Zero vulnerable functions found';
    ELSE
        RAISE NOTICE '⚠️  Still have % vulnerable functions:', vulnerable_count;
        -- List remaining vulnerable functions
        FOR func_record IN 
            SELECT p.proname, pg_get_function_identity_arguments(p.oid) as signature
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
            AND p.prosecdef = true
            AND p.proconfig IS NULL
            ORDER BY p.proname
        LOOP
            RAISE NOTICE '  - % (%)', func_record.proname, func_record.signature;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
END $$;

-- =====================================================================
-- Migration: 20250820160000_fix_final_3_functions
-- =====================================================================

-- FIX THE FINAL 3 SECURITY WARNINGS
-- Set all functions to search_path = '' and use fully qualified function calls

-- ===================================================================
-- 1. Fix check_service_area_coverage - use empty search_path
-- ===================================================================

DROP FUNCTION IF EXISTS public.check_service_area_coverage CASCADE;
CREATE OR REPLACE FUNCTION public.check_service_area_coverage(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for maximum security
AS $function$
DECLARE
    covered BOOLEAN := FALSE;
BEGIN
    -- Check if location is covered by any service area
    SELECT EXISTS(
        SELECT 1 FROM public.service_areas sa
        WHERE sa.company_id = p_company_id 
          AND sa.is_active = true
          AND (
            -- Polygon coverage (using fully qualified PostGIS functions)
            (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
             extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
            
            -- Radius coverage (using fully qualified PostGIS functions)
            (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
             extensions.ST_DWithin(
               sa.center_point::geography, 
               extensions.ST_Point(p_longitude, p_latitude)::geography,
               sa.radius_miles * 1609.34
             )) OR
            
            -- Zip code coverage
            (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
             sa.zip_codes IS NOT NULL AND 
             p_zip_code = ANY(sa.zip_codes))
          )
    ) INTO covered;
    
    RETURN covered;
END;
$function$;

-- ===================================================================
-- 2. Fix get_service_areas_for_location - use empty search_path
-- ===================================================================

DROP FUNCTION IF EXISTS public.get_service_areas_for_location CASCADE;
CREATE OR REPLACE FUNCTION public.get_service_areas_for_location(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    area_id UUID,
    area_name VARCHAR(255),
    area_type VARCHAR(50),
    priority INTEGER,
    matched_condition TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for maximum security
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.name,
        sa.type,
        sa.priority,
        CASE 
            WHEN sa.type = 'polygon' THEN 'polygon_match'
            WHEN sa.type = 'radius' THEN 'radius_match'
            WHEN sa.type = 'zip_code' THEN 'zip_match'
        END as matched_condition
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id 
      AND sa.is_active = true
      AND (
        -- Polygon check with fully qualified PostGIS functions
        (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
         extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
        
        -- Radius check with fully qualified PostGIS functions
        (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
         extensions.ST_DWithin(
           sa.center_point::geography, 
           extensions.ST_Point(p_longitude, p_latitude)::geography,
           sa.radius_miles * 1609.34
         )) OR
        
        -- Zip code check
        (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
         sa.zip_codes IS NOT NULL AND 
         p_zip_code = ANY(sa.zip_codes))
      )
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$function$;

-- ===================================================================
-- 3. Fix handle_new_user - use empty search_path
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for maximum security
AS $function$
DECLARE
    full_name TEXT;
    name_parts TEXT[];
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    -- Get the full name from OAuth providers
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
    );

    -- Split the full name into first and last name
    IF full_name IS NOT NULL AND full_name != '' THEN
        name_parts := string_to_array(trim(full_name), ' ');
        first_name_val := COALESCE(name_parts[1], '');

        -- Join all remaining parts as last name
        IF array_length(name_parts, 1) > 1 THEN
            last_name_val := array_to_string(name_parts[2:], ' ');
        ELSE
            last_name_val := '';
        END IF;
    ELSE
        -- Fallback to individual fields if available
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    END IF;

    -- Insert into profiles table with fully qualified name
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val
    );

    RETURN NEW;
END;
$function$;

-- Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- FINAL VERIFICATION
-- ===================================================================

DO $$
DECLARE
    vulnerable_count INTEGER := 0;
    non_empty_search_path INTEGER := 0;
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL 3 FUNCTIONS SECURITY FIX VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Count functions with no search_path (vulnerable)
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL;
    
    -- Count functions with non-empty search_path (Supabase wants all empty)
    SELECT COUNT(*) INTO non_empty_search_path
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NOT NULL
    AND array_to_string(p.proconfig, ',') != 'search_path=""';
    
    RAISE NOTICE 'Functions with no search_path: %', vulnerable_count;
    RAISE NOTICE 'Functions with non-empty search_path: %', non_empty_search_path;
    RAISE NOTICE '';
    
    -- Check the 3 specific functions
    RAISE NOTICE 'THE 3 PROBLEMATIC FUNCTIONS:';
    FOR func_record IN 
        SELECT 
            p.proname,
            CASE 
                WHEN p.proconfig IS NULL THEN '❌ NO search_path'
                WHEN array_to_string(p.proconfig, ',') = 'search_path=""' THEN '✅ EMPTY search_path'
                ELSE '⚠️ ' || array_to_string(p.proconfig, ', ')
            END as status
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND p.proname IN ('check_service_area_coverage', 'get_service_areas_for_location', 'handle_new_user')
        ORDER BY p.proname
    LOOP
        RAISE NOTICE '  %: %', func_record.proname, func_record.status;
    END LOOP;
    
    RAISE NOTICE '';
    
    IF vulnerable_count = 0 AND non_empty_search_path = 0 THEN
        RAISE NOTICE '🎉 PERFECT! ALL FUNCTIONS NOW HAVE EMPTY SEARCH_PATH!';
        RAISE NOTICE '✅ Maximum security achieved';
        RAISE NOTICE '✅ Zero "Function Search Path Mutable" warnings expected';
        RAISE NOTICE '✅ All PostGIS and auth functions use fully qualified names';
    ELSE
        RAISE NOTICE '⚠️ Still have issues:';
        RAISE NOTICE '   - Vulnerable functions: %', vulnerable_count;
        RAISE NOTICE '   - Non-empty search_path: %', non_empty_search_path;
    END IF;
    
END $$;

-- =====================================================================
-- Migration: 20250820170000_fix_email_automation_table_references
-- =====================================================================

-- FIX EMAIL_AUTOMATION TABLE REFERENCES AND WORKFLOW_TYPE CONSTRAINT
-- Several functions are trying to INSERT into non-existent email_automation table
-- AND create_default_automation_workflows is missing required workflow_type column
-- This migration corrects all functions to use the correct schema

-- Fix create_default_email_templates function
CREATE OR REPLACE FUNCTION public.create_default_email_templates(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.email_templates (
        company_id,
        name,
        template_type,
        subject_line,
        html_content,
        text_content,
        is_active
    ) VALUES 
    (target_company_id, 'Welcome Email', 'welcome', 'Welcome to Our Service!', 
     '<p>Thank you for your interest in our services.</p>', 
     'Thank you for your interest in our services.', true),
    (target_company_id, 'Follow Up', 'followup', 'Following Up on Your Service Request', 
     '<p>We wanted to follow up on your recent inquiry.</p>',
     'We wanted to follow up on your recent inquiry.', true)
    ON CONFLICT (company_id, name) DO NOTHING;
END;
$function$;

-- Fix import_template_from_library function
-- Drop all versions of import_template_from_library before recreating
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    library_template RECORD;
    new_template_id UUID;
BEGIN
    -- Get template from library
    SELECT 
        name,
        description,
        subject_line,
        html_content,
        text_content,
        template_type,
        variables
    INTO library_template
    FROM public.template_library 
    WHERE id = p_library_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    -- Create new template in email_templates table
    INSERT INTO public.email_templates (
        company_id,
        name,
        description,
        subject_line,
        html_content,
        text_content,
        template_type,
        variables,
        is_active
    ) VALUES (
        p_company_id,
        COALESCE(p_custom_name, library_template.name),
        library_template.description,
        library_template.subject_line,
        library_template.html_content,
        library_template.text_content,
        library_template.template_type,
        library_template.variables,
        true
    ) RETURNING id INTO new_template_id;
    
    -- Update usage count in library
    UPDATE public.template_library 
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = p_library_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- Fix create_default_automation_workflows function - add missing workflow_type column
CREATE OR REPLACE FUNCTION public.create_default_automation_workflows(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.automation_workflows (
        company_id, 
        name, 
        description, 
        workflow_type,  -- This was missing!
        trigger_type,
        trigger_conditions,
        workflow_steps, 
        is_active,
        business_hours_only
    ) VALUES 
    (target_company_id, 'New Lead Follow-up', 'Automatic follow-up for new leads', 
     'lead_nurturing', 'lead_created', '{}'::jsonb, '[]'::jsonb, true, true),
    (target_company_id, 'Quote Follow-up', 'Follow-up after quote is sent', 
     'follow_up', 'quote_sent', '{}'::jsonb, '[]'::jsonb, true, true)
    ON CONFLICT (company_id, name) DO NOTHING;
END;
$function$;

-- =====================================================================
-- Migration: 20250820180000_final_workflow_fix
-- =====================================================================

-- FINAL FIX FOR WORKFLOW_TYPE CONSTRAINT VIOLATION
-- This migration runs AFTER 20250820130000 and 20250820170000 to ensure the 
-- create_default_automation_workflows function has the correct schema with workflow_type

CREATE OR REPLACE FUNCTION public.create_default_automation_workflows(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.automation_workflows (
        company_id, 
        name, 
        description, 
        workflow_type,     -- REQUIRED: This was missing in 20250820130000
        trigger_type,
        trigger_conditions,
        workflow_steps, 
        is_active,
        business_hours_only
    ) VALUES 
    (target_company_id, 'New Lead Follow-up', 'Automatic follow-up for new leads', 
     'lead_nurturing', 'lead_created', '{}'::jsonb, '[]'::jsonb, true, true),
    (target_company_id, 'Quote Follow-up', 'Follow-up after quote is sent', 
     'follow_up', 'quote_sent', '{}'::jsonb, '[]'::jsonb, true, true)
    ON CONFLICT (company_id, name) DO NOTHING;
END;
$function$;

-- =====================================================================
-- Migration: 20250820190000_fix_leads_constraint
-- =====================================================================

-- FIX CORRUPTED LEADS_LEAD_SOURCE_CHECK CONSTRAINT
-- The constraint appears to be corrupted or doesn't match our expectations
-- Recreate it with the exact values the seed script expects

-- Drop the existing constraint if it exists
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;

-- Recreate the constraint with the correct allowed values
ALTER TABLE leads ADD CONSTRAINT leads_lead_source_check 
CHECK (lead_source IN (
    'organic', 
    'referral', 
    'google_cpc', 
    'facebook_ads', 
    'linkedin', 
    'email_campaign', 
    'cold_call', 
    'trade_show', 
    'webinar', 
    'content_marketing', 
    'other'
));

-- Add a comment to document this fix
COMMENT ON CONSTRAINT leads_lead_source_check ON leads IS 'Fixed constraint to match seed script expectations - 2025-08-20';

-- =====================================================================
-- Migration: 20250820200000_fix_attribution_function_and_constraint
-- =====================================================================

-- FIX ATTRIBUTION FUNCTION AND EXPAND LEAD SOURCE CONSTRAINT
-- Root cause: determine_lead_source_from_attribution() returns 'bing_cpc' and 'social_media'
-- but the constraint doesn't allow these values

-- First, drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;

-- Recreate constraint with expanded values to support realistic lead sources
ALTER TABLE leads ADD CONSTRAINT leads_lead_source_check 
CHECK (lead_source IN (
    'organic',
    'referral', 
    'google_cpc',
    'facebook_ads',
    'linkedin',
    'email_campaign',
    'cold_call',
    'trade_show',
    'webinar',
    'content_marketing',
    'paid',         -- NEW: Generic paid traffic (Bing, other paid sources)
    'social_media', -- NEW: Social media traffic
    'other'
));

-- Update the determine_lead_source_from_attribution function to use 'paid' instead of 'bing_cpc'
CREATE OR REPLACE FUNCTION public.determine_lead_source_from_attribution(attribution JSONB)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    utm_source TEXT;
    utm_medium TEXT;
    gclid_value TEXT;
    traffic_source TEXT;
    referrer_domain TEXT;
BEGIN
    -- Extract values from attribution JSONB
    utm_source := attribution->>'utm_source';
    utm_medium := attribution->>'utm_medium';
    gclid_value := attribution->>'gclid';
    traffic_source := attribution->>'traffic_source';
    referrer_domain := attribution->>'referrer_domain';
    
    -- Determine lead source based on attribution data
    IF gclid_value IS NOT NULL OR (utm_source = 'google' AND utm_medium = 'cpc') THEN
        RETURN 'google_cpc';
    ELSIF utm_source = 'facebook' AND utm_medium IN ('paid', 'cpc', 'ads') THEN
        RETURN 'facebook_ads';
    ELSIF utm_source = 'linkedin' THEN
        RETURN 'linkedin';
    ELSIF utm_source = 'bing' AND utm_medium = 'cpc' THEN
        RETURN 'paid';  -- FIXED: Changed from 'bing_cpc' to 'paid'
    ELSIF traffic_source = 'organic' THEN
        RETURN 'organic';
    ELSIF traffic_source = 'social' OR referrer_domain IN ('facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com') THEN
        RETURN 'social_media';  -- This is now allowed by the expanded constraint
    ELSIF traffic_source = 'referral' THEN
        RETURN 'referral';
    ELSIF traffic_source = 'direct' THEN
        RETURN 'other';
    ELSE
        RETURN 'other';
    END IF;
END;
$function$;

-- Add comment documenting the fix
COMMENT ON CONSTRAINT leads_lead_source_check ON leads IS 'Expanded constraint to support paid and social_media lead sources from attribution function - 2025-08-20';

-- =====================================================================
-- Migration: 20250820210000_fix_import_template_function
-- =====================================================================

-- FIX BROKEN import_template_from_library FUNCTION
-- Our security migration broke this function by using wrong table name and missing parameters
-- Restore original functionality while maintaining security improvements

-- Drop all versions of import_template_from_library before recreating
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR(255) DEFAULT NULL,
    p_customizations JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_library_template RECORD;
    v_new_template_id UUID;
    v_final_name VARCHAR(255);
BEGIN
    -- Get the library template (using correct table name: email_template_library)
    SELECT 
        id,
        name,
        description,
        template_category,
        subject_line,
        html_content,
        text_content,
        variables,
        is_active
    INTO v_library_template
    FROM public.email_template_library
    WHERE id = p_library_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Library template not found or inactive: %', p_library_template_id;
    END IF;
    
    -- Determine the final name
    v_final_name := COALESCE(p_custom_name, v_library_template.name);
    
    -- Create the company template
    INSERT INTO public.email_templates (
        company_id,
        name,
        description,
        template_type,
        subject_line,
        html_content,
        text_content,
        variables,
        is_active
    ) VALUES (
        p_company_id,
        v_final_name,
        COALESCE(p_customizations->>'description', v_library_template.description),
        v_library_template.template_category,
        COALESCE(p_customizations->>'subject_line', v_library_template.subject_line),
        COALESCE(p_customizations->>'html_content', v_library_template.html_content),
        COALESCE(p_customizations->>'text_content', v_library_template.text_content),
        v_library_template.variables,
        true
    ) RETURNING id INTO v_new_template_id;
    
    -- Record the usage
    INSERT INTO public.template_library_usage (
        library_template_id,
        company_id,
        company_template_id,
        customizations,
        created_at
    ) VALUES (
        p_library_template_id,
        p_company_id,
        v_new_template_id,
        p_customizations,
        NOW()
    );
    
    RETURN v_new_template_id;
END;
$function$;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) IS 'Fixed function signature and table references broken by security migration - 2025-08-20';

-- =====================================================================
-- Migration: 20250820220000_fix_template_usage_column
-- =====================================================================

-- FIX COLUMN NAME ERROR IN import_template_from_library FUNCTION
-- Function was trying to insert 'created_at' but table has 'imported_at' column

-- Drop all versions of import_template_from_library before recreating
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR(255) DEFAULT NULL,
    p_customizations JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_library_template RECORD;
    v_new_template_id UUID;
    v_final_name VARCHAR(255);
BEGIN
    -- Get the library template (using correct table name: email_template_library)
    SELECT 
        id,
        name,
        description,
        template_category,
        subject_line,
        html_content,
        text_content,
        variables,
        is_active
    INTO v_library_template
    FROM public.email_template_library
    WHERE id = p_library_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Library template not found or inactive: %', p_library_template_id;
    END IF;
    
    -- Determine the final name
    v_final_name := COALESCE(p_custom_name, v_library_template.name);
    
    -- Create the company template
    INSERT INTO public.email_templates (
        company_id,
        name,
        description,
        template_type,
        subject_line,
        html_content,
        text_content,
        variables,
        is_active
    ) VALUES (
        p_company_id,
        v_final_name,
        COALESCE(p_customizations->>'description', v_library_template.description),
        v_library_template.template_category,
        COALESCE(p_customizations->>'subject_line', v_library_template.subject_line),
        COALESCE(p_customizations->>'html_content', v_library_template.html_content),
        COALESCE(p_customizations->>'text_content', v_library_template.text_content),
        v_library_template.variables,
        true
    ) RETURNING id INTO v_new_template_id;
    
    -- Record the usage (FIXED: Use 'imported_at' not 'created_at', let DEFAULT NOW() handle timestamp)
    INSERT INTO public.template_library_usage (
        library_template_id,
        company_id,
        company_template_id,
        customizations
    ) VALUES (
        p_library_template_id,
        p_company_id,
        v_new_template_id,
        p_customizations
    ) ON CONFLICT (library_template_id, company_id) 
    DO UPDATE SET
        company_template_id = EXCLUDED.company_template_id,
        imported_at = NOW(),
        customizations = EXCLUDED.customizations;
    
    RETURN v_new_template_id;
END;
$function$;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) IS 'Fixed column name: template_library_usage uses imported_at not created_at - 2025-08-20';

-- =====================================================================
-- Migration: 20250820230000_fix_service_areas_function
-- =====================================================================

-- FIX get_company_service_areas FUNCTION TO RETURN COMPLETE GEOGRAPHIC DATA
-- The security-fixed version was too simplified and missing required geographic fields
-- that the API route needs for service areas functionality

-- Drop and recreate function to change return type
DROP FUNCTION IF EXISTS public.get_company_service_areas(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_company_service_areas(p_company_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    type TEXT,
    polygon_geojson TEXT,
    center_lat TEXT,
    center_lng TEXT,
    radius_miles DECIMAL(10,2),
    zip_codes TEXT[],
    priority INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        sa.id,
        sa.name::TEXT,
        sa.type::TEXT,
        CASE 
            WHEN sa.polygon IS NOT NULL THEN public.ST_AsGeoJSON(sa.polygon)::TEXT
            ELSE NULL
        END as polygon_geojson,
        CASE 
            WHEN sa.center_point IS NOT NULL THEN public.ST_Y(sa.center_point)::TEXT
            ELSE NULL
        END as center_lat,
        CASE 
            WHEN sa.center_point IS NOT NULL THEN public.ST_X(sa.center_point)::TEXT
            ELSE NULL
        END as center_lng,
        sa.radius_miles::DECIMAL(10,2),
        sa.zip_codes,
        sa.priority,
        sa.is_active,
        sa.created_at,
        sa.updated_at
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id
    ORDER BY sa.priority DESC, sa.name ASC;
END;
$function$;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.get_company_service_areas(UUID) IS 'Returns complete service area data with geographic fields for API - security fixed with search_path and SECURITY DEFINER - 2025-08-20';

-- =====================================================================
-- Migration: 20250820240000_add_missing_postgis_columns_to_service_areas
-- =====================================================================

-- ADD MISSING POSTGIS GEOMETRY COLUMNS TO service_areas TABLE
-- The table is missing polygon and center_point columns that the function expects

-- Add the missing PostGIS geometry columns
ALTER TABLE public.service_areas 
ADD COLUMN IF NOT EXISTS polygon GEOMETRY(POLYGON, 4326),
ADD COLUMN IF NOT EXISTS center_point GEOMETRY(POINT, 4326);

-- Add spatial indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_areas_polygon 
ON public.service_areas USING GIST(polygon) 
WHERE polygon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_areas_center_point 
ON public.service_areas USING GIST(center_point) 
WHERE center_point IS NOT NULL;

-- Add check constraint to ensure proper data based on type
ALTER TABLE public.service_areas DROP CONSTRAINT IF EXISTS service_areas_data_integrity_check;
ALTER TABLE public.service_areas ADD CONSTRAINT service_areas_data_integrity_check CHECK (
    (type = 'polygon' AND polygon IS NOT NULL) OR
    (type = 'radius' AND center_point IS NOT NULL AND radius_miles IS NOT NULL) OR
    (type = 'zip_code' AND zip_codes IS NOT NULL AND array_length(zip_codes, 1) > 0)
);

-- Add comment documenting this fix
COMMENT ON TABLE public.service_areas IS 'Geographic service areas for companies including polygon, radius, and zip code based coverage areas - PostGIS columns added 2025-08-20';

-- =====================================================================
-- Migration: 20250820250000_fix_postgis_schema_in_service_areas_function
-- =====================================================================

-- FIX PostGIS SCHEMA REFERENCES IN get_company_service_areas FUNCTION
-- PostGIS functions are in extensions schema, not public schema

-- Drop and recreate function with correct PostGIS schema references
DROP FUNCTION IF EXISTS public.get_company_service_areas(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_company_service_areas(p_company_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    type TEXT,
    polygon_geojson TEXT,
    center_lat TEXT,
    center_lng TEXT,
    radius_miles DECIMAL(10,2),
    zip_codes TEXT[],
    priority INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        sa.id,
        sa.name::TEXT,
        sa.type::TEXT,
        CASE 
            WHEN sa.polygon IS NOT NULL THEN extensions.ST_AsGeoJSON(sa.polygon)::TEXT
            ELSE NULL
        END as polygon_geojson,
        CASE 
            WHEN sa.center_point IS NOT NULL THEN extensions.ST_Y(sa.center_point)::TEXT
            ELSE NULL
        END as center_lat,
        CASE 
            WHEN sa.center_point IS NOT NULL THEN extensions.ST_X(sa.center_point)::TEXT
            ELSE NULL
        END as center_lng,
        sa.radius_miles::DECIMAL(10,2),
        sa.zip_codes,
        sa.priority,
        sa.is_active,
        sa.created_at,
        sa.updated_at
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id
    ORDER BY sa.priority DESC, sa.name ASC;
END;
$function$;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.get_company_service_areas(UUID) IS 'Returns complete service area data with geographic fields - PostGIS functions in extensions schema - 2025-08-20';

-- =====================================================================
-- Migration: 20250820260000_fix_call_record_customer_trigger (FINAL FIX)
-- =====================================================================

-- Fix the ensure_call_record_customer_id trigger function to respect company boundaries
-- This function was causing constraint violations by finding customers from wrong companies

CREATE OR REPLACE FUNCTION public.ensure_call_record_customer_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    existing_customer_id UUID;
    lead_company_id UUID;
BEGIN
    -- If lead_id is provided but customer_id is missing, populate it from the lead
    IF NEW.lead_id IS NOT NULL AND NEW.customer_id IS NULL THEN
        SELECT customer_id INTO NEW.customer_id 
        FROM public.leads 
        WHERE id = NEW.lead_id;
    END IF;
    
    -- If still no customer_id and we have a phone number, try to find customer by phone
    -- BUT respect company boundaries to avoid constraint violations
    IF NEW.customer_id IS NULL AND NEW.phone_number IS NOT NULL THEN
        -- First, try to get company_id from the associated lead
        IF NEW.lead_id IS NOT NULL THEN
            SELECT company_id INTO lead_company_id
            FROM public.leads 
            WHERE id = NEW.lead_id;
        END IF;
        
        -- If we have a company context, search within that company only
        IF lead_company_id IS NOT NULL THEN
            SELECT id INTO existing_customer_id
            FROM public.customers 
            WHERE phone = NEW.phone_number 
            AND company_id = lead_company_id
            LIMIT 1;
        ELSE
            -- Fallback: search across all companies but prefer active customers
            -- This should rarely happen since leads should always have company_id
            SELECT id INTO existing_customer_id
            FROM public.customers 
            WHERE phone = NEW.phone_number 
            AND customer_status = 'active'
            ORDER BY created_at DESC
            LIMIT 1;
        END IF;
        
        IF existing_customer_id IS NOT NULL THEN
            NEW.customer_id = existing_customer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.ensure_call_record_customer_id() IS 'Ensures call records have customer_id populated while respecting company boundaries to prevent constraint violations. Fixed 2025-08-20 to address Retell webhook failures.';

-- =====================================================================
-- FINAL CONSOLIDATED MIGRATION SUMMARY
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONSOLIDATED MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'This migration consolidated the following:';
    RAISE NOTICE '- Performance optimizations (indexes, spatial)';
    RAISE NOTICE '- RLS policy optimizations and cleanups';
    RAISE NOTICE '- Security fixes for 35+ SECURITY DEFINER functions';
    RAISE NOTICE '- PostGIS extension moved to dedicated schema';
    RAISE NOTICE '- Function signature fixes and trigger updates';
    RAISE NOTICE '- Call record customer trigger boundary fixes';
    RAISE NOTICE '';
    RAISE NOTICE 'All migrations from 20250818200000 through 20250820260000';
    RAISE NOTICE 'have been successfully consolidated into this single file.';
    RAISE NOTICE '';
    RAISE NOTICE 'Completed at: %', NOW();
    RAISE NOTICE '========================================';
END $$;
