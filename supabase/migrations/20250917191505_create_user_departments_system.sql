-- Create user_departments table for department assignments
CREATE TABLE IF NOT EXISTS user_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL CHECK (department IN ('sales', 'support', 'scheduling')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id, department)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_company_id ON user_departments(company_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_user_company ON user_departments(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department ON user_departments(department);

-- Create updated_at trigger
CREATE TRIGGER update_user_departments_updated_at
    BEFORE UPDATE ON user_departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update profiles table to support 'customer' role
-- Note: keeping existing constraint flexible since it's already VARCHAR(50)
-- The application layer will enforce the valid values: 'admin', 'user', 'customer'

-- Enable Row Level Security
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_departments

-- Users can view their own department assignments
CREATE POLICY "Users can view their own departments" ON user_departments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view departments for users in the same company (if they're a manager/admin)
CREATE POLICY "Company managers can view department assignments" ON user_departments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = user_departments.company_id
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

-- Global admins can view all department assignments
CREATE POLICY "Global admins can view all departments" ON user_departments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Only company admins/managers and global admins can insert department assignments
CREATE POLICY "Company managers can assign departments" ON user_departments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = user_departments.company_id
            AND uc.role IN ('admin', 'manager', 'owner')
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Only company admins/managers and global admins can update department assignments
CREATE POLICY "Company managers can update departments" ON user_departments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = user_departments.company_id
            AND uc.role IN ('admin', 'manager', 'owner')
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Only company admins/managers and global admins can delete department assignments
CREATE POLICY "Company managers can remove departments" ON user_departments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = user_departments.company_id
            AND uc.role IN ('admin', 'manager', 'owner')
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Create helper function to get user departments for a company
CREATE OR REPLACE FUNCTION get_user_departments(
    p_user_id UUID,
    p_company_id UUID
) RETURNS TEXT[] AS $$
DECLARE
    departments TEXT[];
BEGIN
    SELECT array_agg(department ORDER BY department)
    INTO departments
    FROM user_departments
    WHERE user_id = p_user_id
    AND company_id = p_company_id;

    RETURN COALESCE(departments, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user has specific department access
CREATE OR REPLACE FUNCTION user_has_department_access(
    p_user_id UUID,
    p_company_id UUID,
    p_department VARCHAR(50)
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_departments
        WHERE user_id = p_user_id
        AND company_id = p_company_id
        AND department = p_department
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to table for documentation
COMMENT ON TABLE user_departments IS 'Stores department assignments for users within companies. Only users with member or manager company roles should have departments assigned.';
COMMENT ON COLUMN user_departments.department IS 'Department type: sales, support, or scheduling';
COMMENT ON FUNCTION get_user_departments(UUID, UUID) IS 'Returns array of departments assigned to a user for a specific company';
COMMENT ON FUNCTION user_has_department_access(UUID, UUID, VARCHAR) IS 'Checks if user has access to a specific department within a company';