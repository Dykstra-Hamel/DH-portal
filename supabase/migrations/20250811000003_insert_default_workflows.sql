-- Insert default automation workflows for existing companies

-- Function to create default automation workflows for a company
CREATE OR REPLACE FUNCTION create_default_automation_workflows(target_company_id UUID)
RETURNS void AS $$
DECLARE
    welcome_template_id UUID;
    followup1_template_id UUID;
    followup24_template_id UUID;
BEGIN
    -- Get template IDs for this company
    SELECT id INTO welcome_template_id FROM email_templates 
    WHERE company_id = target_company_id AND name = 'Welcome - Immediate Response';
    
    SELECT id INTO followup1_template_id FROM email_templates 
    WHERE company_id = target_company_id AND name = 'Follow-up - 1 Hour';
    
    SELECT id INTO followup24_template_id FROM email_templates 
    WHERE company_id = target_company_id AND name = 'Follow-up - 24 Hours';

    -- Standard Lead Nurturing Workflow
    INSERT INTO automation_workflows (company_id, name, description, workflow_type, trigger_type, trigger_conditions, workflow_steps, is_active, business_hours_only)
    VALUES (
        target_company_id,
        'Standard Lead Nurturing',
        'Comprehensive lead nurturing sequence for new leads',
        'lead_nurturing',
        'lead_created',
        '{}'::jsonb,
        jsonb_build_array(
            jsonb_build_object(
                'id', 'welcome_email',
                'type', 'send_email',
                'template_id', welcome_template_id,
                'delay_minutes', 0,
                'required', true
            ),
            jsonb_build_object(
                'id', 'followup_1_hour',
                'type', 'send_email', 
                'template_id', followup1_template_id,
                'delay_minutes', 60,
                'required', false
            ),
            jsonb_build_object(
                'id', 'followup_24_hour',
                'type', 'send_email',
                'template_id', followup24_template_id,
                'delay_minutes', 1440,
                'required', false
            )
        ),
        true,
        true
    ) ON CONFLICT (company_id, name) DO NOTHING;

    -- Urgent Lead Fast Response Workflow
    INSERT INTO automation_workflows (company_id, name, description, workflow_type, trigger_type, trigger_conditions, workflow_steps, is_active, business_hours_only)
    VALUES (
        target_company_id,
        'Urgent Lead Fast Response',
        'Fast response workflow for urgent pest control requests',
        'follow_up',
        'lead_created',
        jsonb_build_object(
            'urgency_levels', jsonb_build_array('urgent', 'high')
        ),
        jsonb_build_array(
            jsonb_build_object(
                'id', 'immediate_welcome',
                'type', 'send_email',
                'template_id', welcome_template_id,
                'delay_minutes', 0,
                'required', true
            ),
            jsonb_build_object(
                'id', 'quick_followup',
                'type', 'send_email',
                'template_id', followup1_template_id, 
                'delay_minutes', 30,
                'required', false
            )
        ),
        true,
        false
    ) ON CONFLICT (company_id, name) DO NOTHING;

    -- Re-engagement Workflow (for leads that haven't responded)
    INSERT INTO automation_workflows (company_id, name, description, workflow_type, trigger_type, trigger_conditions, workflow_steps, is_active, business_hours_only)
    VALUES (
        target_company_id,
        'Lead Re-engagement',
        'Re-engage leads who haven''t responded after 3 days',
        'email_sequence',
        'scheduled',
        jsonb_build_object(
            'lead_age_hours', 72,
            'lead_statuses', jsonb_build_array('new', 'contacted')
        ),
        jsonb_build_array(
            jsonb_build_object(
                'id', 'reengage_email',
                'type', 'send_email',
                'template_id', followup24_template_id,
                'delay_minutes', 0,
                'required', false
            ),
            jsonb_build_object(
                'id', 'update_status',
                'type', 'update_lead_status',
                'new_status', 'contacted',
                'delay_minutes', 5,
                'required', false
            )
        ),
        false, -- Start inactive - let companies enable if they want
        true
    ) ON CONFLICT (company_id, name) DO NOTHING;
    
END;
$$ LANGUAGE plpgsql;

-- Create default workflows for all existing companies
DO $$
DECLARE
    company_record RECORD;
BEGIN
    FOR company_record IN SELECT id FROM companies LOOP
        PERFORM create_default_automation_workflows(company_record.id);
    END LOOP;
END $$;

-- Create trigger to add default workflows when new companies are created
CREATE OR REPLACE FUNCTION create_default_workflows_for_new_company()
RETURNS TRIGGER AS $$
BEGIN
    -- Wait for templates to be created first
    PERFORM pg_sleep(1);
    PERFORM create_default_automation_workflows(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS create_workflows_on_company_insert ON companies;
CREATE TRIGGER create_workflows_on_company_insert
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workflows_for_new_company();