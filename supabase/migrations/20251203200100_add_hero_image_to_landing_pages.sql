-- Add single hero image field to campaign_landing_pages
-- Replaces the previous 4-image grid approach

ALTER TABLE campaign_landing_pages
ADD COLUMN hero_image_url TEXT;

-- Update comment
COMMENT ON COLUMN campaign_landing_pages.hero_image_url IS
'Single hero image URL for campaign landing page. Replaces 4-image grid approach with simplified single image upload.';
