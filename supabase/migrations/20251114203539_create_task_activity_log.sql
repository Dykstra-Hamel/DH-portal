-- Create project_task_activity table for tracking all task changes
CREATE TABLE IF NOT EXISTS project_task_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,

    -- Action tracking
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'created',
        'edited',
        'completed',
        'uncompleted',
        'assigned',
        'unassigned',
        'priority_changed',
        'due_date_changed',
        'title_changed',
        'description_changed',
        'notes_changed'
    )),

    -- Change details
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_task_activity_task_id ON project_task_activity(task_id);
CREATE INDEX idx_task_activity_created_at ON project_task_activity(created_at DESC);
CREATE INDEX idx_task_activity_user_id ON project_task_activity(user_id);

-- Enable RLS
ALTER TABLE project_task_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Super admins have full access
CREATE POLICY "Super admins have full access to task activity"
    ON project_task_activity
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can view activity for tasks in their company projects
CREATE POLICY "Users can view activity for accessible tasks"
    ON project_task_activity
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_tasks
            JOIN projects ON projects.id = project_tasks.project_id
            JOIN user_companies ON user_companies.company_id = projects.company_id
            WHERE project_tasks.id = project_task_activity.task_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Create trigger function to automatically log task changes
CREATE OR REPLACE FUNCTION log_project_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log task completion status changes
    IF OLD.is_completed IS DISTINCT FROM NEW.is_completed THEN
        INSERT INTO project_task_activity (task_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            CASE WHEN NEW.is_completed THEN 'completed' ELSE 'uncompleted' END,
            'is_completed',
            OLD.is_completed::text,
            NEW.is_completed::text
        );
    END IF;

    -- Log title changes
    IF OLD.title IS DISTINCT FROM NEW.title THEN
        INSERT INTO project_task_activity (task_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'title_changed',
            'title',
            OLD.title,
            NEW.title
        );
    END IF;

    -- Log description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        INSERT INTO project_task_activity (task_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'description_changed',
            'description',
            COALESCE(OLD.description, ''),
            COALESCE(NEW.description, '')
        );
    END IF;

    -- Log priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO project_task_activity (task_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'priority_changed',
            'priority',
            OLD.priority,
            NEW.priority
        );
    END IF;

    -- Log assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        INSERT INTO project_task_activity (task_id, user_id, action_type, field_changed, old_value, new_value)
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
        INSERT INTO project_task_activity (task_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'due_date_changed',
            'due_date',
            COALESCE(OLD.due_date::text, ''),
            COALESCE(NEW.due_date::text, '')
        );
    END IF;

    -- Log notes changes
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
        INSERT INTO project_task_activity (task_id, user_id, action_type, field_changed, old_value, new_value)
        VALUES (
            NEW.id,
            auth.uid(),
            'notes_changed',
            'notes',
            COALESCE(OLD.notes, ''),
            COALESCE(NEW.notes, '')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions;

-- Create trigger on project_tasks updates
CREATE TRIGGER track_project_task_changes
    AFTER UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_project_task_changes();

-- Log task creation
CREATE OR REPLACE FUNCTION log_project_task_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_task_activity (task_id, user_id, action_type)
    VALUES (NEW.id, auth.uid(), 'created');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions;

-- Create trigger for task creation
CREATE TRIGGER track_project_task_creation
    AFTER INSERT ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_project_task_creation();
