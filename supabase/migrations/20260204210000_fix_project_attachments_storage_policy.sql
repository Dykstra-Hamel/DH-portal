-- Fix storage policy to allow viewing project attachment files
-- The existing policy only checks primary_file_path, but attachments are in JSONB

-- Drop the old policy if it exists and recreate with JSONB support
DROP POLICY IF EXISTS "Users can view project files they have access to" ON storage.objects;

CREATE POLICY "Users can view project files they have access to" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        (
            -- Check primary_file_path (original behavior)
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.primary_file_path = storage.objects.name AND (
                    auth.uid() = p.requested_by OR
                    auth.uid() = p.assigned_to OR
                    EXISTS (
                        SELECT 1 FROM public.user_companies uc
                        WHERE uc.user_id = auth.uid() AND uc.company_id = p.company_id
                    ) OR
                    EXISTS (
                        SELECT 1 FROM public.profiles prof
                        WHERE prof.id = auth.uid() AND (prof.role = 'admin' OR prof.role = 'super_admin')
                    )
                )
            )
            OR
            -- Check attachments JSONB array (new behavior)
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE (
                    -- Check if the storage object path exists in the attachments JSONB array
                    EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements(p.attachments) AS attachment
                        WHERE attachment->>'file_path' = storage.objects.name
                    )
                ) AND (
                    -- User has access to this project
                    auth.uid() = p.requested_by OR
                    auth.uid() = p.assigned_to OR
                    EXISTS (
                        SELECT 1 FROM public.user_companies uc
                        WHERE uc.user_id = auth.uid() AND uc.company_id = p.company_id
                    ) OR
                    EXISTS (
                        SELECT 1 FROM public.profiles prof
                        WHERE prof.id = auth.uid() AND (prof.role = 'admin' OR prof.role = 'super_admin')
                    ) OR
                    EXISTS (
                        SELECT 1 FROM public.project_members pm
                        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Add comment to explain the policy
COMMENT ON POLICY "Users can view project files they have access to" ON storage.objects IS
'Allows users to view project files if they are the requestor, assignee, member of the project, or member of the project company. Checks both primary_file_path and attachments JSONB array.';
