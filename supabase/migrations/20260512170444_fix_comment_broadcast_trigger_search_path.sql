-- Fix broadcast_project_task_comment_change() search_path and table qualification.
--
-- The original function used unqualified table references (`project_tasks`, `projects`).
-- When fired by a PostgREST session (search_path = ''), PostgreSQL cannot resolve those
-- names, producing: relation "project_tasks" does not exist (code 42P01).
--
-- Changes:
--   1. Add SET search_path = 'public, pg_temp' to the function definition (CLAUDE.md rule 13).
--   2. Qualify both table references with public. schema prefix.
--   3. The existing NULL guard on v_project_id already short-circuits for monthly service
--      tasks; it now fires correctly because the preceding SELECT is qualified.
--
-- The trigger (project_task_comments_broadcast_trigger) does not need to be recreated.

CREATE OR REPLACE FUNCTION broadcast_project_task_comment_change()
RETURNS TRIGGER AS $$
DECLARE
  v_task_id    UUID;
  v_project_id UUID;
  v_company_id UUID;
  v_payload    jsonb;
BEGIN
  v_task_id := COALESCE(NEW.task_id, OLD.task_id);
  IF v_task_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT pt.project_id INTO v_project_id
  FROM public.project_tasks pt
  WHERE pt.id = v_task_id;

  -- Monthly service tasks have no project; nothing to broadcast to project channels.
  IF v_project_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT p.company_id INTO v_company_id FROM public.projects p WHERE p.id = v_project_id;

  v_payload := jsonb_build_object(
    'table',      'project_tasks',
    'company_id', v_company_id,
    'action',     'UPDATE',
    'record_id',  v_task_id,
    'project_id', v_project_id,
    'timestamp',  extract(epoch from now())
  );

  PERFORM realtime.send(
    v_payload,
    'project_task_update',
    'project:' || v_project_id || ':tasks',
    false
  );

  PERFORM realtime.send(v_payload, 'project_update', 'admin:projects', false);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp';

COMMENT ON FUNCTION broadcast_project_task_comment_change() IS
  'Broadcasts project_task_comments INSERT/UPDATE/DELETE as a project_task UPDATE event so realtime listeners refetch the task with its comments.';
