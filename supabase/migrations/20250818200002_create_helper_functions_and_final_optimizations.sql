-- Phase 1C: Helper Functions and Final Performance Optimizations
-- Creates utility functions and additional optimizations for database performance

-- 1. CREATE RPC FUNCTION for Direct SQL Execution (if needed)
-- This allows complex queries that Supabase's query builder can't handle efficiently
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
CREATE OR REPLACE FUNCTION auto_refresh_company_lead_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the materialized view when leads are modified
    -- Only refresh if the materialized view exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'company_lead_stats') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY company_lead_stats;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION analyze_query_performance(query_text TEXT)
RETURNS TABLE(
    query_plan TEXT,
    execution_time NUMERIC,
    rows_returned BIGINT
) AS $$
DECLARE
    plan_result TEXT;
    exec_time NUMERIC;
    row_count BIGINT;
BEGIN
    -- This function helps analyze query performance
    -- In production, this would execute EXPLAIN ANALYZE
    RETURN QUERY SELECT 
        'Query analysis functionality'::TEXT,
        0::NUMERIC,
        0::BIGINT;
END;
$$ LANGUAGE plpgsql;

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