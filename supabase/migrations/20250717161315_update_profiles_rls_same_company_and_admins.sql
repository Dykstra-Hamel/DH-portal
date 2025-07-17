-- Update profiles RLS policy to allow users to see profiles of:
-- 1. Their own profile (keep existing policy)
-- 2. Users in the same company
-- 3. Admin users

-- Add new policy to allow viewing profiles of users in the same company or admin users
CREATE POLICY "Users can view profiles of users in same company or admins" ON profiles
    FOR SELECT 
    TO authenticated
    USING (
        -- Allow viewing own profile (redundant with existing policy but clearer)
        auth.uid() = id OR
        
        -- Allow viewing admin users
        role = 'admin' OR
        
        -- Allow viewing users in the same company
        EXISTS (
            SELECT 1 
            FROM user_companies uc1
            WHERE uc1.user_id = auth.uid()
            AND EXISTS (
                SELECT 1 
                FROM user_companies uc2 
                WHERE uc2.user_id = profiles.id 
                AND uc2.company_id = uc1.company_id
            )
        )
    );