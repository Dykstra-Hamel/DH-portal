-- Create table to track when users last viewed task comments
CREATE TABLE IF NOT EXISTS project_task_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure one record per user per task
    UNIQUE(user_id, task_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_views_user_id ON project_task_views(user_id);
CREATE INDEX IF NOT EXISTS idx_task_views_task_id ON project_task_views(task_id);
CREATE INDEX IF NOT EXISTS idx_task_views_user_task ON project_task_views(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_views_last_viewed ON project_task_views(last_viewed_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_task_views_updated_at
    BEFORE UPDATE ON project_task_views
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE project_task_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own task views
CREATE POLICY "Users can view their own task views"
    ON project_task_views
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own task views
CREATE POLICY "Users can insert their own task views"
    ON project_task_views
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own task views
CREATE POLICY "Users can update their own task views"
    ON project_task_views
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Super admins have full access
CREATE POLICY "Super admins have full access to task views"
    ON project_task_views
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE project_task_views IS 'Tracks when users last viewed each task to determine if comments are unread';
COMMENT ON COLUMN project_task_views.last_viewed_at IS 'Timestamp when user last opened/viewed this task';
