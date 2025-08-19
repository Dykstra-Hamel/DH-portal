-- Complete RLS Policy Performance Optimization
-- This migration optimizes all remaining RLS policies for better performance
-- by replacing direct auth function calls with SELECT statements

-- ===================================================================
-- PHASE 1: OPTIMIZE PEST SYSTEM POLICIES
-- ===================================================================

-- 1. PEST_TYPES TABLE
DROP POLICY IF EXISTS "Allow authenticated users to view pest types" ON pest_types;
CREATE POLICY "Allow authenticated users to view pest types" ON pest_types
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admins to manage pest types" ON pest_types;
CREATE POLICY "Allow admins to manage pest types" ON pest_types
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (SELECT auth.uid()) 
            AND profiles.role = 'admin'
        )
    );

-- 2. COMPANY_PEST_OPTIONS TABLE
DROP POLICY IF EXISTS "Allow users to view their company pest options" ON company_pest_options;
CREATE POLICY "Allow users to view their company pest options" ON company_pest_options
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow users to manage their company pest options" ON company_pest_options;
CREATE POLICY "Allow users to manage their company pest options" ON company_pest_options
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 2: OPTIMIZE SERVICE PLANS POLICIES
-- ===================================================================

DROP POLICY IF EXISTS "Allow users to view their company service plans" ON service_plans;
CREATE POLICY "Allow users to view their company service plans" ON service_plans
    FOR SELECT 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow users to manage their company service plans" ON service_plans;
CREATE POLICY "Allow users to manage their company service plans" ON service_plans
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 3: OPTIMIZE BRAND SYSTEM POLICIES
-- ===================================================================

-- 3. BRANDS TABLE
DROP POLICY IF EXISTS "Allow authenticated users to view brands" ON brands;
CREATE POLICY "Allow authenticated users to view brands" ON brands
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admin users to manage brands" ON brands;
CREATE POLICY "Allow admin users to manage brands" ON brands
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- 4. BRAND STORAGE POLICIES
DROP POLICY IF EXISTS "Allow admin users to upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to view brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to delete brand assets" ON storage.objects;

-- Recreate brand storage policies with optimization
CREATE POLICY "Allow admin users to upload brand assets" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'brands' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

CREATE POLICY "Allow anyone to view brand assets" ON storage.objects
    FOR SELECT 
    TO authenticated
    USING (bucket_id = 'brands');

CREATE POLICY "Allow admin users to update brand assets" ON storage.objects
    FOR UPDATE 
    TO authenticated
    USING (
        bucket_id = 'brands' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to delete brand assets" ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (
        bucket_id = 'brands' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 4: OPTIMIZE AUTOMATION SYSTEM POLICIES
-- ===================================================================

-- 5. EMAIL_TEMPLATE_LIBRARY TABLE
DROP POLICY IF EXISTS "Admins can manage global templates" ON email_template_library;
CREATE POLICY "Admins can manage global templates" ON email_template_library
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Everyone can read active template library" ON email_template_library;
CREATE POLICY "Everyone can read active template library" ON email_template_library
    FOR SELECT 
    TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Global admins can manage template library" ON email_template_library;
CREATE POLICY "Global admins can manage template library" ON email_template_library
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );


-- ===================================================================
-- PHASE 5: OPTIMIZE A/B TESTING SYSTEM POLICIES
-- ===================================================================

-- 7. AB_TEST_VARIANTS TABLE
DROP POLICY IF EXISTS "Users can read ab test variants for their companies" ON ab_test_variants;
CREATE POLICY "Users can read ab test variants for their companies" ON ab_test_variants
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company admins can modify ab test variants" ON ab_test_variants;
CREATE POLICY "Company admins can modify ab test variants" ON ab_test_variants
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_variants.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- 8. AB_TEST_RESULTS TABLE
DROP POLICY IF EXISTS "Users can read ab test results for their companies" ON ab_test_results;
CREATE POLICY "Users can read ab test results for their companies" ON ab_test_results
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ab_test_campaigns atc
            JOIN user_companies uc ON uc.company_id = atc.company_id
            WHERE atc.id = ab_test_results.campaign_id
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- ===================================================================
-- PHASE 6: ADD PERFORMANCE INDEXES
-- ===================================================================

-- Add indexes for columns frequently used in RLS policies
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_composite ON user_companies(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- Add indexes for foreign key relationships used in policies
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_call_records_lead_id ON call_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_records_customer_id ON call_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_company_id ON automation_workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_company_id ON email_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_company_id ON service_areas(company_id);
CREATE INDEX IF NOT EXISTS idx_partial_leads_company_id ON partial_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_pest_options_company_id ON company_pest_options(company_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_company_id ON service_plans(company_id);
-- AB test tables indexes - they use campaign_id to reference company_id through campaigns table
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_campaign_id ON ab_test_variants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_campaign_id ON ab_test_results(campaign_id);

-- ===================================================================
-- PHASE 7: CLEAN UP CONFLICTING/DUPLICATE POLICIES
-- ===================================================================

-- Clean up old overly permissive customer policies from 20250717200556_create_customers_table.sql
-- These are replaced by the optimized policies in 20250818200004_optimize_rls_policies.sql
DROP POLICY IF EXISTS "Allow authenticated users to view customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

-- Clean up old overly permissive company policies from 20250710183159_add_companies_table.sql
-- These are replaced by the optimized policies in 20250818200004_optimize_rls_policies.sql
DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to delete companies" ON companies;

-- Clean up old user_companies policies from 20250711000000_create_user_companies_junction.sql
-- These are replaced by the optimized policies in 20250818200004_optimize_rls_policies.sql
DROP POLICY IF EXISTS "Users can view their own company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can insert their own company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can update their own company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can delete their own company associations" ON user_companies;

-- ===================================================================
-- PHASE 8: UPDATE TABLE STATISTICS AND ADD COMMENTS
-- ===================================================================

-- Update table statistics after policy and index changes
ANALYZE pest_types;
ANALYZE company_pest_options;
ANALYZE service_plans;
ANALYZE brands;
ANALYZE email_template_library;
ANALYZE ab_test_variants;
ANALYZE ab_test_results;
ANALYZE user_companies;
ANALYZE profiles;

-- Add comments explaining the optimization
COMMENT ON TABLE pest_types IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE company_pest_options IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE service_plans IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE brands IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE email_template_library IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE ab_test_variants IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';
COMMENT ON TABLE ab_test_results IS 'RLS policies optimized - auth function calls replaced with SELECT statements for better performance';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RLS Performance Optimization Complete: Optimized policies and added indexes for better query performance';
END $$;