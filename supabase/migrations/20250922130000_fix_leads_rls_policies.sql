-- Fix missing RLS policies for leads table
-- The leads table has RLS enabled but no policies, causing 403 errors
-- Set up simple authenticated user policies to match support_cases table

-- DROP any existing restrictive policies first
DROP POLICY IF EXISTS "leads_select_company_access" ON leads;
DROP POLICY IF EXISTS "leads_insert_company_access" ON leads;
DROP POLICY IF EXISTS "leads_update_company_access" ON leads;
DROP POLICY IF EXISTS "leads_delete_company_access" ON leads;

-- Also drop the original policies that may still exist
DROP POLICY IF EXISTS "Allow authenticated users to view leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to delete leads" ON leads;

-- Create simple authenticated user policies (same as support_cases)
CREATE POLICY "Allow authenticated users to view leads" ON leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert leads" ON leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update leads" ON leads
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete leads" ON leads
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments documenting the policies
COMMENT ON POLICY "Allow authenticated users to view leads" ON leads IS 'Authenticated users can view all leads';
COMMENT ON POLICY "Allow authenticated users to insert leads" ON leads IS 'Authenticated users can create leads';
COMMENT ON POLICY "Allow authenticated users to update leads" ON leads IS 'Authenticated users can update leads';
COMMENT ON POLICY "Allow authenticated users to delete leads" ON leads IS 'Authenticated users can delete leads';