-- Add redemption card subheading field to campaign_landing_pages table
-- Controls the prompt above the date/time inputs in the inline redemption card
-- (default fallback in the UI is "When do you want us to get started?").
-- Supports the same variable replacement as other landing-page text fields.

ALTER TABLE campaign_landing_pages
ADD COLUMN redemption_card_subheading TEXT DEFAULT NULL;

COMMENT ON COLUMN campaign_landing_pages.redemption_card_subheading IS
  'Custom subheading shown above the redemption card date/time inputs. Supports variables: {first_name}, {company_name}, {service_name}, etc. Defaults to "When do you want us to get started?" when null.';
