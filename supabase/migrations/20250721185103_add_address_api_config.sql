-- Add address API configuration to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS address_api_config JSONB DEFAULT '{"enabled": false, "provider": "geoapify", "maxSuggestions": 5}';
