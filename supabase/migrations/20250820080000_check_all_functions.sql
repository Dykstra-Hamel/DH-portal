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