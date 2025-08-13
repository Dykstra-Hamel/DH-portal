-- Create A/B testing system for email templates

-- 1. A/B test campaigns table - core test definitions
CREATE TABLE IF NOT EXISTS ab_test_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    test_type VARCHAR(50) DEFAULT 'email_template', -- 'email_template', 'subject_line', 'workflow'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'cancelled'
    
    -- Test Configuration
    traffic_split_percentage INTEGER DEFAULT 50, -- Percentage of traffic to include in test
    variant_split JSONB DEFAULT '{"A": 50, "B": 50}', -- Traffic allocation per variant
    control_variant VARCHAR(10) DEFAULT 'A', -- Which variant is the control
    
    -- Duration and Timing
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Statistical Settings
    confidence_level DECIMAL(3,2) DEFAULT 0.95, -- 95% confidence level
    minimum_sample_size INTEGER DEFAULT 100, -- Minimum participants per variant
    minimum_effect_size DECIMAL(4,3) DEFAULT 0.05, -- 5% minimum detectable effect
    statistical_power DECIMAL(3,2) DEFAULT 0.80, -- 80% statistical power
    
    -- Auto-completion Rules
    auto_promote_winner BOOLEAN DEFAULT true,
    auto_complete_on_significance BOOLEAN DEFAULT true,
    max_duration_days INTEGER DEFAULT 30,
    
    -- Results
    winner_variant VARCHAR(10),
    winner_determined_at TIMESTAMP WITH TIME ZONE,
    statistical_significance BOOLEAN DEFAULT false,
    significance_level DECIMAL(5,4),
    
    -- Metadata
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, name)
);

-- 2. A/B test variants table - template variants for each test
CREATE TABLE IF NOT EXISTS ab_test_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES ab_test_campaigns(id) ON DELETE CASCADE,
    variant_label VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', etc.
    template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    is_control BOOLEAN DEFAULT false,
    
    -- Traffic allocation
    traffic_percentage INTEGER NOT NULL, -- Percentage of test traffic for this variant
    
    -- Performance Metrics (updated in real-time)
    participants_assigned INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0, -- Leads that converted to qualified/won
    
    -- Calculated Rates (updated via triggers)
    open_rate DECIMAL(5,4) DEFAULT 0,
    click_rate DECIMAL(5,4) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, variant_label),
    UNIQUE(campaign_id, template_id)
);

-- 3. A/B test assignments table - track which leads receive which variants
CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES ab_test_campaigns(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Assignment Details
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assignment_method VARCHAR(50) DEFAULT 'deterministic', -- 'deterministic', 'random'
    assignment_hash VARCHAR(64), -- Hash used for deterministic assignment
    
    -- Email Tracking
    email_log_id UUID REFERENCES email_automation_log(id) ON DELETE SET NULL,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_opened_at TIMESTAMP WITH TIME ZONE,
    email_clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Conversion Tracking
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_type VARCHAR(50), -- 'qualified', 'appointment', 'sale'
    conversion_value DECIMAL(10,2), -- Revenue value if applicable
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, lead_id) -- One assignment per lead per campaign
);

-- 4. A/B test results table - statistical analysis results
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES ab_test_campaigns(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Overall Test Metrics
    total_participants INTEGER DEFAULT 0,
    total_emails_sent INTEGER DEFAULT 0,
    test_duration_days INTEGER DEFAULT 0,
    
    -- Statistical Analysis
    primary_metric VARCHAR(50) DEFAULT 'conversion_rate', -- 'open_rate', 'click_rate', 'conversion_rate'
    control_rate DECIMAL(6,4), -- Control variant performance
    test_rate DECIMAL(6,4), -- Best test variant performance
    lift_percentage DECIMAL(6,3), -- Improvement over control
    
    -- Statistical Significance
    p_value DECIMAL(8,6),
    confidence_interval_lower DECIMAL(6,4),
    confidence_interval_upper DECIMAL(6,4),
    is_significant BOOLEAN DEFAULT false,
    confidence_level DECIMAL(3,2),
    
    -- Bayesian Analysis (if available)
    probability_to_beat_control DECIMAL(4,3), -- Probability that test beats control
    expected_loss_control DECIMAL(6,4), -- Expected loss if control is wrong choice
    expected_loss_test DECIMAL(6,4), -- Expected loss if test variant is wrong choice
    
    -- Recommendations
    recommended_action VARCHAR(50), -- 'continue', 'stop_and_implement_winner', 'stop_inconclusive', 'extend_test'
    recommended_winner VARCHAR(10),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for all tables
ALTER TABLE ab_test_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- A/B test campaigns policies
CREATE POLICY "Users can read ab test campaigns for their companies" ON ab_test_campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = ab_test_campaigns.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can modify ab test campaigns" ON ab_test_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = ab_test_campaigns.company_id 
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- A/B test variants policies
CREATE POLICY "Users can read ab test variants for their companies" ON ab_test_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can modify ab test variants" ON ab_test_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- A/B test assignments policies (read-only for users, system manages writes)
CREATE POLICY "Users can read ab test assignments for their companies" ON ab_test_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_assignments.campaign_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- A/B test results policies
CREATE POLICY "Users can read ab test results for their companies" ON ab_test_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_results.campaign_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_ab_test_campaigns_company_id ON ab_test_campaigns(company_id);
CREATE INDEX idx_ab_test_campaigns_status ON ab_test_campaigns(status);
CREATE INDEX idx_ab_test_campaigns_start_end_date ON ab_test_campaigns(start_date, end_date);
CREATE INDEX idx_ab_test_variants_campaign_id ON ab_test_variants(campaign_id);
CREATE INDEX idx_ab_test_variants_template_id ON ab_test_variants(template_id);
CREATE INDEX idx_ab_test_assignments_campaign_id ON ab_test_assignments(campaign_id);
CREATE INDEX idx_ab_test_assignments_lead_id ON ab_test_assignments(lead_id);
CREATE INDEX idx_ab_test_assignments_variant_id ON ab_test_assignments(variant_id);
CREATE INDEX idx_ab_test_assignments_email_log_id ON ab_test_assignments(email_log_id);
CREATE INDEX idx_ab_test_results_campaign_id ON ab_test_results(campaign_id);
CREATE INDEX idx_ab_test_results_analysis_date ON ab_test_results(analysis_date);

-- Create function to update variant metrics when assignments are updated
CREATE OR REPLACE FUNCTION update_variant_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update metrics for the affected variant
    UPDATE ab_test_variants 
    SET 
        participants_assigned = (
            SELECT COUNT(*) 
            FROM ab_test_assignments 
            WHERE variant_id = COALESCE(NEW.variant_id, OLD.variant_id)
        ),
        emails_sent = (
            SELECT COUNT(*) 
            FROM ab_test_assignments 
            WHERE variant_id = COALESCE(NEW.variant_id, OLD.variant_id)
            AND email_sent_at IS NOT NULL
        ),
        emails_opened = (
            SELECT COUNT(*) 
            FROM ab_test_assignments 
            WHERE variant_id = COALESCE(NEW.variant_id, OLD.variant_id)
            AND email_opened_at IS NOT NULL
        ),
        emails_clicked = (
            SELECT COUNT(*) 
            FROM ab_test_assignments 
            WHERE variant_id = COALESCE(NEW.variant_id, OLD.variant_id)
            AND email_clicked_at IS NOT NULL
        ),
        conversions = (
            SELECT COUNT(*) 
            FROM ab_test_assignments 
            WHERE variant_id = COALESCE(NEW.variant_id, OLD.variant_id)
            AND converted = true
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.variant_id, OLD.variant_id);
    
    -- Recalculate rates
    UPDATE ab_test_variants 
    SET 
        open_rate = CASE 
            WHEN emails_sent > 0 THEN emails_opened::DECIMAL / emails_sent::DECIMAL 
            ELSE 0 
        END,
        click_rate = CASE 
            WHEN emails_sent > 0 THEN emails_clicked::DECIMAL / emails_sent::DECIMAL 
            ELSE 0 
        END,
        conversion_rate = CASE 
            WHEN participants_assigned > 0 THEN conversions::DECIMAL / participants_assigned::DECIMAL 
            ELSE 0 
        END
    WHERE id = COALESCE(NEW.variant_id, OLD.variant_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update metrics
CREATE TRIGGER trigger_update_variant_metrics
    AFTER INSERT OR UPDATE OR DELETE ON ab_test_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_variant_metrics();

-- Create function to automatically assign leads to A/B test variants
CREATE OR REPLACE FUNCTION assign_lead_to_ab_test(
    p_company_id UUID,
    p_lead_id UUID,
    p_template_id UUID
) RETURNS UUID AS $$
DECLARE
    v_campaign ab_test_campaigns%ROWTYPE;
    v_variant ab_test_variants%ROWTYPE;
    v_assignment_hash TEXT;
    v_hash_int BIGINT;
    v_bucket INTEGER;
    v_cumulative_percentage INTEGER := 0;
    v_assignment_id UUID;
BEGIN
    -- Find active A/B test campaign for this template
    SELECT * INTO v_campaign
    FROM ab_test_campaigns
    WHERE company_id = p_company_id
    AND status = 'running'
    AND NOW() BETWEEN start_date AND end_date
    AND EXISTS (
        SELECT 1 FROM ab_test_variants 
        WHERE campaign_id = ab_test_campaigns.id 
        AND template_id = p_template_id
    )
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no active campaign, return NULL
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Check if lead is already assigned to this campaign
    SELECT variant_id INTO v_assignment_id
    FROM ab_test_assignments
    WHERE campaign_id = v_campaign.id AND lead_id = p_lead_id;
    
    IF FOUND THEN
        RETURN v_assignment_id;
    END IF;
    
    -- Generate deterministic assignment hash
    v_assignment_hash := encode(digest(v_campaign.id::TEXT || p_lead_id::TEXT, 'md5'), 'hex');
    v_hash_int := ('x' || substr(v_assignment_hash, 1, 8))::bit(32)::BIGINT;
    v_bucket := (v_hash_int % 100) + 1; -- 1-100
    
    -- Select variant based on traffic allocation
    FOR v_variant IN 
        SELECT * FROM ab_test_variants 
        WHERE campaign_id = v_campaign.id 
        ORDER BY variant_label
    LOOP
        v_cumulative_percentage := v_cumulative_percentage + v_variant.traffic_percentage;
        
        IF v_bucket <= v_cumulative_percentage THEN
            -- Assign lead to this variant
            INSERT INTO ab_test_assignments (
                campaign_id,
                variant_id,
                lead_id,
                assignment_hash,
                assignment_method
            ) VALUES (
                v_campaign.id,
                v_variant.id,
                p_lead_id,
                v_assignment_hash,
                'deterministic'
            ) RETURNING variant_id INTO v_assignment_id;
            
            RETURN v_assignment_id;
        END IF;
    END LOOP;
    
    -- Fallback (shouldn't happen if percentages add to 100)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to promote A/B test winner
CREATE OR REPLACE FUNCTION promote_ab_test_winner(
    p_campaign_id UUID,
    p_winner_variant VARCHAR(10)
) RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql;

-- Insert default A/B testing settings for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'ab_testing_enabled',
    'true',
    'boolean',
    'Enable A/B testing for email templates'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'ab_test_confidence_level',
    '0.95',
    'number',
    'Statistical confidence level for A/B tests (0-1)'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'ab_test_min_sample_size',
    '100',
    'number',
    'Minimum sample size per variant for A/B tests'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;