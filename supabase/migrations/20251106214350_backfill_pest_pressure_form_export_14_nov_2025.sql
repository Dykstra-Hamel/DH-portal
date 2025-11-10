-- Bulk Import Pest Pressure Data Points
-- Source: Form-Export-2025-11-07-14-59.csv
-- Company: 3cc78340-214b-4526-aa61-e4454ea8b34a
-- Generated: 2025-11-07 15:00:19

DO $$
DECLARE
  company_uuid UUID := '3cc78340-214b-4526-aa61-e4454ea8b34a';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN


  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;

