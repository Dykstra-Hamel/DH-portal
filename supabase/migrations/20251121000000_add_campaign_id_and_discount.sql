-- Add campaign_id and discount_id columns to campaigns table
-- campaign_id: Human-friendly unique identifier (e.g., "PEST26")
-- discount_id: Optional reference to company_discounts

ALTER TABLE campaigns
ADD COLUMN campaign_id VARCHAR(50) UNIQUE NOT NULL,
ADD COLUMN discount_id UUID REFERENCES company_discounts(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE UNIQUE INDEX idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX idx_campaigns_discount_id ON campaigns(discount_id);

-- Add comments for documentation
COMMENT ON COLUMN campaigns.campaign_id IS 'Human-friendly unique identifier used in reports and form submissions (e.g., PEST26)';
COMMENT ON COLUMN campaigns.discount_id IS 'Optional discount to apply to this campaign';
