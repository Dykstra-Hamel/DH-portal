-- Update RLS policies on company_discounts to allow global admins access to all companies
-- This migration allows users with profile.role = 'admin' to view and manage discounts
-- for any company, regardless of company membership

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view company discounts" ON company_discounts;
DROP POLICY IF EXISTS "Admins can manage company discounts" ON company_discounts;

-- Recreate SELECT policy with global admin bypass
-- Regular users can view discounts for companies they belong to
-- Global admins (profile.role = 'admin') can view discounts for any company
CREATE POLICY "Users can view company discounts"
    ON company_discounts FOR SELECT
    USING (
        -- User is a member of the company
        company_id IN (
            SELECT uc.company_id FROM user_companies uc
            WHERE uc.user_id = auth.uid()
        )
        OR
        -- User is a global admin
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Recreate ALL policy with global admin bypass
-- Company admins can manage discounts for their companies
-- Global admins (profile.role = 'admin') can manage discounts for any company
CREATE POLICY "Admins can manage company discounts"
    ON company_discounts FOR ALL
    USING (
        -- User is a company admin or super_admin for this company
        company_id IN (
            SELECT uc.company_id
            FROM user_companies uc
            JOIN profiles p ON p.id = uc.user_id
            WHERE uc.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
        OR
        -- User is a global admin
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
