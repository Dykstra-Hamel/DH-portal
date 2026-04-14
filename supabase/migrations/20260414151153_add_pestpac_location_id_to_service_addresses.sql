ALTER TABLE service_addresses
  ADD COLUMN IF NOT EXISTS pestpac_location_id text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_addresses_company_pestpac_location
  ON service_addresses (company_id, pestpac_location_id)
  WHERE pestpac_location_id IS NOT NULL;
