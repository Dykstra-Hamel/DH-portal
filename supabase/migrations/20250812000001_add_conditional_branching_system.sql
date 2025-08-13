-- Add conditional branching and advanced automation features

-- 1. Extend automation_workflows table to support conditional rules
ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS conditional_rules JSONB DEFAULT '[]';

-- 2. Create workflow_branches table for complex branching logic
CREATE TABLE IF NOT EXISTS workflow_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    parent_step_id VARCHAR(100) NOT NULL,
    condition_type VARCHAR(50) NOT NULL, -- 'lead_score', 'urgency', 'pest_type', 'call_outcome', 'email_opened', 'time_based'
    condition_operator VARCHAR(20) NOT NULL, -- 'equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in_array', 'not_in_array'
    condition_value JSONB NOT NULL,
    branch_steps JSONB NOT NULL DEFAULT '[]', -- Array of steps to execute if condition is met
    branch_name VARCHAR(255),
    priority INTEGER DEFAULT 0, -- For ordering multiple branches
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create template_performance table for tracking email effectiveness
CREATE TABLE IF NOT EXISTS template_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'open_rate', 'click_rate', 'conversion_rate', 'response_rate'
    metric_value DECIMAL(5,2) NOT NULL,
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    lead_count INTEGER DEFAULT 0,
    sample_size INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create template_marketplace for sharing templates
CREATE TABLE IF NOT EXISTS template_marketplace (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    created_by_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    industry_tags TEXT[] DEFAULT '{}',
    pest_type_tags TEXT[] DEFAULT '{}',
    performance_score DECIMAL(3,2) DEFAULT 0, -- 0-1 based on conversion rates
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0, -- 0-5 star rating
    rating_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create call_automation_log for tracking automated calls
CREATE TABLE IF NOT EXISTS call_automation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID NOT NULL REFERENCES automation_executions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    call_id VARCHAR(255), -- Retell call ID
    call_type VARCHAR(50) DEFAULT 'outbound', -- 'outbound', 'follow_up', 'urgent'
    scheduled_for TIMESTAMP WITH TIME ZONE,
    attempted_at TIMESTAMP WITH TIME ZONE,
    call_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'calling', 'completed', 'failed', 'no_answer'
    call_outcome VARCHAR(100), -- 'successful', 'no_answer', 'busy', 'declined', 'voicemail'
    duration_seconds INTEGER,
    retell_variables JSONB DEFAULT '{}',
    call_analysis JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create automation_analytics for workflow performance tracking
CREATE TABLE IF NOT EXISTS automation_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    date_period DATE NOT NULL,
    executions_started INTEGER DEFAULT 0,
    executions_completed INTEGER DEFAULT 0,
    executions_failed INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    calls_attempted INTEGER DEFAULT 0,
    calls_completed INTEGER DEFAULT 0,
    leads_converted INTEGER DEFAULT 0,
    avg_completion_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, company_id, date_period)
);

-- Add RLS policies for all new tables
ALTER TABLE workflow_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_analytics ENABLE ROW LEVEL SECURITY;

-- Workflow branches policies
CREATE POLICY "Users can read workflow branches for their companies" ON workflow_branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_workflows aw
            JOIN user_companies uc ON uc.company_id = aw.company_id
            WHERE aw.id = workflow_branches.workflow_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can modify workflow branches" ON workflow_branches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM automation_workflows aw
            JOIN user_companies uc ON uc.company_id = aw.company_id
            WHERE aw.id = workflow_branches.workflow_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Template performance policies
CREATE POLICY "Users can read template performance for their companies" ON template_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = template_performance.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Template marketplace policies (public read for browsing, restricted write)
CREATE POLICY "Everyone can read public marketplace templates" ON template_marketplace
    FOR SELECT USING (is_public = true OR approved_at IS NOT NULL);

CREATE POLICY "Company admins can manage their marketplace templates" ON template_marketplace
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = template_marketplace.created_by_company_id 
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Call automation log policies
CREATE POLICY "Users can read call automation log for their companies" ON call_automation_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = call_automation_log.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Automation analytics policies
CREATE POLICY "Users can read automation analytics for their companies" ON automation_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = automation_analytics.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_workflow_branches_workflow_id ON workflow_branches(workflow_id);
CREATE INDEX idx_workflow_branches_parent_step ON workflow_branches(parent_step_id);
CREATE INDEX idx_workflow_branches_condition_type ON workflow_branches(condition_type);
CREATE INDEX idx_template_performance_template_id ON template_performance(template_id);
CREATE INDEX idx_template_performance_company_id ON template_performance(company_id);
CREATE INDEX idx_template_performance_metric_type ON template_performance(metric_type);
CREATE INDEX idx_template_marketplace_public ON template_marketplace(is_public);
CREATE INDEX idx_template_marketplace_industry_tags ON template_marketplace USING GIN(industry_tags);
CREATE INDEX idx_template_marketplace_pest_tags ON template_marketplace USING GIN(pest_type_tags);
CREATE INDEX idx_template_marketplace_performance ON template_marketplace(performance_score);
CREATE INDEX idx_call_automation_log_execution_id ON call_automation_log(execution_id);
CREATE INDEX idx_call_automation_log_company_id ON call_automation_log(company_id);
CREATE INDEX idx_call_automation_log_call_id ON call_automation_log(call_id);
CREATE INDEX idx_call_automation_log_status ON call_automation_log(call_status);
CREATE INDEX idx_automation_analytics_workflow_id ON automation_analytics(workflow_id);
CREATE INDEX idx_automation_analytics_company_date ON automation_analytics(company_id, date_period);

-- Insert default conditional rules for existing workflows that can benefit from them
UPDATE automation_workflows 
SET conditional_rules = jsonb_build_array(
    jsonb_build_object(
        'field', 'urgency',
        'operator', 'in_array', 
        'values', jsonb_build_array('urgent', 'high'),
        'description', 'High urgency leads get faster response'
    ),
    jsonb_build_object(
        'field', 'pest_type',
        'operator', 'equals',
        'values', 'termites',
        'description', 'Termite issues require specialized handling'
    )
)
WHERE conditional_rules = '[]'::jsonb 
AND workflow_type IN ('lead_nurturing', 'follow_up');

-- Create function to update automation analytics daily
CREATE OR REPLACE FUNCTION update_automation_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO automation_analytics (
        workflow_id, 
        company_id, 
        date_period,
        executions_started,
        executions_completed,
        executions_failed,
        emails_sent,
        calls_attempted,
        leads_converted
    )
    SELECT 
        ae.workflow_id,
        ae.company_id,
        CURRENT_DATE - INTERVAL '1 day',
        COUNT(CASE WHEN ae.execution_status IN ('pending', 'running', 'completed') THEN 1 END),
        COUNT(CASE WHEN ae.execution_status = 'completed' THEN 1 END),
        COUNT(CASE WHEN ae.execution_status = 'failed' THEN 1 END),
        (SELECT COUNT(*) FROM email_automation_log eal WHERE eal.execution_id = ae.id),
        (SELECT COUNT(*) FROM call_automation_log cal WHERE cal.execution_id = ae.id),
        COUNT(CASE WHEN ae.execution_status = 'completed' AND 
                         EXISTS(SELECT 1 FROM leads l WHERE l.id = ae.lead_id AND l.lead_status = 'qualified') 
                  THEN 1 END)
    FROM automation_executions ae
    WHERE DATE(ae.started_at) = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY ae.workflow_id, ae.company_id
    ON CONFLICT (workflow_id, company_id, date_period) 
    DO UPDATE SET
        executions_started = EXCLUDED.executions_started,
        executions_completed = EXCLUDED.executions_completed,
        executions_failed = EXCLUDED.executions_failed,
        emails_sent = EXCLUDED.emails_sent,
        calls_attempted = EXCLUDED.calls_attempted,
        leads_converted = EXCLUDED.leads_converted;
END;
$$ LANGUAGE plpgsql;