-- Optimize Row Level Security (RLS) Policies for Performance
-- Replace auth.uid() calls with (SELECT auth.uid()) to evaluate once per query instead of per row
-- This addresses Supabase performance warnings about suboptimal RLS policies

-- 1. OPTIMIZE COMPANIES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to view companies" ON companies;
CREATE POLICY "Allow authenticated users to view companies" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = companies.id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 2. OPTIMIZE PROFILES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow users to view same company profiles and admins" ON profiles;
CREATE POLICY "Allow users to view same company profiles and admins" ON profiles
    FOR SELECT USING (
        (SELECT auth.uid()) = id OR
        -- Allow users to see profiles of people in the same company
        EXISTS (
            SELECT 1 FROM user_companies uc1
            JOIN user_companies uc2 ON uc1.company_id = uc2.company_id
            WHERE uc1.user_id = (SELECT auth.uid()) AND uc2.user_id = profiles.id
        )
    );

-- 3. OPTIMIZE USER_COMPANIES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can create own profile" ON profiles
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can create own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can update own user_companies" ON user_companies;
DROP POLICY IF EXISTS "Users can delete own user_companies" ON user_companies;

CREATE POLICY "Users can view own user_companies" ON user_companies
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own user_companies" ON user_companies
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own user_companies" ON user_companies
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own user_companies" ON user_companies
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 4. OPTIMIZE PROJECTS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow project members to view projects" ON projects;
CREATE POLICY "Allow project members to view projects" ON projects
    FOR SELECT USING (
        (SELECT auth.uid()) = requested_by OR
        (SELECT auth.uid()) = assigned_to OR
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) AND uc.company_id = projects.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 5. OPTIMIZE LEADS TABLE RLS POLICIES  
DROP POLICY IF EXISTS "Users can only access leads from their company or assigned to them" ON leads;
CREATE POLICY "Users can only access leads from their company or assigned to them" ON leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = leads.company_id
        ) OR
        assigned_to = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 6. OPTIMIZE CUSTOMERS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Users can only access customers from their company" ON customers;
CREATE POLICY "Users can only access customers from their company" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE user_id = (SELECT auth.uid()) AND company_id = customers.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 7. OPTIMIZE CALL_RECORDS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Users can view call records from their company" ON call_records;
CREATE POLICY "Users can view call records from their company" ON call_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = call_records.lead_id 
            AND leads.assigned_to = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM customers
            JOIN user_companies uc ON uc.company_id = customers.company_id
            WHERE customers.id = call_records.customer_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- 8. OPTIMIZE AUTOMATION SYSTEM RLS POLICIES
DROP POLICY IF EXISTS "Company members can view email templates" ON email_templates;
CREATE POLICY "Company members can view email templates" ON email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = email_templates.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can manage email templates" ON email_templates;
CREATE POLICY "Company members can manage email templates" ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = email_templates.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can view automation workflows" ON automation_workflows;
CREATE POLICY "Company members can view automation workflows" ON automation_workflows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = automation_workflows.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can manage automation workflows" ON automation_workflows;
CREATE POLICY "Company members can manage automation workflows" ON automation_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = automation_workflows.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 9. OPTIMIZE SERVICE AREA RLS POLICIES
DROP POLICY IF EXISTS "Company members can view service areas" ON service_areas;
CREATE POLICY "Company members can view service areas" ON service_areas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = service_areas.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 10. OPTIMIZE PARTIAL LEADS RLS POLICIES
DROP POLICY IF EXISTS "Allow users to view partial leads for their companies" ON partial_leads;
CREATE POLICY "Allow users to view partial leads for their companies" ON partial_leads
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Allow users to insert partial leads for their companies" ON partial_leads;
CREATE POLICY "Allow users to insert partial leads for their companies" ON partial_leads
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Allow users to update partial leads for their companies" ON partial_leads;
CREATE POLICY "Allow users to update partial leads for their companies" ON partial_leads
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    );

-- 11. OPTIMIZE BRAND/STORAGE RLS POLICIES
DROP POLICY IF EXISTS "Admin users can manage brands" ON brands;
CREATE POLICY "Admin users can manage brands" ON brands
    FOR ALL USING (
        (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
    );

-- 12. OPTIMIZE COMPANY SETTINGS RLS POLICIES
DROP POLICY IF EXISTS "Company members can view settings" ON company_settings;
CREATE POLICY "Company members can view settings" ON company_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = company_settings.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company members can manage settings" ON company_settings;
CREATE POLICY "Company members can manage settings" ON company_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = (SELECT auth.uid()) 
            AND uc.company_id = company_settings.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- Update table statistics after policy changes
ANALYZE companies;
ANALYZE profiles;
ANALYZE user_companies;
ANALYZE projects;
ANALYZE leads;
ANALYZE customers;
ANALYZE call_records;
ANALYZE email_templates;
ANALYZE automation_workflows;
ANALYZE service_areas;
ANALYZE partial_leads;
ANALYZE brands;
ANALYZE company_settings;

-- Add comments explaining the optimization
COMMENT ON TABLE companies IS 'RLS policies optimized - auth.uid() calls replaced with (SELECT auth.uid()) for better performance';
COMMENT ON TABLE profiles IS 'RLS policies optimized - auth.uid() calls replaced with (SELECT auth.uid()) for better performance';
COMMENT ON TABLE user_companies IS 'RLS policies optimized - auth.uid() calls replaced with (SELECT auth.uid()) for better performance';