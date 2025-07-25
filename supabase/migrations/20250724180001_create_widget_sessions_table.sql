-- Create widget_sessions table for managing user sessions across the widget
CREATE TABLE IF NOT EXISTS widget_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_agent TEXT,
    ip_address INET,
    referrer_url TEXT,
    page_url TEXT NOT NULL,
    first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_widget_sessions_company_id ON widget_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_widget_sessions_first_visit_at ON widget_sessions(first_visit_at);
CREATE INDEX IF NOT EXISTS idx_widget_sessions_last_activity_at ON widget_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_widget_sessions_is_active ON widget_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_widget_sessions_ip_address ON widget_sessions(ip_address);

-- Create function to automatically update last_activity_at timestamp
CREATE OR REPLACE FUNCTION update_widget_sessions_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the last_activity_at column
DROP TRIGGER IF EXISTS trigger_update_widget_sessions_last_activity ON widget_sessions;
CREATE TRIGGER trigger_update_widget_sessions_last_activity
    BEFORE UPDATE ON widget_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_widget_sessions_last_activity();

-- Add RLS policies for row-level security
ALTER TABLE widget_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Companies can only access their own widget sessions
CREATE POLICY "Companies can view their own widget sessions" ON widget_sessions
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Companies can insert their own widget sessions" ON widget_sessions
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Companies can update their own widget sessions" ON widget_sessions
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- Service role policy for widget submissions (bypasses RLS)
CREATE POLICY "Service role full access" ON widget_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up old inactive sessions (for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_widget_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sessions older than 90 days that are inactive
    DELETE FROM widget_sessions 
    WHERE is_active = false 
    AND last_activity_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Mark sessions as inactive if no activity for 7 days
    UPDATE widget_sessions 
    SET is_active = false 
    WHERE is_active = true 
    AND last_activity_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments for documentation
COMMENT ON TABLE widget_sessions IS 'Tracks user sessions across widget interactions for analytics and form recovery';
COMMENT ON COLUMN widget_sessions.session_id IS 'Unique session identifier used to link partial leads and form data';
COMMENT ON COLUMN widget_sessions.user_agent IS 'Browser user agent string for device/browser analytics';
COMMENT ON COLUMN widget_sessions.ip_address IS 'Client IP address for geographic analytics and fraud prevention';
COMMENT ON COLUMN widget_sessions.referrer_url IS 'URL that referred the user to the widget page';
COMMENT ON COLUMN widget_sessions.page_url IS 'URL where the widget is embedded';
COMMENT ON COLUMN widget_sessions.first_visit_at IS 'Timestamp of first widget interaction in this session';
COMMENT ON COLUMN widget_sessions.last_activity_at IS 'Timestamp of most recent activity in this session';
COMMENT ON COLUMN widget_sessions.is_active IS 'Whether the session is still active (updated by cleanup function)';
COMMENT ON FUNCTION cleanup_old_widget_sessions() IS 'Maintenance function to clean up old sessions and mark inactive ones';