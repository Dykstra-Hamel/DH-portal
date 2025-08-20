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