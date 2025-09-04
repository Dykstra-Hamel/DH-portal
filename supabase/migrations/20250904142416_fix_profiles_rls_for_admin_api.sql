-- Fix profiles table RLS policies to allow service role access for admin API operations
-- This enables the isAuthorizedAdmin() function to work properly

-- Add new policy to allow service role to read profiles for admin checks
CREATE POLICY "Allow service role to read profiles for admin operations" ON profiles
    FOR SELECT 
    USING (auth.role() = 'service_role');

-- Note: We're keeping existing policies intact and just adding service role access
-- This maintains current security model while enabling admin functionality