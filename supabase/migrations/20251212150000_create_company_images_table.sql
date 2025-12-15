-- Campaign Image Library Migration
-- Creates company_images table for reusable company-wide image library
-- Creates campaign_image_usage table to track image usage across campaigns

-- =====================================================
-- Table: company_images
-- Purpose: Store reusable images for company campaigns
-- =====================================================
CREATE TABLE company_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,  -- Storage path: {companyId}/library/{filename}
  file_name TEXT NOT NULL,  -- Original filename
  file_size INTEGER NOT NULL,  -- File size in bytes
  mime_type TEXT NOT NULL,  -- image/jpeg, image/png, image/webp, etc.
  width INTEGER,  -- Original width in pixels
  height INTEGER,  -- Original height in pixels
  aspect_ratio DECIMAL(10,2),  -- Calculated: width/height
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  alt_text TEXT,  -- Optional alt text for accessibility
  tags TEXT[],  -- Searchable tags for categorization

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,  -- How many campaigns use this image
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_company_images_company_id ON company_images(company_id);
CREATE INDEX idx_company_images_created_at ON company_images(created_at DESC);
CREATE INDEX idx_company_images_tags ON company_images USING GIN(tags);

-- Row Level Security
ALTER TABLE company_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view images from their company
CREATE POLICY "Users can view company images"
  ON company_images FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can upload images for their company
CREATE POLICY "Users can upload company images"
  ON company_images FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update images from their company
CREATE POLICY "Users can update company images"
  ON company_images FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete images from their company
CREATE POLICY "Users can delete company images"
  ON company_images FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Table: campaign_image_usage
-- Purpose: Track which images are used in which campaigns
-- =====================================================
CREATE TABLE campaign_image_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_landing_page_id UUID NOT NULL REFERENCES campaign_landing_pages(id) ON DELETE CASCADE,
  company_image_id UUID NOT NULL REFERENCES company_images(id) ON DELETE CASCADE,
  image_field TEXT NOT NULL,  -- 'hero_image', 'features_image', 'additional_services_image'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure each campaign landing page can only have one image per field
  UNIQUE(campaign_landing_page_id, image_field)
);

-- Indexes for performance
CREATE INDEX idx_campaign_image_usage_campaign ON campaign_image_usage(campaign_landing_page_id);
CREATE INDEX idx_campaign_image_usage_image ON campaign_image_usage(company_image_id);

-- =====================================================
-- Update campaign_landing_pages table
-- Add crop metadata columns for aspect ratio enforcement
-- =====================================================
ALTER TABLE campaign_landing_pages
  ADD COLUMN IF NOT EXISTS hero_image_crop JSONB,
  ADD COLUMN IF NOT EXISTS features_image_crop JSONB,
  ADD COLUMN IF NOT EXISTS additional_services_image_crop JSONB;

-- Add comments for documentation
COMMENT ON TABLE company_images IS 'Stores reusable images in company-wide library for campaign landing pages';
COMMENT ON TABLE campaign_image_usage IS 'Tracks which company images are used in which campaign landing pages';
COMMENT ON COLUMN company_images.aspect_ratio IS 'Calculated aspect ratio (width/height) for quick filtering';
COMMENT ON COLUMN company_images.usage_count IS 'Number of campaigns currently using this image';
COMMENT ON COLUMN campaign_landing_pages.hero_image_crop IS 'Crop coordinates for hero image: {x, y, width, height}';
COMMENT ON COLUMN campaign_landing_pages.features_image_crop IS 'Crop coordinates for features image: {x, y, width, height}';
COMMENT ON COLUMN campaign_landing_pages.additional_services_image_crop IS 'Crop coordinates for additional services image: {x, y, width, height}';
