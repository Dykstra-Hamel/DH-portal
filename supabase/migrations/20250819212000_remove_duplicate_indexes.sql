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