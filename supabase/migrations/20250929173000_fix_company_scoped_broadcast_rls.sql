-- Fix RLS policy for broadcast messages to be company-scoped
-- This ensures users only receive broadcasts for their company

-- Drop the existing generic policy
DROP POLICY IF EXISTS "authenticated_users_can_receive_broadcasts" ON realtime.messages;

-- Create a company-scoped broadcast authorization policy
-- This policy allows users to receive broadcast messages only for their company
CREATE POLICY "company_scoped_broadcast_access" 
ON realtime.messages 
FOR SELECT 
TO authenticated 
USING (
  -- Only allow broadcast messages
  extension = 'broadcast'
  AND
  -- Extract company_id from the channel topic and verify user belongs to that company
  EXISTS (
    SELECT 1 
    FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.company_id::text = split_part(split_part(realtime.topic(), ':', 2), ':', 1)
  )
);

COMMENT ON POLICY "company_scoped_broadcast_access" ON realtime.messages IS 'Allows authenticated users to receive broadcast messages only for their company. Extracts company_id from channel topic pattern company:{company_id}:counts and verifies user membership.';

-- Also ensure the INSERT policy works for our broadcast function
-- Keep the existing service_role policy for inserting broadcast messages
-- This policy should already exist from previous migration, but ensure it's correct
DROP POLICY IF EXISTS "allow_broadcast_function_to_insert" ON realtime.messages;
CREATE POLICY "allow_broadcast_function_to_insert" 
ON realtime.messages 
FOR INSERT 
TO service_role 
WITH CHECK (true);

COMMENT ON POLICY "allow_broadcast_function_to_insert" ON realtime.messages IS 'Allows database triggers with SECURITY DEFINER to insert broadcast messages';

-- Verify that RLS is enabled
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;