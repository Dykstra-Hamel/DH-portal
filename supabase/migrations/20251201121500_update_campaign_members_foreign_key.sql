-- Update campaign_contact_list_members foreign key to point to contact_lists (reusable lists)
-- instead of campaign_contact_lists (old campaign-specific lists)
-- This enables the reusable contact lists system to work properly

-- Drop the old foreign key constraint pointing to campaign_contact_lists
ALTER TABLE campaign_contact_list_members
DROP CONSTRAINT IF EXISTS campaign_contact_list_members_contact_list_id_fkey;

-- Add new foreign key constraint pointing to contact_lists (reusable lists)
-- This allows contact_list_id to reference IDs from the contact_lists table
ALTER TABLE campaign_contact_list_members
ADD CONSTRAINT campaign_contact_list_members_contact_list_id_fkey
FOREIGN KEY (contact_list_id)
REFERENCES contact_lists(id)
ON DELETE CASCADE;

-- Note: Existing data in campaign_contact_list_members remains intact
-- This constraint only affects new inserts going forward
-- Old campaigns using campaign_contact_lists will continue to work
