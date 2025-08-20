-- FIX THE ACTUAL VULNERABLE FUNCTIONS
-- Based on Supabase linter findings, fix the functions with their correct signatures

-- ===================================================================
-- SECTION 1: Fix assign_lead_to_ab_test with ORIGINAL signature
-- ===================================================================

DROP FUNCTION IF EXISTS public.assign_lead_to_ab_test(UUID, UUID, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.assign_lead_to_ab_test(
    p_company_id UUID,
    p_lead_id UUID,
    p_template_id UUID
)
RETURNS UUID
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

-- ===================================================================
-- SECTION 2: Fix promote_ab_test_winner with ORIGINAL signature
-- ===================================================================

-- First find the original signature by checking existing function
DO $$
DECLARE
    func_signature TEXT;
BEGIN
    -- Get the current signature
    SELECT pg_get_function_identity_arguments(p.oid) INTO func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'promote_ab_test_winner'
    AND n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL -- Only the vulnerable one
    LIMIT 1;
    
    IF func_signature IS NOT NULL THEN
        RAISE NOTICE 'Found vulnerable promote_ab_test_winner with signature: %', func_signature;
    ELSE
        RAISE NOTICE 'No vulnerable promote_ab_test_winner found';
    END IF;
END $$;

DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.promote_ab_test_winner(
    p_test_id UUID,
    p_winning_variant_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Mark test as complete and set winner
    UPDATE public.ab_tests 
    SET status = 'completed', 
        winning_variant_id = p_winning_variant_id,
        ended_at = NOW()
    WHERE id = p_test_id;
    
    -- If ab_tests table doesn't exist, try ab_test_campaigns
    IF NOT FOUND THEN
        UPDATE public.ab_test_campaigns
        SET is_active = false,
            ended_at = NOW(),
            winning_variant_id = p_winning_variant_id
        WHERE id = p_test_id;
    END IF;
END;
$function$;

-- ===================================================================
-- SECTION 3: Fix import_template_from_library with ORIGINAL signature
-- ===================================================================

DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    new_template_id UUID;
    template_record RECORD;
BEGIN
    -- Get template from library
    SELECT * INTO template_record
    FROM public.email_template_library 
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_template_id;
    END IF;
    
    -- Copy template to company's email_templates (if table exists)
    BEGIN
        INSERT INTO public.email_templates (
            company_id, 
            name, 
            description, 
            template_type,
            subject_line, 
            html_content, 
            text_content,
            variables,
            is_active
        )
        SELECT 
            p_company_id,
            template_record.name,
            template_record.description,
            template_record.template_type,
            template_record.subject_line,
            template_record.html_content,
            template_record.text_content,
            template_record.variables,
            false
        RETURNING id INTO new_template_id;
    EXCEPTION WHEN undefined_table THEN
        -- Fallback to email_automation table
        INSERT INTO public.email_automation (
            company_id, 
            template_name, 
            subject_line, 
            email_body, 
            trigger_event, 
            delay_minutes, 
            is_active
        )
        SELECT 
            p_company_id,
            template_record.name,
            template_record.subject_line,
            COALESCE(template_record.html_content, template_record.text_content),
            'manual',
            0,
            false
        RETURNING id INTO new_template_id;
    END;
    
    -- Update usage count
    UPDATE public.email_template_library 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- ===================================================================
-- SECTION 4: Fix handle_new_user - already has correct signature, just add SECURITY DEFINER
-- ===================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'
AS $function$
DECLARE
    full_name TEXT;
    name_parts TEXT[];
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    -- Get the full name from OAuth providers
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
    );

    -- Split the full name into first and last name
    IF full_name IS NOT NULL AND full_name != '' THEN
        name_parts := string_to_array(trim(full_name), ' ');
        first_name_val := COALESCE(name_parts[1], '');

        -- Join all remaining parts as last name
        IF array_length(name_parts, 1) > 1 THEN
            last_name_val := array_to_string(name_parts[2:], ' ');
        ELSE
            last_name_val := '';
        END IF;
    ELSE
        -- Fallback to individual fields if available
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    END IF;

    -- Insert into profiles table
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val
    );

    RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- SECTION 5: Verification
-- ===================================================================

DO $$
DECLARE
    vulnerable_count INTEGER := 0;
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TARGETED FUNCTION FIX VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Check specifically the functions we just fixed
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as signature,
            CASE 
                WHEN p.proconfig IS NULL THEN 'STILL VULNERABLE'
                ELSE 'FIXED - ' || array_to_string(p.proconfig, ', ')
            END as status
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
        AND p.proname IN ('assign_lead_to_ab_test', 'promote_ab_test_winner', 'import_template_from_library', 'handle_new_user')
        ORDER BY p.proname
    LOOP
        RAISE NOTICE '% (%) - %', 
            func_record.proname,
            func_record.signature,
            func_record.status;
            
        IF func_record.status = 'STILL VULNERABLE' THEN
            vulnerable_count := vulnerable_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    IF vulnerable_count = 0 THEN
        RAISE NOTICE '✅ All targeted functions have been fixed!';
    ELSE
        RAISE NOTICE '❌ % functions are still vulnerable', vulnerable_count;
    END IF;
    
END $$;