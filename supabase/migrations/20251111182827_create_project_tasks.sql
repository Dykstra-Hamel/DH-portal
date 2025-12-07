-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,

    -- Basic Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    notes TEXT,

    -- Status & Priority
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'completed', 'blocked', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    -- Assignment
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,

    -- Timeline
    due_date DATE,
    start_date DATE,
    completed_at TIMESTAMPTZ,

    -- Progress & Time Tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),

    -- Project Management Fields
    labels TEXT[],
    milestone VARCHAR(100),
    sprint VARCHAR(100),
    story_points INTEGER,

    -- Dependencies & Blockers
    blocked_by TEXT[],
    blocking TEXT[],
    blocker_reason TEXT,

    -- Order & Display
    display_order INTEGER DEFAULT 0,
    kanban_column VARCHAR(50),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_tasks_parent_task ON project_tasks(parent_task_id);
CREATE INDEX idx_project_tasks_due_date ON project_tasks(due_date);

-- Create project_task_comments table
CREATE TABLE IF NOT EXISTS project_task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for comments
CREATE INDEX idx_project_task_comments_task_id ON project_task_comments(task_id);
CREATE INDEX idx_project_task_comments_created_at ON project_task_comments(created_at DESC);

-- Create project_task_templates table
CREATE TABLE IF NOT EXISTS project_task_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tasks JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_task_updated_at();

CREATE TRIGGER update_project_task_comments_updated_at
    BEFORE UPDATE ON project_task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_task_updated_at();

CREATE TRIGGER update_project_task_templates_updated_at
    BEFORE UPDATE ON project_task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_project_task_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_task_templates ENABLE ROW LEVEL SECURITY;

-- project_tasks policies
-- Super admins can do everything
CREATE POLICY "Super admins have full access to project tasks"
    ON project_tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can view tasks for projects in their company
CREATE POLICY "Users can view tasks in their company projects"
    ON project_tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN user_companies ON user_companies.company_id = projects.company_id
            WHERE projects.id = project_tasks.project_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- project_task_comments policies
-- Super admins can do everything
CREATE POLICY "Super admins have full access to task comments"
    ON project_task_comments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can view comments on tasks they can see
CREATE POLICY "Users can view comments on accessible tasks"
    ON project_task_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_tasks
            JOIN projects ON projects.id = project_tasks.project_id
            JOIN user_companies ON user_companies.company_id = projects.company_id
            WHERE project_tasks.id = project_task_comments.task_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Users can create comments on tasks they can see
CREATE POLICY "Users can create comments on accessible tasks"
    ON project_task_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_tasks
            JOIN projects ON projects.id = project_tasks.project_id
            JOIN user_companies ON user_companies.company_id = projects.company_id
            WHERE project_tasks.id = project_task_comments.task_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON project_task_comments
    FOR UPDATE
    USING (user_id = auth.uid());

-- project_task_templates policies
-- Super admins can manage templates
CREATE POLICY "Super admins have full access to task templates"
    ON project_task_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- All authenticated users can view templates
CREATE POLICY "Authenticated users can view task templates"
    ON project_task_templates
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
