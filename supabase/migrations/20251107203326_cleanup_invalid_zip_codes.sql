-- Clean up pest pressure data points with invalid ZIP codes (phone numbers, etc.)
-- These were inserted before ZIP validation was added to the import script

DO $$
DECLARE
  deleted_count INT := 0;
BEGIN
  -- Delete records where zip_code contains non-numeric characters (except hyphens)
  -- or is longer than 10 characters
  DELETE FROM pest_pressure_data_points
  WHERE
    -- ZIP code exists but is invalid
    zip_code IS NOT NULL
    AND zip_code != ''
    AND (
      -- Contains non-digit, non-hyphen characters
      zip_code ~ '[^0-9\-]'
      -- Or is too long
      OR LENGTH(zip_code) > 10
      -- Or when hyphens removed, is not 5 or 9 digits
      OR LENGTH(REGEXP_REPLACE(zip_code, '[^0-9]', '', 'g')) NOT IN (5, 9)
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % records with invalid ZIP codes', deleted_count;
END $$;
