-- Add size range columns to service_addresses table
-- These store the selected range from dropdowns (e.g., "0-1500", "1501-2000")

ALTER TABLE service_addresses
ADD COLUMN IF NOT EXISTS home_size_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS yard_size_range VARCHAR(50);

-- Add indexes for filtering/querying
CREATE INDEX IF NOT EXISTS idx_service_addresses_home_size_range ON service_addresses(home_size_range);
CREATE INDEX IF NOT EXISTS idx_service_addresses_yard_size_range ON service_addresses(yard_size_range);

-- Add comments for documentation
COMMENT ON COLUMN service_addresses.home_size_range IS 'Selected home size range from dropdown (e.g., "0-1500", "1501-2000")';
COMMENT ON COLUMN service_addresses.yard_size_range IS 'Selected yard size range from dropdown (e.g., "0-0.25", "0.26-0.50")';