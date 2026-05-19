-- Extend broadcast_project_task_to_projects() to also broadcast to a per-
-- project channel.
--
-- The original function (in 20260212180000_add_project_broadcast_system.sql)
-- only sends to admin:projects, which is correct for the admin overview but
-- too coarse for the project detail page hook (useProjectTasks). That hook is
-- about to be migrated off postgres_changes onto a broadcast channel scoped
-- to a single project (channel name `project:{project_id}:tasks`).
--
-- This migration replaces the function body. The trigger row itself does not
-- need to be recreated.

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

  SELECT company_id INTO v_company_id FROM projects WHERE id = v_project_id;

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

  -- New per-project channel for the project detail page.
  PERFORM realtime.send(
    v_payload,
    'project_task_update',
    'project:' || v_project_id || ':tasks',
    false
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION broadcast_project_task_to_projects() IS
  'Broadcasts project_task changes to admin:projects (overview list refresh) and to project:{project_id}:tasks (detail page subscription).';
