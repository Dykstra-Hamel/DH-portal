-- The FOR ALL policy (added in 20260408162611) covers SELECT/UPDATE/DELETE correctly
-- via its USING clause, but its WITH CHECK for INSERT appears to not evaluate
-- correctly for the SECURITY DEFINER function in INSERT context.
--
-- Add an explicit FOR INSERT policy with an inline role check so project_manager
-- users can post comments without depending on is_admin_or_pm() in WITH CHECK.

CREATE POLICY "project_managers can create project comments"
    ON project_comments
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role = 'project_manager'
        )
    );
