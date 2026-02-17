-- Add hero_subheading column for campaign landing pages
ALTER TABLE campaign_landing_pages
  ADD COLUMN IF NOT EXISTS hero_subheading TEXT;
