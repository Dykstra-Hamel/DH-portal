-- Broadcast project_task_comments changes so the project detail page hook
-- (useProjectTasks) refetches the parent task and the dashboard refreshes its
-- task counts.
--
-- The trigger sends:
--   1) `project_task_update` to project:{project_id}:tasks  (useProjectTasks
--      already subscribes to this channel; receiving an event for action=UPDATE
--      makes it refetch the task, which includes the comments via JSON join).
--   2) `project_update` to admin:projects  (the admin dashboard subscribes here
--      and refreshes project lists / task counts).
--
-- Both broadcasts use action='UPDATE' regardless of whether the comment was
-- inserted, edited, or deleted -- the receiving handlers re-fetch the task as
-- a whole.

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
  FROM project_tasks pt
  WHERE pt.id = v_task_id;

  IF v_project_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT p.company_id INTO v_company_id FROM projects p WHERE p.id = v_project_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS project_task_comments_broadcast_trigger ON project_task_comments;
CREATE TRIGGER project_task_comments_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_project_task_comment_change();

COMMENT ON FUNCTION broadcast_project_task_comment_change() IS
  'Broadcasts project_task_comments INSERT/UPDATE/DELETE as a project_task UPDATE event so realtime listeners refetch the task with its comments.';
