-- Add optional service plan reference to campaigns
-- This allows campaigns to optionally link to a service plan for FAQs and features

ALTER TABLE campaigns
ADD COLUMN service_plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL;

-- Add index for lookups
CREATE INDEX idx_campaigns_service_plan_id ON campaigns(service_plan_id);

-- Update comment
COMMENT ON COLUMN campaigns.service_plan_id IS
'Optional link to service plan. If set, landing page will use plan FAQs and features. If null, uses manual entries from landing_page_config.';
