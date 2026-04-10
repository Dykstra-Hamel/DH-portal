-- Fix: brand-assets INSERT policy blocks non-admin users from uploading comment attachments.
--
-- The existing policy only allows uploads to paths starting with the user's company name,
-- but comment attachment paths are structured as:
--   comment-attachments/{project_id or "tasks"}/{comment_id}/{filename}
-- These never match the company-name prefix check, so non-admin users (including PMs)
-- cannot upload comment attachments.
--
-- Solution: drop and recreate the INSERT policy to additionally allow any authenticated
-- user to write to the comment-attachments/ path prefix. The path includes project/task
-- and comment IDs, providing sufficient namespacing. Auth is still required.

DROP POLICY IF EXISTS "Users can upload to their company folders in brand assets" ON storage.objects;

CREATE POLICY "Users can upload to their company folders in brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (
    -- Global admins: unrestricted
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    OR
    -- Any authenticated user can upload comment attachments (path is namespaced by
    -- project/task ID and comment ID, auth requirement is the security boundary)
    SPLIT_PART(name, '/', 1) = 'comment-attachments'
    OR
    -- Company users can upload to their company's folder
    EXISTS (
      SELECT 1
      FROM user_companies uc
      JOIN companies c ON c.id = uc.company_id
      WHERE uc.user_id = auth.uid()
      AND LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(c.name, '[^a-z0-9\s-]', '', 'gi'),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        )
      ) = SPLIT_PART(name, '/', 1)
    )
  )
);
