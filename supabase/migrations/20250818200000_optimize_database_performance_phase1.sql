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