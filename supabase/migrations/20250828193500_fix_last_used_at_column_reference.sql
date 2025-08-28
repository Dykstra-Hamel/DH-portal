-- Fix last_used_at column reference in import_template_from_library function
-- The column doesn't exist in email_template_library table, should use updated_at instead

CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR DEFAULT NULL,
    p_customizations JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_template_id UUID;
    library_template RECORD;
BEGIN
    RAISE NOTICE 'TEMPLATE IMPORT: Starting import for template % to company %', p_library_template_id, p_company_id;
    
    -- Get the template from the library
    SELECT * INTO library_template
    FROM email_template_library 
    WHERE id = p_library_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    RAISE NOTICE 'TEMPLATE IMPORT: Found library template: %', library_template.name;
    
    -- Create new template for the company based on ACTUAL email_templates columns ONLY
    -- Columns from 20250811000001_create_automation_system.sql:
    -- id, company_id, name, description, template_type, subject_line, html_content, text_content, variables, is_active, created_at, updated_at
    -- IMPORTANT: NO library_template_id column exists in email_templates table
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
            library_template.template_category, -- Map template_category to template_type
            library_template.subject_line,
            library_template.html_content,
            library_template.text_content,
            library_template.variables,
            true -- Start active
        ) RETURNING id INTO new_template_id;
        
        RAISE NOTICE 'TEMPLATE IMPORT: Created email template with ID: %', new_template_id;
        
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'TEMPLATE IMPORT: email_templates table not found, trying email_automation fallback';
        -- Fall back to email_automation table if email_templates doesn't exist
        -- IMPORTANT: NO library_template_id column exists in email_automation table either
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
        
        RAISE NOTICE 'TEMPLATE IMPORT: Created email_automation with ID: %', new_template_id;
    END;
    
    -- Track the usage with proper duplicate handling
    -- Only insert columns that exist in template_library_usage table
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
    
    RAISE NOTICE 'TEMPLATE IMPORT: Tracked usage for template %', p_library_template_id;
    
    -- Update library template usage count (FIXED: use updated_at not last_used_at)
    UPDATE email_template_library 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_library_template_id;
    
    RAISE NOTICE 'TEMPLATE IMPORT: Updated usage count for library template %', p_library_template_id;
    RAISE NOTICE 'TEMPLATE IMPORT: Successfully completed import, returning ID: %', new_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) IS 
'FIXED: Corrected last_used_at reference to updated_at since last_used_at column does not exist - 2025-08-28';