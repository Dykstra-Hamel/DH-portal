-- CONVERT NON-SECURITY DEFINER FUNCTIONS TO SECURITY DEFINER
-- Fix the root cause: Supabase wants certain functions to be SECURITY DEFINER with search_path

-- ===================================================================
-- SECTION 1: Fix promote_ab_test_winner (OID: 20120)
-- Current: NOT SECURITY DEFINER
-- Need: SECURITY DEFINER with search_path
-- ===================================================================

DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION public.promote_ab_test_winner(
    p_campaign_id UUID,
    p_winner_variant VARCHAR
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Mark the specified variant as the winner for the campaign
    UPDATE public.ab_test_campaigns 
    SET 
        is_active = false,
        ended_at = NOW(),
        winning_variant_name = p_winner_variant
    WHERE id = p_campaign_id;
    
    -- Update campaign results
    INSERT INTO public.ab_test_results (
        campaign_id,
        winning_variant,
        concluded_at
    ) VALUES (
        p_campaign_id,
        p_winner_variant,
        NOW()
    ) ON CONFLICT (campaign_id) DO UPDATE SET
        winning_variant = EXCLUDED.winning_variant,
        concluded_at = EXCLUDED.concluded_at;
END;
$function$;

-- ===================================================================
-- SECTION 2: Fix import_template_from_library (OID: 20345)
-- Current: NOT SECURITY DEFINER  
-- Need: SECURITY DEFINER with search_path
-- ===================================================================

DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;

CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR,
    p_customizations JSONB
)
RETURNS UUID
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
    FROM public.email_template_library 
    WHERE id = p_library_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    -- Create new template for the company based on library template
    INSERT INTO public.email_templates (
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
    
    -- Update library template usage
    UPDATE public.email_template_library 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_library_template_id;
    
    -- Log the import
    INSERT INTO public.template_library_usage (
        library_template_id,
        company_id,
        imported_template_id,
        imported_at
    ) VALUES (
        p_library_template_id,
        p_company_id,
        new_template_id,
        NOW()
    );
    
    RETURN new_template_id;
END;
$function$;

-- ===================================================================
-- SECTION 3: Check for any other non-SECURITY DEFINER functions
-- that might need conversion
-- ===================================================================

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
    non_secdef_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING FOR REMAINING NON-SECURITY DEFINER FUNCTIONS ===';
    RAISE NOTICE '';
    
    -- Find any remaining non-SECURITY DEFINER functions from our CSV list
    FOR func_record IN 
        SELECT 
            p.proname,
            p.oid,
            pg_get_function_identity_arguments(p.oid) as signature,
            p.prosecdef
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname = ANY(csv_functions)
        AND p.prosecdef = false  -- NOT SECURITY DEFINER
        ORDER BY p.proname, p.oid
    LOOP
        non_secdef_count := non_secdef_count + 1;
        RAISE NOTICE 'NON-SECURITY DEFINER: % (OID: %) - Signature: (%)', 
            func_record.proname,
            func_record.oid,
            func_record.signature;
    END LOOP;
    
    RAISE NOTICE '';
    IF non_secdef_count = 0 THEN
        RAISE NOTICE '✅ ALL CSV FUNCTIONS ARE NOW SECURITY DEFINER!';
    ELSE
        RAISE NOTICE '⚠️  % functions still need to be converted to SECURITY DEFINER', non_secdef_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'FINAL CHECK: All functions from CSV with their SECURITY DEFINER status:';
    
    FOR func_record IN 
        SELECT 
            p.proname,
            COUNT(*) as total_functions,
            COUNT(CASE WHEN p.prosecdef = true THEN 1 END) as secdef_functions,
            COUNT(CASE WHEN p.prosecdef = false THEN 1 END) as non_secdef_functions
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname = ANY(csv_functions)
        GROUP BY p.proname
        ORDER BY p.proname
    LOOP
        RAISE NOTICE '%: Total=% | SECURITY DEFINER=% | Non-SECDEF=%', 
            func_record.proname,
            func_record.total_functions,
            func_record.secdef_functions,
            func_record.non_secdef_functions;
    END LOOP;
    
END $$;