-- Update address API configuration to remove provider dependency
-- This migration updates existing companies to remove the provider field
-- since we're switching to Google Places API exclusively

-- Update existing companies that have address_api_config to remove provider field
UPDATE companies 
SET address_api_config = jsonb_build_object(
  'enabled', COALESCE((address_api_config->>'enabled')::boolean, false),
  'maxSuggestions', COALESCE((address_api_config->>'maxSuggestions')::integer, 5)
)
WHERE address_api_config IS NOT NULL;

-- Update the default for the address_api_config column
ALTER TABLE companies 
ALTER COLUMN address_api_config SET DEFAULT '{"enabled": false, "maxSuggestions": 5}';