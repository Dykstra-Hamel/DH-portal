-- Fix unique constraint on campaign_contact_list_members to support reusable contact lists
-- The old constraint prevented the same contact list from being used in multiple campaigns
-- New constraint ensures uniqueness per campaign while allowing list reuse across campaigns

-- Drop the old constraint that only checked (contact_list_id, customer_id)
ALTER TABLE campaign_contact_list_members
DROP CONSTRAINT IF EXISTS campaign_contact_list_members_contact_list_id_customer_id_key;

-- Add new constraint that includes campaign_id
-- This allows the same customer in the same list to be used across multiple campaigns
-- But prevents duplicates within a single campaign
ALTER TABLE campaign_contact_list_members
ADD CONSTRAINT campaign_contact_list_members_unique_per_campaign
UNIQUE(contact_list_id, customer_id, campaign_id);

-- Note: campaign_id was added to this table in the previous migration (20251126205140)
-- This migration assumes that column already exists
