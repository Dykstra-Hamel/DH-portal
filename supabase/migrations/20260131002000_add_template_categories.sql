-- Create junction table for project template categories
CREATE TABLE IF NOT EXISTS project_template_category_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, category_id)
);

-- Create indexes
CREATE INDEX idx_template_category_template ON project_template_category_assignments(template_id);
CREATE INDEX idx_template_category_category ON project_template_category_assignments(category_id);

-- Enable RLS
ALTER TABLE project_template_category_assignments ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins full access to template categories"
    ON project_template_category_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- All authenticated users can view template categories
CREATE POLICY "Users can view template categories"
    ON project_template_category_assignments
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON project_template_category_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_template_category_assignments TO service_role;

-- Add comment
COMMENT ON TABLE project_template_category_assignments IS 'Junction table linking project templates to categories';
