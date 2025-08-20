-- FINAL FIX FOR WORKFLOW_TYPE CONSTRAINT VIOLATION
-- This migration runs AFTER 20250820130000 and 20250820170000 to ensure the 
-- create_default_automation_workflows function has the correct schema with workflow_type

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
        workflow_type,     -- REQUIRED: This was missing in 20250820130000
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