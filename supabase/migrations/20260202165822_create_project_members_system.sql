-- Create project_members table
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    added_via VARCHAR(50) NOT NULL CHECK (added_via IN ('manual', 'task_assignment', 'project_assignment')),
    added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_user ON project_members(project_id, user_id);

-- Trigger function: Auto-add member when task is assigned
CREATE OR REPLACE FUNCTION auto_add_project_member_from_task()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_to IS NOT NULL AND NEW.project_id IS NOT NULL THEN
        INSERT INTO project_members (project_id, user_id, added_via, added_by)
        VALUES (NEW.project_id, NEW.assigned_to, 'task_assignment', auth.uid())
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-add when task is created with assignment
CREATE TRIGGER auto_add_member_on_task_assign_insert
    AFTER INSERT ON project_tasks FOR EACH ROW
    EXECUTE FUNCTION auto_add_project_member_from_task();

-- Trigger: Auto-add when task assignment is updated
CREATE TRIGGER auto_add_member_on_task_assign_update
    AFTER UPDATE OF assigned_to ON project_tasks FOR EACH ROW
    WHEN (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)
    EXECUTE FUNCTION auto_add_project_member_from_task();

-- Trigger function: Auto-add when project assigned_to is set
CREATE OR REPLACE FUNCTION auto_add_project_assignee_as_member()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO project_members (project_id, user_id, added_via, added_by)
        VALUES (NEW.id, NEW.assigned_to, 'project_assignment', auth.uid())
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-add when project is created with assigned_to
CREATE TRIGGER auto_add_project_assignee_insert
    AFTER INSERT ON projects FOR EACH ROW
    EXECUTE FUNCTION auto_add_project_assignee_as_member();

-- Trigger: Auto-add when project assigned_to is updated
CREATE TRIGGER auto_add_project_assignee_update
    AFTER UPDATE OF assigned_to ON projects FOR EACH ROW
    WHEN (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)
    EXECUTE FUNCTION auto_add_project_assignee_as_member();

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins have full access
CREATE POLICY "Admins full access" ON project_members FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
));

-- RLS Policy: Users can view members of accessible projects
CREATE POLICY "Users view accessible" ON project_members FOR SELECT
USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN user_companies uc ON uc.company_id = p.company_id
    WHERE p.id = project_members.project_id
    AND (
        auth.uid() = p.requested_by
        OR auth.uid() = p.assigned_to
        OR uc.user_id = auth.uid()
    )
));

-- RLS Policy: Users can add members to projects they manage
CREATE POLICY "Users add to managed" ON project_members FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN user_companies uc ON uc.company_id = p.company_id
    WHERE p.id = project_members.project_id
    AND (
        auth.uid() = p.requested_by
        OR auth.uid() = p.assigned_to
        OR (uc.user_id = auth.uid() AND uc.role IN ('manager', 'owner'))
    )
));

-- RLS Policy: Users can remove manual members from projects they manage
CREATE POLICY "Users remove manual from managed" ON project_members FOR DELETE
USING (
    added_via = 'manual'
    AND EXISTS (
        SELECT 1 FROM projects p
        LEFT JOIN user_companies uc ON uc.company_id = p.company_id
        WHERE p.id = project_members.project_id
        AND (
            auth.uid() = p.requested_by
            OR auth.uid() = p.assigned_to
            OR (uc.user_id = auth.uid() AND uc.role IN ('manager', 'owner'))
        )
    )
);

-- Backfill: Add existing project assignees as members
INSERT INTO project_members (project_id, user_id, added_via, added_by, created_at)
SELECT id, assigned_to, 'project_assignment', requested_by, created_at
FROM projects
WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill: Add existing task assignees as members
INSERT INTO project_members (project_id, user_id, added_via, added_by, created_at)
SELECT DISTINCT
    project_id,
    assigned_to,
    'task_assignment',
    created_by,
    MIN(created_at)
FROM project_tasks
WHERE assigned_to IS NOT NULL
AND project_id IS NOT NULL
GROUP BY project_id, assigned_to, created_by
ON CONFLICT DO NOTHING;

-- Create project_template_members table
CREATE TABLE public.project_template_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_template_member UNIQUE (template_id, user_id)
);

-- Create index for template members
CREATE INDEX idx_template_members_template_id ON project_template_members(template_id);

-- Enable RLS for template members
ALTER TABLE project_template_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins have full access to template members
CREATE POLICY "Admins full access template members" ON project_template_members FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
));

-- RLS Policy: Authenticated users can view template members for active templates
CREATE POLICY "Users view active template members" ON project_template_members FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM project_templates
        WHERE project_templates.id = project_template_members.template_id
        AND project_templates.is_active = TRUE
    )
);
