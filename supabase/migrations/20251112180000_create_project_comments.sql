-- Create project_comments table

CREATE TABLE IF NOT EXISTS project_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX idx_project_comments_created_at ON project_comments(created_at DESC);
CREATE INDEX idx_project_comments_user_id ON project_comments(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_project_comments_updated_at
    BEFORE UPDATE ON project_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super admins have full access
CREATE POLICY "Super admins have full access to project comments"
    ON project_comments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can view comments on projects they have access to
CREATE POLICY "Users can view comments on accessible projects"
    ON project_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_comments.project_id
            AND (
                auth.uid() = projects.requested_by OR
                auth.uid() = projects.assigned_to OR
                EXISTS (
                    SELECT 1 FROM user_companies uc
                    WHERE uc.user_id = auth.uid()
                    AND uc.company_id = projects.company_id
                )
            )
        )
    );

-- Users can create comments on projects they have access to
CREATE POLICY "Users can create comments on accessible projects"
    ON project_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_comments.project_id
            AND (
                auth.uid() = projects.requested_by OR
                auth.uid() = projects.assigned_to OR
                EXISTS (
                    SELECT 1 FROM user_companies uc
                    WHERE uc.user_id = auth.uid()
                    AND uc.company_id = projects.company_id
                )
            )
        )
        AND user_id = auth.uid()
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON project_comments
    FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own comments (or admins can delete any)
CREATE POLICY "Users can delete their own comments"
    ON project_comments
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON project_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_comments TO service_role;

-- Add helpful comments
COMMENT ON TABLE project_comments IS 'Comments on projects for team collaboration';
COMMENT ON COLUMN project_comments.project_id IS 'The project this comment belongs to';
COMMENT ON COLUMN project_comments.user_id IS 'The user who created the comment';
COMMENT ON COLUMN project_comments.comment IS 'The comment text';
