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
CREATE OR REPLACE FUNCTION refresh_company_lead_stats()
RETURNS void AS $$
BEGIN
  -- Check if materialized view exists before refreshing
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY company_lead_stats;
  END IF;
END;
$$ LANGUAGE plpgsql;

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