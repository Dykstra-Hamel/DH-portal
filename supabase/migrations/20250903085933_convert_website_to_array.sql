-- Convert companies.website from VARCHAR to JSONB array for multi-domain support
-- This migration safely converts existing single website URLs to array format

-- Step 1: Add new JSONB column
ALTER TABLE companies ADD COLUMN website_domains JSONB;

-- Step 2: Migrate existing data - convert single website to array format
UPDATE companies 
SET website_domains = 
  CASE 
    -- If website is not null/empty, convert to JSON array
    WHEN website IS NOT NULL AND website != '' THEN 
      jsonb_build_array(website)
    -- If website is null/empty, set as empty array
    ELSE 
      '[]'::jsonb
  END;

-- Step 3: Drop old website column
ALTER TABLE companies DROP COLUMN website;

-- Step 4: Rename new column to website
ALTER TABLE companies RENAME COLUMN website_domains TO website;

-- Step 5: Add NOT NULL constraint (all records should have at least empty array)
ALTER TABLE companies ALTER COLUMN website SET NOT NULL;

-- Step 6: Add check constraint to ensure website is always a JSON array
ALTER TABLE companies ADD CONSTRAINT website_is_array 
  CHECK (jsonb_typeof(website) = 'array');

-- Step 7: Create a function to validate array contains only strings
CREATE OR REPLACE FUNCTION validate_website_array(website JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Must be an array type
  IF jsonb_typeof(website) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Empty array is valid
  IF website = '[]'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- Check if all elements are strings
  RETURN (
    SELECT bool_and(jsonb_typeof(value) = 'string') 
    FROM jsonb_array_elements(website)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 8: Add check constraint using the function
ALTER TABLE companies ADD CONSTRAINT website_array_contains_strings
  CHECK (validate_website_array(website));

-- Step 9: Create index for efficient domain lookups
CREATE INDEX idx_companies_website_domains ON companies USING GIN (website);

-- Step 10: Add comment explaining the new structure
COMMENT ON COLUMN companies.website IS 'JSONB array of website domains for this company. Example: ["example.com", "www.example.com", "blog.example.com"]';

-- Migration complete - website field is now JSONB array with proper constraints