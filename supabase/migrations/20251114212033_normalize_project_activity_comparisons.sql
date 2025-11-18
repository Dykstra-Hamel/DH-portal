-- Normalize project activity comparisons to avoid false positives
-- Treats NULL and empty values as equivalent for optional fields

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

    -- Log description changes (normalize NULL and empty string)
    IF COALESCE(OLD.description, '') IS DISTINCT FROM COALESCE(NEW.description, '') THEN
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

    -- Log notes changes (normalize NULL and empty string)
    IF COALESCE(OLD.notes, '') IS DISTINCT FROM COALESCE(NEW.notes, '') THEN
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

    -- Log project subtype changes (normalize NULL and empty string)
    IF COALESCE(OLD.project_subtype, '') IS DISTINCT FROM COALESCE(NEW.project_subtype, '') THEN
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

    -- Log tags changes (normalize NULL and empty array)
    -- Only log if there's an actual difference in content, not just NULL vs []
    IF (
        -- Check if both are non-empty and different
        (OLD.tags IS NOT NULL AND NEW.tags IS NOT NULL AND OLD.tags != NEW.tags)
        OR
        -- Check if one is NULL/empty and the other has content
        (COALESCE(array_length(OLD.tags, 1), 0) = 0 AND COALESCE(array_length(NEW.tags, 1), 0) > 0)
        OR
        (COALESCE(array_length(OLD.tags, 1), 0) > 0 AND COALESCE(array_length(NEW.tags, 1), 0) = 0)
    ) THEN
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
