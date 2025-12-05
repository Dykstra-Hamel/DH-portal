-- Create campaign landing pages table for customizable landing page content

CREATE TABLE IF NOT EXISTS campaign_landing_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Hero Section
  hero_title TEXT DEFAULT 'Quarterly Pest Control starting at only $44/mo',
  hero_subtitle TEXT DEFAULT 'Special Offer',
  hero_description TEXT,
  hero_button_text TEXT DEFAULT 'Upgrade Today!',
  hero_image_urls JSONB DEFAULT '[]'::jsonb,

  -- Pricing Display
  display_price TEXT DEFAULT '$44/mo',
  display_original_price TEXT,
  display_savings TEXT,

  -- Letter Section
  show_letter BOOLEAN DEFAULT TRUE,
  letter_content TEXT,
  letter_signature_text TEXT DEFAULT 'The Team',
  letter_image_url TEXT,

  -- Features Section
  feature_heading TEXT DEFAULT 'No initial cost to get started',
  feature_bullets JSONB DEFAULT '[]'::jsonb,
  feature_image_url TEXT,

  -- Additional Services Section
  show_additional_services BOOLEAN DEFAULT TRUE,
  additional_services_heading TEXT DEFAULT 'And thats not all, we offer additional add-on programs as well including:',
  additional_services JSONB DEFAULT '[]'::jsonb,
  additional_services_image_url TEXT,

  -- FAQ Section
  show_faq BOOLEAN DEFAULT TRUE,
  faq_heading TEXT DEFAULT 'Frequently Asked Questions',
  faq_items JSONB DEFAULT '[]'::jsonb,

  -- Header CTAs
  header_primary_button_text TEXT DEFAULT 'Upgrade Now',
  header_secondary_button_text TEXT DEFAULT 'Call (888) 888-8888',
  show_header_cta BOOLEAN DEFAULT TRUE,

  -- Brand Overrides (optional - will fallback to brands table if not set)
  override_logo_url TEXT,
  override_primary_color VARCHAR(7),
  override_secondary_color VARCHAR(7),
  override_phone VARCHAR(50),

  -- Footer
  footer_company_tagline TEXT DEFAULT 'Personal. Urgent. Reliable.',
  footer_links JSONB DEFAULT '[]'::jsonb,

  -- Modal Terms
  terms_content TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for campaign lookups
CREATE INDEX IF NOT EXISTS idx_campaign_landing_pages_campaign_id ON campaign_landing_pages(campaign_id);

-- Create updated_at trigger
CREATE TRIGGER update_campaign_landing_pages_updated_at
  BEFORE UPDATE ON campaign_landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE campaign_landing_pages ENABLE ROW LEVEL SECURITY;

-- Public read access (for landing pages)
CREATE POLICY "Allow public read for landing pages" ON campaign_landing_pages
  FOR SELECT USING (true);

-- Authenticated users can manage landing pages for their companies
CREATE POLICY "Allow authenticated users to manage landing pages" ON campaign_landing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = campaign_landing_pages.campaign_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('admin', 'manager', 'owner')
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE campaign_landing_pages IS 'Stores customizable content and branding for campaign landing pages';
COMMENT ON COLUMN campaign_landing_pages.hero_image_urls IS 'Array of image URLs for hero section collage: ["url1", "url2", ...]';
COMMENT ON COLUMN campaign_landing_pages.feature_bullets IS 'Array of feature bullet points: ["Feature 1", "Feature 2", ...]';
COMMENT ON COLUMN campaign_landing_pages.additional_services IS 'Array of service objects: [{"name": "Service Name", "description": "..."}, ...]';
COMMENT ON COLUMN campaign_landing_pages.faq_items IS 'Array of FAQ objects: [{"question": "Q?", "answer": "A."}, ...]';
COMMENT ON COLUMN campaign_landing_pages.footer_links IS 'Array of footer link objects: [{"label": "Link", "url": "/path"}, ...]';
COMMENT ON COLUMN campaign_landing_pages.override_logo_url IS 'Campaign-specific logo override (fallback to brands.logo_url)';
COMMENT ON COLUMN campaign_landing_pages.override_primary_color IS 'Campaign-specific primary color override (fallback to brands.primary_color_hex)';
COMMENT ON COLUMN campaign_landing_pages.override_secondary_color IS 'Campaign-specific secondary color override (fallback to brands.secondary_color_hex)';
COMMENT ON COLUMN campaign_landing_pages.override_phone IS 'Campaign-specific phone number override (fallback to companies.phone)';
