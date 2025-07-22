-- Fix call_records RLS policy to allow company-based access instead of just assigned leads
-- Users should see calls for all leads in their company, not just leads assigned to them

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "call_records_user_own_leads" ON call_records;

-- Create a new policy that allows users to see calls for leads in their company
CREATE POLICY "call_records_user_company_leads" ON call_records
  FOR SELECT USING (
    lead_id IN (
      SELECT leads.id 
      FROM leads
      JOIN user_companies ON user_companies.company_id = leads.company_id
      WHERE user_companies.user_id = auth.uid()
    )
  );

-- Also create a policy for INSERT operations (for when calls are created via webhook)
-- This allows the system to create call records without RLS blocking it
CREATE POLICY "call_records_system_insert" ON call_records
  FOR INSERT WITH CHECK (true);

-- Create a policy for UPDATE operations (for when webhooks update call records)
CREATE POLICY "call_records_system_update" ON call_records
  FOR UPDATE USING (true);