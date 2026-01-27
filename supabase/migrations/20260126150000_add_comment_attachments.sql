-- Comment Attachments Table
-- Stores attachments for both project_comments and project_task_comments

CREATE TABLE comment_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Polymorphic reference - one of these will be set
    project_comment_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
    task_comment_id UUID REFERENCES project_task_comments(id) ON DELETE CASCADE,
    -- File metadata
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: exactly one parent
    CONSTRAINT one_parent_comment CHECK (
        (project_comment_id IS NOT NULL AND task_comment_id IS NULL) OR
        (project_comment_id IS NULL AND task_comment_id IS NOT NULL)
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_comment_attachments_project_comment ON comment_attachments(project_comment_id) WHERE project_comment_id IS NOT NULL;
CREATE INDEX idx_comment_attachments_task_comment ON comment_attachments(task_comment_id) WHERE task_comment_id IS NOT NULL;
CREATE INDEX idx_comment_attachments_uploaded_by ON comment_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE comment_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_attachments
-- View policy: Users can view attachments on comments they can see (via admin access)
CREATE POLICY "Admins can view comment attachments" ON comment_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'dh_admin', 'company_admin')
        )
    );

-- Insert policy: Users can add attachments to comments
CREATE POLICY "Admins can create comment attachments" ON comment_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'dh_admin', 'company_admin')
        )
        AND uploaded_by = auth.uid()
    );

-- Delete policy: Users can delete their own attachments
CREATE POLICY "Users can delete own attachments" ON comment_attachments
    FOR DELETE
    USING (uploaded_by = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON comment_attachments TO authenticated;
