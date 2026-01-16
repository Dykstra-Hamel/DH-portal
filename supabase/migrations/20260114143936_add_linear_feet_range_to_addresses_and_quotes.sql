-- Add linear_feet_range column to service_addresses table
-- Stores the selected linear feet range from dropdown (e.g., "0-100", "101-150", "500+")

ALTER TABLE service_addresses
ADD COLUMN IF NOT EXISTS linear_feet_range VARCHAR(50);

-- Add linear_feet_range column to quotes table
-- Copied from service_address at time of quote creation
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS linear_feet_range VARCHAR(50);

-- Add indexes for filtering/querying
CREATE INDEX IF NOT EXISTS idx_service_addresses_linear_feet_range ON service_addresses(linear_feet_range);
CREATE INDEX IF NOT EXISTS idx_quotes_linear_feet_range ON quotes(linear_feet_range);

-- Add comments for documentation
COMMENT ON COLUMN service_addresses.linear_feet_range IS 'Selected linear feet range from dropdown (e.g., "0-100", "101-150", "500+")';
COMMENT ON COLUMN quotes.linear_feet_range IS 'Linear feet range copied from service_address at time of quote creation';
