-- =====================================================================
-- Migration: 20250822150000_fix_promote_ab_test_winner_function_signature
-- =====================================================================
-- 
-- FIX FUNCTION SIGNATURE CONFLICT: promote_ab_test_winner
-- 
-- Issue: The consolidated migration contains multiple conflicting versions of
-- promote_ab_test_winner with different signatures:
--   - Original: (UUID, VARCHAR(10)) RETURNS BOOLEAN 
--   - Consolidated: (UUID, UUID) RETURNS void AND (UUID, VARCHAR) RETURNS void
-- 
-- This causes "cannot change return type of existing function" error in production
-- because PostgreSQL cannot change return types of existing functions.
-- 
-- Solution: Drop all conflicting versions and recreate the original function
-- with the correct signature and added security fixes.
-- =====================================================================

-- ===================================================================
-- SECTION 1: DROP ALL CONFLICTING FUNCTION SIGNATURES
-- ===================================================================

-- Drop all possible conflicting signatures that were created in consolidation
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.promote_ab_test_winner(UUID, VARCHAR(10)) CASCADE;

-- ===================================================================  
-- SECTION 2: RECREATE ORIGINAL FUNCTION WITH SECURITY FIXES
-- ===================================================================

-- Recreate the function with the ORIGINAL signature from migration 20250811000004
-- but with added SECURITY DEFINER and SET search_path for security
CREATE OR REPLACE FUNCTION public.promote_ab_test_winner(
    p_campaign_id UUID,
    p_winner_variant VARCHAR(10)
) RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_campaign ab_test_campaigns%ROWTYPE;
    v_winner_template_id UUID;
    v_control_template_id UUID;
BEGIN
    -- Get campaign details
    SELECT * INTO v_campaign FROM ab_test_campaigns WHERE id = p_campaign_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
    END IF;
    
    -- Get winner template ID
    SELECT template_id INTO v_winner_template_id
    FROM ab_test_variants
    WHERE campaign_id = p_campaign_id AND variant_label = p_winner_variant;
    
    -- Get control template ID
    SELECT template_id INTO v_control_template_id
    FROM ab_test_variants
    WHERE campaign_id = p_campaign_id AND is_control = true;
    
    -- If winner is not control, copy winner template over control template
    IF v_winner_template_id != v_control_template_id THEN
        UPDATE email_templates 
        SET 
            subject_line = winner.subject_line,
            html_content = winner.html_content,
            text_content = winner.text_content,
            variables = winner.variables,
            updated_at = NOW()
        FROM (
            SELECT subject_line, html_content, text_content, variables
            FROM email_templates 
            WHERE id = v_winner_template_id
        ) AS winner
        WHERE email_templates.id = v_control_template_id;
    END IF;
    
    -- Update campaign status
    UPDATE ab_test_campaigns 
    SET 
        status = 'completed',
        winner_variant = p_winner_variant,
        winner_determined_at = NOW(),
        actual_end_date = NOW(),
        updated_at = NOW()
    WHERE id = p_campaign_id;
    
    RETURN TRUE;
END;
$function$;

-- ===================================================================
-- SECTION 3: VERIFICATION AND LOGGING
-- ===================================================================

-- Verify the function was created with correct signature
DO $$
DECLARE
    func_signature TEXT;
    return_type TEXT;
    is_secure BOOLEAN;
BEGIN
    -- Get function details
    SELECT 
        pg_get_function_identity_arguments(p.oid),
        pg_get_function_result(p.oid),
        (p.prosecdef = true AND p.proconfig IS NOT NULL)
    INTO func_signature, return_type, is_secure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'promote_ab_test_winner'
    AND n.nspname = 'public';
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'FUNCTION SIGNATURE FIX COMPLETE';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Function signature: promote_ab_test_winner(%)', func_signature;
    RAISE NOTICE 'Return type: %', return_type;
    RAISE NOTICE 'Security status: %', CASE WHEN is_secure THEN 'SECURED' ELSE 'NOT SECURED' END;
    
    IF func_signature LIKE '%uuid, character varying%' AND return_type = 'boolean' AND is_secure THEN
        RAISE NOTICE '✅ FUNCTION SIGNATURE CORRECTED';
        RAISE NOTICE '✅ Return type restored to BOOLEAN';
        RAISE NOTICE '✅ Security fixes applied (SECURITY DEFINER + SET search_path)';
        RAISE NOTICE '✅ Production deployment should now work';
    ELSE
        RAISE NOTICE '⚠️  Function may not have been fixed correctly';
        RAISE NOTICE '   Expected: (uuid, character varying) RETURNS boolean SECURED';
        RAISE NOTICE '   Actual: (%) RETURNS % %', 
            func_signature, 
            return_type, 
            CASE WHEN is_secure THEN 'SECURED' ELSE 'NOT SECURED' END;
    END IF;
    
    RAISE NOTICE '====================================';
END $$;

-- Add documentation comment
COMMENT ON FUNCTION public.promote_ab_test_winner(UUID, VARCHAR) IS 'Fixed function signature conflict: restored original (UUID, VARCHAR(10)) RETURNS BOOLEAN signature with added SECURITY DEFINER and SET search_path for security - resolves production deployment error';