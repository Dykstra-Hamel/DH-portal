-- Fix Template Import Regression
-- Issue: Previous fix broke template imports completely
-- Root causes:
--   1. Missing duplicate handling for template_library_usage table
--   2. Need proper error handling and fallback logic
--   3. Missing library_template_id and customizations columns in email_templates

-- Drop the broken function
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;

-- Create properly working version based on successful 20250820110000 migration
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
    WHERE id = p_library_template_id AND is_active = true;
    
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
            is_active
        ) VALUES (
            p_company_id,
            COALESCE(p_custom_name, library_template.name),
            library_template.description,
            library_template.template_category, -- Note: using template_category from library
            library_template.subject_line,
            library_template.html_content,
            library_template.text_content,
            library_template.variables,
            false -- Start inactive
        ) RETURNING id INTO new_template_id;
    EXCEPTION WHEN undefined_table THEN
        -- Fall back to email_automation table if email_templates doesn't exist
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
    
    -- Track the usage with proper duplicate handling
    INSERT INTO template_library_usage (
        library_template_id,
        company_id,
        company_template_id,
        customizations,
        imported_at
    ) VALUES (
        p_library_template_id,
        p_company_id,
        new_template_id,
        COALESCE(p_customizations, '{}'::jsonb),
        NOW()
    ) ON CONFLICT (library_template_id, company_id) 
      DO UPDATE SET 
        company_template_id = EXCLUDED.company_template_id,
        customizations = EXCLUDED.customizations,
        imported_at = NOW();
    
    -- Update library template usage count
    UPDATE email_template_library 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_library_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- Add comprehensive comment
COMMENT ON FUNCTION public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) IS 
'Fixed regression: restored proper table references, added ON CONFLICT handling for duplicates, maintained fallback logic - 2025-08-28';

-- Test the function exists
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
    
    RAISE NOTICE '✅ import_template_from_library function fixed with proper duplicate handling';
END $$;