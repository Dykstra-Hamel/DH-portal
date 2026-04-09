-- Fix: Storage INSERT and DELETE policies for the project-files bucket.
--
-- The old INSERT policy matched paths against 'project-files/' || company_id || '/%',
-- but actual upload paths are '{project_id}/{filename}' (no bucket prefix, no company prefix).
-- This made the user_companies branch dead code — only admins could ever upload.
--
-- New INSERT policy:
--   • Admins / super-admins can upload anything.
--   • project_manager role can upload to any project (same as their admin-level access elsewhere).
--   • Requestors, assignees, and project members can upload to paths under their project UUID.
--
-- The DELETE policy is also tightened to match, so PMs and members can remove attachments
-- they uploaded (the attachment route already enforces canEditProject before calling storage).

-- ── INSERT (upload) ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can upload project files for their companies" ON storage.objects;

CREATE POLICY "Users can upload project files" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'project-files'
        AND (
            -- Global admins / super-admins
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role IN ('admin', 'super_admin')
            )
            OR
            -- Project managers
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role = 'project_manager'
            )
            OR
            -- Requestors, assignees, and project members uploading to their project's directory
            -- Paths are structured as: {project_id}/{...}
            EXISTS (
                SELECT 1 FROM public.projects proj
                WHERE storage.objects.name LIKE proj.id::text || '/%'
                  AND (
                      auth.uid() = proj.requested_by
                      OR auth.uid() = proj.assigned_to
                      OR EXISTS (
                          SELECT 1 FROM public.project_members pm
                          WHERE pm.project_id = proj.id
                            AND pm.user_id = auth.uid()
                      )
                  )
            )
        )
    );

-- ── DELETE ─────────────────────────────────────────────────────────────────────
-- Old policy only matched primary_file_path, so it never covered attachment or proof paths.
-- New policy mirrors the INSERT conditions so anyone who can upload can also remove files.

DROP POLICY IF EXISTS "Users can delete project files they have access to" ON storage.objects;

CREATE POLICY "Users can delete project files they have access to" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'project-files'
        AND (
            -- Global admins / super-admins
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role IN ('admin', 'super_admin')
            )
            OR
            -- Project managers
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role = 'project_manager'
            )
            OR
            -- Requestors, assignees, and project members for their project's directory
            EXISTS (
                SELECT 1 FROM public.projects proj
                WHERE storage.objects.name LIKE proj.id::text || '/%'
                  AND (
                      auth.uid() = proj.requested_by
                      OR auth.uid() = proj.assigned_to
                      OR EXISTS (
                          SELECT 1 FROM public.project_members pm
                          WHERE pm.project_id = proj.id
                            AND pm.user_id = auth.uid()
                      )
                  )
            )
        )
    );
