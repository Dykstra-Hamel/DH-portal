-- Fix tasks table RLS policies to be company-scoped for realtime functionality
-- Current policies allow all authenticated users to see all tasks from all companies
-- This creates noise in realtime subscriptions and prevents proper filtering

-- Drop existing overly-permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to view tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete tasks" ON tasks;

-- Create company-scoped policies based on user_companies table
-- This pattern matches working tables like service_plans and notifications

CREATE POLICY "Users can view their company tasks" ON tasks
    FOR SELECT USING (
        -- Users can see tasks from companies they belong to
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_companies.user_id = auth.uid() 
            AND user_companies.company_id = tasks.company_id
        ) OR
        -- Admins can see all tasks
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Users can insert tasks for their company" ON tasks
    FOR INSERT WITH CHECK (
        -- Users can create tasks for companies they belong to
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_companies.user_id = auth.uid() 
            AND user_companies.company_id = tasks.company_id
        ) OR
        -- Admins can create tasks for any company
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Users can update their company tasks" ON tasks
    FOR UPDATE USING (
        -- Users can update tasks from companies they belong to
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_companies.user_id = auth.uid() 
            AND user_companies.company_id = tasks.company_id
        ) OR
        -- Admins can update all tasks
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Users can delete their company tasks" ON tasks
    FOR DELETE USING (
        -- Users can delete tasks from companies they belong to
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_companies.user_id = auth.uid() 
            AND user_companies.company_id = tasks.company_id
        ) OR
        -- Admins can delete all tasks
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Add helpful comments documenting the policies
COMMENT ON POLICY "Users can view their company tasks" ON tasks IS 'Users can view tasks from companies they belong to; admins can view all tasks';
COMMENT ON POLICY "Users can insert tasks for their company" ON tasks IS 'Users can create tasks for companies they belong to; admins can create tasks for any company';
COMMENT ON POLICY "Users can update their company tasks" ON tasks IS 'Users can update tasks from companies they belong to; admins can update all tasks';
COMMENT ON POLICY "Users can delete their company tasks" ON tasks IS 'Users can delete tasks from companies they belong to; admins can delete all tasks';

-- Add migration comment
COMMENT ON TABLE tasks IS 'Universal task management table with company-scoped RLS policies for proper realtime filtering';