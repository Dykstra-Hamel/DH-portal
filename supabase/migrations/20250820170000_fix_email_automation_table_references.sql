-- FIX EMAIL_AUTOMATION TABLE REFERENCES AND WORKFLOW_TYPE CONSTRAINT
-- Several functions are trying to INSERT into non-existent email_automation table
-- AND create_default_automation_workflows is missing required workflow_type column
-- This migration corrects all functions to use the correct schema

-- Fix create_default_email_templates function
CREATE OR REPLACE FUNCTION public.create_default_email_templates(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.email_templates (
        company_id,
        name,
        template_type,
        subject_line,
        html_content,
        text_content,
        is_active
    ) VALUES 
    (target_company_id, 'Welcome Email', 'welcome', 'Welcome to Our Service!', 
     '<p>Thank you for your interest in our services.</p>', 
     'Thank you for your interest in our services.', true),
    (target_company_id, 'Follow Up', 'followup', 'Following Up on Your Service Request', 
     '<p>We wanted to follow up on your recent inquiry.</p>',
     'We wanted to follow up on your recent inquiry.', true)
    ON CONFLICT (company_id, name) DO NOTHING;
END;
$function$;

-- Fix import_template_from_library function
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    library_template RECORD;
    new_template_id UUID;
BEGIN
    -- Get template from library
    SELECT 
        name,
        description,
        subject_line,
        html_content,
        text_content,
        template_type,
        variables
    INTO library_template
    FROM public.template_library 
    WHERE id = p_library_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    -- Create new template in email_templates table
    INSERT INTO public.email_templates (
        company_id,
        name,
        description,
        subject_line,
        html_content,
        text_content,
        template_type,
        variables,
        is_active
    ) VALUES (
        p_company_id,
        COALESCE(p_custom_name, library_template.name),
        library_template.description,
        library_template.subject_line,
        library_template.html_content,
        library_template.text_content,
        library_template.template_type,
        library_template.variables,
        true
    ) RETURNING id INTO new_template_id;
    
    -- Update usage count in library
    UPDATE public.template_library 
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = p_library_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- Fix create_default_automation_workflows function - add missing workflow_type column
CREATE OR REPLACE FUNCTION public.create_default_automation_workflows(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.automation_workflows (
        company_id, 
        name, 
        description, 
        workflow_type,  -- This was missing!
        trigger_type,
        trigger_conditions,
        workflow_steps, 
        is_active,
        business_hours_only
    ) VALUES 
    (target_company_id, 'New Lead Follow-up', 'Automatic follow-up for new leads', 
     'lead_nurturing', 'lead_created', '{}'::jsonb, '[]'::jsonb, true, true),
    (target_company_id, 'Quote Follow-up', 'Follow-up after quote is sent', 
     'follow_up', 'quote_sent', '{}'::jsonb, '[]'::jsonb, true, true)
    ON CONFLICT (company_id, name) DO NOTHING;
END;
$function$;