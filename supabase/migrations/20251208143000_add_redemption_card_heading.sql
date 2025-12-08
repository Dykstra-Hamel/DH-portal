-- Add redemption card heading field to campaign_landing_pages table
-- This allows customization of the heading text in the inline redemption card
-- with support for variable replacement (e.g., {original_price}, {display_price}, {savings})

ALTER TABLE campaign_landing_pages
ADD COLUMN redemption_card_heading TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN campaign_landing_pages.redemption_card_heading IS
  'Custom heading for the redemption card. Supports variables: {original_price}, {display_price}, {savings}, {first_name}, {company_name}, {service_name}, etc. Styling is applied automatically during rendering.';
