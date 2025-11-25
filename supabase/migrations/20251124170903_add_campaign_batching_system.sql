-- Add campaign batching and rate limiting system
-- This enables controlled sending with concurrency limits and business hours respect

-- 1. Add batching configuration columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS batch_size INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS batch_interval_minutes INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS daily_limit INT DEFAULT 500,
ADD COLUMN IF NOT EXISTS respect_business_hours BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS exclude_weekends BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS estimated_days INT,
ADD COLUMN IF NOT EXISTS current_batch INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_batch_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contacts_sent_today INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_day_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN campaigns.batch_size IS 'Number of contacts to process per batch (default 10)';
COMMENT ON COLUMN campaigns.batch_interval_minutes IS 'Minutes to wait between batches (default 10)';
COMMENT ON COLUMN campaigns.daily_limit IS 'Maximum contacts to process per day (default 500)';
COMMENT ON COLUMN campaigns.respect_business_hours IS 'Whether to only send during company business hours';
COMMENT ON COLUMN campaigns.exclude_weekends IS 'Whether to skip weekends based on company settings';
COMMENT ON COLUMN campaigns.estimated_days IS 'Calculated estimate of days needed to complete campaign';
COMMENT ON COLUMN campaigns.current_batch IS 'Current batch number being processed';
COMMENT ON COLUMN campaigns.last_batch_sent_at IS 'Timestamp of last batch execution';
COMMENT ON COLUMN campaigns.contacts_sent_today IS 'Count of contacts sent today (resets at midnight)';
COMMENT ON COLUMN campaigns.current_day_date IS 'Current day for tracking daily limits';

-- 2. Create campaign_batch_schedule table for tracking scheduled batches
CREATE TABLE IF NOT EXISTS campaign_batch_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    batch_number INT NOT NULL,
    contacts_count INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    started_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(campaign_id, scheduled_date, batch_number)
);

-- Create indexes for campaign_batch_schedule
CREATE INDEX idx_campaign_batch_schedule_campaign_id ON campaign_batch_schedule(campaign_id);
CREATE INDEX idx_campaign_batch_schedule_status ON campaign_batch_schedule(status);
CREATE INDEX idx_campaign_batch_schedule_scheduled_date ON campaign_batch_schedule(scheduled_date);
CREATE INDEX idx_campaign_batch_schedule_pending ON campaign_batch_schedule(campaign_id, status) WHERE status = 'pending';

COMMENT ON TABLE campaign_batch_schedule IS 'Tracks scheduled batches for campaigns over multiple days';

-- 3. Create campaign_concurrency_tracker table for managing concurrent calls
CREATE TABLE IF NOT EXISTS campaign_concurrency_tracker (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES automation_executions(id) ON DELETE SET NULL,
    retell_call_id VARCHAR(255),
    call_started_at TIMESTAMPTZ DEFAULT NOW(),
    call_completed_at TIMESTAMPTZ,
    call_duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for concurrency tracking
CREATE INDEX idx_campaign_concurrency_campaign_id ON campaign_concurrency_tracker(campaign_id);
CREATE INDEX idx_campaign_concurrency_retell_call_id ON campaign_concurrency_tracker(retell_call_id);
CREATE INDEX idx_campaign_concurrency_active_calls ON campaign_concurrency_tracker(call_completed_at)
    WHERE call_completed_at IS NULL;
CREATE INDEX idx_campaign_concurrency_execution_id ON campaign_concurrency_tracker(execution_id);

COMMENT ON TABLE campaign_concurrency_tracker IS 'Tracks active phone calls to enforce max 10 concurrent calls limit';

-- 4. Enable RLS for new tables
ALTER TABLE campaign_batch_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_concurrency_tracker ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_batch_schedule
CREATE POLICY "Users can read batch schedules for their companies" ON campaign_batch_schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_batch_schedule.campaign_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Company admins can manage batch schedules" ON campaign_batch_schedule
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_batch_schedule.campaign_id
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- RLS Policies for campaign_concurrency_tracker
CREATE POLICY "Users can read concurrency data for their companies" ON campaign_concurrency_tracker
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_companies uc ON uc.company_id = c.company_id
            WHERE c.id = campaign_concurrency_tracker.campaign_id
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 5. Function to reset daily contact counter at midnight
CREATE OR REPLACE FUNCTION reset_campaign_daily_counters()
RETURNS void AS $$
BEGIN
    UPDATE campaigns
    SET
        contacts_sent_today = 0,
        current_day_date = CURRENT_DATE
    WHERE
        current_day_date < CURRENT_DATE
        AND status IN ('running', 'scheduled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION reset_campaign_daily_counters IS 'Resets daily contact counters for campaigns at midnight';

-- 6. Function to get active concurrent calls count
CREATE OR REPLACE FUNCTION get_active_calls_count()
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM campaign_concurrency_tracker
        WHERE call_completed_at IS NULL
        AND call_started_at > NOW() - INTERVAL '2 hours' -- Safety: ignore calls older than 2 hours
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION get_active_calls_count IS 'Returns count of currently active campaign calls for concurrency control';

-- 7. Function to cleanup stale call tracking records
CREATE OR REPLACE FUNCTION cleanup_stale_call_tracking()
RETURNS void AS $$
BEGIN
    -- Mark calls older than 1 hour as completed if still showing as active
    UPDATE campaign_concurrency_tracker
    SET
        call_completed_at = call_started_at + INTERVAL '1 hour',
        call_duration_seconds = 3600
    WHERE
        call_completed_at IS NULL
        AND call_started_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION cleanup_stale_call_tracking IS 'Cleans up stale call tracking records (older than 1 hour)';

-- 8. Enable realtime for new tables (optional, for UI updates)
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_batch_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_concurrency_tracker;
