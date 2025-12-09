-- Add hero button icon URL column to campaign_landing_pages table
ALTER TABLE campaign_landing_pages
ADD COLUMN hero_button_icon_url TEXT DEFAULT NULL;

COMMENT ON COLUMN campaign_landing_pages.hero_button_icon_url IS
  'Optional icon/badge URL to display next to the hero CTA button (e.g., BBB accreditation, trust badges). Desktop: 135px width with 18px gap. Mobile: 106px width below button with 25px gap.';
