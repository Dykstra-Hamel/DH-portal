-- Fix: relation "projects" does not exist on project_tasks PATCH
--
-- The previous consolidated policy had an unqualified `projects` reference that
-- failed when the planner evaluated the SELECT policy for monthly service tasks
-- (project_id IS NULL). PostgreSQL must validate the full USING expression even
-- for rows where the branch predicate is false.
--
-- Changes:
-- 1. Drop all four consolidated project_tasks_* policies
-- 2. Recreate them with fully schema-qualified table references
-- 3. Guard the `projects` branch with `project_id IS NOT NULL` so the planner
--    can skip it entirely for monthly service tasks
-- 4. Guard the `monthly_services` branch with `project_id IS NULL` (mutually exclusive)

-- Drop existing consolidated policies
DROP POLICY IF EXISTS project_tasks_select ON public.project_tasks;
DROP POLICY IF EXISTS project_tasks_insert ON public.project_tasks;
DROP POLICY IF EXISTS project_tasks_update ON public.project_tasks;
DROP POLICY IF EXISTS project_tasks_delete ON public.project_tasks;

-- SELECT: admins see everything; monthly service tasks via company membership;
-- project tasks via the project's company
CREATE POLICY project_tasks_select ON public.project_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
    OR (
      project_id IS NULL
      AND monthly_service_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.monthly_services ms
        JOIN public.user_companies uc ON uc.company_id = ms.company_id
        WHERE ms.id = project_tasks.monthly_service_id
          AND uc.user_id = (SELECT auth.uid())
      )
    )
    OR (
      project_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.user_companies uc ON uc.company_id = p.company_id
        WHERE p.id = project_tasks.project_id
          AND uc.user_id = (SELECT auth.uid())
      )
    )
  );

-- INSERT: admins or company members inserting monthly service tasks
CREATE POLICY project_tasks_insert ON public.project_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
    OR (
      project_id IS NULL
      AND monthly_service_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.monthly_services ms
        JOIN public.user_companies uc ON uc.company_id = ms.company_id
        WHERE ms.id = monthly_service_id
          AND uc.user_id = (SELECT auth.uid())
      )
    )
  );

-- UPDATE: admins or company members updating monthly service tasks
CREATE POLICY project_tasks_update ON public.project_tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
    OR (
      project_id IS NULL
      AND monthly_service_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.monthly_services ms
        JOIN public.user_companies uc ON uc.company_id = ms.company_id
        WHERE ms.id = project_tasks.monthly_service_id
          AND uc.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
    OR (
      project_id IS NULL
      AND monthly_service_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.monthly_services ms
        JOIN public.user_companies uc ON uc.company_id = ms.company_id
        WHERE ms.id = project_tasks.monthly_service_id
          AND uc.user_id = (SELECT auth.uid())
      )
    )
  );

-- DELETE: admins only
CREATE POLICY project_tasks_delete ON public.project_tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
  );
