-- Add a default "Service Confirmation" email template for every company.
-- This migration only introduces the new service_confirmation template; the
-- existing 4 default templates (welcome, two follow-ups, quote) seeded by
-- 20250811000002_insert_default_templates.sql are intentionally left
-- untouched.

CREATE OR REPLACE FUNCTION create_service_confirmation_template(target_company_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO email_templates (company_id, name, description, template_type, subject_line, html_content, text_content, variables)
    VALUES (
        target_company_id,
        'Service Confirmation',
        'Confirmation email sent after a customer schedules service',
        'service_confirmation',
        'Your service is scheduled for {{scheduledDate}}',
        '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Your service is scheduled</title>
    <style>
      @media (max-width: 480px) {
        .email-body { padding: 10px !important; }
        .banner-area { display: block !important; padding: 10px !important; }
        .banner-area-content, .banner-area-image { display: block !important; position: relative !important; width: 100% !important; margin: 10px auto !important; }
      }
    </style>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0">
    <div style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 33px 20px;">
      <div style="margin: 0 auto; width: 600px; max-width: 100%; background: #fff;">
        <section class="email-body" style="display: block; background: #fff; box-sizing: border-box; padding: 30px 40px; margin: 0 auto; color: #515151; font-family: Arial, sans-serif; border-radius: 26px;">
          <div style="text-align: center;">
            <img src="{{ companyLogo }}" alt="{{ companyName }} logo" style="max-width: 100%; width: 135px; height: auto" />
          </div>
          <div class="banner-area" style="display: flex; width: 100%; background: rgba(0, 82, 155, 0.05); margin: 40px 0; padding: 30px; border-radius: 6px;">
            <div class="banner-area-content" style="display: block; width: 48%; text-align: left; margin: 0 auto 0 0;">
              <p style="color: {{ brandPrimaryColor }}; font-size: 14px; font-weight: 700; line-height: 14px; letter-spacing: 0.4px; text-transform: uppercase; margin-top: 0;">Service Confirmed</p>
              <p style="font-size: 28px; font-weight: 700; line-height: 32px; letter-spacing: -0.28px; margin: 10px 0;">You&apos;re all set, {{ firstName }}.</p>
              <p style="font-size: 16px; font-weight: 500; line-height: 22px; letter-spacing: -0.16px; margin-bottom: 0;">We&apos;ll see you on <strong>{{ scheduledDate }}</strong> at <strong>{{ scheduledTime }}</strong>.</p>
            </div>
            <div class="banner-area-image" style="display: block; width: 48%; margin: 0 0 0 auto;">
              <div style="background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: #94a3b8;">Date</p>
                <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #0f172a;">{{ scheduledDate }}</p>
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: #94a3b8;">Time</p>
                <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #0f172a;">{{ scheduledTime }}</p>
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: #94a3b8;">Service Address</p>
                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #0f172a;">{{ streetAddress }}<br />{{ city }}, {{ state }} {{ zipCode }}</p>
              </div>
            </div>
          </div>
          <div class="main-content" style="width: 100%;">
            <p style="margin: 20px 0; font-size: 18px;">Hi {{ firstName }},</p>
            <p style="margin: 20px 0; font-size: 18px;">Thanks for choosing {{ companyName }}. Here&apos;s what to expect on the day of your service:</p>
            <ul style="margin: 20px 0; font-size: 16px; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Your technician will arrive within the scheduled window.</li>
              <li style="margin-bottom: 8px;">Please secure pets and clear access to treatment areas.</li>
              <li style="margin-bottom: 8px;">We&apos;ll walk you through findings and next steps before we leave.</li>
            </ul>
            <p style="margin: 20px 0; font-size: 18px;"><strong>Your investment:</strong> {{ quoteTotalInitialPrice }} initial &middot; {{ quoteTotalRecurringPrice }}/mo recurring.</p>
            <p style="margin: 20px 0; font-size: 18px;">Need to make a change? Give us a call at <span style="color: {{ brandPrimaryColor }}; font-weight: 700;">{{ companyPhone }}</span> and we&apos;ll get it sorted.</p>
            <p style="margin: 20px 0; font-size: 18px;">Sincerely,<br />The {{ companyName }} Team</p>
          </div>
          <div class="bottom-cta-section" style="text-align: center; margin-top: 40px;">
            <p style="margin-bottom: 30px;">
              <a href="tel:{{ companyPhone }}" style="background: {{ brandPrimaryColor }}; padding: 14px 30px; color: #fff; border-radius: 6px; font-weight: 700; text-decoration: none;">Need to Reschedule? Call Us</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  </body>
</html>',
        'Hi {{firstName}},

Thanks for choosing {{companyName}}. Your service is confirmed for {{scheduledDate}} at {{scheduledTime}}.

Service Address:
{{streetAddress}}
{{city}}, {{state}} {{zipCode}}

What to expect on the day of your service:
- Your technician will arrive within the scheduled window.
- Please secure pets and clear access to treatment areas.
- We will walk you through findings and next steps before we leave.

Your investment: {{quoteTotalInitialPrice}} initial - {{quoteTotalRecurringPrice}}/mo recurring.

Need to make a change? Give us a call at {{companyPhone}} and we will get it sorted.

Sincerely,
The {{companyName}} Team',
        '["firstName", "customerName", "companyName", "companyLogo", "companyPhone", "brandPrimaryColor", "scheduledDate", "scheduledTime", "streetAddress", "city", "state", "zipCode", "quoteTotalInitialPrice", "quoteTotalRecurringPrice"]'::jsonb
    ) ON CONFLICT (company_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Backfill: insert the Service Confirmation template for every existing
-- company. ON CONFLICT DO NOTHING keeps repeated runs safe.
DO $$
DECLARE
    company_record RECORD;
BEGIN
    FOR company_record IN SELECT id FROM companies LOOP
        PERFORM create_service_confirmation_template(company_record.id);
    END LOOP;
END $$;

-- New companies: seed the Service Confirmation template alongside the
-- existing default templates handled by create_templates_on_company_insert.
CREATE OR REPLACE FUNCTION create_service_confirmation_for_new_company()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_service_confirmation_template(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_service_confirmation_on_company_insert ON companies;

CREATE TRIGGER create_service_confirmation_on_company_insert
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_service_confirmation_for_new_company();
