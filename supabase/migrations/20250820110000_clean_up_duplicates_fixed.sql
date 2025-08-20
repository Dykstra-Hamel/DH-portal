-- CLEAN UP ALL DUPLICATE FUNCTIONS - FIXED VERSION
-- Remove the duplicate functions I created, keeping only the originals

-- ===================================================================
-- STEP 1: DROP MY CREATED DUPLICATE FUNCTIONS
-- ===================================================================

-- Drop the newer assign_lead_to_ab_test (2 params) - keep original (3 params)
DROP FUNCTION IF EXISTS public.assign_lead_to_ab_test(UUID, UUID) CASCADE;

-- Drop the newer promote_ab_test_winner (UUID, UUID) - keep original (UUID, VARCHAR)
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, UUID) CASCADE;

-- Drop the newer import_template_from_library (2 params) - keep original (4 params)
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;

-- ===================================================================
-- STEP 2: NOW FIX THE ORIGINAL FUNCTIONS BY ADDING SECURITY DEFINER
-- Instead of creating new functions, modify the existing ones
-- ===================================================================

-- Fix the original assign_lead_to_ab_test (3 parameters)
CREATE OR REPLACE FUNCTION public.assign_lead_to_ab_test(
    p_company_id UUID,
    p_lead_id UUID,
    p_template_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_campaign ab_test_campaigns%ROWTYPE;
    v_variant ab_test_variants%ROWTYPE;
    v_assignment_hash TEXT;
    v_hash_int BIGINT;
    v_bucket INTEGER;
    v_variant_id UUID;
BEGIN
    -- Find active A/B test campaign for this company and template
    SELECT * INTO v_campaign
    FROM ab_test_campaigns
    WHERE company_id = p_company_id
    AND template_id = p_template_id
    AND is_active = true
    AND started_at <= NOW()
    AND (ended_at IS NULL OR ended_at > NOW())
    LIMIT 1;

    -- If no active campaign, return null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Create a deterministic hash from lead_id to ensure consistent assignment
    v_assignment_hash := encode(digest(p_lead_id::text || v_campaign.id::text, 'sha256'), 'hex');
    
    -- Convert hash to integer and get bucket (0-99)
    v_hash_int := ('x' || left(v_assignment_hash, 8))::bit(32)::bigint;
    v_bucket := abs(v_hash_int) % 100;

    -- Find which variant this lead should be assigned to based on traffic split
    SELECT * INTO v_variant
    FROM ab_test_variants
    WHERE campaign_id = v_campaign.id
    AND v_bucket >= traffic_split_start
    AND v_bucket < traffic_split_end
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no variant found (shouldn't happen), use control
    IF NOT FOUND THEN
        SELECT * INTO v_variant
        FROM ab_test_variants
        WHERE campaign_id = v_campaign.id
        AND is_control = true
        LIMIT 1;
    END IF;

    v_variant_id := v_variant.id;

    -- Insert assignment record
    INSERT INTO ab_test_assignments (
        campaign_id,
        variant_id,
        lead_id,
        assigned_at
    ) VALUES (
        v_campaign.id,
        v_variant_id,
        p_lead_id,
        NOW()
    ) ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
        variant_id = EXCLUDED.variant_id,
        assigned_at = EXCLUDED.assigned_at;

    RETURN v_variant_id;
END;
$function$;

-- Fix the original promote_ab_test_winner (UUID, VARCHAR)
CREATE OR REPLACE FUNCTION public.promote_ab_test_winner(
    p_campaign_id UUID,
    p_winner_variant VARCHAR
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Mark the specified variant as the winner for the campaign
    UPDATE ab_test_campaigns 
    SET 
        is_active = false,
        ended_at = NOW(),
        winning_variant_name = p_winner_variant
    WHERE id = p_campaign_id;
    
    -- Update campaign results if table exists
    BEGIN
        INSERT INTO ab_test_results (
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
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, skip this step
        NULL;
    END;
END;
$function$;

-- Fix the original import_template_from_library (4 parameters)
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR,
    p_customizations JSONB
) RETURNS UUID
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
    FROM email_template_library 
    WHERE id = p_library_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    -- Create new template for the company based on library template
    BEGIN
        INSERT INTO email_templates (
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
    EXCEPTION WHEN undefined_table THEN
        -- Fall back to email_automation table
        INSERT INTO email_automation (
            company_id,
            template_name,
            subject_line,
            email_body,
            trigger_event,
            delay_minutes,
            is_active
        ) VALUES (
            p_company_id,
            COALESCE(p_custom_name, library_template.name),
            library_template.subject_line,
            COALESCE(library_template.html_content, library_template.text_content),
            'manual',
            0,
            false
        ) RETURNING id INTO new_template_id;
    END;
    
    -- Update library template usage
    UPDATE email_template_library 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_library_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- ===================================================================
-- STEP 3: VERIFICATION
-- ===================================================================

DO $$
DECLARE
    func_record RECORD;
    still_vulnerable INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION AFTER CLEANUP AND FIX ===';
    RAISE NOTICE '';
    
    -- Check the key problematic functions
    FOR func_record IN 
        SELECT 
            p.proname,
            COUNT(*) as total_functions,
            COUNT(CASE WHEN p.prosecdef = true AND p.proconfig IS NOT NULL THEN 1 END) as secured,
            COUNT(CASE WHEN p.prosecdef = true AND p.proconfig IS NULL THEN 1 END) as vulnerable_secdef,
            COUNT(CASE WHEN p.prosecdef = false THEN 1 END) as non_secdef
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname IN ('assign_lead_to_ab_test', 'promote_ab_test_winner', 'import_template_from_library')
        GROUP BY p.proname
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'FUNCTION: %', func_record.proname;
        RAISE NOTICE '  Total: % | Secured: % | Vulnerable SECDEF: % | Non-SECDEF: %',
            func_record.total_functions,
            func_record.secured,
            func_record.vulnerable_secdef,
            func_record.non_secdef;
            
        still_vulnerable := still_vulnerable + func_record.vulnerable_secdef + func_record.non_secdef;
        
        IF func_record.total_functions = 1 AND func_record.secured = 1 THEN
            RAISE NOTICE '  ✅ FIXED - Single secured function';
        ELSIF func_record.vulnerable_secdef > 0 OR func_record.non_secdef > 0 THEN
            RAISE NOTICE '  ❌ STILL HAS ISSUES';
        ELSE
            RAISE NOTICE '  ⚠️  Multiple functions exist';
        END IF;
        RAISE NOTICE '';
    END LOOP;
    
    IF still_vulnerable = 0 THEN
        RAISE NOTICE '🎉 ALL KEY FUNCTIONS ARE NOW PROPERLY SECURED!';
    ELSE
        RAISE NOTICE '⚠️  Still have % vulnerable or non-SECDEF functions', still_vulnerable;
    END IF;
    
END $$;