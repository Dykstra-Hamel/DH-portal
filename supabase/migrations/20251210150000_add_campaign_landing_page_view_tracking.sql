-- Add campaign landing page view tracking
-- This enables tracking of page views, conversion analytics, and workflow triggering based on view behavior

-- Create table to track individual page views
CREATE TABLE IF NOT EXISTS campaign_landing_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  device_data JSONB,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_campaign_landing_page_views_campaign_id ON campaign_landing_page_views(campaign_id);
CREATE INDEX idx_campaign_landing_page_views_customer_id ON campaign_landing_page_views(customer_id);
CREATE INDEX idx_campaign_landing_page_views_viewed_at ON campaign_landing_page_views(viewed_at);
CREATE INDEX idx_campaign_landing_page_views_campaign_customer ON campaign_landing_page_views(campaign_id, customer_id);

-- Add view tracking summary columns to campaign_contact_list_members
ALTER TABLE campaign_contact_list_members
ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for view tracking queries
CREATE INDEX IF NOT EXISTS idx_campaign_members_last_viewed_at ON campaign_contact_list_members(last_viewed_at);
CREATE INDEX IF NOT EXISTS idx_campaign_members_view_count ON campaign_contact_list_members(view_count);

-- Enable Row Level Security
ALTER TABLE campaign_landing_page_views ENABLE ROW LEVEL SECURITY;

-- Public insert access (for tracking views from landing pages)
CREATE POLICY "Allow public insert for view tracking" ON campaign_landing_page_views
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read view data for their companies
CREATE POLICY "Allow authenticated users to read view data" ON campaign_landing_page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = campaign_landing_page_views.campaign_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('admin', 'manager', 'owner')
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE campaign_landing_page_views IS 'Tracks individual campaign landing page views for analytics and workflow triggering';
COMMENT ON COLUMN campaign_landing_page_views.campaign_id IS 'Campaign that was viewed';
COMMENT ON COLUMN campaign_landing_page_views.customer_id IS 'Customer who viewed the page';
COMMENT ON COLUMN campaign_landing_page_views.viewed_at IS 'Timestamp of the page view';
COMMENT ON COLUMN campaign_landing_page_views.device_data IS 'Device and session metadata captured at view time';
COMMENT ON COLUMN campaign_landing_page_views.session_id IS 'Browser session identifier for deduplication';

COMMENT ON COLUMN campaign_contact_list_members.first_viewed_at IS 'Timestamp of first landing page view';
COMMENT ON COLUMN campaign_contact_list_members.last_viewed_at IS 'Timestamp of most recent landing page view';
COMMENT ON COLUMN campaign_contact_list_members.view_count IS 'Total number of landing page views';
