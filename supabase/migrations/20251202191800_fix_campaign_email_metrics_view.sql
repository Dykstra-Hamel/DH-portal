-- Fix campaign_email_metrics view to properly count delivered emails
-- Issue: When emails are opened/clicked, delivery_status changes from 'delivered' to 'opened'/'clicked'
-- This caused the denominator to be 0 or too small, returning NULL for open_rate and click_rate

CREATE OR REPLACE VIEW campaign_email_metrics AS
SELECT
  campaign_id,
  COUNT(*) as total_sent,

  -- Count emails that were successfully delivered (including those that were later opened/clicked)
  COUNT(*) FILTER (WHERE delivery_status IN ('delivered', 'opened', 'clicked')) as delivered,

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

  -- Open rate (opens / delivered emails)
  -- Fixed: Now counts delivered, opened, and clicked as successfully delivered
  ROUND(
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE delivery_status IN ('delivered', 'opened', 'clicked')), 0) * 100,
    2
  ) as open_rate,

  -- Click rate (clicks / delivered emails)
  -- Fixed: Now counts delivered, opened, and clicked as successfully delivered
  ROUND(
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE delivery_status IN ('delivered', 'opened', 'clicked')), 0) * 100,
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

COMMENT ON VIEW campaign_email_metrics IS 'Aggregated email metrics per campaign with calculated rates. Fixed to count opened/clicked emails as delivered for rate calculations.';
