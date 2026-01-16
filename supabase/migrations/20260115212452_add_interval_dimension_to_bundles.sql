-- Add interval_dimension to bundle_plans
-- Allows bundles to specify which dimension (home sq ft, yard acres, or linear feet) the intervals are based on

ALTER TABLE bundle_plans
  ADD COLUMN interval_dimension TEXT CHECK (interval_dimension IN ('home', 'yard', 'linear_feet')) DEFAULT 'home';

-- Update existing bundles to explicitly use 'home' dimension
UPDATE bundle_plans
SET interval_dimension = 'home'
WHERE pricing_mode = 'per_interval' AND interval_dimension IS NULL;

-- Add comment
COMMENT ON COLUMN bundle_plans.interval_dimension IS 'Which dimension the interval pricing is based on: home (sq ft), yard (acres), or linear_feet. Only used when pricing_mode = per_interval.';
