-- Modify template_marketplace for admin-managed template library

-- 1. Modify template_marketplace table to support admin-created templates
ALTER TABLE template_marketplace ALTER COLUMN created_by_company_id DROP NOT NULL;
ALTER TABLE template_marketplace ADD COLUMN IF NOT EXISTS is_admin_template BOOLEAN DEFAULT false;
ALTER TABLE template_marketplace ADD COLUMN IF NOT EXISTS template_category VARCHAR(100) DEFAULT 'general';
ALTER TABLE template_marketplace ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_marketplace_admin_template ON template_marketplace(is_admin_template);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_category ON template_marketplace(template_category);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_featured ON template_marketplace(featured);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_public ON template_marketplace(is_public);

-- 3. Update RLS policies for admin template management
-- Drop existing policies for marketplace
DROP POLICY IF EXISTS "Everyone can read public marketplace templates" ON template_marketplace;
DROP POLICY IF EXISTS "Company admins can manage their marketplace templates" ON template_marketplace;

-- Create new policies for admin-managed template library
CREATE POLICY "Everyone can read public admin templates" ON template_marketplace
    FOR SELECT USING (is_public = true AND is_admin_template = true);

CREATE POLICY "Global admins can manage admin templates" ON template_marketplace
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 4. Create email_template_library table to store admin-created template content
CREATE TABLE IF NOT EXISTS email_template_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_category VARCHAR(100) NOT NULL DEFAULT 'general',
    industry_tags TEXT[] DEFAULT '{}',
    pest_type_tags TEXT[] DEFAULT '{}',
    subject_line TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    performance_score DECIMAL(3,2) DEFAULT 0, -- 0-1 based on average performance
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name)
);

-- Add RLS for email_template_library
ALTER TABLE email_template_library ENABLE ROW LEVEL SECURITY;

-- Public read access for active templates
CREATE POLICY "Everyone can read active template library" ON email_template_library
    FOR SELECT USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Global admins can manage template library" ON email_template_library
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 5. Create template_library_usage table to track company usage
CREATE TABLE IF NOT EXISTS template_library_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    library_template_id UUID NOT NULL REFERENCES email_template_library(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    company_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customizations JSONB DEFAULT '{}', -- Track what was customized during import
    
    UNIQUE(library_template_id, company_id) -- Prevent duplicate imports
);

-- Add RLS for template_library_usage
ALTER TABLE template_library_usage ENABLE ROW LEVEL SECURITY;

-- Companies can see their own usage
CREATE POLICY "Companies can read their template usage" ON template_library_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = template_library_usage.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- System can insert usage records
CREATE POLICY "System can track template usage" ON template_library_usage
    FOR INSERT WITH CHECK (true);

-- 6. Create indexes for template_library_usage
CREATE INDEX IF NOT EXISTS idx_template_library_usage_library_template ON template_library_usage(library_template_id);
CREATE INDEX IF NOT EXISTS idx_template_library_usage_company ON template_library_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_template_library_usage_imported_at ON template_library_usage(imported_at);

-- 7. Create function to update template library usage counts
CREATE OR REPLACE FUNCTION update_template_library_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage count on the library template
    UPDATE email_template_library 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.library_template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update usage counts
CREATE TRIGGER trigger_update_template_library_usage
    AFTER INSERT ON template_library_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_template_library_usage_count();

-- 8. Insert some default admin templates
INSERT INTO email_template_library (
    name, 
    description, 
    template_category, 
    industry_tags, 
    pest_type_tags, 
    subject_line, 
    html_content, 
    text_content, 
    variables, 
    is_featured,
    created_by
) VALUES 
(
    'Professional Welcome Email',
    'Professional welcome email template for new pest control leads',
    'welcome',
    '{"pest_control"}',
    '{"general", "ants", "roaches", "termites"}',
    'Thank you for contacting {{companyName}} - We''re here to help!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thank you for contacting us</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Thank You for Contacting {{companyName}}!</h1>
        
        <p>Dear {{customerName}},</p>
        
        <p>Thank you for reaching out to {{companyName}} regarding your {{pestType}} concern. We appreciate you choosing us for your pest control needs.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Your Request Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Service Type:</strong> {{pestType}}</li>
                <li><strong>Urgency Level:</strong> {{urgency}}</li>
                {{#if address}}<li><strong>Service Address:</strong> {{address}}</li>{{/if}}
            </ul>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ol>
            <li>Our specialist will review your request within 1 hour</li>
            <li>We''ll prepare a customized treatment plan</li>
            <li>A team member will contact you to schedule service</li>
        </ol>
        
        <p>For urgent matters, please call us directly at {{companyPhone}}.</p>
        
        <p>Best regards,<br>The {{companyName}} Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated response. A team member will contact you personally within business hours.</p>
        </div>
    </div>
</body>
</html>',
    'Dear {{customerName}},

Thank you for reaching out to {{companyName}} regarding your {{pestType}} concern. We appreciate you choosing us for your pest control needs.

Your Request Details:
- Service Type: {{pestType}}
- Urgency Level: {{urgency}}
{{#if address}}- Service Address: {{address}}{{/if}}

What happens next?
1. Our specialist will review your request within 1 hour
2. We''ll prepare a customized treatment plan  
3. A team member will contact you to schedule service

For urgent matters, please call us directly at {{companyPhone}}.

Best regards,
The {{companyName}} Team

This is an automated response. A team member will contact you personally within business hours.',
    '["customerName", "companyName", "pestType", "urgency", "address", "companyPhone"]'::jsonb,
    true,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
),
(
    'Follow-up Reminder',
    'Professional follow-up template for leads who haven''t responded',
    'followup',
    '{"pest_control", "hvac", "plumbing"}',
    '{"general"}',
    'Still need help with your {{pestType}} issue? - {{companyName}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Follow-up on your service request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <h1 style="color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">Following Up on Your Service Request</h1>
        
        <p>Hello {{customerName}},</p>
        
        <p>We wanted to follow up on your recent inquiry about {{pestType}} service. We understand that choosing the right service provider is an important decision.</p>
        
        <div style="background: #e8f5e8; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #27ae60;">Why Choose {{companyName}}?</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Licensed and insured professionals</li>
                <li>Guaranteed results with follow-up service</li>
                <li>Family and pet-safe treatment options</li>
                <li>Local expertise you can trust</li>
            </ul>
        </div>
        
        <p>We''re ready to help you resolve your {{pestType}} concern quickly and effectively. Our team is standing by to:</p>
        
        <ul>
            <li>Provide a free, no-obligation inspection</li>
            <li>Create a customized treatment plan</li>
            <li>Schedule service at your convenience</li>
        </ul>
        
        <p><strong>Ready to get started?</strong> Simply reply to this email or call us at {{companyPhone}}.</p>
        
        <p>Best regards,<br>The {{companyName}} Team</p>
    </div>
</body>
</html>',
    'Hello {{customerName}},

We wanted to follow up on your recent inquiry about {{pestType}} service. We understand that choosing the right service provider is an important decision.

Why Choose {{companyName}}?
- Licensed and insured professionals
- Guaranteed results with follow-up service  
- Family and pet-safe treatment options
- Local expertise you can trust

We''re ready to help you resolve your {{pestType}} concern quickly and effectively. Our team is standing by to:
- Provide a free, no-obligation inspection
- Create a customized treatment plan
- Schedule service at your convenience

Ready to get started? Simply reply to this email or call us at {{companyPhone}}.

Best regards,
The {{companyName}} Team',
    '["customerName", "companyName", "pestType", "companyPhone"]'::jsonb,
    true,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- 9. Create function to help companies import templates from library
CREATE OR REPLACE FUNCTION import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR(255) DEFAULT NULL,
    p_customizations JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_library_template email_template_library%ROWTYPE;
    v_new_template_id UUID;
    v_final_name VARCHAR(255);
BEGIN
    -- Get the library template
    SELECT * INTO v_library_template
    FROM email_template_library
    WHERE id = p_library_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Library template not found or inactive: %', p_library_template_id;
    END IF;
    
    -- Determine the final name
    v_final_name := COALESCE(p_custom_name, v_library_template.name);
    
    -- Create the company template
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
        v_final_name,
        COALESCE(p_customizations->>'description', v_library_template.description),
        v_library_template.template_category,
        COALESCE(p_customizations->>'subject_line', v_library_template.subject_line),
        COALESCE(p_customizations->>'html_content', v_library_template.html_content),
        COALESCE(p_customizations->>'text_content', v_library_template.text_content),
        v_library_template.variables,
        true
    ) RETURNING id INTO v_new_template_id;
    
    -- Record the usage
    INSERT INTO template_library_usage (
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
$$ LANGUAGE plpgsql;