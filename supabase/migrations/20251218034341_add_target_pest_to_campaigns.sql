-- Add optional target pest reference to campaigns
-- This allows campaigns to specify which pest they're targeting,
-- and automatically applies that pest to leads created from campaign redemptions

ALTER TABLE campaigns
ADD COLUMN target_pest_id UUID REFERENCES pest_types(id) ON DELETE SET NULL;

-- Add index for lookups
CREATE INDEX idx_campaigns_target_pest_id ON campaigns(target_pest_id);

-- Add comment for documentation
COMMENT ON COLUMN campaigns.target_pest_id IS
'Optional target pest for this campaign. When set, leads created from this campaign will automatically have this pest type assigned.';
