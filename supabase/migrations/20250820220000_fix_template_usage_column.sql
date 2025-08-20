-- FIX COLUMN NAME ERROR IN import_template_from_library FUNCTION
-- Function was trying to insert 'created_at' but table has 'imported_at' column

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
    -- Get the library template (using correct table name: email_template_library)
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
    
    -- Determine the final name
    v_final_name := COALESCE(p_custom_name, v_library_template.name);
    
    -- Create the company template
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
    ) VALUES (
        p_company_id,
        v_final_name,
        COALESCE(p_customizations->>'description', v_library_template.description),
        v_library_template.template_category,
        COALESCE(p_customizations->>'subject_line', v_library_template.subject_line),
        COALESCE(p_customizations->>'html_content', v_library_template.html_content),
        COALESCE(p_customizations->>'text_content', v_library_template.text_content),
        v_library_template.variables,
        true
    ) RETURNING id INTO v_new_template_id;
    
    -- Record the usage (FIXED: Use 'imported_at' not 'created_at', let DEFAULT NOW() handle timestamp)
    INSERT INTO public.template_library_usage (
        library_template_id,
        company_id,
        company_template_id,
        customizations
    ) VALUES (
        p_library_template_id,
        p_company_id,
        v_new_template_id,
        p_customizations
    ) ON CONFLICT (library_template_id, company_id) 
    DO UPDATE SET
        company_template_id = EXCLUDED.company_template_id,
        imported_at = NOW(),
        customizations = EXCLUDED.customizations;
    
    RETURN v_new_template_id;
END;
$function$;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) IS 'Fixed column name: template_library_usage uses imported_at not created_at - 2025-08-20';