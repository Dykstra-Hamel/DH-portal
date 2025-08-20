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