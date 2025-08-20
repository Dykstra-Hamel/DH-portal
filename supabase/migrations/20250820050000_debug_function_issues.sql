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