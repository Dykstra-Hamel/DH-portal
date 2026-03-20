-- Add PestPac client ID to customers for reliable future matching
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS pestpac_client_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_customers_pestpac_client_id
  ON customers(company_id, pestpac_client_id);
