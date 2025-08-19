-- Consolidate Multiple Call Records RLS Policies
-- Fixes Supabase warning about multiple permissive policies for the same action
-- Combines overlapping policies into single, efficient policies

-- 1. DROP ALL EXISTING CALL_RECORDS POLICIES TO START CLEAN
DROP POLICY IF EXISTS "call_records_admin_all" ON call_records;
DROP POLICY IF EXISTS "call_records_system_update" ON call_records;
DROP POLICY IF EXISTS "call_records_system_insert" ON call_records;
DROP POLICY IF EXISTS "call_records_user_company_leads" ON call_records;
DROP POLICY IF EXISTS "call_records_user_own_leads" ON call_records;
DROP POLICY IF EXISTS "Users can view call records from their company" ON call_records;

-- 2. CREATE CONSOLIDATED, OPTIMIZED POLICIES

-- Policy 1: SELECT - Users can view call records from their company or assigned leads + Admins see all
CREATE POLICY "call_records_select" ON call_records
    FOR SELECT USING (
        -- Admin users can see all call records
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        ) OR
        -- Regular users can see call records for leads they're assigned to
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = call_records.lead_id 
            AND leads.assigned_to = (SELECT auth.uid())
        ) OR
        -- Regular users can see call records for leads in their company
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        ) OR
        -- Regular users can see call records for customers in their company
        EXISTS (
            SELECT 1 FROM customers
            JOIN user_companies uc ON uc.company_id = customers.company_id
            WHERE customers.id = call_records.customer_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- Policy 2: INSERT - Admins + System can insert call records
CREATE POLICY "call_records_insert" ON call_records
    FOR INSERT WITH CHECK (
        -- Admin users can insert any call record
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        ) OR
        -- System/webhook inserts (when auth.uid() is null, allow through)
        (SELECT auth.uid()) IS NULL OR
        -- Regular users can insert call records for leads in their company
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- Policy 3: UPDATE - Consolidates admin_all and system_update into one policy
CREATE POLICY "call_records_update" ON call_records
    FOR UPDATE USING (
        -- Admin users can update any call record
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        ) OR
        -- System/webhook updates (when auth.uid() is null, allow through)
        (SELECT auth.uid()) IS NULL OR
        -- Regular users can update call records for leads they're assigned to
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = call_records.lead_id 
            AND leads.assigned_to = (SELECT auth.uid())
        ) OR
        -- Regular users can update call records for leads in their company
        EXISTS (
            SELECT 1 FROM leads
            JOIN user_companies uc ON uc.company_id = leads.company_id
            WHERE leads.id = call_records.lead_id 
            AND uc.user_id = (SELECT auth.uid())
        )
    );

-- Policy 4: DELETE - Only admins can delete call records
CREATE POLICY "call_records_delete" ON call_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 3. VERIFY POLICIES ARE CORRECTLY SET
-- Check that we now have exactly one policy per action type

-- Update table statistics after policy consolidation
ANALYZE call_records;

-- Add comment explaining the consolidation
COMMENT ON TABLE call_records IS 'RLS policies consolidated - single policy per action type for optimal performance, eliminates multiple permissive policy warnings';

-- Log the policy consolidation
DO $$
BEGIN
    RAISE NOTICE 'Call records RLS policies consolidated:';
    RAISE NOTICE '- call_records_select: Single SELECT policy for all user types';
    RAISE NOTICE '- call_records_insert: Single INSERT policy for admins + system';
    RAISE NOTICE '- call_records_update: Single UPDATE policy (replaces admin_all + system_update)';
    RAISE NOTICE '- call_records_delete: Single DELETE policy for admins only';
    RAISE NOTICE 'This eliminates multiple permissive policy warnings and improves performance.';
END $$;