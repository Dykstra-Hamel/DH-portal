-- Fix project activity log trigger to remove references to dropped columns
-- The columns budget_amount, estimated_hours, and actual_hours were dropped in
-- migration 20251112170000_update_projects_for_billable_pricing.sql

CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'status_changed',
            'status',
            OLD.status,
            NEW.status
        );
    END IF;

    -- Log priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'priority_changed',
            'priority',
            OLD.priority,
            NEW.priority
        );
    END IF;

    -- Log name changes
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'name_changed',
            'name',
            OLD.name,
            NEW.name
        );
    END IF;

    -- Log description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'description_changed',
            'description',
            COALESCE(OLD.description, ''),
            COALESCE(NEW.description, '')
        );
    END IF;

    -- Log notes changes
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'notes_changed',
            'notes',
            COALESCE(OLD.notes, ''),
            COALESCE(NEW.notes, '')
        );
    END IF;

    -- Log assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            CASE
                WHEN NEW.assigned_to IS NULL THEN 'unassigned'
                WHEN OLD.assigned_to IS NULL THEN 'assigned'
                ELSE 'assigned'
            END,
            'assigned_to',
            COALESCE(OLD.assigned_to::text, ''),
            COALESCE(NEW.assigned_to::text, '')
        );
    END IF;

    -- Log due date changes
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'due_date_changed',
            'due_date',
            COALESCE(OLD.due_date::text, ''),
            COALESCE(NEW.due_date::text, '')
        );
    END IF;

    -- Log start date changes
    IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'start_date_changed',
            'start_date',
            COALESCE(OLD.start_date::text, ''),
            COALESCE(NEW.start_date::text, '')
        );
    END IF;

    -- Log completion date changes
    IF OLD.completion_date IS DISTINCT FROM NEW.completion_date THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'completion_date_changed',
            'completion_date',
            COALESCE(OLD.completion_date::text, ''),
            COALESCE(NEW.completion_date::text, '')
        );
    END IF;

    -- Log project type changes
    IF OLD.project_type IS DISTINCT FROM NEW.project_type THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'project_type_changed',
            'project_type',
            OLD.project_type,
            NEW.project_type
        );
    END IF;

    -- Log project subtype changes (if column exists)
    IF OLD.project_subtype IS DISTINCT FROM NEW.project_subtype THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'project_subtype_changed',
            'project_subtype',
            COALESCE(OLD.project_subtype, ''),
            COALESCE(NEW.project_subtype, '')
        );
    END IF;

    -- Log tags changes
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
        INSERT INTO project_activity (project_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'tags_changed',
            'tags',
            COALESCE(array_to_string(OLD.tags, ', '), ''),
            COALESCE(array_to_string(NEW.tags, ', '), '')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions;
