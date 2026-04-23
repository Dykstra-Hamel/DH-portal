-- Company-shared saved field-sales reports.
-- Admins/managers/owners of a company can create, view, and edit reports
-- generated from the field-sales admin dashboard.

CREATE TABLE IF NOT EXISTS saved_field_sales_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_field_sales_reports_company
    ON saved_field_sales_reports(company_id, created_at DESC);

CREATE TRIGGER update_saved_field_sales_reports_updated_at
    BEFORE UPDATE ON saved_field_sales_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE saved_field_sales_reports ENABLE ROW LEVEL SECURITY;

-- Admins/managers/owners of the row's company can read/write.
-- Global platform admins (profiles.role = 'admin') also have access.
CREATE POLICY "Company admins manage saved field-sales reports"
    ON saved_field_sales_reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
              AND uc.company_id = saved_field_sales_reports.company_id
              AND uc.role IN ('owner', 'admin', 'manager')
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
              AND uc.company_id = saved_field_sales_reports.company_id
              AND uc.role IN ('owner', 'admin', 'manager')
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON saved_field_sales_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_field_sales_reports TO service_role;

COMMENT ON TABLE saved_field_sales_reports IS
    'Company-shared prompts + cached results for the field-sales admin dashboard. Readable/writable by admin/manager/owner of the company.';
