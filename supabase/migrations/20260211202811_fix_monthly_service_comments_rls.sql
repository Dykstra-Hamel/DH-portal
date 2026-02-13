-- Fix RLS policies for monthly_service_comments to allow admins full access
-- Previously, admins were restricted to only their own companies
-- This migration updates policies to match the pattern used in project_task_comments

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view monthly service comments in their companies" ON monthly_service_comments;
DROP POLICY IF EXISTS "Admins can create monthly service comments in their companies" ON monthly_service_comments;

-- Create new admin-friendly policy for full access
CREATE POLICY "Super admins have full access to monthly service comments"
    ON monthly_service_comments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create policy for non-admin users to view comments on monthly services in their companies
CREATE POLICY "Users can view comments on monthly services in their companies"
    ON monthly_service_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM monthly_services
            JOIN user_companies ON user_companies.company_id = monthly_services.company_id
            WHERE monthly_services.id = monthly_service_comments.monthly_service_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Create policy for non-admin users to create comments on monthly services in their companies
CREATE POLICY "Users can create comments on monthly services in their companies"
    ON monthly_service_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM monthly_services
            JOIN user_companies ON user_companies.company_id = monthly_services.company_id
            WHERE monthly_services.id = monthly_service_comments.monthly_service_id
            AND user_companies.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );
