-- Migration: Add Broadcast System for Projects and Project Tasks
-- Purpose: Enable realtime updates on the admin Project Management list page
-- Pattern: Consistent with existing ticket/lead/task broadcast systems

-- =============================================================================
-- Function: broadcast_project_update
-- Broadcasts to both admin:projects (admin overview) and company-scoped channel
-- =============================================================================
CREATE OR REPLACE FUNCTION broadcast_project_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
  project_id_value UUID;
  status_value TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    company_id_value := OLD.company_id;
    project_id_value := OLD.id;
    status_value := OLD.status;
  ELSE
    company_id_value := NEW.company_id;
    project_id_value := NEW.id;
    status_value := NEW.status;
  END IF;

  -- Broadcast to admin channel (always, for admin overview page)
  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'projects',
      'company_id', company_id_value,
      'action', TG_OP,
      'record_id', project_id_value,
      'project_id', project_id_value,
      'status', status_value,
      'timestamp', extract(epoch from now())
    ),
    'project_update',
    'admin:projects',
    false
  );

  -- Broadcast to company-scoped channel (for future company-scoped views)
  IF company_id_value IS NOT NULL THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'table', 'projects',
        'company_id', company_id_value,
        'action', TG_OP,
        'record_id', project_id_value,
        'project_id', project_id_value,
        'status', status_value,
        'timestamp', extract(epoch from now())
      ),
      'project_update',
      'company:' || company_id_value || ':projects',
      false
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS projects_broadcast_trigger ON projects;

-- Create trigger for projects table
CREATE TRIGGER projects_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_project_update();

COMMENT ON FUNCTION broadcast_project_update() IS
  'Broadcasts project changes via Supabase Realtime broadcast to admin:projects and company:{company_id}:projects channels.';

-- =============================================================================
-- Function: broadcast_project_task_to_projects
-- When project_tasks change, notify the projects list so task counts update
-- =============================================================================
CREATE OR REPLACE FUNCTION broadcast_project_task_to_projects()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_company_id UUID;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  -- Look up company_id from the parent project
  SELECT company_id INTO v_company_id FROM projects WHERE id = v_project_id;

  -- Broadcast to admin channel so list page refreshes task counts
  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'project_tasks',
      'company_id', v_company_id,
      'action', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id),
      'project_id', v_project_id,
      'timestamp', extract(epoch from now())
    ),
    'project_update',
    'admin:projects',
    false
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS project_tasks_broadcast_to_projects_trigger ON project_tasks;

-- Create trigger for project_tasks table
CREATE TRIGGER project_tasks_broadcast_to_projects_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_project_task_to_projects();

COMMENT ON FUNCTION broadcast_project_task_to_projects() IS
  'Broadcasts project_task changes to admin:projects channel so the project list page can refresh task counts.';
