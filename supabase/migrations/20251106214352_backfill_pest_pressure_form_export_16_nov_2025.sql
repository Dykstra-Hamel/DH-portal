-- Bulk Import Pest Pressure Data Points
-- Source: Form-Export-2025-11-07-15-01.csv
-- Company: 16621b46-2e03-41b3-af84-b4bb1f37f48d
-- Generated: 2025-11-07 15:01:49

DO $$
DECLARE
  company_uuid UUID := '16621b46-2e03-41b3-af84-b4bb1f37f48d';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN


  -- Form 1671: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '91355',
    4, 0.75, '2025-11-06 13:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1629: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74055',
    5, 0.75, '2025-10-23 15:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1599: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74136',
    6, 0.90, '2025-10-12 11:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1593: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74033',
    5, 0.85, '2025-10-08 11:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1593: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74033',
    5, 0.85, '2025-10-08 11:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1585: ticks (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'OK', '74037',
    4, 0.90, '2025-10-04 18:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1544: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74063',
    5, 0.90, '2025-09-16 17:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1505: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74112',
    5, 0.75, '2025-09-05 10:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1475: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '55416',
    5, 0.85, '2025-08-25 03:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1475: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '55416',
    5, 0.85, '2025-08-25 03:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1475: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '55416',
    5, 0.85, '2025-08-25 03:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1460: ants (Ave, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ave', 'OK', '89117',
    5, 0.85, '2025-08-21 07:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1460: mosquitoes (Ave, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Ave', 'OK', '89117',
    5, 0.85, '2025-08-21 07:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1460: rodents (Ave, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Ave', 'OK', '89117',
    5, 0.85, '2025-08-21 07:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1417: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74008',
    6, 0.90, '2025-08-09 09:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1406: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '91355',
    4, 0.85, '2025-08-06 13:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1406: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '91355',
    4, 0.85, '2025-08-06 13:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1392: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74021',
    5, 0.75, '2025-07-30 10:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1384: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74055',
    9, 0.75, '2025-07-28 09:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1366: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '74104',
    5, 0.90, '2025-07-21 12:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1365: ants (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Street', 'OK', '55416',
    5, 0.85, '2025-07-21 07:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1365: rodents (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Street', 'OK', '55416',
    5, 0.85, '2025-07-21 07:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1333: ants (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Street', 'OK', '55416',
    5, 0.85, '2025-07-10 04:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1333: fleas (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Street', 'OK', '55416',
    5, 0.85, '2025-07-10 04:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1333: rodents (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Street', 'OK', '55416',
    5, 0.85, '2025-07-10 04:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1333: ticks (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Street', 'OK', '55416',
    5, 0.85, '2025-07-10 04:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1332: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '6191 As',
    5, 0.75, '2025-07-09 23:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1314: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '32507',
    4, 0.85, '2025-07-04 06:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1314: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '32507',
    4, 0.85, '2025-07-04 06:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1313: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '32507',
    4, 0.85, '2025-07-04 06:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1313: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '32507',
    4, 0.85, '2025-07-04 06:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1289: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74070',
    6, 0.85, '2025-06-25 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1289: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74070',
    6, 0.85, '2025-06-25 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1289: moths (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'OK', '74070',
    6, 0.85, '2025-06-25 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1289: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74070',
    6, 0.85, '2025-06-25 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1283: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74037',
    4, 0.75, '2025-06-22 15:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1243: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '74135',
    4, 0.90, '2025-06-08 09:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1204: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74066',
    5, 0.85, '2025-05-18 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1204: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74066',
    5, 0.85, '2025-05-18 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1192: ants (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Street', 'OK', '55416',
    5, 0.85, '2025-05-16 09:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1192: mosquitoes (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Street', 'OK', '55416',
    5, 0.85, '2025-05-16 09:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1192: rodents (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Street', 'OK', '55416',
    5, 0.85, '2025-05-16 09:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1188: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74133',
    5, 0.90, '2025-05-15 09:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1184: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74011',
    6, 0.85, '2025-05-13 16:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1184: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74011',
    6, 0.85, '2025-05-13 16:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1133: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74037-4352',
    5, 0.90, '2025-05-02 16:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1129: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74012',
    5, 0.90, '2025-05-01 18:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1103: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '74114',
    5, 0.90, '2025-04-25 16:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1100: ants (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Street', 'OK', '55416',
    5, 0.85, '2025-04-25 06:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1100: rodents (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Street', 'OK', '55416',
    5, 0.85, '2025-04-25 06:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1096: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74008',
    5, 0.75, '2025-04-24 17:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1058: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74012',
    4, 0.90, '2025-04-16 12:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1054: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74112',
    5, 0.85, '2025-04-15 19:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1054: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '74112',
    5, 0.85, '2025-04-15 19:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1048: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '55416',
    5, 0.85, '2025-04-15 07:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 1048: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '55416',
    5, 0.85, '2025-04-15 07:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 868: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74037',
    5, 0.75, '2025-03-23 19:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 784: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '29111',
    6, 0.80, '2025-03-15 05:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 722: ants (Pawhuska, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Pawhuska', 'OK', '74056',
    5, 0.75, '2025-03-06 17:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 678: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74011',
    5, 0.90, '2025-03-01 11:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 638: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.90, '2025-02-24 10:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 626: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '5527 Aw',
    5, 0.85, '2025-02-17 17:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 626: bees (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'OK', '5527 Aw',
    5, 0.85, '2025-02-17 17:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 626: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '5527 Aw',
    5, 0.85, '2025-02-17 17:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 620: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74055',
    5, 0.75, '2025-02-17 11:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 568: mosquitoes (Street, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Street', 'OK', '74120',
    4, 0.90, '2025-01-17 06:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 558: ants (, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'LA', '70411',
    5, 0.90, '2025-01-11 08:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 521: ants (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-11-27 05:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 521: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-11-27 05:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 506: ants (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-11-20 03:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 506: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-11-20 03:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 458: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '13520',
    5, 0.85, '2024-11-09 16:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 458: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '13520',
    5, 0.85, '2024-11-09 16:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 415: ants (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-11-01 09:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 415: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-11-01 09:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 407: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74008',
    4, 0.75, '2024-10-29 08:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 401: ants (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-10-25 05:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 401: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-10-25 05:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 399: ants (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-10-24 08:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 399: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-10-24 08:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 346: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74019',
    6, 0.85, '2024-10-05 11:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 346: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74019',
    6, 0.85, '2024-10-05 11:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 335: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '32801',
    4, 0.90, '2024-10-02 12:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 281: ants (Knoxville, TN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Knoxville', 'TN', '37918',
    4, 0.75, '2024-09-08 23:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 280: ants (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-09-07 11:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 280: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-09-07 11:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 273: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '10032',
    5, 0.90, '2024-09-03 02:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 272: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74063-2913',
    5, 0.75, '2024-09-01 18:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 267: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74114',
    6, 0.90, '2024-08-30 17:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 221: ants (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-08-20 13:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 221: rodents (Irvine, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Irvine', 'CA', '92618',
    5, 0.85, '2024-08-20 13:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 143: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '33156',
    5, 0.90, '2024-07-20 03:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 129: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74135',
    4, 0.90, '2024-07-12 20:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 43: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '63867',
    4, 0.85, '2024-06-12 08:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 43: fleas (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', '', 'OK', '63867',
    4, 0.85, '2024-06-12 08:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 43: ticks (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'OK', '63867',
    4, 0.85, '2024-06-12 08:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 26: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '74137',
    6, 0.85, '2024-06-04 18:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 26: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '74137',
    6, 0.85, '2024-06-04 18:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 21: mosquitoes (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'OK', '142243',
    5, 0.85, '2024-06-04 01:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 21: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '142243',
    5, 0.85, '2024-06-04 01:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 20: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '10032',
    5, 0.90, '2024-06-04 01:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 11: fleas (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', '', 'OK', '144252',
    5, 0.85, '2024-06-02 12:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 11: ticks (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'OK', '144252',
    5, 0.85, '2024-06-02 12:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5: ants (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'OK', '2580',
    5, 0.85, '2024-05-31 19:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5: rodents (, OK)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'OK', '2580',
    5, 0.85, '2024-05-31 19:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;

