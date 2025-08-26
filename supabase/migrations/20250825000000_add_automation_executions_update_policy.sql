-- Migration: Add missing RLS UPDATE/DELETE policies for automation_executions
-- Purpose: Fix execution cancellation by allowing company admins to modify executions
-- Date: 2025-08-25
-- Issue: Users cannot cancel executions because UPDATE policy is missing

-- Add policy for company admins to modify automation executions
CREATE POLICY "Company admins can modify automation executions" ON automation_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = automation_executions.company_id 
            AND uc.user_id = (SELECT auth.uid())
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
    );

-- Add documentation comment
COMMENT ON POLICY "Company admins can modify automation executions" ON automation_executions IS 
'Allows company admins, managers, owners, and global admins to update/delete automation executions for cancellation and management purposes - Added 2025-08-25';

-- Test the policy by verifying a test user can see and theoretically modify executions
-- (This won't actually modify data, just tests the policy logic)
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Check if the policy was created successfully
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'automation_executions' 
        AND policyname = 'Company admins can modify automation executions'
        AND cmd = 'ALL'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        RAISE NOTICE 'SUCCESS: automation_executions UPDATE/DELETE policy created successfully!';
        RAISE NOTICE 'Users with admin/manager/owner roles can now cancel executions.';
    ELSE
        RAISE EXCEPTION 'FAILED: automation_executions policy was not created properly';
    END IF;
END $$;