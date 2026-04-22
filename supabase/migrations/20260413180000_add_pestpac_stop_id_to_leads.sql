ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pestpac_stop_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_leads_company_stop
  ON leads (company_id, pestpac_stop_id)
  WHERE pestpac_stop_id IS NOT NULL;
