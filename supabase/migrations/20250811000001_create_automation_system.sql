-- Create automation system tables

-- 1. Email templates table for company-specific email content
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(100) NOT NULL DEFAULT 'custom', -- 'welcome', 'followup', 'quote', 'reminder', 'custom'
    subject_line TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, name)
);

-- 2. Automation workflows table for workflow definitions
CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(100) NOT NULL, -- 'lead_nurturing', 'email_sequence', 'lead_scoring', 'follow_up'
    trigger_type VARCHAR(100) NOT NULL, -- 'lead_created', 'lead_updated', 'email_opened', 'scheduled', 'manual'
    trigger_conditions JSONB DEFAULT '{}', -- Conditions that must be met to trigger
    workflow_steps JSONB NOT NULL DEFAULT '[]', -- Array of workflow steps
    is_active BOOLEAN DEFAULT true,
    business_hours_only BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, name)
);

-- 3. Automation rules table for conditional logic
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    step_id VARCHAR(100) NOT NULL, -- Reference to step in workflow_steps
    rule_type VARCHAR(100) NOT NULL, -- 'condition', 'filter', 'branch'
    field_name VARCHAR(100) NOT NULL, -- Field to evaluate (e.g., 'pest_type', 'lead_source')
    operator VARCHAR(50) NOT NULL, -- 'equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in'
    value JSONB NOT NULL, -- Value to compare against
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Automation executions table for tracking workflow runs
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    execution_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    current_step VARCHAR(100),
    execution_data JSONB DEFAULT '{}', -- Runtime data and variables
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Email automation log table for tracking email sends
CREATE TABLE IF NOT EXISTS email_automation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID NOT NULL REFERENCES automation_executions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject_line TEXT NOT NULL,
    send_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'opened', 'clicked', 'failed'
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    email_provider_id VARCHAR(255), -- ID from email service provider
    tracking_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for all tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automation_log ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Users can read email templates for their companies" ON email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = email_templates.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can modify email templates" ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = email_templates.company_id 
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Automation workflows policies
CREATE POLICY "Users can read automation workflows for their companies" ON automation_workflows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = automation_workflows.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can modify automation workflows" ON automation_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = automation_workflows.company_id 
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Automation rules policies
CREATE POLICY "Users can read automation rules for their companies" ON automation_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_workflows aw
            JOIN user_companies uc ON uc.company_id = aw.company_id
            WHERE aw.id = automation_rules.workflow_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can modify automation rules" ON automation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM automation_workflows aw
            JOIN user_companies uc ON uc.company_id = aw.company_id
            WHERE aw.id = automation_rules.workflow_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Automation executions policies
CREATE POLICY "Users can read automation executions for their companies" ON automation_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = automation_executions.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Email automation log policies
CREATE POLICY "Users can read email automation log for their companies" ON email_automation_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = email_automation_log.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_email_templates_company_id ON email_templates(company_id);
CREATE INDEX idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX idx_automation_workflows_company_id ON automation_workflows(company_id);
CREATE INDEX idx_automation_workflows_trigger_type ON automation_workflows(trigger_type);
CREATE INDEX idx_automation_workflows_active ON automation_workflows(is_active);
CREATE INDEX idx_automation_rules_workflow_id ON automation_rules(workflow_id);
CREATE INDEX idx_automation_executions_workflow_id ON automation_executions(workflow_id);
CREATE INDEX idx_automation_executions_company_id ON automation_executions(company_id);
CREATE INDEX idx_automation_executions_lead_id ON automation_executions(lead_id);
CREATE INDEX idx_automation_executions_status ON automation_executions(execution_status);
CREATE INDEX idx_email_automation_log_execution_id ON email_automation_log(execution_id);
CREATE INDEX idx_email_automation_log_company_id ON email_automation_log(company_id);
CREATE INDEX idx_email_automation_log_recipient_email ON email_automation_log(recipient_email);
CREATE INDEX idx_email_automation_log_send_status ON email_automation_log(send_status);

-- Insert default automation settings into company_settings for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'automation_enabled',
    'true',
    'boolean',
    'Enable automation workflows for this company'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'automation_business_hours_only',
    'true',
    'boolean',
    'Only run automations during business hours'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'automation_max_emails_per_day',
    '10',
    'number',
    'Maximum number of automation emails to send per day per lead'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Update the create_default_company_settings function to include automation settings
CREATE OR REPLACE FUNCTION create_default_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
    VALUES 
        (NEW.id, 'auto_call_enabled', 'true', 'boolean', 'Automatically initiate phone calls for new leads'),
        (NEW.id, 'business_hours_start', '09:00', 'string', 'Business hours start time (24h format)'),
        (NEW.id, 'business_hours_end', '17:00', 'string', 'Business hours end time (24h format)'),
        (NEW.id, 'call_throttle_minutes', '5', 'number', 'Minimum minutes between calls to same customer'),
        (NEW.id, 'weekend_calling_enabled', 'false', 'boolean', 'Allow calls on weekends'),
        (NEW.id, 'auto_contact_method', 'text', 'string', 'Preferred automatic contact method: text or call'),
        (NEW.id, 'email_domain', '', 'string', 'Custom domain for sending emails (e.g., nwexterminating.com)'),
        (NEW.id, 'email_domain_status', 'not_configured', 'string', 'Domain verification status'),
        (NEW.id, 'email_domain_region', 'us-east-1', 'string', 'Resend email sending region'),
        (NEW.id, 'email_domain_prefix', 'noreply', 'string', 'Email address prefix'),
        (NEW.id, 'email_domain_records', '[]', 'json', 'DNS records required for domain verification'),
        (NEW.id, 'resend_domain_id', '', 'string', 'Resend API domain identifier'),
        (NEW.id, 'email_domain_verified_at', '', 'string', 'Timestamp when domain was verified'),
        (NEW.id, 'automation_enabled', 'true', 'boolean', 'Enable automation workflows for this company'),
        (NEW.id, 'automation_business_hours_only', 'true', 'boolean', 'Only run automations during business hours'),
        (NEW.id, 'automation_max_emails_per_day', '10', 'number', 'Maximum number of automation emails per day per lead')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;