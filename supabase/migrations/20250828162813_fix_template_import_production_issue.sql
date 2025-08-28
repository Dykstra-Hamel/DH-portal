-- Fix Critical Template Import Production Issue
-- The import_template_from_library function was broken during security migration
-- This restores proper functionality with correct table references and column mappings

-- Drop the broken function first
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;

-- Create the corrected function with proper implementation
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR(255) DEFAULT NULL,
    p_customizations JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_library_template RECORD;
    v_new_template_id UUID;
    v_final_name VARCHAR(255);
BEGIN
    -- Get the library template with all required fields
    SELECT 
        id,
        name,
        description,
        template_category,
        subject_line,
        html_content,
        text_content,
        variables,
        is_active
    INTO v_library_template
    FROM public.email_template_library
    WHERE id = p_library_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Library template not found or inactive: %', p_library_template_id;
    END IF;
    
    -- Determine the final name (use custom name if provided, otherwise use original)
    v_final_name := COALESCE(p_custom_name, v_library_template.name);
    
    -- Create the company template using correct table and columns
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
        created_at,
        updated_at
    ) VALUES (
        p_company_id,
        v_final_name,
        COALESCE(p_customizations->>'description', v_library_template.description),
        v_library_template.template_category,
        COALESCE(p_customizations->>'subject_line', v_library_template.subject_line),
        COALESCE(p_customizations->>'html_content', v_library_template.html_content),
        COALESCE(p_customizations->>'text_content', v_library_template.text_content),
        v_library_template.variables,
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO v_new_template_id;
    
    -- Record the usage in tracking table (using correct column name: imported_at not created_at)
    INSERT INTO public.template_library_usage (
        library_template_id,
        company_id,
        company_template_id,
        customizations,
        imported_at
    ) VALUES (
        p_library_template_id,
        p_company_id,
        v_new_template_id,
        p_customizations,
        NOW()
    );
    
    -- Update the library template usage count
    UPDATE public.email_template_library 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_library_template_id;
    
    RETURN v_new_template_id;
END;
$function$;

-- Add helpful comment for documentation
COMMENT ON FUNCTION public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) IS 
'Fixed critical production issue: corrected table references (email_templates not email_automation) and column mappings (imported_at not created_at) - 2025-08-28';

-- Verify the function exists and has correct signature
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'import_template_from_library'
        AND p.pronargs = 4
    ) THEN
        RAISE EXCEPTION 'Function import_template_from_library was not created properly';
    END IF;
    
    RAISE NOTICE '✅ import_template_from_library function successfully restored with correct implementation';
END $$;