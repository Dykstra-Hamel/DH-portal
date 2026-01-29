-- Add RLS policies for monthly service tasks
-- Monthly service tasks have project_id = NULL and monthly_service_id != NULL

-- Add index on monthly_service_id for better query performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_monthly_service_id
ON project_tasks(monthly_service_id)
WHERE monthly_service_id IS NOT NULL;

-- Policy: Users can view monthly service tasks for companies they have access to
CREATE POLICY "Users can view monthly service tasks in their companies"
    ON project_tasks
    FOR SELECT
    USING (
        -- Allow if this is a monthly service task and user has access to the company
        project_id IS NULL
        AND monthly_service_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM monthly_services
            JOIN user_companies ON user_companies.company_id = monthly_services.company_id
            WHERE monthly_services.id = project_tasks.monthly_service_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Policy: Users with company access can create/update monthly service tasks for their companies
CREATE POLICY "Users can manage monthly service tasks in their companies"
    ON project_tasks
    FOR INSERT
    WITH CHECK (
        -- Allow if this is a monthly service task and user has access to the company
        project_id IS NULL
        AND monthly_service_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM monthly_services
            JOIN user_companies ON user_companies.company_id = monthly_services.company_id
            WHERE monthly_services.id = project_tasks.monthly_service_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Policy: Users can update monthly service tasks in their companies
CREATE POLICY "Users can update monthly service tasks in their companies"
    ON project_tasks
    FOR UPDATE
    USING (
        -- Allow if this is a monthly service task and user has access to the company
        project_id IS NULL
        AND monthly_service_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM monthly_services
            JOIN user_companies ON user_companies.company_id = monthly_services.company_id
            WHERE monthly_services.id = project_tasks.monthly_service_id
            AND user_companies.user_id = auth.uid()
        )
    )
    WITH CHECK (
        -- Ensure they can't change it to a different monthly service outside their access
        project_id IS NULL
        AND monthly_service_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM monthly_services
            JOIN user_companies ON user_companies.company_id = monthly_services.company_id
            WHERE monthly_services.id = project_tasks.monthly_service_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Add helpful comment
COMMENT ON INDEX idx_project_tasks_monthly_service_id IS 'Index for querying tasks associated with monthly services';
