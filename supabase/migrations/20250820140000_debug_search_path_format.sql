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