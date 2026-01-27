-- Fix comment_attachments RLS policies to include 'admin' role
-- The original policies only checked for 'super_admin', 'dh_admin', 'company_admin'
-- but the isAuthorizedAdmin function checks for 'admin' role

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view comment attachments" ON comment_attachments;
DROP POLICY IF EXISTS "Admins can create comment attachments" ON comment_attachments;

-- Recreate SELECT policy with 'admin' role included
CREATE POLICY "Admins can view comment attachments" ON comment_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'dh_admin', 'company_admin')
        )
    );

-- Recreate INSERT policy with 'admin' role included
CREATE POLICY "Admins can create comment attachments" ON comment_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'dh_admin', 'company_admin')
        )
        AND uploaded_by = auth.uid()
    );
