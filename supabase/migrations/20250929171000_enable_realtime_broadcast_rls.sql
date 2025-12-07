-- Enable RLS and create policy for realtime.messages table
-- This allows authenticated users to receive broadcast messages

-- Enable RLS on realtime.messages if not already enabled
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read broadcast messages
-- This is required for broadcast messages to be received by the frontend
CREATE POLICY "authenticated_users_can_receive_broadcasts" 
ON realtime.messages 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow the broadcast function to insert messages
-- This ensures our database triggers can send broadcast messages
CREATE POLICY "allow_broadcast_function_to_insert" 
ON realtime.messages 
FOR INSERT 
TO service_role 
WITH CHECK (true);

COMMENT ON POLICY "authenticated_users_can_receive_broadcasts" ON realtime.messages IS 'Allows authenticated users to receive broadcast messages for realtime count updates';
COMMENT ON POLICY "allow_broadcast_function_to_insert" ON realtime.messages IS 'Allows database triggers with SECURITY DEFINER to insert broadcast messages';