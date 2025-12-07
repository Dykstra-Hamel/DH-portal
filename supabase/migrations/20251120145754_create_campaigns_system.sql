-- Create campaigns system tables

-- 1. Main campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(100) NOT NULL DEFAULT 'mixed', -- 'email', 'sms', 'mixed', 'ai_call'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE,
    workflow_id UUID REFERENCES automation_workflows(id) ON DELETE SET NULL,
    target_audience_type VARCHAR(100) DEFAULT 'custom_list', -- 'all_customers', 'custom_list', 'filtered'
    audience_filter_criteria JSONB DEFAULT '{}',
    total_contacts INTEGER DEFAULT 0,
    processed_contacts INTEGER DEFAULT 0,
    successful_contacts INTEGER DEFAULT 0,
    failed_contacts INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, name)
);

-- 2. Campaign contact lists table
CREATE TABLE IF NOT EXISTS campaign_contact_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    list_name VARCHAR(255) NOT NULL,
    description TEXT,
    total_contacts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(campaign_id, list_name)
);

-- 3. Campaign contact list members (junction table)
CREATE TABLE IF NOT EXISTS campaign_contact_list_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_list_id UUID NOT NULL REFERENCES campaign_contact_lists(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'processed', 'excluded', 'bounced', 'unsubscribed', 'failed'
    execution_id UUID REFERENCES automation_executions(id) ON DELETE SET NULL,
    error_message TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(contact_list_id, customer_id)
);

-- 4. Campaign executions (links campaigns to automation_executions)
CREATE TABLE IF NOT EXISTS campaign_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    automation_execution_id UUID NOT NULL REFERENCES automation_executions(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_status VARCHAR(50) DEFAULT 'pending',

    UNIQUE(campaign_id, automation_execution_id)
);

-- Create indexes for performance
CREATE INDEX idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_start_datetime ON campaigns(start_datetime);
CREATE INDEX idx_campaigns_workflow_id ON campaigns(workflow_id);

CREATE INDEX idx_campaign_contact_lists_campaign_id ON campaign_contact_lists(campaign_id);

CREATE INDEX idx_campaign_members_contact_list_id ON campaign_contact_list_members(contact_list_id);
CREATE INDEX idx_campaign_members_customer_id ON campaign_contact_list_members(customer_id);
CREATE INDEX idx_campaign_members_lead_id ON campaign_contact_list_members(lead_id);
CREATE INDEX idx_campaign_members_status ON campaign_contact_list_members(status);
CREATE INDEX idx_campaign_members_execution_id ON campaign_contact_list_members(execution_id);

CREATE INDEX idx_campaign_executions_campaign_id ON campaign_executions(campaign_id);
CREATE INDEX idx_campaign_executions_automation_execution_id ON campaign_executions(automation_execution_id);
CREATE INDEX idx_campaign_executions_customer_id ON campaign_executions(customer_id);
CREATE INDEX idx_campaign_executions_status ON campaign_executions(execution_status);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Users can read campaigns for their companies" ON campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = campaigns.company_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can manage campaigns" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = campaigns.company_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- RLS Policies for campaign_contact_lists
CREATE POLICY "Users can read contact lists for their companies" ON campaign_contact_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_contact_lists.campaign_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can manage contact lists" ON campaign_contact_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_contact_lists.campaign_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- RLS Policies for campaign_contact_list_members
CREATE POLICY "Users can read contact list members for their companies" ON campaign_contact_list_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaign_contact_lists ccl
            JOIN campaigns c ON c.id = ccl.campaign_id
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE ccl.id = campaign_contact_list_members.contact_list_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can manage contact list members" ON campaign_contact_list_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaign_contact_lists ccl
            JOIN campaigns c ON c.id = ccl.campaign_id
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE ccl.id = campaign_contact_list_members.contact_list_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- RLS Policies for campaign_executions
CREATE POLICY "Users can read campaign executions for their companies" ON campaign_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_executions.campaign_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Create updated_at triggers
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_contact_lists_updated_at
    BEFORE UPDATE ON campaign_contact_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update campaign contact counts
CREATE OR REPLACE FUNCTION update_campaign_contact_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update contact list total
    UPDATE campaign_contact_lists
    SET total_contacts = (
        SELECT COUNT(*)
        FROM campaign_contact_list_members
        WHERE contact_list_id = NEW.contact_list_id
    )
    WHERE id = NEW.contact_list_id;

    -- Update campaign totals
    UPDATE campaigns
    SET total_contacts = (
        SELECT COUNT(*)
        FROM campaign_contact_list_members cclm
        JOIN campaign_contact_lists ccl ON ccl.id = cclm.contact_list_id
        WHERE ccl.campaign_id = (
            SELECT campaign_id FROM campaign_contact_lists WHERE id = NEW.contact_list_id
        )
    ),
    processed_contacts = (
        SELECT COUNT(*)
        FROM campaign_contact_list_members cclm
        JOIN campaign_contact_lists ccl ON ccl.id = cclm.contact_list_id
        WHERE ccl.campaign_id = (
            SELECT campaign_id FROM campaign_contact_lists WHERE id = NEW.contact_list_id
        )
        AND cclm.status IN ('processed', 'failed', 'bounced')
    ),
    successful_contacts = (
        SELECT COUNT(*)
        FROM campaign_contact_list_members cclm
        JOIN campaign_contact_lists ccl ON ccl.id = cclm.contact_list_id
        WHERE ccl.campaign_id = (
            SELECT campaign_id FROM campaign_contact_lists WHERE id = NEW.contact_list_id
        )
        AND cclm.status = 'processed'
    ),
    failed_contacts = (
        SELECT COUNT(*)
        FROM campaign_contact_list_members cclm
        JOIN campaign_contact_lists ccl ON ccl.id = cclm.contact_list_id
        WHERE ccl.campaign_id = (
            SELECT campaign_id FROM campaign_contact_lists WHERE id = NEW.contact_list_id
        )
        AND cclm.status IN ('failed', 'bounced')
    )
    WHERE id = (
        SELECT campaign_id FROM campaign_contact_lists WHERE id = NEW.contact_list_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Trigger to update counts when members are added/updated
CREATE TRIGGER update_campaign_counts_on_member_change
    AFTER INSERT OR UPDATE OF status ON campaign_contact_list_members
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_contact_counts();

-- Enable realtime for campaigns table
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_contact_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_contact_list_members;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_executions;
