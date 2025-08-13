-- Insert default email templates for each existing company

-- Function to create default email templates for a company
CREATE OR REPLACE FUNCTION create_default_email_templates(target_company_id UUID)
RETURNS void AS $$
BEGIN
    -- Welcome/Immediate Response Template
    INSERT INTO email_templates (company_id, name, description, template_type, subject_line, html_content, text_content, variables)
    VALUES (
        target_company_id,
        'Welcome - Immediate Response',
        'Immediate response sent when a new lead is created',
        'welcome',
        'Thank you for your service request - {{customerName}}',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thank you for your service request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Thank You for Your Service Request!</h1>
        
        <p>Hi {{customerName}},</p>
        
        <p>Thank you for reaching out to {{companyName}} regarding your {{pestType}} concern. We&apos;ve received your service request and wanted to get back to you immediately.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Your Request Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Service Type:</strong> {{pestType}}</li>
                <li><strong>Urgency:</strong> {{urgency}}</li>
                {{#if address}}<li><strong>Address:</strong> {{address}}</li>{{/if}}
                {{#if homeSize}}<li><strong>Home Size:</strong> {{homeSize}} sq ft</li>{{/if}}
            </ul>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ol>
            <li>Our team will review your request within the next hour</li>
            <li>We&apos;ll prepare a customized treatment plan for your situation</li>
            <li>A specialist will contact you to schedule an inspection</li>
        </ol>
        
        <p>If you have any urgent questions, please don&apos;t hesitate to call us at {{companyPhone}} or reply to this email.</p>
        
        <p>Best regards,<br>
        The {{companyName}} Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This email was sent because you requested service from {{companyName}}. If you believe this was sent in error, please contact us.</p>
        </div>
    </div>
</body>
</html>',
        'Hi {{customerName}},

Thank you for reaching out to {{companyName}} regarding your {{pestType}} concern. We''ve received your service request and wanted to get back to you immediately.

Your Request Details:
- Service Type: {{pestType}}
- Urgency: {{urgency}}
{{#if address}}- Address: {{address}}{{/if}}
{{#if homeSize}}- Home Size: {{homeSize}} sq ft{{/if}}

What happens next?
1. Our team will review your request within the next hour
2. We''ll prepare a customized treatment plan for your situation  
3. A specialist will contact you to schedule an inspection

If you have any urgent questions, please don''t hesitate to call us at {{companyPhone}} or reply to this email.

Best regards,
The {{companyName}} Team',
        '["customerName", "companyName", "pestType", "urgency", "address", "homeSize", "companyPhone"]'::jsonb
    ) ON CONFLICT (company_id, name) DO NOTHING;

    -- 1 Hour Follow-up Template
    INSERT INTO email_templates (company_id, name, description, template_type, subject_line, html_content, text_content, variables)
    VALUES (
        target_company_id,
        'Follow-up - 1 Hour',
        'Follow-up email sent 1 hour after initial contact',
        'followup',
        'We&apos;re preparing your custom pest control plan - {{customerName}}',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Custom Pest Control Plan</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <h1 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">Your Custom Treatment Plan is Being Prepared</h1>
        
        <p>Hi {{customerName}},</p>
        
        <p>Great news! Our pest control specialists have reviewed your {{pestType}} service request and are currently preparing a customized treatment plan specifically for your property.</p>
        
        <div style="background: #e8f5e8; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #27ae60;">🎯 Why Choose {{companyName}}?</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Local Expertise:</strong> We understand the unique pest challenges in your area</li>
                <li><strong>Safe & Effective:</strong> Family and pet-friendly treatment methods</li>
                <li><strong>Guaranteed Results:</strong> We stand behind our work with a satisfaction guarantee</li>
                <li><strong>Licensed Professionals:</strong> All our technicians are fully licensed and insured</li>
            </ul>
        </div>
        
        {{#if estimatedPrice}}
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">💰 Estimated Investment</h3>
            <p style="margin: 0; font-size: 18px;"><strong>${{estimatedPrice.min}} - ${{estimatedPrice.max}}</strong> for {{estimatedPrice.service_type}}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">*Final pricing determined after inspection</p>
        </div>
        {{/if}}
        
        <p><strong>What&apos;s happening behind the scenes?</strong></p>
        <ul>
            <li>✅ Your request has been assigned to our {{pestType}} specialist</li>
            <li>🔍 We&apos;re researching the most effective treatment for your situation</li>
            <li>📋 Your custom treatment plan and quote are being prepared</li>
            <li>📞 A specialist will call you within the next 2-3 hours</li>
        </ul>
        
        <p>In the meantime, here are some immediate tips for dealing with {{pestType}}:</p>
        <p><em>[This section would contain pest-specific advice based on the pest type]</em></p>
        
        <p>Questions? Call us at {{companyPhone}} - we&apos;re here to help!</p>
        
        <p>Best regards,<br>
        The {{companyName}} Team</p>
    </div>
</body>
</html>',
        'Hi {{customerName}},

Great news! Our pest control specialists have reviewed your {{pestType}} service request and are currently preparing a customized treatment plan specifically for your property.

🎯 Why Choose {{companyName}}?
- Local Expertise: We understand the unique pest challenges in your area
- Safe & Effective: Family and pet-friendly treatment methods  
- Guaranteed Results: We stand behind our work with a satisfaction guarantee
- Licensed Professionals: All our technicians are fully licensed and insured

{{#if estimatedPrice}}
💰 Estimated Investment: ${{estimatedPrice.min}} - ${{estimatedPrice.max}} for {{estimatedPrice.service_type}}
*Final pricing determined after inspection
{{/if}}

What''s happening behind the scenes?
✅ Your request has been assigned to our {{pestType}} specialist
🔍 We''re researching the most effective treatment for your situation  
📋 Your custom treatment plan and quote are being prepared
📞 A specialist will call you within the next 2-3 hours

Questions? Call us at {{companyPhone}} - we''re here to help!

Best regards,
The {{companyName}} Team',
        '["customerName", "companyName", "pestType", "companyPhone", "estimatedPrice"]'::jsonb
    ) ON CONFLICT (company_id, name) DO NOTHING;

    -- 24 Hour Follow-up Template
    INSERT INTO email_templates (company_id, name, description, template_type, subject_line, html_content, text_content, variables)
    VALUES (
        target_company_id,
        'Follow-up - 24 Hours',
        'Follow-up email sent 24 hours after initial contact if no response',
        'followup',
        'Don&apos;t let {{pestType}} take over your home - {{customerName}}',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Don''t Wait - Pest Problems Get Worse</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <h1 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">🚨 Don&apos;t Wait - {{pestType}} Problems Get Worse!</h1>
        
        <p>Hi {{customerName}},</p>
        
        <p>We reached out yesterday about your {{pestType}} concern, but haven&apos;t heard back from you yet. We wanted to follow up because <strong>pest problems rarely resolve on their own</strong> - and waiting often makes treatment more expensive and difficult.</p>
        
        <div style="background: #ffebee; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #d32f2f;">⏰ Why Acting Quickly Matters:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Population Growth:</strong> Most pests multiply rapidly - a small problem becomes a big one fast</li>
                <li><strong>Property Damage:</strong> Many pests cause structural damage that worsens over time</li>
                <li><strong>Health Risks:</strong> Pests can carry diseases and allergens harmful to your family</li>
                <li><strong>Cost Increases:</strong> Early treatment is always more affordable than dealing with infestations</li>
            </ul>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #27ae60;">🎯 Still Available: Free Inspection & Quote</h3>
            <p style="margin: 0 0 15px 0; font-size: 16px;">Get a professional assessment of your {{pestType}} situation at no cost.</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">Call {{companyPhone}} now to schedule</p>
        </div>
        
        <p><strong>What our customers say:</strong></p>
        <blockquote style="font-style: italic; border-left: 3px solid #3498db; padding-left: 15px; margin: 15px 0; color: #555;">
            "I wish I had called {{companyName}} sooner! They solved my {{pestType}} problem in one treatment, and the technician was incredibly professional and knowledgeable."
            <br><br>- Happy Customer
        </blockquote>
        
        <p>Don&apos;t let this problem get worse. Our {{pestType}} specialists are standing by to help you reclaim your home.</p>
        
        <p><strong>Ready to get started?</strong> Simply reply to this email or call {{companyPhone}}.</p>
        
        <p>Best regards,<br>
        The {{companyName}} Team</p>
        
        <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
                No longer interested? <a href="#" style="color: #3498db;">Click here to unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>',
        'Hi {{customerName}},

We reached out yesterday about your {{pestType}} concern, but haven''t heard back from you yet. We wanted to follow up because pest problems rarely resolve on their own - and waiting often makes treatment more expensive and difficult.

⏰ Why Acting Quickly Matters:
- Population Growth: Most pests multiply rapidly - a small problem becomes a big one fast
- Property Damage: Many pests cause structural damage that worsens over time  
- Health Risks: Pests can carry diseases and allergens harmful to your family
- Cost Increases: Early treatment is always more affordable than dealing with infestations

🎯 Still Available: Free Inspection & Quote
Get a professional assessment of your {{pestType}} situation at no cost.
Call {{companyPhone}} now to schedule.

What our customers say:
"I wish I had called {{companyName}} sooner! They solved my {{pestType}} problem in one treatment, and the technician was incredibly professional and knowledgeable." - Happy Customer

Don''t let this problem get worse. Our {{pestType}} specialists are standing by to help you reclaim your home.

Ready to get started? Simply reply to this email or call {{companyPhone}}.

Best regards,
The {{companyName}} Team',
        '["customerName", "companyName", "pestType", "companyPhone"]'::jsonb
    ) ON CONFLICT (company_id, name) DO NOTHING;

    -- Quote Follow-up Template
    INSERT INTO email_templates (company_id, name, description, template_type, subject_line, html_content, text_content, variables)
    VALUES (
        target_company_id,
        'Quote Follow-up',
        'Follow-up email sent after a quote has been provided',
        'quote',
        'Your {{pestType}} treatment quote from {{companyName}}',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Pest Control Quote</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <h1 style="color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">Your {{pestType}} Treatment Quote</h1>
        
        <p>Hi {{customerName}},</p>
        
        <p>Thank you for your interest in our {{pestType}} treatment services. As requested, here is your personalized quote:</p>
        
        {{#if estimatedPrice}}
        <div style="background: #e8f5e8; padding: 20px; border-left: 4px solid #27ae60; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 15px 0; color: #27ae60;">💰 Your Investment</h3>
            <div style="font-size: 24px; font-weight: bold; color: #27ae60; margin-bottom: 10px;">
                ${{estimatedPrice.min}}{{#if estimatedPrice.max}} - ${{estimatedPrice.max}}{{/if}}
            </div>
            <p style="margin: 0; color: #666;">{{estimatedPrice.service_type}}</p>
        </div>
        {{/if}}
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📋 What&apos;s Included:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Comprehensive property inspection</li>
                <li>Professional-grade {{pestType}} treatment</li>
                <li>30-day satisfaction guarantee</li>
                <li>Follow-up monitoring visit</li>
                <li>Prevention recommendations</li>
            </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">⏰ Limited Time Offer</h3>
            <p style="margin: 0;">Schedule within the next 7 days and save 15% on your first treatment!</p>
        </div>
        
        <p><strong>Ready to schedule your treatment?</strong></p>
        <ul>
            <li>📞 Call us at {{companyPhone}}</li>
            <li>📧 Reply to this email</li>
            <li>🌐 Visit our website to book online</li>
        </ul>
        
        <p>Questions about the quote or our process? Don&apos;t hesitate to reach out - we&apos;re here to help!</p>
        
        <p>Best regards,<br>
        The {{companyName}} Team</p>
    </div>
</body>
</html>',
        'Hi {{customerName}},

Thank you for your interest in our {{pestType}} treatment services. As requested, here is your personalized quote:

{{#if estimatedPrice}}
💰 Your Investment: ${{estimatedPrice.min}}{{#if estimatedPrice.max}} - ${{estimatedPrice.max}}{{/if}}
{{estimatedPrice.service_type}}
{{/if}}

📋 What''s Included:
- Comprehensive property inspection
- Professional-grade {{pestType}} treatment  
- 30-day satisfaction guarantee
- Follow-up monitoring visit
- Prevention recommendations

⏰ Limited Time Offer
Schedule within the next 7 days and save 15% on your first treatment!

Ready to schedule your treatment?
📞 Call us at {{companyPhone}}
📧 Reply to this email  
🌐 Visit our website to book online

Questions about the quote or our process? Don''t hesitate to reach out - we''re here to help!

Best regards,
The {{companyName}} Team',
        '["customerName", "companyName", "pestType", "companyPhone", "estimatedPrice"]'::jsonb
    ) ON CONFLICT (company_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create default templates for all existing companies
DO $$
DECLARE
    company_record RECORD;
BEGIN
    FOR company_record IN SELECT id FROM companies LOOP
        PERFORM create_default_email_templates(company_record.id);
    END LOOP;
END $$;

-- Create trigger to add default templates when new companies are created
CREATE OR REPLACE FUNCTION create_default_templates_for_new_company()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_email_templates(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_templates_on_company_insert
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_default_templates_for_new_company();