-- Recreate projects table after it was dropped in remote_schema.sql
-- This migration re-adds the projects table with all its constraints, indexes, and policies

-- First, ensure we have the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create projects table with comprehensive project management fields
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core project information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100) NOT NULL,
    
    -- Relationships
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Status and priority
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    
    -- Dates
    due_date DATE NOT NULL,
    start_date DATE,
    completion_date DATE,
    
    -- Budget and estimation
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    budget_amount DECIMAL(12,2),
    
    -- Supabase Storage integration for primary file
    primary_file_path TEXT, -- Storage path (e.g., 'project-files/company-id/project-id/filename.pdf')
    
    -- Additional metadata
    tags TEXT[], -- Array of tags for categorization
    attachments JSONB DEFAULT '[]'::jsonb, -- Store additional file references from Storage
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT projects_status_check CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    CONSTRAINT projects_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT projects_dates_check CHECK (
        (start_date IS NULL OR due_date >= start_date) AND
        (completion_date IS NULL OR completion_date >= COALESCE(start_date, created_at::date))
    )
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_projects_requested_by ON public.projects(requested_by);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON public.projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects(project_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON public.projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_status ON public.projects(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_projects_company_due_date ON public.projects(company_id, due_date);

-- GIN index for tags array and attachments JSONB
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_projects_attachments ON public.projects USING GIN(attachments);

-- Add updated_at trigger
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security

-- Users can view projects if they:
-- 1. Are the requester
-- 2. Are assigned to the project
-- 3. Are associated with the project's company
-- 4. Are admin
CREATE POLICY "Users can view projects they have access to" ON public.projects
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = requested_by OR
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.user_companies uc
            WHERE uc.user_id = auth.uid() AND uc.company_id = projects.company_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Users can create projects if they are associated with the company OR are admin
CREATE POLICY "Users can create projects for their companies or admins can create for any company" ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = requested_by AND (
            EXISTS (
                SELECT 1 FROM public.user_companies uc
                WHERE uc.user_id = auth.uid() AND uc.company_id = projects.company_id
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role = 'admin'
            )
        )
    );

-- Users can update projects if they:
-- 1. Are the requester
-- 2. Are assigned to the project
-- 3. Are admin (can update any project)
-- 4. Have manager/owner role in the company
CREATE POLICY "Users can update projects they have permission for" ON public.projects
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = requested_by OR
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_companies uc
            WHERE uc.user_id = auth.uid() 
            AND uc.company_id = projects.company_id
            AND uc.role IN ('manager', 'owner')
        )
    );

-- Only admins and project requesters can delete projects
CREATE POLICY "Only admins and requesters can delete projects" ON public.projects
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = requested_by OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Create Storage bucket for project files (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files',
    'project-files',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/vnd.adobe.illustrator', 'application/postscript']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for project files
CREATE POLICY "Users can view project files they have access to" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.primary_file_path = storage.objects.name AND (
                auth.uid() = p.requested_by OR
                auth.uid() = p.assigned_to OR
                EXISTS (
                    SELECT 1 FROM public.user_companies uc
                    WHERE uc.user_id = auth.uid() AND uc.company_id = p.company_id
                ) OR
                EXISTS (
                    SELECT 1 FROM public.profiles prof
                    WHERE prof.id = auth.uid() AND prof.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Users can upload project files for their companies" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'project-files' AND
        (
            -- Check if user has access to upload for this company (path structure: company-id/...)
            EXISTS (
                SELECT 1 FROM public.user_companies uc
                WHERE uc.user_id = auth.uid() AND 
                storage.objects.name LIKE 'project-files/' || uc.company_id::text || '/%'
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role = 'admin'
            )
        )
    );

CREATE POLICY "Users can update project files they have access to" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.primary_file_path = storage.objects.name AND (
                auth.uid() = p.requested_by OR
                auth.uid() = p.assigned_to OR
                EXISTS (
                    SELECT 1 FROM public.profiles prof
                    WHERE prof.id = auth.uid() AND prof.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Users can delete project files they have access to" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.primary_file_path = storage.objects.name AND (
                auth.uid() = p.requested_by OR
                EXISTS (
                    SELECT 1 FROM public.profiles prof
                    WHERE prof.id = auth.uid() AND prof.role = 'admin'
                )
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.projects IS 'Project management table storing project requests and tracking';
COMMENT ON COLUMN public.projects.requested_by IS 'User who requested/created the project';
COMMENT ON COLUMN public.projects.company_id IS 'Company the project belongs to';
COMMENT ON COLUMN public.projects.assigned_to IS 'User assigned to work on the project';
COMMENT ON COLUMN public.projects.status IS 'Current status: pending, in_progress, on_hold, completed, cancelled';
COMMENT ON COLUMN public.projects.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN public.projects.primary_file_path IS 'Storage path to primary project file in Supabase Storage';
COMMENT ON COLUMN public.projects.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN public.projects.attachments IS 'JSONB array of additional file references from Storage';