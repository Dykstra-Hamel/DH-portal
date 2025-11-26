-- Consolidate Email Logging: Add columns to email_logs and migrate data from email_automation_log
-- This migration consolidates two parallel email logging systems into a single table

-- Step 1: Add missing columns from email_automation_log to email_logs
ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS execution_id UUID REFERENCES automation_executions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tracking_data JSONB DEFAULT '{}'::jsonb;

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_execution_id ON email_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_scheduled_for ON email_logs(scheduled_for);

-- Step 3: Migrate data from email_automation_log to email_logs
-- Insert records that don't already exist in email_logs
INSERT INTO email_logs (
  company_id,
  lead_id,
  template_id,
  recipient_email,
  recipient_name,
  subject_line,
  email_provider,
  provider_message_id,
  ses_message_id,
  execution_id,
  send_status,
  delivery_status,
  scheduled_for,
  sent_at,
  delivered_at,
  opened_at,
  clicked_at,
  tracking_data,
  source,
  created_at,
  updated_at
)
SELECT
  eal.company_id,
  ae.lead_id,  -- Get lead_id from automation_execution
  eal.template_id,
  eal.recipient_email,
  eal.recipient_name,
  eal.subject_line,
  'aws-ses' as email_provider,
  eal.email_provider_id,
  eal.email_provider_id as ses_message_id,
  eal.execution_id,
  eal.send_status,
  CASE
    WHEN eal.send_status = 'delivered' THEN 'delivered'::email_delivery_status
    WHEN eal.send_status = 'opened' THEN 'opened'::email_delivery_status
    WHEN eal.send_status = 'clicked' THEN 'clicked'::email_delivery_status
    WHEN eal.send_status = 'failed' THEN 'failed'::email_delivery_status
    ELSE 'sent'::email_delivery_status
  END as delivery_status,
  eal.scheduled_for,
  eal.sent_at,
  eal.delivered_at,
  eal.opened_at,
  eal.clicked_at,
  eal.tracking_data,
  'automation_workflow' as source,
  eal.created_at,
  eal.updated_at
FROM email_automation_log eal
LEFT JOIN automation_executions ae ON ae.id = eal.execution_id
WHERE eal.email_provider_id IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicates if email_logs already has this entry
    SELECT 1 FROM email_logs el
    WHERE el.ses_message_id = eal.email_provider_id
  );

-- Step 4: Update existing email_logs entries with execution context from email_automation_log
UPDATE email_logs el
SET
  execution_id = eal.execution_id,
  recipient_name = COALESCE(el.recipient_name, eal.recipient_name),
  scheduled_for = COALESCE(el.scheduled_for, eal.scheduled_for),
  tracking_data = COALESCE(el.tracking_data, '{}'::jsonb) || COALESCE(eal.tracking_data, '{}'::jsonb),
  updated_at = NOW()
FROM email_automation_log eal
WHERE el.ses_message_id = eal.email_provider_id
  AND el.execution_id IS NULL
  AND eal.email_provider_id IS NOT NULL;

-- Step 5: Create campaign email metrics view with calculated rates
CREATE OR REPLACE VIEW campaign_email_metrics AS
SELECT
  campaign_id,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE delivery_status = 'bounced') as bounced,
  COUNT(*) FILTER (WHERE delivery_status = 'complained') as complained,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as unique_opens,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as unique_clicks,

  -- Bounce rate (bounces / total sent)
  ROUND(
    COUNT(*) FILTER (WHERE delivery_status = 'bounced')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as bounce_rate,

  -- Open rate (opens / delivered)
  ROUND(
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE delivery_status = 'delivered'), 0) * 100,
    2
  ) as open_rate,

  -- Click rate (clicks / delivered)
  ROUND(
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE delivery_status = 'delivered'), 0) * 100,
    2
  ) as click_rate,

  -- Click through rate (clicks / opens)
  ROUND(
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE opened_at IS NOT NULL), 0) * 100,
    2
  ) as click_through_rate,

  -- Complaint rate (complaints / total sent)
  ROUND(
    COUNT(*) FILTER (WHERE delivery_status = 'complained')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as complaint_rate,

  -- Hard vs soft bounces
  COUNT(*) FILTER (WHERE bounce_type = 'Permanent') as hard_bounces,
  COUNT(*) FILTER (WHERE bounce_type = 'Transient') as soft_bounces,

  -- Failed emails
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as total_failures

FROM email_logs
WHERE campaign_id IS NOT NULL
GROUP BY campaign_id;

COMMENT ON VIEW campaign_email_metrics IS 'Aggregated email metrics per campaign with calculated rates (bounce_rate, open_rate, click_rate, complaint_rate)';

-- Step 6: Create execution email metrics view
CREATE OR REPLACE VIEW execution_email_metrics AS
SELECT
  execution_id,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE delivery_status = 'bounced') as bounced,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed,
  MAX(sent_at) as last_email_sent,
  MIN(sent_at) as first_email_sent
FROM email_logs
WHERE execution_id IS NOT NULL
GROUP BY execution_id;

COMMENT ON VIEW execution_email_metrics IS 'Aggregated email metrics per workflow execution';

-- Step 7: Add comments for new columns
COMMENT ON COLUMN email_logs.execution_id IS 'Links to automation_executions for workflow tracking';
COMMENT ON COLUMN email_logs.campaign_id IS 'Links to campaigns for campaign email analytics';
COMMENT ON COLUMN email_logs.recipient_name IS 'Name of email recipient for personalization tracking';
COMMENT ON COLUMN email_logs.scheduled_for IS 'When email was scheduled to be sent (may differ from sent_at)';
COMMENT ON COLUMN email_logs.tracking_data IS 'Workflow-specific metadata and custom tracking data';
