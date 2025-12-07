-- Migration: Create reusable contact lists system
-- This migration creates company-wide contact lists that can be reused across campaigns

-- 1. Create company-wide contact_lists table
CREATE TABLE IF NOT EXISTS contact_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    notes TEXT, -- General notes about the list
    total_contacts INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, name)
);

-- 2. Create contact_list_members table (who's in each list)
CREATE TABLE IF NOT EXISTS contact_list_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    notes TEXT, -- Optional per-contact notes
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    UNIQUE(contact_list_id, customer_id)
);

-- 3. Create campaign_contact_list_assignments (which lists are assigned to which campaigns)
-- This is a many-to-many relationship - campaigns can use multiple lists, lists can be used in multiple campaigns
CREATE TABLE IF NOT EXISTS campaign_contact_list_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    UNIQUE(campaign_id, contact_list_id)
);

-- 4. Migrate existing campaign_contact_lists data to new structure
-- For each existing campaign contact list, create a new reusable contact list
-- Handle duplicate names by appending campaign name
INSERT INTO contact_lists (id, company_id, name, description, total_contacts, created_at, updated_at)
SELECT
    ccl.id,
    c.company_id,
    CASE
        -- If duplicate name exists, append campaign name
        WHEN EXISTS (
            SELECT 1 FROM campaign_contact_lists ccl2
            JOIN campaigns c2 ON c2.id = ccl2.campaign_id
            WHERE ccl2.list_name = ccl.list_name
            AND c2.company_id = c.company_id
            AND ccl2.id < ccl.id  -- Only for later duplicates
        ) THEN ccl.list_name || ' (' || c.name || ')'
        ELSE ccl.list_name
    END as name,
    ccl.description,
    ccl.total_contacts,
    ccl.created_at,
    ccl.updated_at
FROM campaign_contact_lists ccl
JOIN campaigns c ON c.id = ccl.campaign_id
ON CONFLICT (company_id, name) DO NOTHING;

-- 5. Migrate existing campaign_contact_list_members to new contact_list_members
-- Note: We need to handle the fact that old members are tied to campaign-specific lists
INSERT INTO contact_list_members (contact_list_id, customer_id, added_at)
SELECT DISTINCT
    cclm.contact_list_id,
    cclm.customer_id,
    cclm.added_at
FROM campaign_contact_list_members cclm
WHERE cclm.customer_id IS NOT NULL
ON CONFLICT (contact_list_id, customer_id) DO NOTHING;

-- 6. Create assignments linking campaigns to their contact lists
INSERT INTO campaign_contact_list_assignments (campaign_id, contact_list_id, assigned_at)
SELECT DISTINCT
    ccl.campaign_id,
    ccl.id,
    ccl.created_at
FROM campaign_contact_lists ccl
ON CONFLICT (campaign_id, contact_list_id) DO NOTHING;

-- 7. Add campaign_id to campaign_contact_list_members to track which campaign execution this is for
-- This allows the same contact list to be used in multiple campaigns with separate execution tracking
ALTER TABLE campaign_contact_list_members
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

-- Update existing records with campaign_id from their contact list
UPDATE campaign_contact_list_members cclm
SET campaign_id = ccl.campaign_id
FROM campaign_contact_lists ccl
WHERE cclm.contact_list_id = ccl.id
AND cclm.campaign_id IS NULL;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_lists_company_id ON contact_lists(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_lists_created_at ON contact_lists(created_at);

CREATE INDEX IF NOT EXISTS idx_contact_list_members_list_id ON contact_list_members(contact_list_id);
CREATE INDEX IF NOT EXISTS idx_contact_list_members_customer_id ON contact_list_members(customer_id);

CREATE INDEX IF NOT EXISTS idx_campaign_list_assignments_campaign_id ON campaign_contact_list_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_list_assignments_list_id ON campaign_contact_list_assignments(contact_list_id);

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON campaign_contact_list_members(campaign_id);

-- 9. Enable Row Level Security
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contact_list_assignments ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies for contact_lists
CREATE POLICY "Users can read contact lists for their companies" ON contact_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = contact_lists.company_id
            AND uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create contact lists for their companies" ON contact_lists
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = contact_lists.company_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

CREATE POLICY "Users can update contact lists for their companies" ON contact_lists
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = contact_lists.company_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

CREATE POLICY "Users can delete contact lists for their companies" ON contact_lists
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = contact_lists.company_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

-- 11. Create RLS Policies for contact_list_members
CREATE POLICY "Users can read members for their company lists" ON contact_list_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contact_lists cl
            JOIN user_companies uc ON uc.company_id = cl.company_id
            WHERE cl.id = contact_list_members.contact_list_id
            AND uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add members to their company lists" ON contact_list_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contact_lists cl
            JOIN user_companies uc ON uc.company_id = cl.company_id
            WHERE cl.id = contact_list_members.contact_list_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

CREATE POLICY "Users can update members in their company lists" ON contact_list_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contact_lists cl
            JOIN user_companies uc ON uc.company_id = cl.company_id
            WHERE cl.id = contact_list_members.contact_list_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

CREATE POLICY "Users can delete members from their company lists" ON contact_list_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contact_lists cl
            JOIN user_companies uc ON uc.company_id = cl.company_id
            WHERE cl.id = contact_list_members.contact_list_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

-- 12. Create RLS Policies for campaign_contact_list_assignments
CREATE POLICY "Users can read assignments for their company campaigns" ON campaign_contact_list_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_contact_list_assignments.campaign_id
            AND uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create assignments for their company campaigns" ON campaign_contact_list_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_contact_list_assignments.campaign_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

CREATE POLICY "Users can delete assignments for their company campaigns" ON campaign_contact_list_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_contact_list_assignments.campaign_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

-- 13. Create function to update total_contacts count when members are added/removed
CREATE OR REPLACE FUNCTION update_contact_list_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contact_lists
        SET total_contacts = total_contacts + 1,
            updated_at = NOW()
        WHERE id = NEW.contact_list_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contact_lists
        SET total_contacts = GREATEST(0, total_contacts - 1),
            updated_at = NOW()
        WHERE id = OLD.contact_list_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger to automatically update total_contacts
DROP TRIGGER IF EXISTS update_contact_list_total_trigger ON contact_list_members;
CREATE TRIGGER update_contact_list_total_trigger
    AFTER INSERT OR DELETE ON contact_list_members
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_list_total();

-- 15. Create function to get campaign usage count for a contact list
CREATE OR REPLACE FUNCTION get_contact_list_campaign_count(list_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(DISTINCT campaign_id)::INTEGER
    FROM campaign_contact_list_assignments
    WHERE contact_list_id = list_id;
$$ LANGUAGE SQL STABLE;

-- 16. Create function to get last used date for a contact list
CREATE OR REPLACE FUNCTION get_contact_list_last_used(list_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
    SELECT MAX(c.start_datetime)
    FROM campaign_contact_list_assignments ccla
    JOIN campaigns c ON c.id = ccla.campaign_id
    WHERE ccla.contact_list_id = list_id;
$$ LANGUAGE SQL STABLE;

-- Note: We're keeping campaign_contact_lists table for now for backward compatibility
-- It can be deprecated and removed in a future migration once all code is updated
