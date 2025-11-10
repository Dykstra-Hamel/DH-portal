-- Bulk Import Pest Pressure Data Points
-- Source: Form-Export-2025-11-07-14-58 (1).csv
-- Company: 68dfce02-5279-44db-bf98-00d915e27092
-- Generated: 2025-11-07 14:59:09

DO $$
DECLARE
  company_uuid UUID := '68dfce02-5279-44db-bf98-00d915e27092';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN


  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;

