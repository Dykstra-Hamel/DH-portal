-- Fix companies table RLS policies to allow service role access for admin operations
-- This enables admin API routes to work properly with the service role key

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to delete companies" ON companies;

-- Create new policies that allow both authenticated users and service role
CREATE POLICY "Allow authenticated users and service role to view companies" ON companies
    FOR SELECT USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow authenticated users and service role to insert companies" ON companies
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow authenticated users and service role to update companies" ON companies
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow authenticated users and service role to delete companies" ON companies
    FOR DELETE USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );