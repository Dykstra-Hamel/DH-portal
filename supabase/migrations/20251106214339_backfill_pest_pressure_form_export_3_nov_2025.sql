-- Bulk Import Pest Pressure Data Points
-- Source: Form-Export-2025-11-07-11-31.csv
-- Company: 3e9c0c56-524a-4ed8-b1a4-25c692656fa0
-- Generated: 2025-11-07 12:12:23

DO $$
DECLARE
  company_uuid UUID := '3e9c0c56-524a-4ed8-b1a4-25c692656fa0';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN


  -- Form 9790: bees (Longmont, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Longmont', 'CO', '80503',
    5, 0.85, '2025-11-07 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9790: wasps (Longmont, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Longmont', 'CO', '80503',
    5, 0.85, '2025-11-07 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9789: bees (Longmont, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Longmont', 'CO', '80503',
    5, 0.85, '2025-11-07 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9789: wasps (Longmont, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Longmont', 'CO', '80503',
    5, 0.85, '2025-11-07 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9768: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80124',
    5, 0.75, '2025-11-04 18:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9765: rodents (Dr, 10)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Dr', '10', '80503-3650',
    5, 0.75, '2025-11-04 16:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9764: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80917',
    5, 0.75, '2025-11-04 14:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9739: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80222',
    6, 0.90, '2025-11-01 11:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9721: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80210',
    5, 0.85, '2025-10-27 14:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9721: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80210',
    5, 0.85, '2025-10-27 14:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9716: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80525',
    6, 0.90, '2025-10-26 11:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9715: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    5, 0.85, '2025-10-25 23:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9715: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    5, 0.85, '2025-10-25 23:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9710: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80304',
    5, 0.85, '2025-10-25 11:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9710: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.85, '2025-10-25 11:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9709: rodents (Pl, SU)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Pl', 'SU', '80915',
    4, 0.75, '2025-10-25 02:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9705: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80817',
    5, 0.85, '2025-10-24 15:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9705: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80817',
    5, 0.85, '2025-10-24 15:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9698: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80231',
    4, 0.75, '2025-10-23 02:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9697: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80231',
    4, 0.75, '2025-10-23 01:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9691: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80266',
    6, 0.85, '2025-10-21 16:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9691: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80266',
    6, 0.85, '2025-10-21 16:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9683: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80513',
    4, 0.75, '2025-10-20 12:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9670: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80304',
    5, 0.85, '2025-10-17 13:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9670: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    5, 0.85, '2025-10-17 13:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9669: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80524',
    5, 0.90, '2025-10-17 12:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9654: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    5, 0.90, '2025-10-15 19:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9650: rodents (5484, LO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '5484', 'LO', '80303',
    6, 0.90, '2025-10-14 16:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9647: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    4, 0.90, '2025-10-14 00:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9644: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80550',
    6, 0.85, '2025-10-13 16:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9644: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    6, 0.85, '2025-10-13 16:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9637: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80550',
    6, 0.90, '2025-10-12 10:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9635: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80021',
    5, 0.90, '2025-10-11 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9630: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80220',
    5, 0.75, '2025-10-10 16:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9629: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '42726',
    4, 0.85, '2025-10-10 16:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9629: rodents (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', '', '42726',
    4, 0.85, '2025-10-10 16:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9628: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80301',
    8, 0.85, '2025-10-10 16:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9628: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80301',
    8, 0.85, '2025-10-10 16:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9628: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80301',
    8, 0.85, '2025-10-10 16:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9623: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80402',
    4, 0.75, '2025-10-09 23:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9620: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80538',
    5, 0.90, '2025-10-09 16:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9613: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80012',
    5, 0.75, '2025-10-08 14:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9612: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80466',
    5, 0.75, '2025-10-08 12:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9609: spiders (Boulder, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Boulder', 'CO', '80305',
    5, 0.90, '2025-10-07 16:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9604: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80228',
    5, 0.90, '2025-10-07 11:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9598: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80123',
    6, 0.90, '2025-10-06 13:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9595: fleas (street, AP)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'street', 'AP', '80202',
    5, 0.90, '2025-10-05 22:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9584: ants (dr, BO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'dr', 'BO', '80302',
    9, 0.85, '2025-10-02 18:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9584: wasps (dr, BO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'dr', 'BO', '80302',
    9, 0.85, '2025-10-02 18:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9578: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80634',
    8, 0.90, '2025-10-02 06:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9573: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80220',
    5, 0.85, '2025-09-30 21:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9573: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80220',
    5, 0.85, '2025-09-30 21:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9570: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80305',
    4, 0.85, '2025-09-29 19:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9570: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80305',
    4, 0.85, '2025-09-29 19:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9569: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80302',
    5, 0.90, '2025-09-29 18:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9561: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80305',
    5, 0.85, '2025-09-29 08:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9561: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80305',
    5, 0.85, '2025-09-29 08:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9557: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    5, 0.75, '2025-09-27 19:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9543: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80218',
    5, 0.85, '2025-09-25 17:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9543: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80218',
    5, 0.85, '2025-09-25 17:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9536: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80007',
    5, 0.85, '2025-09-23 16:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9536: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80007',
    5, 0.85, '2025-09-23 16:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9534: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80503',
    6, 0.85, '2025-09-23 12:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9534: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80503',
    6, 0.85, '2025-09-23 12:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9527: bees (Dr, AP)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Dr', 'AP', '80303',
    6, 0.85, '2025-09-22 15:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9527: roaches (Dr, AP)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Dr', 'AP', '80303',
    6, 0.85, '2025-09-22 15:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9523: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    6, 0.80, '2025-09-20 22:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9522: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80013',
    4, 0.75, '2025-09-20 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9519: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80504',
    5, 0.85, '2025-09-19 18:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9519: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80504',
    5, 0.85, '2025-09-19 18:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9515: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.85, '2025-09-18 18:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9515: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    5, 0.85, '2025-09-18 18:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9514: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80304',
    5, 0.85, '2025-09-18 14:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9514: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80304',
    5, 0.85, '2025-09-18 14:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9514: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80304',
    5, 0.85, '2025-09-18 14:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9514: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    5, 0.85, '2025-09-18 14:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9514: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80304',
    5, 0.85, '2025-09-18 14:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9505: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    6, 0.85, '2025-09-17 16:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9505: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    6, 0.85, '2025-09-17 16:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9505: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80304',
    6, 0.85, '2025-09-17 16:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9499: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80525',
    5, 0.90, '2025-09-17 12:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9497: bees (Lane, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Lane', 'UN', '80002',
    6, 0.85, '2025-09-16 22:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9497: spiders (Lane, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Lane', 'UN', '80002',
    6, 0.85, '2025-09-16 22:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9489: spiders (15, EV)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '15', 'EV', '80620',
    4, 0.75, '2025-09-15 19:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9487: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80026',
    5, 0.85, '2025-09-15 18:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9487: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80026',
    5, 0.85, '2025-09-15 18:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9482: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80538',
    5, 0.75, '2025-09-15 11:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9479: spiders (Milliken, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Milliken', 'CO', '80543',
    5, 0.90, '2025-09-13 21:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9472: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80111',
    5, 0.75, '2025-09-12 14:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9469: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80304',
    4, 0.85, '2025-09-12 11:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9469: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80304',
    4, 0.85, '2025-09-12 11:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9449: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80525',
    8, 0.85, '2025-09-10 11:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9449: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80525',
    8, 0.85, '2025-09-10 11:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9443: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80526',
    4, 0.90, '2025-09-09 12:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9437: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80226',
    5, 0.75, '2025-09-08 19:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9435: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80911',
    6, 0.85, '2025-09-08 16:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9435: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80911',
    6, 0.85, '2025-09-08 16:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9434: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80210',
    5, 0.85, '2025-09-08 16:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9434: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80210',
    5, 0.85, '2025-09-08 16:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9434: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80210',
    5, 0.85, '2025-09-08 16:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9431: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80212',
    5, 0.75, '2025-09-08 14:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9428: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80111',
    5, 0.85, '2025-09-08 09:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9428: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80111',
    5, 0.85, '2025-09-08 09:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9428: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80111',
    5, 0.85, '2025-09-08 09:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9422: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80521',
    6, 0.85, '2025-09-06 12:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9422: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80521',
    6, 0.85, '2025-09-06 12:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9420: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80305',
    4, 0.85, '2025-09-05 14:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9420: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80305',
    4, 0.85, '2025-09-05 14:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9418: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80113',
    5, 0.75, '2025-09-05 12:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9417: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80219',
    5, 0.90, '2025-09-05 02:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9413: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80538',
    9, 0.90, '2025-09-04 12:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9410: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80631',
    5, 0.75, '2025-09-03 21:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9406: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80905-3532',
    5, 0.85, '2025-09-03 15:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9406: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80905-3532',
    5, 0.85, '2025-09-03 15:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9406: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80905-3532',
    5, 0.85, '2025-09-03 15:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9406: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80905-3532',
    5, 0.85, '2025-09-03 15:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9406: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80905-3532',
    5, 0.85, '2025-09-03 15:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9405: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80610',
    5, 0.75, '2025-09-03 14:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9396: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80524',
    5, 0.90, '2025-09-02 14:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9394: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80219',
    6, 0.85, '2025-09-02 13:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9394: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80219',
    6, 0.85, '2025-09-02 13:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9380: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80305',
    6, 0.90, '2025-08-31 16:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9377: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80301',
    5, 0.75, '2025-08-30 12:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9367: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80212',
    6, 0.80, '2025-08-28 16:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9365: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80220-4906',
    4, 0.90, '2025-08-28 12:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9364: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80003',
    5, 0.75, '2025-08-28 12:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9360: spiders (Collins, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Collins', 'CO', '80526',
    5, 0.90, '2025-08-27 17:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9349: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80015',
    4, 0.90, '2025-08-27 02:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9347: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80517',
    5, 0.85, '2025-08-26 22:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9347: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80517',
    5, 0.85, '2025-08-26 22:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9326: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80002',
    6, 0.90, '2025-08-24 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9325: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80218',
    5, 0.90, '2025-08-24 09:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9311: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80550',
    5, 0.90, '2025-08-22 14:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9307: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80128',
    5, 0.75, '2025-08-21 22:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9306: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80524',
    5, 0.90, '2025-08-21 22:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9303: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80123',
    5, 0.90, '2025-08-21 17:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9284: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    4, 0.75, '2025-08-20 12:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9277: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    4, 0.90, '2025-08-19 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9275: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80203',
    4, 0.90, '2025-08-19 13:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9271: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80908-4020',
    5, 0.85, '2025-08-18 20:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9271: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80908-4020',
    5, 0.85, '2025-08-18 20:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9261: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80207',
    4, 0.90, '2025-08-18 08:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9260: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80504',
    6, 0.90, '2025-08-17 20:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9254: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80207',
    6, 0.90, '2025-08-16 18:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9243: rodents (Boulder, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Boulder', 'CO', '80304',
    5, 0.90, '2025-08-15 14:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9242: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80922',
    4, 0.90, '2025-08-15 12:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9234: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80503',
    6, 0.80, '2025-08-14 09:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9232: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', 'Littleton',
    6, 0.85, '2025-08-14 08:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9232: spiders (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', '', 'Littleton',
    6, 0.85, '2025-08-14 08:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9226: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80528',
    5, 0.90, '2025-08-13 17:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9221: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80513',
    8, 0.90, '2025-08-13 15:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9218: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80501',
    5, 0.90, '2025-08-13 11:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9215: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80027',
    4, 0.75, '2025-08-12 23:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9214: crickets (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'CO', '80123',
    5, 0.85, '2025-08-12 20:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9214: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80123',
    5, 0.85, '2025-08-12 20:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9203: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80524',
    5, 0.85, '2025-08-12 12:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9203: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80524',
    5, 0.85, '2025-08-12 12:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9201: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80537',
    5, 0.75, '2025-08-12 12:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9200: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80026',
    6, 0.85, '2025-08-12 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9200: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80026',
    6, 0.85, '2025-08-12 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9200: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80026',
    6, 0.85, '2025-08-12 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9199: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80013',
    4, 0.75, '2025-08-12 09:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9198: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80550',
    6, 0.80, '2025-08-12 05:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9182: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80237',
    4, 0.90, '2025-08-09 22:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9175: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80122',
    5, 0.85, '2025-08-08 15:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9175: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80122',
    5, 0.85, '2025-08-08 15:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9175: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80122',
    5, 0.85, '2025-08-08 15:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9173: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '84045',
    5, 0.75, '2025-08-08 12:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9170: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80501',
    5, 0.90, '2025-08-07 22:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9160: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80649',
    4, 0.90, '2025-08-07 10:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9155: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80209',
    5, 0.85, '2025-08-06 14:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9155: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80209',
    5, 0.85, '2025-08-06 14:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9155: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80209',
    5, 0.85, '2025-08-06 14:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9154: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '81082',
    5, 0.85, '2025-08-06 13:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9154: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '81082',
    5, 0.85, '2025-08-06 13:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9140: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80236',
    5, 0.75, '2025-08-05 15:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9137: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80017',
    5, 0.85, '2025-08-05 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9137: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80017',
    5, 0.85, '2025-08-05 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9137: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80017',
    5, 0.85, '2025-08-05 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9133: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80517',
    5, 0.85, '2025-08-05 01:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9133: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80517',
    5, 0.85, '2025-08-05 01:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9129: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80504',
    6, 0.80, '2025-08-04 15:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9110: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80003',
    6, 0.90, '2025-08-02 00:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9107: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80634',
    5, 0.90, '2025-08-01 13:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9103: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80005',
    5, 0.85, '2025-08-01 09:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9103: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80005',
    5, 0.85, '2025-08-01 09:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9100: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80304',
    5, 0.90, '2025-07-31 16:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9099: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80916',
    6, 0.90, '2025-07-31 15:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9097: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80601',
    4, 0.75, '2025-07-31 14:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9095: ants (Rd, JO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Rd', 'JO', '80534',
    5, 0.85, '2025-07-31 11:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9095: rodents (Rd, JO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Rd', 'JO', '80534',
    5, 0.85, '2025-07-31 11:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9095: wildlife (Rd, JO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Rd', 'JO', '80534',
    5, 0.85, '2025-07-31 11:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9091: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80123',
    6, 0.85, '2025-07-30 20:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9091: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80123',
    6, 0.85, '2025-07-30 20:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9089: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.85, '2025-07-30 18:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9089: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    5, 0.85, '2025-07-30 18:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9084: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80214',
    6, 0.90, '2025-07-30 14:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9078: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80504',
    5, 0.75, '2025-07-29 18:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9069: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80020',
    6, 0.85, '2025-07-28 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9069: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80020',
    6, 0.85, '2025-07-28 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9069: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80020',
    6, 0.85, '2025-07-28 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9066: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80219',
    9, 0.85, '2025-07-28 19:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9066: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80219',
    9, 0.85, '2025-07-28 19:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9065: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80526',
    6, 0.80, '2025-07-28 18:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9057: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80403',
    4, 0.85, '2025-07-28 00:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9057: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80403',
    4, 0.85, '2025-07-28 00:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9057: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80403',
    4, 0.85, '2025-07-28 00:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9056: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80537',
    5, 0.90, '2025-07-27 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9047: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    5, 0.75, '2025-07-26 18:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9028: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80403',
    5, 0.75, '2025-07-24 14:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9026: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80127',
    7, 0.90, '2025-07-24 10:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9024: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80920',
    5, 0.85, '2025-07-23 20:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9024: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80920',
    5, 0.85, '2025-07-23 20:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9015: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80134',
    5, 0.90, '2025-07-22 17:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9014: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80239',
    8, 0.85, '2025-07-22 16:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9014: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80239',
    8, 0.85, '2025-07-22 16:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9010: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    5, 0.75, '2025-07-22 09:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9009: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80925',
    5, 0.90, '2025-07-22 08:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9002: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80023',
    5, 0.85, '2025-07-21 18:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 9002: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80023',
    5, 0.85, '2025-07-21 18:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 9000: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80110',
    5, 0.90, '2025-07-21 15:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8989: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80501',
    5, 0.90, '2025-07-20 01:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8987: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80304',
    9, 0.80, '2025-07-19 14:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8982: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80015',
    5, 0.85, '2025-07-18 21:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8982: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80015',
    5, 0.85, '2025-07-18 21:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8982: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80015',
    5, 0.85, '2025-07-18 21:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8981: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80015',
    5, 0.85, '2025-07-18 21:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8981: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80015',
    5, 0.85, '2025-07-18 21:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8981: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80015',
    5, 0.85, '2025-07-18 21:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8978: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80516',
    5, 0.85, '2025-07-18 20:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8978: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80516',
    5, 0.85, '2025-07-18 20:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8978: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80516',
    5, 0.85, '2025-07-18 20:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8978: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80516',
    5, 0.85, '2025-07-18 20:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8965: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80010',
    6, 0.85, '2025-07-17 16:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8965: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80010',
    6, 0.85, '2025-07-17 16:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8956: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80305',
    5, 0.75, '2025-07-16 13:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8947: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80921',
    6, 0.90, '2025-07-15 12:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8945: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80122',
    6, 0.85, '2025-07-15 03:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8945: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80122',
    6, 0.85, '2025-07-15 03:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8938: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80524',
    5, 0.85, '2025-07-14 17:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8938: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80524',
    5, 0.85, '2025-07-14 17:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8935: termites (Colorado, 80)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Colorado', '80', '80504',
    5, 0.75, '2025-07-14 16:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8930: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80110',
    5, 0.85, '2025-07-14 13:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8930: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80110',
    5, 0.85, '2025-07-14 13:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8930: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80110',
    5, 0.85, '2025-07-14 13:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8927: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80918',
    4, 0.85, '2025-07-14 12:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8927: millipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'millipedes', '', 'CO', '80918',
    4, 0.85, '2025-07-14 12:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8927: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80918',
    4, 0.85, '2025-07-14 12:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8922: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.90, '2025-07-14 10:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8911: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80530',
    6, 0.85, '2025-07-12 20:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8911: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80530',
    6, 0.85, '2025-07-12 20:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8897: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80304',
    5, 0.75, '2025-07-11 12:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8895: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80528',
    5, 0.75, '2025-07-11 11:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8893: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80525',
    8, 0.90, '2025-07-10 14:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8892: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80127',
    6, 0.90, '2025-07-10 14:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8886: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80110',
    6, 0.85, '2025-07-10 11:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8886: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80110',
    6, 0.85, '2025-07-10 11:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8885: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80504-5530',
    5, 0.90, '2025-07-10 10:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8883: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80305',
    7, 0.85, '2025-07-10 09:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8883: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80305',
    7, 0.85, '2025-07-10 09:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8883: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80305',
    7, 0.85, '2025-07-10 09:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8882: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80228',
    5, 0.75, '2025-07-10 08:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8877: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80210',
    5, 0.85, '2025-07-09 14:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8877: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80210',
    5, 0.85, '2025-07-09 14:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8876: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80120',
    5, 0.90, '2025-07-09 14:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8875: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80238',
    5, 0.75, '2025-07-09 14:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8874: ants (Rd, BE)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Rd', 'BE', '80102',
    6, 0.85, '2025-07-09 12:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8874: flies (Rd, BE)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Rd', 'BE', '80102',
    6, 0.85, '2025-07-09 12:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8864: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80528',
    6, 0.85, '2025-07-08 15:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8864: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80528',
    6, 0.85, '2025-07-08 15:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8862: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80003',
    4, 0.85, '2025-07-08 12:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8862: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80003',
    4, 0.85, '2025-07-08 12:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8862: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80003',
    4, 0.85, '2025-07-08 12:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8862: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80003',
    4, 0.85, '2025-07-08 12:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8862: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80003',
    4, 0.85, '2025-07-08 12:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8861: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80236',
    5, 0.85, '2025-07-08 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8861: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80236',
    5, 0.85, '2025-07-08 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8856: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80125',
    5, 0.85, '2025-07-08 08:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8856: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80125',
    5, 0.85, '2025-07-08 08:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8855: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80517',
    5, 0.75, '2025-07-08 00:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8854: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80015',
    5, 0.85, '2025-07-07 21:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8854: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80015',
    5, 0.85, '2025-07-07 21:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8853: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80112',
    5, 0.85, '2025-07-07 19:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8853: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80112',
    5, 0.85, '2025-07-07 19:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8848: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80303',
    5, 0.75, '2025-07-07 13:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8836: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80122',
    4, 0.85, '2025-07-06 10:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8836: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80122',
    4, 0.85, '2025-07-06 10:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8830: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80501',
    5, 0.75, '2025-07-05 11:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8820: bees (Ave, BO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Ave', 'BO', '80304',
    5, 0.85, '2025-07-04 14:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8820: rodents (Ave, BO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Ave', 'BO', '80304',
    5, 0.85, '2025-07-04 14:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8814: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80124',
    4, 0.90, '2025-07-03 17:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8800: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80305',
    6, 0.90, '2025-07-02 20:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8798: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80634',
    5, 0.90, '2025-07-02 17:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8793: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80501',
    5, 0.85, '2025-07-01 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8793: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80501',
    5, 0.85, '2025-07-01 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8790: bees (WAY, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'WAY', 'CO', '80123',
    5, 0.85, '2025-07-01 12:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8790: beetles (WAY, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'WAY', 'CO', '80123',
    5, 0.85, '2025-07-01 12:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8781: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    6, 0.90, '2025-06-30 13:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8775: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80221',
    6, 0.85, '2025-06-29 22:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8775: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80221',
    6, 0.85, '2025-06-29 22:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8775: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80221',
    6, 0.85, '2025-06-29 22:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8775: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80221',
    6, 0.85, '2025-06-29 22:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8773: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80020',
    5, 0.85, '2025-06-29 17:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8773: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80020',
    5, 0.85, '2025-06-29 17:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8770: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80302',
    5, 0.90, '2025-06-29 15:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8767: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80528',
    5, 0.90, '2025-06-29 12:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8758: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80122',
    5, 0.75, '2025-06-28 12:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8749: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '81007',
    4, 0.75, '2025-06-27 13:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8732: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80127',
    5, 0.85, '2025-06-26 12:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8732: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80127',
    5, 0.85, '2025-06-26 12:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8732: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80127',
    5, 0.85, '2025-06-26 12:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8731: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80301',
    5, 0.75, '2025-06-26 09:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8718: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80219',
    5, 0.75, '2025-06-24 20:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8713: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '10013',
    4, 0.75, '2025-06-24 16:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8712: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '10013',
    4, 0.75, '2025-06-24 16:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8684: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80540',
    6, 0.90, '2025-06-21 18:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8683: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80524-5312',
    5, 0.90, '2025-06-21 15:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8664: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80301',
    4, 0.85, '2025-06-19 14:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8664: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80301',
    4, 0.85, '2025-06-19 14:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8663: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80550',
    5, 0.85, '2025-06-19 14:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8663: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    5, 0.85, '2025-06-19 14:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8660: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80474',
    6, 0.80, '2025-06-19 13:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8659: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80537',
    6, 0.85, '2025-06-19 12:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8659: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80537',
    6, 0.85, '2025-06-19 12:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8659: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537',
    6, 0.85, '2025-06-19 12:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8656: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '18302',
    6, 0.75, '2025-06-19 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8651: rodents (4208, LO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '4208', 'LO', '80538',
    6, 0.80, '2025-06-18 17:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8649: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80303',
    5, 0.85, '2025-06-18 15:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8649: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80303',
    5, 0.85, '2025-06-18 15:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8643: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80909',
    5, 0.75, '2025-06-18 11:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8642: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80219',
    4, 0.85, '2025-06-18 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8642: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80219',
    4, 0.85, '2025-06-18 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8639: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80504',
    5, 0.85, '2025-06-17 18:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8639: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80504',
    5, 0.85, '2025-06-17 18:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8630: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80550',
    5, 0.75, '2025-06-17 09:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8625: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80127',
    5, 0.85, '2025-06-16 21:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8625: fleas (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', '', 'CO', '80127',
    5, 0.85, '2025-06-16 21:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8623: crickets (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'CO', '80503',
    5, 0.85, '2025-06-16 17:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8623: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80503',
    5, 0.85, '2025-06-16 17:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8623: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80503',
    5, 0.85, '2025-06-16 17:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8623: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80503',
    5, 0.85, '2025-06-16 17:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8619: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80504',
    4, 0.90, '2025-06-16 16:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8616: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80503',
    4, 0.85, '2025-06-16 11:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8616: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80503',
    4, 0.85, '2025-06-16 11:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8616: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80503',
    4, 0.85, '2025-06-16 11:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8611: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80550',
    6, 0.85, '2025-06-16 02:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8611: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80550',
    6, 0.85, '2025-06-16 02:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8606: ants (Collins, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Collins', 'CO', '80525',
    8, 0.85, '2025-06-15 16:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8606: bees (Collins, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Collins', 'CO', '80525',
    8, 0.85, '2025-06-15 16:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8605: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80550',
    5, 0.75, '2025-06-15 16:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8604: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80016',
    6, 0.85, '2025-06-15 13:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8604: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80016',
    6, 0.85, '2025-06-15 13:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8602: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80224',
    5, 0.90, '2025-06-15 13:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8599: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80122',
    6, 0.80, '2025-06-14 21:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8596: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80513',
    5, 0.85, '2025-06-14 12:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8596: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80513',
    5, 0.85, '2025-06-14 12:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8596: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80513',
    5, 0.85, '2025-06-14 12:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8594: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80303',
    6, 0.85, '2025-06-13 22:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8594: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80303',
    6, 0.85, '2025-06-13 22:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8589: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80129',
    5, 0.90, '2025-06-13 14:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8588: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80210',
    5, 0.90, '2025-06-13 14:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8582: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80033',
    5, 0.85, '2025-06-12 19:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8582: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80033',
    5, 0.85, '2025-06-12 19:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8581: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80231-4218',
    8, 0.90, '2025-06-12 18:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8573: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80921-7605',
    5, 0.75, '2025-06-11 20:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8569: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80525',
    5, 0.85, '2025-06-11 15:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8569: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80525',
    5, 0.85, '2025-06-11 15:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8569: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80525',
    5, 0.85, '2025-06-11 15:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8564: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80465',
    5, 0.75, '2025-06-11 09:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8559: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80503',
    8, 0.90, '2025-06-10 19:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8558: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80301',
    5, 0.75, '2025-06-10 18:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8551: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80206',
    5, 0.85, '2025-06-09 22:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8551: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80206',
    5, 0.85, '2025-06-09 22:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8549: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80911',
    5, 0.75, '2025-06-09 19:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8546: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80219',
    6, 0.90, '2025-06-09 17:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8532: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80304',
    5, 0.90, '2025-06-06 22:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8528: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80466',
    6, 0.85, '2025-06-06 15:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8528: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80466',
    6, 0.85, '2025-06-06 15:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8528: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80466',
    6, 0.85, '2025-06-06 15:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8527: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80205',
    5, 0.90, '2025-06-06 12:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8522: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80210',
    6, 0.90, '2025-06-05 14:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8517: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80524',
    5, 0.90, '2025-06-05 08:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8508: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80012',
    5, 0.75, '2025-06-03 16:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8504: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80439',
    5, 0.85, '2025-06-03 12:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8504: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80439',
    5, 0.85, '2025-06-03 12:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8484: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80218',
    5, 0.75, '2025-05-31 16:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8478: ants (Denver, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Denver', 'CO', '80249',
    4, 0.75, '2025-05-30 17:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8471: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80101',
    5, 0.90, '2025-05-29 15:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8467: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80231',
    5, 0.90, '2025-05-28 13:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8457: mosquitoes (Drive, BO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Drive', 'BO', '80301',
    5, 0.85, '2025-05-27 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8457: rodents (Drive, BO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Drive', 'BO', '80301',
    5, 0.85, '2025-05-27 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8457: wasps (Drive, BO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Drive', 'BO', '80301',
    5, 0.85, '2025-05-27 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8456: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    5, 0.75, '2025-05-26 18:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8448: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80016',
    6, 0.90, '2025-05-25 19:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8447: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80517',
    5, 0.90, '2025-05-25 17:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8446: bees (Drive, F2)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Drive', 'F2', '80247',
    6, 0.85, '2025-05-24 21:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8446: roaches (Drive, F2)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Drive', 'F2', '80247',
    6, 0.85, '2025-05-24 21:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8446: rodents (Drive, F2)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Drive', 'F2', '80247',
    6, 0.85, '2025-05-24 21:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8423: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80517',
    6, 0.80, '2025-05-20 23:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8421: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80301',
    6, 0.85, '2025-05-20 21:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8421: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80301',
    6, 0.85, '2025-05-20 21:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8421: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80301',
    6, 0.85, '2025-05-20 21:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8416: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80129',
    5, 0.85, '2025-05-20 08:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8416: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80129',
    5, 0.85, '2025-05-20 08:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8411: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80634',
    5, 0.85, '2025-05-18 16:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8411: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80634',
    5, 0.85, '2025-05-18 16:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8411: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80634',
    5, 0.85, '2025-05-18 16:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8411: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80634',
    5, 0.85, '2025-05-18 16:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8393: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80004',
    5, 0.85, '2025-05-15 16:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8393: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80004',
    5, 0.85, '2025-05-15 16:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8392: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80013',
    5, 0.75, '2025-05-15 16:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8383: ants (Trail, AP)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Trail', 'AP', '80301',
    8, 0.90, '2025-05-13 20:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8381: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80130',
    5, 0.85, '2025-05-13 19:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8381: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80130',
    5, 0.85, '2025-05-13 19:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8368: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80501',
    5, 0.85, '2025-05-12 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8368: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80501',
    5, 0.85, '2025-05-12 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8366: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80516',
    4, 0.75, '2025-05-12 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8359: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80916',
    5, 0.85, '2025-05-12 01:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8359: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80916',
    5, 0.85, '2025-05-12 01:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8359: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80916',
    5, 0.85, '2025-05-12 01:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8353: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80005',
    5, 0.90, '2025-05-11 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8351: crickets (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'CO', '80132',
    5, 0.85, '2025-05-11 11:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8351: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80132',
    5, 0.85, '2025-05-11 11:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8346: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80503',
    5, 0.75, '2025-05-10 09:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8340: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80237',
    5, 0.90, '2025-05-08 15:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8334: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80538',
    4, 0.85, '2025-05-07 13:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8334: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80538',
    4, 0.85, '2025-05-07 13:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8334: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80538',
    4, 0.85, '2025-05-07 13:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8329: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80634',
    5, 0.75, '2025-05-06 13:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8309: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80513',
    5, 0.85, '2025-05-04 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8309: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80513',
    5, 0.85, '2025-05-04 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8309: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80513',
    5, 0.85, '2025-05-04 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8308: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80018',
    5, 0.90, '2025-05-04 14:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8303: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80466',
    5, 0.90, '2025-05-03 18:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8300: bees (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', '', 'Denver',
    5, 0.85, '2025-05-03 15:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8300: beetles (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', '', 'Denver',
    5, 0.85, '2025-05-03 15:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8300: wasps (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', '', 'Denver',
    5, 0.85, '2025-05-03 15:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8293: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80026',
    5, 0.85, '2025-05-03 00:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8293: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80026',
    5, 0.85, '2025-05-03 00:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8293: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80026',
    5, 0.85, '2025-05-03 00:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8293: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80026',
    5, 0.85, '2025-05-03 00:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8293: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80026',
    5, 0.85, '2025-05-03 00:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8292: ants (Collins, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Collins', 'CO', '80528',
    4, 0.90, '2025-05-02 18:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8277: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80543',
    5, 0.75, '2025-04-29 19:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8269: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80003',
    6, 0.85, '2025-04-28 15:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8269: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80003',
    6, 0.85, '2025-04-28 15:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8268: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80501',
    5, 0.75, '2025-04-28 13:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8259: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    4, 0.85, '2025-04-28 09:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8259: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80634',
    4, 0.85, '2025-04-28 09:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8255: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80212',
    5, 0.90, '2025-04-27 18:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8249: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80027',
    8, 0.85, '2025-04-27 14:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8249: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80027',
    8, 0.85, '2025-04-27 14:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8249: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80027',
    8, 0.85, '2025-04-27 14:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8247: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80220',
    5, 0.75, '2025-04-27 13:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8243: ants (Trail, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Trail', 'UN', '80610',
    5, 0.85, '2025-04-26 19:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8243: rodents (Trail, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Trail', 'UN', '80610',
    5, 0.85, '2025-04-26 19:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8241: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80221',
    5, 0.85, '2025-04-26 15:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8241: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80221',
    5, 0.85, '2025-04-26 15:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8241: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80221',
    5, 0.85, '2025-04-26 15:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8241: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80221',
    5, 0.85, '2025-04-26 15:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8235: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80920',
    6, 0.85, '2025-04-25 17:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8235: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80920',
    6, 0.85, '2025-04-25 17:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8229: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80138',
    6, 0.90, '2025-04-24 10:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8227: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80465',
    5, 0.75, '2025-04-24 09:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8221: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80517',
    5, 0.90, '2025-04-22 21:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8220: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80513',
    4, 0.85, '2025-04-22 16:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8220: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80513',
    4, 0.85, '2025-04-22 16:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8219: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80640',
    4, 0.85, '2025-04-22 16:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8219: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80640',
    4, 0.85, '2025-04-22 16:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8216: rodents (Boulder, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Boulder', 'CO', '80304',
    5, 0.90, '2025-04-22 13:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8214: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80504',
    5, 0.75, '2025-04-22 09:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8210: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80012',
    5, 0.75, '2025-04-21 15:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8205: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80209',
    5, 0.90, '2025-04-21 11:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8204: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80129',
    5, 0.75, '2025-04-20 22:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8202: bees (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', '', '33132',
    5, 0.85, '2025-04-20 10:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8202: beetles (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', '', '33132',
    5, 0.85, '2025-04-20 10:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8202: roaches (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', '', '33132',
    5, 0.85, '2025-04-20 10:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8199: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80229',
    6, 0.85, '2025-04-18 19:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8199: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80229',
    6, 0.85, '2025-04-18 19:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8199: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80229',
    6, 0.85, '2025-04-18 19:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8199: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80229',
    6, 0.85, '2025-04-18 19:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8198: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80219',
    6, 0.90, '2025-04-18 15:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8196: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80549',
    5, 0.85, '2025-04-18 13:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8196: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80549',
    5, 0.85, '2025-04-18 13:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8193: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80125',
    5, 0.75, '2025-04-17 20:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8192: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80303',
    5, 0.85, '2025-04-17 17:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8192: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80303',
    5, 0.85, '2025-04-17 17:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8189: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80550',
    5, 0.75, '2025-04-17 14:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8179: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80301',
    5, 0.90, '2025-04-16 15:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8177: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80305',
    5, 0.85, '2025-04-16 14:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8177: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80305',
    5, 0.85, '2025-04-16 14:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8177: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80305',
    5, 0.85, '2025-04-16 14:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8171: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80504',
    5, 0.90, '2025-04-15 16:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8170: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80210',
    5, 0.75, '2025-04-15 15:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8168: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    6, 0.85, '2025-04-15 13:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8168: silverfish (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'silverfish', '', 'CO', '80302',
    6, 0.85, '2025-04-15 13:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8168: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80302',
    6, 0.85, '2025-04-15 13:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8168: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80302',
    6, 0.85, '2025-04-15 13:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8162: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80602',
    9, 0.75, '2025-04-14 20:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8161: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80631',
    5, 0.85, '2025-04-14 18:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8161: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80631',
    5, 0.85, '2025-04-14 18:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8154: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '98007',
    5, 0.75, '2025-04-14 12:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8153: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '98007',
    5, 0.75, '2025-04-14 12:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8152: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '98007',
    5, 0.75, '2025-04-14 11:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8146: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80923',
    5, 0.75, '2025-04-13 18:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8145: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80504',
    5, 0.75, '2025-04-13 18:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8141: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80466',
    5, 0.75, '2025-04-13 12:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8139: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80237',
    4, 0.75, '2025-04-12 18:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8134: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80026',
    5, 0.85, '2025-04-12 16:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8134: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80026',
    5, 0.85, '2025-04-12 16:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8131: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80547',
    6, 0.90, '2025-04-12 13:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8128: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80223',
    5, 0.85, '2025-04-11 19:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8128: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80223',
    5, 0.85, '2025-04-11 19:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8128: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80223',
    5, 0.85, '2025-04-11 19:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8125: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80123',
    6, 0.90, '2025-04-11 13:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8117: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80220-4823',
    5, 0.75, '2025-04-10 18:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8107: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80439',
    5, 0.75, '2025-04-09 15:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8099: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80125',
    5, 0.90, '2025-04-08 19:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8098: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80817',
    5, 0.85, '2025-04-08 16:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8098: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80817',
    5, 0.85, '2025-04-08 16:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8091: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80516',
    6, 0.90, '2025-04-07 16:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8080: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80004',
    5, 0.90, '2025-04-04 12:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8077: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80205',
    6, 0.90, '2025-04-04 10:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8073: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80504',
    6, 0.90, '2025-04-02 15:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8070: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80634',
    5, 0.75, '2025-04-02 11:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8063: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80403',
    6, 0.90, '2025-03-31 14:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8062: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80452',
    5, 0.75, '2025-03-31 14:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8061: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80538',
    5, 0.90, '2025-03-31 14:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8052: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80236-2426',
    5, 0.85, '2025-03-30 20:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8052: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80236-2426',
    5, 0.85, '2025-03-30 20:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8052: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80236-2426',
    5, 0.85, '2025-03-30 20:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8046: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80216',
    6, 0.80, '2025-03-29 20:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8044: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80524',
    5, 0.75, '2025-03-29 11:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8028: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80303',
    8, 0.90, '2025-03-26 21:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8027: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80305',
    4, 0.75, '2025-03-26 19:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8026: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80304',
    6, 0.85, '2025-03-26 19:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8026: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    6, 0.85, '2025-03-26 19:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8021: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80027',
    5, 0.85, '2025-03-26 06:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8021: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80027',
    5, 0.85, '2025-03-26 06:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8011: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80634',
    6, 0.80, '2025-03-24 17:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8010: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80550',
    6, 0.85, '2025-03-24 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8010: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    6, 0.85, '2025-03-24 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 8009: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80550',
    6, 0.85, '2025-03-24 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 8009: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    6, 0.85, '2025-03-24 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7999: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80925',
    5, 0.75, '2025-03-22 17:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7994: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80503',
    5, 0.85, '2025-03-21 18:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7994: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80503',
    5, 0.85, '2025-03-21 18:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7992: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80220',
    4, 0.85, '2025-03-20 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7992: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80220',
    4, 0.85, '2025-03-20 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7991: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80916',
    5, 0.85, '2025-03-20 16:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7991: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80916',
    5, 0.85, '2025-03-20 16:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7981: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80525',
    5, 0.85, '2025-03-18 09:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7981: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80525',
    5, 0.85, '2025-03-18 09:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7975: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80615-3530',
    5, 0.75, '2025-03-17 13:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7973: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80610',
    5, 0.75, '2025-03-17 00:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7969: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80260',
    5, 0.85, '2025-03-16 14:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7969: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80260',
    5, 0.85, '2025-03-16 14:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7961: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80651',
    5, 0.90, '2025-03-13 09:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7957: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80906',
    5, 0.90, '2025-03-12 01:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7955: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80222',
    5, 0.90, '2025-03-11 18:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7950: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80537',
    5, 0.85, '2025-03-11 00:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7950: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80537',
    5, 0.85, '2025-03-11 00:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7950: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80537',
    5, 0.85, '2025-03-11 00:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7941: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80127',
    5, 0.75, '2025-03-09 22:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7937: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80229',
    5, 0.90, '2025-03-07 22:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7924: ants (Ave, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ave', 'CO', '80110',
    5, 0.90, '2025-03-04 11:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7923: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80917',
    5, 0.90, '2025-03-04 11:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7922: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80517',
    6, 0.85, '2025-03-03 15:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7922: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80517',
    6, 0.85, '2025-03-03 15:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7918: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80260',
    5, 0.75, '2025-03-02 18:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7892: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80120',
    5, 0.75, '2025-02-24 10:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7885: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80128',
    4, 0.90, '2025-02-22 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7883: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80303',
    6, 0.85, '2025-02-22 11:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7883: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80303',
    6, 0.85, '2025-02-22 11:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7877: roaches (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', '', '00000',
    4, 0.85, '2025-02-20 09:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7877: rodents (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', '', '00000',
    4, 0.85, '2025-02-20 09:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7874: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80221',
    5, 0.75, '2025-02-18 14:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7871: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80550',
    4, 0.75, '2025-02-17 10:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7870: rodents (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', '', '50000',
    4, 0.75, '2025-02-17 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7869: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80228',
    5, 0.90, '2025-02-17 00:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7868: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80221',
    4, 0.85, '2025-02-16 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7868: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80221',
    4, 0.85, '2025-02-16 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7856: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80547',
    6, 0.90, '2025-02-11 20:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7852: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80212',
    5, 0.85, '2025-02-11 12:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7852: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80212',
    5, 0.85, '2025-02-11 12:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7846: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80220',
    6, 0.90, '2025-02-10 00:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7842: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80218',
    6, 0.90, '2025-02-09 12:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7816: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80305',
    5, 0.75, '2025-02-02 14:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7807: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80110',
    5, 0.75, '2025-01-30 11:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7806: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80111',
    6, 0.90, '2025-01-30 08:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7792: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80111',
    5, 0.90, '2025-01-25 13:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7791: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80126',
    5, 0.75, '2025-01-25 11:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7790: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80525',
    5, 0.90, '2025-01-24 16:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7771: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80124',
    5, 0.75, '2025-01-20 13:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7763: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80528',
    5, 0.75, '2025-01-15 18:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7749: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80526',
    5, 0.90, '2025-01-10 16:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7742: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80247',
    5, 0.75, '2025-01-08 18:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7738: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80603',
    5, 0.85, '2025-01-07 17:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7738: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80603',
    5, 0.85, '2025-01-07 17:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7737: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80021',
    5, 0.75, '2025-01-07 13:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7732: rodents (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', '', '07001',
    4, 0.75, '2025-01-06 10:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7726: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80302-9742',
    6, 0.80, '2025-01-05 07:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7725: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80113',
    5, 0.85, '2025-01-04 15:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7725: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80113',
    5, 0.85, '2025-01-04 15:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7723: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80504',
    5, 0.75, '2025-01-04 09:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7711: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '81212',
    6, 0.90, '2025-01-02 10:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7706: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80027',
    5, 0.85, '2024-12-31 09:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7706: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80027',
    5, 0.85, '2024-12-31 09:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7699: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80247',
    4, 0.85, '2024-12-29 09:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7699: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80247',
    4, 0.85, '2024-12-29 09:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7686: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80027',
    5, 0.85, '2024-12-25 18:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7686: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80027',
    5, 0.85, '2024-12-25 18:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7679: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80543',
    5, 0.75, '2024-12-22 14:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7677: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80120',
    5, 0.75, '2024-12-21 15:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7675: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80110',
    5, 0.85, '2024-12-20 17:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7675: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80110',
    5, 0.85, '2024-12-20 17:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7671: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    5, 0.75, '2024-12-18 18:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7670: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80547',
    5, 0.90, '2024-12-18 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7664: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80205',
    8, 0.90, '2024-12-16 11:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7661: rodents (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', '', '19087',
    6, 0.90, '2024-12-15 20:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7658: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80210',
    6, 0.85, '2024-12-14 19:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7658: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80210',
    6, 0.85, '2024-12-14 19:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7656: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80004',
    5, 0.90, '2024-12-13 16:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7655: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80113',
    6, 0.85, '2024-12-13 16:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7655: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80113',
    6, 0.85, '2024-12-13 16:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7655: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80113',
    6, 0.85, '2024-12-13 16:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7655: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80113',
    6, 0.85, '2024-12-13 16:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7646: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80537',
    5, 0.75, '2024-12-08 16:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7645: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80920',
    6, 0.85, '2024-12-08 13:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7645: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80920',
    6, 0.85, '2024-12-08 13:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7642: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80128',
    5, 0.90, '2024-12-07 03:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7641: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80526',
    5, 0.75, '2024-12-06 12:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7638: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '2333',
    5, 0.85, '2024-12-06 00:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7638: termites (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', '', '2333',
    5, 0.85, '2024-12-06 00:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7638: ticks (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', '', '2333',
    5, 0.85, '2024-12-06 00:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7635: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80513',
    5, 0.90, '2024-12-05 14:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7632: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80302',
    5, 0.75, '2024-12-04 15:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7631: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80224',
    5, 0.75, '2024-12-04 05:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7629: ants (406, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '406', 'LA', '81055',
    5, 0.85, '2024-12-03 21:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7629: rodents (406, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '406', 'LA', '81055',
    5, 0.85, '2024-12-03 21:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7626: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80023',
    6, 0.90, '2024-12-03 12:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7620: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80122',
    5, 0.85, '2024-12-02 21:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7620: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80122',
    5, 0.85, '2024-12-02 21:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7618: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    5, 0.75, '2024-12-02 16:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7614: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80918',
    5, 0.85, '2024-12-01 16:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7614: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80918',
    5, 0.85, '2024-12-01 16:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7611: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80013',
    6, 0.90, '2024-12-01 11:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7608: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80127',
    4, 0.75, '2024-11-30 13:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7607: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80026',
    5, 0.75, '2024-11-30 10:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7600: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80110',
    5, 0.90, '2024-11-29 09:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7592: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80027',
    5, 0.90, '2024-11-27 09:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7588: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80203',
    6, 0.85, '2024-11-26 16:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7588: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80203',
    6, 0.85, '2024-11-26 16:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7587: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80502',
    5, 0.85, '2024-11-26 13:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7587: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80502',
    5, 0.85, '2024-11-26 13:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7581: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80304',
    8, 0.85, '2024-11-25 22:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7581: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    8, 0.85, '2024-11-25 22:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7580: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80301',
    5, 0.75, '2024-11-25 21:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7579: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80303',
    5, 0.75, '2024-11-25 10:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7573: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80303',
    6, 0.80, '2024-11-24 10:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7568: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80923',
    6, 0.90, '2024-11-22 09:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7561: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80020',
    5, 0.90, '2024-11-20 18:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7559: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80610',
    6, 0.90, '2024-11-19 11:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7552: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80923',
    6, 0.90, '2024-11-17 23:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7550: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80023',
    8, 0.85, '2024-11-16 21:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7550: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80023',
    8, 0.85, '2024-11-16 21:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7549: bees (Lakewood, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Lakewood', 'CO', '80214',
    8, 0.85, '2024-11-16 18:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7549: roaches (Lakewood, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Lakewood', 'CO', '80214',
    8, 0.85, '2024-11-16 18:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7535: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80515',
    6, 0.90, '2024-11-13 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7531: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.75, '2024-11-12 11:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7515: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80014',
    5, 0.75, '2024-11-09 14:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7514: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80545',
    4, 0.75, '2024-11-08 17:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7508: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80640',
    6, 0.85, '2024-11-06 16:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7508: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80640',
    6, 0.85, '2024-11-06 16:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7508: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80640',
    6, 0.85, '2024-11-06 16:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7508: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80640',
    6, 0.85, '2024-11-06 16:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7508: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80640',
    6, 0.85, '2024-11-06 16:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7503: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80304',
    9, 0.90, '2024-11-05 16:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7502: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80521',
    8, 0.85, '2024-11-05 14:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7502: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80521',
    8, 0.85, '2024-11-05 14:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7496: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80015',
    5, 0.90, '2024-11-03 20:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7495: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80474',
    5, 0.75, '2024-11-03 19:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7494: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80705',
    5, 0.85, '2024-11-03 17:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7494: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80705',
    5, 0.85, '2024-11-03 17:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7488: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80930',
    5, 0.85, '2024-11-01 18:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7488: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80930',
    5, 0.85, '2024-11-01 18:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7485: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80439',
    6, 0.90, '2024-10-31 18:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7478: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80233',
    5, 0.90, '2024-10-31 08:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7474: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80634',
    5, 0.75, '2024-10-30 19:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7463: rodents (Ave, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Ave', 'UN', '80302',
    6, 0.80, '2024-10-29 16:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7462: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80304',
    5, 0.85, '2024-10-29 10:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7462: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.85, '2024-10-29 10:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7460: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80504',
    6, 0.80, '2024-10-28 20:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7459: wasps (COS, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'COS', 'CO', '80911',
    5, 0.90, '2024-10-28 18:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7456: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80123',
    6, 0.85, '2024-10-28 14:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7456: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80123',
    6, 0.85, '2024-10-28 14:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7456: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80123',
    6, 0.85, '2024-10-28 14:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7455: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80305',
    6, 0.90, '2024-10-28 14:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7453: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80621',
    5, 0.90, '2024-10-28 11:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7441: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    5, 0.90, '2024-10-26 23:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7440: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80904',
    4, 0.75, '2024-10-26 22:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7438: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80207',
    6, 0.90, '2024-10-26 17:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7428: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80301',
    6, 0.90, '2024-10-25 11:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7421: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80223',
    4, 0.75, '2024-10-24 12:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7420: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80525',
    5, 0.90, '2024-10-24 10:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7414: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80528',
    5, 0.85, '2024-10-23 18:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7414: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80528',
    5, 0.85, '2024-10-23 18:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7414: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80528',
    5, 0.85, '2024-10-23 18:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7413: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80538',
    5, 0.85, '2024-10-23 15:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7413: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80538',
    5, 0.85, '2024-10-23 15:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7411: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80224',
    5, 0.75, '2024-10-23 12:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7408: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80236',
    5, 0.85, '2024-10-22 21:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7408: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80236',
    5, 0.85, '2024-10-22 21:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7405: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80513',
    6, 0.80, '2024-10-22 17:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7400: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80112',
    6, 0.85, '2024-10-21 21:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7400: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80112',
    6, 0.85, '2024-10-21 21:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7389: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80020',
    5, 0.85, '2024-10-20 13:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7389: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80020',
    5, 0.85, '2024-10-20 13:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7385: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80465',
    5, 0.75, '2024-10-20 02:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7383: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80204',
    4, 0.75, '2024-10-19 17:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7375: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80007',
    4, 0.90, '2024-10-18 12:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7370: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80210',
    5, 0.85, '2024-10-18 00:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7370: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80210',
    5, 0.85, '2024-10-18 00:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7369: bed_bugs (Place, LO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Place', 'LO', '80503',
    5, 0.85, '2024-10-17 22:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7369: fleas (Place, LO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Place', 'LO', '80503',
    5, 0.85, '2024-10-17 22:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7367: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80634',
    5, 0.85, '2024-10-17 13:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7367: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    5, 0.85, '2024-10-17 13:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7357: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80620',
    4, 0.90, '2024-10-16 01:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7350: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80525',
    5, 0.85, '2024-10-14 15:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7350: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80525',
    5, 0.85, '2024-10-14 15:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7348: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80921',
    8, 0.90, '2024-10-14 15:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7342: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.90, '2024-10-14 11:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7333: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80018',
    5, 0.75, '2024-10-13 18:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7322: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80915',
    5, 0.75, '2024-10-12 22:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7311: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80219',
    9, 0.85, '2024-10-11 01:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7311: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80219',
    9, 0.85, '2024-10-11 01:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7311: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80219',
    9, 0.85, '2024-10-11 01:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7309: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80521',
    8, 0.90, '2024-10-10 22:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7303: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80517',
    5, 0.85, '2024-10-10 10:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7303: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80517',
    5, 0.85, '2024-10-10 10:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7293: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80455',
    5, 0.90, '2024-10-09 00:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7287: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537-3325',
    5, 0.90, '2024-10-08 11:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7281: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80132',
    5, 0.75, '2024-10-07 18:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7279: rodents (Park, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Park', 'CO', '80517',
    6, 0.90, '2024-10-07 15:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7276: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80404',
    5, 0.85, '2024-10-07 02:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7276: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80404',
    5, 0.85, '2024-10-07 02:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7268: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80528',
    8, 0.90, '2024-10-05 22:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7259: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80108',
    5, 0.75, '2024-10-04 18:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7250: spiders (Ct, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Ct', 'LA', '80228',
    5, 0.75, '2024-10-03 14:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7247: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80540',
    4, 0.85, '2024-10-03 12:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7247: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80540',
    4, 0.85, '2024-10-03 12:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7247: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80540',
    4, 0.85, '2024-10-03 12:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7247: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80540',
    4, 0.85, '2024-10-03 12:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7232: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80918',
    5, 0.75, '2024-10-01 20:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7229: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    6, 0.90, '2024-10-01 16:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7204: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80640',
    5, 0.85, '2024-09-28 13:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7204: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80640',
    5, 0.85, '2024-09-28 13:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7204: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80640',
    5, 0.85, '2024-09-28 13:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7204: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80640',
    5, 0.85, '2024-09-28 13:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7201: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80227',
    4, 0.85, '2024-09-28 10:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7201: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80227',
    4, 0.85, '2024-09-28 10:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7196: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80102',
    6, 0.85, '2024-09-27 21:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7196: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80102',
    6, 0.85, '2024-09-27 21:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7196: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80102',
    6, 0.85, '2024-09-27 21:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7194: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80301',
    5, 0.90, '2024-09-27 19:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7192: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80303',
    5, 0.85, '2024-09-27 11:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7192: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80303',
    5, 0.85, '2024-09-27 11:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7192: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80303',
    5, 0.85, '2024-09-27 11:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7192: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80303',
    5, 0.85, '2024-09-27 11:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7169: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80524',
    5, 0.75, '2024-09-24 16:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7166: ants (Bennett, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Bennett', 'CO', '80102',
    4, 0.75, '2024-09-24 13:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7146: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80113',
    5, 0.75, '2024-09-22 14:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7125: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80016',
    5, 0.85, '2024-09-19 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7125: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80016',
    5, 0.85, '2024-09-19 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7125: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80016',
    5, 0.85, '2024-09-19 15:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7124: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80906',
    8, 0.85, '2024-09-19 14:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7124: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80906',
    8, 0.85, '2024-09-19 14:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7121: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    5, 0.75, '2024-09-19 07:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7120: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80222',
    9, 0.90, '2024-09-19 03:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7119: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537',
    5, 0.90, '2024-09-19 00:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7112: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80220',
    5, 0.85, '2024-09-18 13:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7112: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80220',
    5, 0.85, '2024-09-18 13:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7111: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    9, 0.85, '2024-09-18 12:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7111: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80302',
    9, 0.85, '2024-09-18 12:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7098: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    9, 0.90, '2024-09-16 23:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7097: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80543',
    6, 0.90, '2024-09-16 21:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7084: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80207',
    8, 0.90, '2024-09-15 16:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7063: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80911',
    4, 0.85, '2024-09-13 11:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7063: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80911',
    4, 0.85, '2024-09-13 11:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7063: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80911',
    4, 0.85, '2024-09-13 11:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7049: rodents (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', '', 'Denver',
    5, 0.90, '2024-09-12 01:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7048: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    4, 0.90, '2024-09-11 22:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7047: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80027',
    4, 0.75, '2024-09-11 20:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7038: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80538',
    5, 0.85, '2024-09-10 23:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7038: crickets (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'CO', '80538',
    5, 0.85, '2024-09-10 23:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7038: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80538',
    5, 0.85, '2024-09-10 23:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7029: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80504',
    5, 0.75, '2024-09-10 09:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7023: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80127',
    4, 0.85, '2024-09-09 18:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 7023: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80127',
    4, 0.85, '2024-09-09 18:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7021: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537',
    6, 0.80, '2024-09-09 18:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7018: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80305-7079',
    5, 0.90, '2024-09-09 17:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7012: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80123',
    5, 0.75, '2024-09-09 08:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 7000: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80534',
    5, 0.75, '2024-09-07 23:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6995: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80422',
    6, 0.90, '2024-09-07 14:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6992: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80538',
    5, 0.85, '2024-09-07 13:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6992: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80538',
    5, 0.85, '2024-09-07 13:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6988: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80701',
    5, 0.75, '2024-09-06 20:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6977: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80301-3512',
    5, 0.90, '2024-09-05 13:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6975: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80121',
    5, 0.75, '2024-09-05 12:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6974: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80205',
    6, 0.85, '2024-09-05 12:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6974: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80205',
    6, 0.85, '2024-09-05 12:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6972: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80550',
    5, 0.85, '2024-09-05 11:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6972: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80550',
    5, 0.85, '2024-09-05 11:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6972: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80550',
    5, 0.85, '2024-09-05 11:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6971: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80537',
    5, 0.90, '2024-09-05 10:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6970: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80401',
    6, 0.85, '2024-09-05 10:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6970: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80401',
    6, 0.85, '2024-09-05 10:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6968: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80521',
    6, 0.90, '2024-09-04 22:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6964: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80012',
    5, 0.90, '2024-09-04 14:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6960: wasps (Johnstown, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Johnstown', 'CO', '80534',
    5, 0.90, '2024-09-04 10:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6957: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80204',
    5, 0.85, '2024-09-03 20:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6957: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80204',
    5, 0.85, '2024-09-03 20:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6955: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80517',
    5, 0.85, '2024-09-03 16:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6955: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80517',
    5, 0.85, '2024-09-03 16:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6946: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80238',
    4, 0.75, '2024-09-02 22:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6943: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80911',
    5, 0.75, '2024-09-02 17:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6939: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80521',
    5, 0.75, '2024-09-02 10:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6938: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80130',
    9, 0.85, '2024-09-02 10:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6938: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80130',
    9, 0.85, '2024-09-02 10:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6938: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80130',
    9, 0.85, '2024-09-02 10:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6935: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    5, 0.85, '2024-09-02 00:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6935: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80634',
    5, 0.85, '2024-09-02 00:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6931: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80027',
    5, 0.90, '2024-09-01 14:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6925: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    4, 0.85, '2024-08-31 15:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6925: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80550',
    4, 0.85, '2024-08-31 15:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6916: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80501',
    5, 0.85, '2024-08-30 17:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6916: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80501',
    5, 0.85, '2024-08-30 17:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6911: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80010',
    5, 0.85, '2024-08-29 16:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6911: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80010',
    5, 0.85, '2024-08-29 16:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6910: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    5, 0.75, '2024-08-29 14:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6901: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80503',
    5, 0.75, '2024-08-28 21:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6898: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80027',
    9, 0.80, '2024-08-28 16:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6895: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80550',
    5, 0.90, '2024-08-28 15:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6889: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80504',
    5, 0.90, '2024-08-28 00:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6876: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80911-2962',
    5, 0.85, '2024-08-27 06:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6876: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80911-2962',
    5, 0.85, '2024-08-27 06:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6876: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80911-2962',
    5, 0.85, '2024-08-27 06:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6871: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80120',
    5, 0.85, '2024-08-26 13:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6871: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80120',
    5, 0.85, '2024-08-26 13:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6863: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80120',
    5, 0.90, '2024-08-25 20:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6859: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80135',
    5, 0.75, '2024-08-25 14:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6848: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80236',
    5, 0.85, '2024-08-23 22:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6848: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80236',
    5, 0.85, '2024-08-23 22:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6844: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80524',
    7, 0.85, '2024-08-23 19:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6844: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80524',
    7, 0.85, '2024-08-23 19:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6842: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80516',
    5, 0.85, '2024-08-23 18:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6842: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80516',
    5, 0.85, '2024-08-23 18:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6833: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80621',
    5, 0.90, '2024-08-22 20:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6823: rodents (Elizabeth, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Elizabeth', 'CO', '80107',
    5, 0.90, '2024-08-22 00:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6822: fleas (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', '', 'CO', '80526',
    5, 0.90, '2024-08-22 00:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6817: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80127',
    9, 0.85, '2024-08-21 17:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6817: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80127',
    9, 0.85, '2024-08-21 17:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6810: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80515',
    5, 0.75, '2024-08-21 11:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6794: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80033',
    5, 0.85, '2024-08-20 18:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6794: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80033',
    5, 0.85, '2024-08-20 18:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6792: roaches (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', '', '76013',
    5, 0.75, '2024-08-20 17:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6789: rodents (LN, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'LN', 'UN', '80550',
    5, 0.85, '2024-08-20 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6789: spiders (LN, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'LN', 'UN', '80550',
    5, 0.85, '2024-08-20 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6789: wasps (LN, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'LN', 'UN', '80550',
    5, 0.85, '2024-08-20 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6779: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80301',
    5, 0.85, '2024-08-19 14:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6779: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80301',
    5, 0.85, '2024-08-19 14:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6774: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80503',
    5, 0.85, '2024-08-18 17:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6774: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80503',
    5, 0.85, '2024-08-18 17:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6766: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80549',
    5, 0.85, '2024-08-17 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6766: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80549',
    5, 0.85, '2024-08-17 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6766: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80549',
    5, 0.85, '2024-08-17 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6766: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80549',
    5, 0.85, '2024-08-17 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6766: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80549',
    5, 0.85, '2024-08-17 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6766: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80549',
    5, 0.85, '2024-08-17 22:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6763: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80501',
    5, 0.85, '2024-08-17 18:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6763: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80501',
    5, 0.85, '2024-08-17 18:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6761: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80304',
    6, 0.90, '2024-08-17 11:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6760: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80219-3133',
    5, 0.75, '2024-08-17 10:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6759: wasps (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', '', '92154',
    5, 0.90, '2024-08-17 09:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6754: spiders (Ave, 10)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Ave', '10', '80528',
    5, 0.90, '2024-08-16 15:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6752: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537',
    5, 0.85, '2024-08-16 15:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6752: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80537',
    5, 0.85, '2024-08-16 15:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6752: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80537',
    5, 0.85, '2024-08-16 15:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6747: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80123',
    6, 0.90, '2024-08-15 19:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6745: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80231',
    5, 0.85, '2024-08-15 15:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6745: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80231',
    5, 0.85, '2024-08-15 15:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6744: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80127-3432',
    5, 0.75, '2024-08-15 13:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6742: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80611',
    6, 0.80, '2024-08-15 12:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6737: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80504',
    9, 0.85, '2024-08-14 21:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6737: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80504',
    9, 0.85, '2024-08-14 21:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6736: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '81001',
    5, 0.85, '2024-08-14 19:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6736: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '81001',
    5, 0.85, '2024-08-14 19:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6719: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    5, 0.75, '2024-08-13 01:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6710: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304-1728',
    6, 0.80, '2024-08-12 12:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6709: ants (Way, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Way', 'UN', '80230',
    5, 0.85, '2024-08-12 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6709: rodents (Way, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Way', 'UN', '80230',
    5, 0.85, '2024-08-12 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6701: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80249',
    6, 0.85, '2024-08-11 13:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6701: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80249',
    6, 0.85, '2024-08-11 13:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6696: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80229',
    5, 0.85, '2024-08-09 20:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6696: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80229',
    5, 0.85, '2024-08-09 20:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6689: ants (Pt, ST)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Pt', 'ST', '80550',
    5, 0.90, '2024-08-08 12:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6682: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80927',
    5, 0.90, '2024-08-07 22:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6678: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80305',
    5, 0.90, '2024-08-07 12:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6677: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80004',
    6, 0.85, '2024-08-07 12:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6677: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80004',
    6, 0.85, '2024-08-07 12:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6677: silverfish (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'silverfish', '', 'CO', '80004',
    6, 0.85, '2024-08-07 12:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6677: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80004',
    6, 0.85, '2024-08-07 12:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6674: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537',
    5, 0.90, '2024-08-07 08:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6673: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80130',
    8, 0.85, '2024-08-07 05:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6673: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80130',
    8, 0.85, '2024-08-07 05:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6673: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80130',
    8, 0.85, '2024-08-07 05:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6673: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80130',
    8, 0.85, '2024-08-07 05:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6672: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80550',
    7, 0.85, '2024-08-06 22:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6672: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80550',
    7, 0.85, '2024-08-06 22:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6672: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80550',
    7, 0.85, '2024-08-06 22:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6670: spiders (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', '', '90631',
    5, 0.90, '2024-08-06 20:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6667: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80504',
    4, 0.75, '2024-08-06 17:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6657: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80204',
    5, 0.85, '2024-08-05 21:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6657: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80204',
    5, 0.85, '2024-08-05 21:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6657: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80204',
    5, 0.85, '2024-08-05 21:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6657: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80204',
    5, 0.85, '2024-08-05 21:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6655: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80525',
    5, 0.75, '2024-08-05 20:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6653: bees (St, 4B)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'St', '4B', '80301',
    4, 0.85, '2024-08-05 17:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6653: beetles (St, 4B)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'St', '4B', '80301',
    4, 0.85, '2024-08-05 17:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6653: spiders (St, 4B)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'St', '4B', '80301',
    4, 0.85, '2024-08-05 17:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6653: ticks (St, 4B)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'St', '4B', '80301',
    4, 0.85, '2024-08-05 17:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6648: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80525',
    5, 0.75, '2024-08-05 14:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6646: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80503',
    5, 0.75, '2024-08-05 11:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6645: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80532',
    9, 0.75, '2024-08-05 09:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6637: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '81632',
    5, 0.90, '2024-08-04 11:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6617: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80304',
    5, 0.90, '2024-08-02 14:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6608: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80122',
    5, 0.85, '2024-08-01 17:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6608: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80122',
    5, 0.85, '2024-08-01 17:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6603: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80027',
    6, 0.90, '2024-08-01 12:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6598: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80501',
    6, 0.90, '2024-08-01 00:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6597: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80304',
    5, 0.85, '2024-07-31 23:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6597: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    5, 0.85, '2024-07-31 23:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6596: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80214-1625',
    5, 0.90, '2024-07-31 22:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6595: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '81201',
    5, 0.90, '2024-07-31 22:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6586: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80466',
    5, 0.90, '2024-07-31 10:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6579: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80528',
    5, 0.90, '2024-07-30 11:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6577: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80512',
    5, 0.75, '2024-07-29 19:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6573: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80205',
    4, 0.75, '2024-07-29 17:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6571: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80525',
    6, 0.90, '2024-07-29 16:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6563: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80526',
    5, 0.85, '2024-07-29 10:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6563: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80526',
    5, 0.85, '2024-07-29 10:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6563: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80526',
    5, 0.85, '2024-07-29 10:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6559: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80020',
    5, 0.90, '2024-07-28 19:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6547: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80023',
    5, 0.85, '2024-07-27 20:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6547: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80023',
    5, 0.85, '2024-07-27 20:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6540: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80026',
    5, 0.90, '2024-07-27 11:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6530: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80303',
    5, 0.75, '2024-07-26 13:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6525: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80236',
    5, 0.90, '2024-07-25 21:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6523: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80220',
    5, 0.75, '2024-07-25 20:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6518: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80532',
    5, 0.90, '2024-07-25 00:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6517: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80525',
    5, 0.75, '2024-07-24 22:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6513: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80549',
    5, 0.90, '2024-07-24 09:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6508: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    5, 0.75, '2024-07-23 12:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6507: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80220',
    6, 0.85, '2024-07-23 12:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6507: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80220',
    6, 0.85, '2024-07-23 12:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6507: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80220',
    6, 0.85, '2024-07-23 12:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6502: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80525',
    8, 0.90, '2024-07-22 15:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6501: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80501',
    5, 0.85, '2024-07-22 14:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6501: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80501',
    5, 0.85, '2024-07-22 14:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6494: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80537',
    6, 0.85, '2024-07-21 19:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6494: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80537',
    6, 0.85, '2024-07-21 19:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6494: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537',
    6, 0.85, '2024-07-21 19:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6486: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80014',
    9, 0.90, '2024-07-21 03:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6483: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80304',
    4, 0.90, '2024-07-20 20:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6473: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80525',
    5, 0.75, '2024-07-19 16:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6461: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80808',
    6, 0.85, '2024-07-18 16:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6461: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80808',
    6, 0.85, '2024-07-18 16:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6461: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80808',
    6, 0.85, '2024-07-18 16:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6443: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80513',
    5, 0.75, '2024-07-17 07:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6442: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80302',
    8, 0.90, '2024-07-17 06:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6441: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80303',
    5, 0.75, '2024-07-17 01:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6440: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80027',
    5, 0.85, '2024-07-17 00:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6440: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80027',
    5, 0.85, '2024-07-17 00:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6440: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80027',
    5, 0.85, '2024-07-17 00:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6429: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80210',
    5, 0.90, '2024-07-16 11:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6427: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80538',
    5, 0.75, '2024-07-16 10:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6423: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80634',
    6, 0.80, '2024-07-15 23:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6412: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80550-3029',
    6, 0.85, '2024-07-15 10:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6412: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550-3029',
    6, 0.85, '2024-07-15 10:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6412: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550-3029',
    6, 0.85, '2024-07-15 10:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6407: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80205',
    4, 0.75, '2024-07-15 03:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6344: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80650',
    5, 0.90, '2024-07-10 11:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6342: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80122',
    5, 0.75, '2024-07-10 09:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6337: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80634',
    6, 0.90, '2024-07-09 22:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6333: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80501',
    5, 0.90, '2024-07-09 17:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6311: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80121',
    5, 0.75, '2024-07-08 08:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6309: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80304',
    5, 0.75, '2024-07-08 01:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6294: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    9, 0.90, '2024-07-07 11:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6287: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80534',
    5, 0.75, '2024-07-06 11:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6285: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80122',
    5, 0.85, '2024-07-06 09:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6285: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80122',
    5, 0.85, '2024-07-06 09:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6281: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80206',
    4, 0.90, '2024-07-05 13:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6280: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80549',
    5, 0.75, '2024-07-05 12:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6272: wasps (Street, C6)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Street', 'C6', '80521',
    5, 0.90, '2024-07-04 12:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6267: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    4, 0.85, '2024-07-03 17:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6267: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    4, 0.85, '2024-07-03 17:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6266: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80422',
    8, 0.90, '2024-07-03 16:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6264: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    5, 0.85, '2024-07-02 23:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6264: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80302',
    5, 0.85, '2024-07-02 23:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6263: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80122',
    5, 0.85, '2024-07-02 23:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6263: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80122',
    5, 0.85, '2024-07-02 23:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6258: ants (Ridge, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ridge', 'CO', '80033',
    5, 0.85, '2024-07-02 18:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6258: spiders (Ridge, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Ridge', 'CO', '80033',
    5, 0.85, '2024-07-02 18:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6251: ants (Bennett, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Bennett', 'CO', '80102',
    6, 0.85, '2024-07-02 11:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6251: bees (Bennett, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Bennett', 'CO', '80102',
    6, 0.85, '2024-07-02 11:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6251: flies (Bennett, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Bennett', 'CO', '80102',
    6, 0.85, '2024-07-02 11:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6245: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80528',
    5, 0.75, '2024-07-01 20:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6241: rodents (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', '', 'Boulder',
    5, 0.90, '2024-07-01 18:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6238: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80503',
    4, 0.75, '2024-07-01 14:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6232: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80550',
    5, 0.90, '2024-07-01 11:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6226: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80027',
    5, 0.90, '2024-07-01 10:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6214: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80401',
    5, 0.75, '2024-06-30 13:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6212: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80503',
    5, 0.75, '2024-06-30 12:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6211: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80503',
    5, 0.90, '2024-06-30 11:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6199: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80303',
    5, 0.85, '2024-06-29 10:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6199: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80303',
    5, 0.85, '2024-06-29 10:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6198: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80015',
    5, 0.75, '2024-06-28 21:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6190: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    5, 0.85, '2024-06-28 12:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6190: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80302',
    5, 0.85, '2024-06-28 12:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6190: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80302',
    5, 0.85, '2024-06-28 12:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6186: rodents (209, 35)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '209', '35', '80515',
    5, 0.75, '2024-06-28 10:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6183: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80831',
    5, 0.90, '2024-06-27 23:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6164: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80611',
    4, 0.75, '2024-06-26 11:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6162: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80227',
    5, 0.90, '2024-06-26 08:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6140: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80525',
    5, 0.90, '2024-06-25 10:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6138: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80465',
    6, 0.90, '2024-06-24 23:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6136: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80249',
    5, 0.85, '2024-06-24 22:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6136: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80249',
    5, 0.85, '2024-06-24 22:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6131: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80538',
    5, 0.90, '2024-06-24 20:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6116: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80537',
    5, 0.75, '2024-06-24 10:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6115: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80537',
    6, 0.90, '2024-06-24 10:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6109: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80013',
    5, 0.85, '2024-06-23 19:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6109: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80013',
    5, 0.85, '2024-06-23 19:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6093: ants (BERTHOUD, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'BERTHOUD', 'CO', '80513',
    5, 0.90, '2024-06-21 18:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6092: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80516',
    4, 0.85, '2024-06-21 16:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6092: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80516',
    4, 0.85, '2024-06-21 16:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6091: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80011',
    5, 0.75, '2024-06-21 13:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6081: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80247',
    4, 0.85, '2024-06-20 14:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6081: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80247',
    4, 0.85, '2024-06-20 14:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6071: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80249',
    9, 0.75, '2024-06-19 09:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6058: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80501',
    5, 0.85, '2024-06-17 22:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6058: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80501',
    5, 0.85, '2024-06-17 22:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6058: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80501',
    5, 0.85, '2024-06-17 22:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6057: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80893',
    5, 0.75, '2024-06-17 19:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6056: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80016',
    5, 0.90, '2024-06-17 17:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6046: crickets (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'CO', '80013',
    5, 0.85, '2024-06-17 11:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6046: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80013',
    5, 0.85, '2024-06-17 11:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6031: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80015',
    5, 0.85, '2024-06-16 18:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6031: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80015',
    5, 0.85, '2024-06-16 18:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6024: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80123',
    5, 0.85, '2024-06-16 09:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6024: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80123',
    5, 0.85, '2024-06-16 09:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6018: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80302',
    5, 0.85, '2024-06-15 16:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6018: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80302',
    5, 0.85, '2024-06-15 16:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6014: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80550',
    5, 0.85, '2024-06-15 12:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6014: termites (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'CO', '80550',
    5, 0.85, '2024-06-15 12:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6007: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80536',
    5, 0.85, '2024-06-15 00:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6007: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80536',
    5, 0.85, '2024-06-15 00:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6007: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80536',
    5, 0.85, '2024-06-15 00:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6005: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80513',
    5, 0.85, '2024-06-14 17:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6005: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80513',
    5, 0.85, '2024-06-14 17:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6004: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80401',
    5, 0.85, '2024-06-14 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6004: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80401',
    5, 0.85, '2024-06-14 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6004: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80401',
    5, 0.85, '2024-06-14 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6004: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80401',
    5, 0.85, '2024-06-14 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 6003: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80221',
    5, 0.85, '2024-06-14 14:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 6003: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80221',
    5, 0.85, '2024-06-14 14:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5995: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80528',
    4, 0.90, '2024-06-13 20:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5983: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80515',
    6, 0.90, '2024-06-12 10:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5967: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80517',
    5, 0.90, '2024-06-11 11:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5960: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80015',
    5, 0.85, '2024-06-10 22:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5960: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80015',
    5, 0.85, '2024-06-10 22:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5955: ants (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', '', '62948',
    5, 0.85, '2024-06-10 08:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5955: bed_bugs (, )
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', '', '62948',
    5, 0.85, '2024-06-10 08:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5946: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80304',
    5, 0.90, '2024-06-09 04:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5937: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80022',
    5, 0.75, '2024-06-07 23:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5932: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80301',
    4, 0.75, '2024-06-07 17:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5928: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80525',
    6, 0.85, '2024-06-07 12:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5928: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80525',
    6, 0.85, '2024-06-07 12:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5928: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80525',
    6, 0.85, '2024-06-07 12:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5923: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80634',
    5, 0.85, '2024-06-07 11:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5923: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    5, 0.85, '2024-06-07 11:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5906: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80538',
    4, 0.85, '2024-06-06 15:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5906: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80538',
    4, 0.85, '2024-06-06 15:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5906: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80538',
    4, 0.85, '2024-06-06 15:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5905: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80234',
    5, 0.90, '2024-06-06 15:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5901: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80503',
    4, 0.90, '2024-06-06 13:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5898: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80908',
    5, 0.90, '2024-06-06 08:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5892: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80538',
    5, 0.85, '2024-06-05 16:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5892: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80538',
    5, 0.85, '2024-06-05 16:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5892: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80538',
    5, 0.85, '2024-06-05 16:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5836: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80634',
    5, 0.85, '2024-05-30 14:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5836: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80634',
    5, 0.85, '2024-05-30 14:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5836: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80634',
    5, 0.85, '2024-05-30 14:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5836: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80634',
    5, 0.85, '2024-05-30 14:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5834: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80113',
    4, 0.75, '2024-05-30 12:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5821: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80547',
    6, 0.85, '2024-05-29 12:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5821: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80547',
    6, 0.85, '2024-05-29 12:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5819: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80113',
    4, 0.75, '2024-05-29 11:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5817: moths (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'CO', '80903',
    8, 0.90, '2024-05-28 23:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5810: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80110',
    4, 0.85, '2024-05-28 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5810: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80110',
    4, 0.85, '2024-05-28 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5793: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80528',
    5, 0.85, '2024-05-26 11:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5793: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80528',
    5, 0.85, '2024-05-26 11:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5789: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80022',
    4, 0.85, '2024-05-25 10:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5789: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80022',
    4, 0.85, '2024-05-25 10:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5789: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80022',
    4, 0.85, '2024-05-25 10:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5788: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80220',
    5, 0.75, '2024-05-25 07:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5783: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80110',
    4, 0.75, '2024-05-24 15:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5782: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80206',
    4, 0.90, '2024-05-24 14:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5778: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80122',
    6, 0.80, '2024-05-24 10:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5770: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80226',
    4, 0.85, '2024-05-23 10:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5770: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80226',
    4, 0.85, '2024-05-23 10:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5765: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80022',
    6, 0.90, '2024-05-22 23:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5763: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80917',
    9, 0.85, '2024-05-22 21:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5763: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80917',
    9, 0.85, '2024-05-22 21:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5754: ticks (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'CO', '80550',
    8, 0.90, '2024-05-21 23:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5753: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80229',
    8, 0.90, '2024-05-21 21:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5750: bed_bugs (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'CO', '80224',
    4, 0.75, '2024-05-21 13:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5749: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80027',
    6, 0.90, '2024-05-21 12:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5746: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80207',
    5, 0.75, '2024-05-21 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5744: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80525',
    5, 0.75, '2024-05-20 21:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5738: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80524',
    9, 0.85, '2024-05-20 16:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5738: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80524',
    9, 0.85, '2024-05-20 16:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5737: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80538',
    5, 0.75, '2024-05-20 16:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5728: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80228',
    9, 0.85, '2024-05-20 03:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5728: flies (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'CO', '80228',
    9, 0.85, '2024-05-20 03:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5726: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80550',
    6, 0.80, '2024-05-19 23:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5724: bees (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'CO', '80916',
    6, 0.85, '2024-05-19 21:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5724: beetles (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'CO', '80916',
    6, 0.85, '2024-05-19 21:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5724: centipedes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', '', 'CO', '80916',
    6, 0.85, '2024-05-19 21:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5724: roaches (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'CO', '80916',
    6, 0.85, '2024-05-19 21:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5724: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80916',
    6, 0.85, '2024-05-19 21:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5723: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80521',
    5, 0.90, '2024-05-19 20:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5710: rodents (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'CO', '80004',
    4, 0.85, '2024-05-18 16:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5710: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80004',
    4, 0.85, '2024-05-18 16:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5708: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80525',
    5, 0.85, '2024-05-18 12:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5708: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80525',
    5, 0.85, '2024-05-18 12:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5707: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80403',
    5, 0.85, '2024-05-18 12:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5707: wildlife (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'CO', '80403',
    5, 0.85, '2024-05-18 12:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5706: ants (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'CO', '80525',
    5, 0.90, '2024-05-18 11:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5698: mosquitoes (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'CO', '80301',
    5, 0.85, '2024-05-17 20:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5698: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80301',
    5, 0.85, '2024-05-17 20:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5690: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80923',
    6, 0.90, '2024-05-17 13:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5678: spiders (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'CO', '80014',
    5, 0.75, '2024-05-16 15:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5673: wasps (, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'CO', '80133',
    5, 0.75, '2024-05-15 15:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;

