-- Remove project_members restriction from project-files storage policy.
-- Any authenticated user in the same company should be able to view project
-- attachments, consistent with the projects_select_optimized RLS policy.

DROP POLICY IF EXISTS "Users can view project files they have access to" ON storage.objects;

CREATE POLICY "Users can view project files they have access to" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE (
                -- Match via primary_file_path or JSONB attachments array
                p.primary_file_path = storage.objects.name
                OR EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements(p.attachments) AS attachment
                    WHERE attachment->>'file_path' = storage.objects.name
                )
            ) AND (
                -- Any authenticated user in the same company can view
                auth.uid() = p.requested_by OR
                auth.uid() = p.assigned_to OR
                EXISTS (
                    SELECT 1 FROM public.user_companies uc
                    WHERE uc.user_id = auth.uid() AND uc.company_id = p.company_id
                ) OR
                EXISTS (
                    SELECT 1 FROM public.profiles prof
                    WHERE prof.id = auth.uid() AND prof.role IN ('admin', 'super_admin')
                )
            )
        )
    );
