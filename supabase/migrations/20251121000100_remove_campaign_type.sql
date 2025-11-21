-- Remove campaign_type column from campaigns table
-- This field was purely cosmetic and not used in any business logic
-- The workflow determines what actions actually happen (email, SMS, calls, etc.)

ALTER TABLE campaigns
DROP COLUMN IF EXISTS campaign_type;
