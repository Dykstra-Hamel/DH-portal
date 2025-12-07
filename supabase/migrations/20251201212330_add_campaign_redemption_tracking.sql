-- Add campaign redemption tracking columns to campaign_contact_list_members
-- This allows tracking of signature, device data, scheduling preferences, and redemption state

ALTER TABLE campaign_contact_list_members
ADD COLUMN redeemed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN signature_data TEXT,
ADD COLUMN signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN device_data JSONB,
ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN requested_date DATE,
ADD COLUMN requested_time VARCHAR(50);

-- Create indexes for performance on redemption queries
CREATE INDEX idx_campaign_members_redeemed_at ON campaign_contact_list_members(redeemed_at);
CREATE INDEX idx_campaign_members_signed_at ON campaign_contact_list_members(signed_at);

-- Add comments for documentation
COMMENT ON COLUMN campaign_contact_list_members.redeemed_at IS 'Timestamp when campaign offer was redeemed (Step 4 completed)';
COMMENT ON COLUMN campaign_contact_list_members.signature_data IS 'Base64-encoded signature image data from canvas';
COMMENT ON COLUMN campaign_contact_list_members.signed_at IS 'Timestamp when signature was captured';
COMMENT ON COLUMN campaign_contact_list_members.device_data IS 'Device and session metadata captured at signature time';
COMMENT ON COLUMN campaign_contact_list_members.terms_accepted IS 'Whether customer accepted terms and conditions';
COMMENT ON COLUMN campaign_contact_list_members.requested_date IS 'Customer preferred service start date';
COMMENT ON COLUMN campaign_contact_list_members.requested_time IS 'Customer preferred arrival time (morning/afternoon/evening/anytime)';
