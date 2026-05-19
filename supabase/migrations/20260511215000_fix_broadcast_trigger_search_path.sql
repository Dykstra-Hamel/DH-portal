-- Fix broadcast_project_task_to_projects() trigger function:
--
-- 1. Embed SET search_path = 'public, pg_temp' in the function definition so it
--    survives future CREATE OR REPLACE calls (rule 13 in CLAUDE.md).
-- 2. Add early NULL exit for monthly service tasks (project_id IS NULL) so the
--    function never attempts the projects JOIN for rows that don't belong to a
--    project, preventing the "relation does not exist" error in those cases.
-- 3. Fully qualify the projects table reference (public.projects) so it resolves
--    correctly even if search_path is somehow empty.
--
-- The trigger row itself does not need to be recreated.

CREATE OR REPLACE FUNCTION broadcast_project_task_to_projects()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_company_id UUID;
  v_task_id    UUID;
  v_payload    jsonb;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  v_task_id    := COALESCE(NEW.id, OLD.id);

  -- Monthly service tasks have no project; nothing to broadcast to project channels.
  IF v_project_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT company_id INTO v_company_id FROM public.projects WHERE id = v_project_id;

  v_payload := jsonb_build_object(
    'table',      'project_tasks',
    'company_id', v_company_id,
    'action',     TG_OP,
    'record_id',  v_task_id,
    'project_id', v_project_id,
    'timestamp',  extract(epoch from now())
  );

  -- Existing admin overview channel (preserved verbatim).
  PERFORM realtime.send(v_payload, 'project_update', 'admin:projects', false);

  -- Per-project channel for the project detail page.
  PERFORM realtime.send(
    v_payload,
    'project_task_update',
    'project:' || v_project_id || ':tasks',
    false
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp';

COMMENT ON FUNCTION broadcast_project_task_to_projects() IS
  'Broadcasts project_task changes to admin:projects (overview list refresh) and to project:{project_id}:tasks (detail page subscription). Monthly service tasks (project_id IS NULL) are skipped.';
