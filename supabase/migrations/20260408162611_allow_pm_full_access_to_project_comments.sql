-- Grant project_manager role full access to project_comments, matching admin access.
-- Uses the existing is_admin_or_pm() SECURITY DEFINER function to avoid RLS recursion.

-- Replace the admin-only full-access policy with one that covers both admin and project_manager.
DROP POLICY IF EXISTS "Super admins have full access to project comments" ON project_comments;

CREATE POLICY "Admins and PMs have full access to project comments"
    ON project_comments
    FOR ALL
    USING (public.is_admin_or_pm())
    WITH CHECK (public.is_admin_or_pm());

-- Also update comment_attachments so PMs can read/write attachments on project comments.
DROP POLICY IF EXISTS "Admins can view comment attachments" ON comment_attachments;
DROP POLICY IF EXISTS "Admins can create comment attachments" ON comment_attachments;

CREATE POLICY "Admins and PMs can view comment attachments"
    ON comment_attachments
    FOR SELECT
    USING (public.is_admin_or_pm());

CREATE POLICY "Admins and PMs can create comment attachments"
    ON comment_attachments
    FOR INSERT
    WITH CHECK (public.is_admin_or_pm());
