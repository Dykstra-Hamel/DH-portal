-- Bulk Import Pest Pressure Data Points
-- Source: Form-Export-2025-11-07-14-59 (1).csv
-- Company: 3cc78340-214b-4526-aa61-e4454ea8b34a
-- Generated: 2025-11-07 15:00:19

DO $$
DECLARE
  company_uuid UUID := '3cc78340-214b-4526-aa61-e4454ea8b34a';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN


  -- Form 422: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32224',
    8, 0.90, '2025-11-05 07:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 419: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32258',
    5, 0.85, '2025-11-03 15:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 419: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32258',
    5, 0.85, '2025-11-03 15:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 418: mosquitoes (Ponte Vedra Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Ponte Vedra Beach', 'FL', '32082',
    5, 0.90, '2025-11-03 15:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 417: mosquitoes (Ponte Vedra Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Ponte Vedra Beach', 'FL', '32082',
    5, 0.90, '2025-11-03 15:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 416: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32254',
    5, 0.75, '2025-11-01 22:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 414: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32246',
    5, 0.85, '2025-10-28 11:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 414: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32246',
    5, 0.85, '2025-10-28 11:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 413: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-10-27 15:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 411: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32218',
    5, 0.75, '2025-10-23 02:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 410: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '',
    5, 0.85, '2025-10-20 19:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 410: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '',
    5, 0.85, '2025-10-20 19:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 409: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32210',
    5, 0.75, '2025-10-20 17:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 408: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32210',
    5, 0.75, '2025-10-19 21:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 407: fleas (Hastings, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Hastings', 'FL', '32145',
    5, 0.75, '2025-10-17 15:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 403: ants (Ponte Vedra Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ponte Vedra Beach', 'FL', '32082',
    5, 0.85, '2025-10-14 19:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 403: termites (Ponte Vedra Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Ponte Vedra Beach', 'FL', '32082',
    5, 0.85, '2025-10-14 19:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 398: termites (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Fernandina Beach', 'FL', '32034',
    5, 0.75, '2025-10-08 14:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 395: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32207',
    5, 0.75, '2025-10-06 15:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 394: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32222',
    5, 0.85, '2025-10-05 15:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 394: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32222',
    5, 0.85, '2025-10-05 15:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 393: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32223',
    6, 0.80, '2025-10-02 08:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 392: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-10-01 17:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 392: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-10-01 17:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 391: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32218',
    5, 0.75, '2025-10-01 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 385: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32225',
    4, 0.75, '2025-09-25 08:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 382: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32206',
    4, 0.85, '2025-09-22 09:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 382: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32206',
    4, 0.85, '2025-09-22 09:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 381: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32209',
    5, 0.75, '2025-09-21 18:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 379: ants (Ponte Vedra, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ponte Vedra', 'FL', '32081',
    5, 0.75, '2025-09-18 16:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 378: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-09-18 15:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 378: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-09-18 15:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 376: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32221',
    6, 0.90, '2025-09-18 01:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 375: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32217',
    5, 0.75, '2025-09-17 21:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 374: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32246',
    5, 0.85, '2025-09-17 14:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 374: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32246',
    5, 0.85, '2025-09-17 14:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 373: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-09-16 10:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 370: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32208',
    5, 0.85, '2025-09-15 17:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 370: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32208',
    5, 0.85, '2025-09-15 17:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 369: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32258',
    5, 0.90, '2025-09-14 01:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 368: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32259',
    5, 0.90, '2025-09-11 15:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 367: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32211',
    5, 0.75, '2025-09-11 11:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 362: ants (Green Cove Springs, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Green Cove Springs', 'FL', '32259',
    5, 0.85, '2025-09-10 11:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 362: wasps (Green Cove Springs, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Green Cove Springs', 'FL', '32259',
    5, 0.85, '2025-09-10 11:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 361: ants (ponte vedra, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'ponte vedra', 'FL', '32081',
    4, 0.85, '2025-09-10 10:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 361: rodents (ponte vedra, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'ponte vedra', 'FL', '32081',
    4, 0.85, '2025-09-10 10:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 360: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32256',
    5, 0.75, '2025-09-09 14:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 359: ants (JACKSONVILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'JACKSONVILLE', 'FL', '32208',
    5, 0.85, '2025-09-08 14:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 359: fleas (JACKSONVILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'JACKSONVILLE', 'FL', '32208',
    5, 0.85, '2025-09-08 14:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 359: mosquitoes (JACKSONVILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'JACKSONVILLE', 'FL', '32208',
    5, 0.85, '2025-09-08 14:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 359: roaches (JACKSONVILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'JACKSONVILLE', 'FL', '32208',
    5, 0.85, '2025-09-08 14:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 358: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32206',
    5, 0.75, '2025-09-08 14:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 357: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32206',
    5, 0.90, '2025-09-08 11:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 356: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32258',
    5, 0.85, '2025-09-07 19:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 356: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32258',
    5, 0.85, '2025-09-07 19:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 355: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32207',
    5, 0.75, '2025-09-06 22:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 350: termites (Green Cove Springs, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Cove Springs', 'FL', '32043',
    4, 0.75, '2025-09-03 14:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 348: rodents (Jacksonville Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville Beach', 'FL', '32250',
    5, 0.75, '2025-09-03 10:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 345: termites (ST JOHNS, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'ST JOHNS', 'FL', '32259',
    5, 0.75, '2025-09-02 14:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 344: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32205-5107',
    6, 0.85, '2025-09-01 17:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 344: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32205-5107',
    6, 0.85, '2025-09-01 17:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 344: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32205-5107',
    6, 0.85, '2025-09-01 17:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 342: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-08-31 11:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 339: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32226',
    6, 0.80, '2025-08-29 12:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 338: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32246',
    4, 0.75, '2025-08-28 15:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 333: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32208',
    5, 0.75, '2025-08-22 04:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 332: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32226',
    5, 0.85, '2025-08-21 23:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 332: beetles (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Jacksonville', 'FL', '32226',
    5, 0.85, '2025-08-21 23:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 329: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32277',
    5, 0.85, '2025-08-19 12:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 329: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32277',
    5, 0.85, '2025-08-19 12:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 327: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-08-18 15:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 327: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-08-18 15:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 326: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32218',
    5, 0.75, '2025-08-18 12:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 325: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32207',
    4, 0.75, '2025-08-18 09:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 323: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32244',
    5, 0.75, '2025-08-15 18:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 321: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32244',
    5, 0.90, '2025-08-15 13:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 320: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-08-15 10:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 320: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-08-15 10:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 319: termites (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Fernandina Beach', 'FL', '32034',
    5, 0.75, '2025-08-13 15:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 318: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-08-13 13:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 318: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-08-13 13:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 316: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    6, 0.90, '2025-08-12 15:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 315: flies (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-08-12 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 315: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-08-12 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 314: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    6, 0.85, '2025-08-11 22:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 314: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32218',
    6, 0.85, '2025-08-11 22:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 311: roaches (jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'jacksonville', 'FL', '32277',
    5, 0.75, '2025-08-11 11:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 310: ants (Brooklyn, NY)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Brooklyn', 'NY', '11201',
    4, 0.75, '2025-08-11 10:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 309: centipedes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-08-11 09:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 308: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32221',
    5, 0.90, '2025-08-09 18:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 307: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32216',
    6, 0.85, '2025-08-06 14:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 307: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32216',
    6, 0.85, '2025-08-06 14:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 305: roaches (Saint Johns, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Saint Johns', 'FL', '32259',
    8, 0.90, '2025-08-05 16:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 304: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32250',
    5, 0.85, '2025-08-05 14:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 304: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32250',
    5, 0.85, '2025-08-05 14:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 303: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32218',
    4, 0.85, '2025-08-05 10:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 303: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32218',
    4, 0.85, '2025-08-05 10:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 302: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32208',
    8, 0.90, '2025-08-05 01:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 301: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32219',
    5, 0.75, '2025-08-04 12:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 300: mosquitoes (Jacksonville Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville Beach', 'FL', '32250',
    4, 0.90, '2025-08-04 10:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 299: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32208',
    6, 0.80, '2025-08-03 14:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 298: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-07-31 23:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 298: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-07-31 23:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 297: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-07-31 23:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 297: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-07-31 23:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 295: mosquitoes (Jacsonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacsonville', 'FL', '32206',
    5, 0.75, '2025-07-30 15:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 294: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32209',
    5, 0.75, '2025-07-29 14:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 293: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32246',
    5, 0.75, '2025-07-29 10:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 292: roaches (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Fernandina Beach', 'FL', '32034',
    5, 0.75, '2025-07-28 19:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 291: mosquitoes (St Augustine, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'St Augustine', 'FL', '32092',
    5, 0.85, '2025-07-28 17:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 291: termites (St Augustine, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'St Augustine', 'FL', '32092',
    5, 0.85, '2025-07-28 17:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 289: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32257',
    6, 0.80, '2025-07-28 15:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 288: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32256',
    5, 0.75, '2025-07-28 13:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 285: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-07-28 06:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 284: ants (Middleburg, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Middleburg', 'FL', '32068',
    5, 0.85, '2025-07-26 16:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 284: roaches (Middleburg, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Middleburg', 'FL', '32068',
    5, 0.85, '2025-07-26 16:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 282: roaches (Honolulu, HA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Honolulu', 'HA', '96818',
    5, 0.75, '2025-07-24 20:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 280: ants (hastings, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'hastings', 'FL', '32145',
    5, 0.85, '2025-07-24 07:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 280: wasps (hastings, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'hastings', 'FL', '32145',
    5, 0.85, '2025-07-24 07:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 279: ants (Fleming Island, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Fleming Island', 'FL', '32003',
    5, 0.75, '2025-07-22 08:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 278: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32206',
    5, 0.85, '2025-07-22 06:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 278: flies (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Jacksonville', 'FL', '32206',
    5, 0.85, '2025-07-22 06:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 278: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32206',
    5, 0.85, '2025-07-22 06:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 278: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32206',
    5, 0.85, '2025-07-22 06:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 278: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32206',
    5, 0.85, '2025-07-22 06:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 277: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32218',
    5, 0.90, '2025-07-21 13:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 276: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32254',
    5, 0.75, '2025-07-21 08:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 275: wasps (St John, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'St John', 'FL', '32259',
    5, 0.90, '2025-07-20 18:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 273: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32221',
    5, 0.85, '2025-07-19 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 273: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32221',
    5, 0.85, '2025-07-19 10:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 272: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32277',
    5, 0.75, '2025-07-19 08:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 269: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32211',
    5, 0.75, '2025-07-18 10:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 266: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32218',
    5, 0.90, '2025-07-16 17:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 265: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32244',
    5, 0.90, '2025-07-16 15:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 264: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32207',
    4, 0.85, '2025-07-16 14:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 264: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32207',
    4, 0.85, '2025-07-16 14:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 264: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32207',
    4, 0.85, '2025-07-16 14:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 263: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-07-14 01:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 263: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-07-14 01:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 262: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32217',
    5, 0.75, '2025-07-13 22:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 261: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-07-13 11:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 261: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32256',
    5, 0.85, '2025-07-13 11:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 260: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32208',
    5, 0.75, '2025-07-13 07:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 259: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-07-12 18:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 258: ants (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Fernandina Beach', 'FL', '32034',
    4, 0.85, '2025-07-12 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 258: mosquitoes (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Fernandina Beach', 'FL', '32034',
    4, 0.85, '2025-07-12 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 258: roaches (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Fernandina Beach', 'FL', '32034',
    4, 0.85, '2025-07-12 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 258: rodents (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Fernandina Beach', 'FL', '32034',
    4, 0.85, '2025-07-12 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 258: termites (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Fernandina Beach', 'FL', '32034',
    4, 0.85, '2025-07-12 15:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 257: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32206',
    5, 0.75, '2025-07-12 13:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 256: roaches (Ponte vedra, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Ponte vedra', 'FL', '32081',
    5, 0.75, '2025-07-12 00:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 255: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-07-11 18:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 253: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32257',
    4, 0.75, '2025-07-10 19:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 252: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32204',
    5, 0.75, '2025-07-10 10:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 251: ants (Ponte Vedra, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ponte Vedra', 'FL', '32082',
    5, 0.90, '2025-07-10 10:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 249: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32244',
    5, 0.85, '2025-07-09 06:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 249: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32244',
    5, 0.85, '2025-07-09 06:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 246: wasps (Ponte Vedra Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Ponte Vedra Beach', 'FL', '32082',
    5, 0.90, '2025-07-07 15:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 245: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32204',
    5, 0.85, '2025-07-07 11:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 245: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32204',
    5, 0.85, '2025-07-07 11:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 245: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32204',
    5, 0.85, '2025-07-07 11:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 245: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32204',
    5, 0.85, '2025-07-07 11:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 244: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32205',
    4, 0.85, '2025-07-06 21:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 244: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32205',
    4, 0.85, '2025-07-06 21:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 242: fleas (JAX, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'JAX', 'FL', '32210',
    5, 0.75, '2025-07-03 19:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 241: mosquitoes (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Orange Park', 'FL', '32073',
    5, 0.75, '2025-07-03 09:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 239: bees (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Orange Park', 'FL', '32065',
    5, 0.85, '2025-07-02 20:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 239: fleas (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Orange Park', 'FL', '32065',
    5, 0.85, '2025-07-02 20:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 238: ants (Minneapolis, MN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Minneapolis', 'MN', '55405',
    4, 0.90, '2025-07-02 18:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 237: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32216',
    6, 0.85, '2025-07-02 08:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 237: beetles (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Jacksonville', 'FL', '32216',
    6, 0.85, '2025-07-02 08:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 236: ants (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Orange Park', 'FL', '32073',
    4, 0.85, '2025-07-02 07:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 236: fleas (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Orange Park', 'FL', '32073',
    4, 0.85, '2025-07-02 07:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 235: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32219',
    5, 0.75, '2025-07-02 05:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 234: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32244',
    5, 0.75, '2025-07-01 23:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 232: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32211',
    5, 0.85, '2025-07-01 11:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 232: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32211',
    5, 0.85, '2025-07-01 11:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 231: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32225',
    9, 0.85, '2025-06-30 22:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 231: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32225',
    9, 0.85, '2025-06-30 22:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 231: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32225',
    9, 0.85, '2025-06-30 22:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 230: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32211',
    5, 0.75, '2025-06-29 03:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 229: mosquitoes (Middleburg, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Middleburg', 'FL', '32068',
    5, 0.75, '2025-06-27 19:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 227: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-06-27 11:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 226: roaches (HASTINGS, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'HASTINGS', 'FL', '32145',
    5, 0.75, '2025-06-27 10:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 225: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32226',
    5, 0.75, '2025-06-27 01:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 224: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32210',
    8, 0.90, '2025-06-26 10:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 223: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32207',
    5, 0.85, '2025-06-26 08:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 223: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32207',
    5, 0.85, '2025-06-26 08:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 220: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32246',
    5, 0.75, '2025-06-22 11:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 219: wasps (Saint Johns, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Saint Johns', 'FL', '32259',
    5, 0.75, '2025-06-21 15:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 218: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32246',
    5, 0.75, '2025-06-21 08:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 216: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32209',
    5, 0.75, '2025-06-19 17:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 214: roaches (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Orange Park', 'FL', '32073',
    5, 0.75, '2025-06-19 01:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 212: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32328',
    5, 0.75, '2025-06-18 16:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 211: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32246',
    5, 0.75, '2025-06-17 20:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 210: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-06-17 06:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 209: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32222',
    6, 0.85, '2025-06-16 22:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 209: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32222',
    6, 0.85, '2025-06-16 22:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 209: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32222',
    6, 0.85, '2025-06-16 22:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 205: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32244',
    5, 0.75, '2025-06-16 10:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 204: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32204',
    6, 0.85, '2025-06-16 09:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 204: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32204',
    6, 0.85, '2025-06-16 09:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 203: termites (jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'jacksonville', 'FL', '32206',
    5, 0.75, '2025-06-15 09:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 201: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32209',
    5, 0.75, '2025-06-14 12:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 200: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32221',
    5, 0.75, '2025-06-14 00:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 199: roaches (Atlantic beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Atlantic beach', 'FL', '32233',
    9, 0.75, '2025-06-13 23:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 196: wasps (St. Augustine, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'St. Augustine', 'FL', '32084',
    6, 0.90, '2025-06-13 11:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 195: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32210',
    5, 0.90, '2025-06-13 10:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 193: termites (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Orange Park', 'FL', '32073',
    5, 0.90, '2025-06-12 10:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 192: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32277',
    5, 0.75, '2025-06-10 16:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 185: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32223',
    5, 0.75, '2025-06-07 10:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 184: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32225',
    5, 0.75, '2025-06-06 13:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 183: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    5, 0.75, '2025-06-06 08:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 182: rodents (Mount Pleasant, SC)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Mount Pleasant', 'SC', '29464',
    5, 0.90, '2025-06-05 04:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 179: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32208',
    5, 0.75, '2025-06-02 11:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 178: ants (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Fernandina Beach', 'FL', '32034',
    6, 0.85, '2025-06-02 08:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 178: termites (Fernandina Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Fernandina Beach', 'FL', '32034',
    6, 0.85, '2025-06-02 08:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 175: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32204',
    5, 0.75, '2025-05-31 16:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 171: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32210',
    4, 0.75, '2025-05-29 13:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 170: ants (ORANGE PARK, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'ORANGE PARK', 'FL', '32073',
    4, 0.75, '2025-05-29 10:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 169: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32256',
    4, 0.75, '2025-05-29 08:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 168: bed_bugs (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Jacksonville', 'FL', '32254',
    5, 0.75, '2025-05-28 11:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 167: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32209',
    6, 0.85, '2025-05-27 22:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 167: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32209',
    6, 0.85, '2025-05-27 22:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 166: bees (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Jacksonville', 'FL', '32209',
    6, 0.85, '2025-05-27 22:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 166: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32209',
    6, 0.85, '2025-05-27 22:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 163: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32210',
    5, 0.85, '2025-05-26 14:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 163: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32210',
    5, 0.85, '2025-05-26 14:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 163: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32210',
    5, 0.85, '2025-05-26 14:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 162: rodents (Atlantic beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Atlantic beach', 'FL', '32233',
    9, 0.75, '2025-05-26 13:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 161: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32244',
    4, 0.90, '2025-05-25 17:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 160: roaches (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Orange Park', 'FL', '32073',
    6, 0.85, '2025-05-24 10:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 160: spiders (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Orange Park', 'FL', '32073',
    6, 0.85, '2025-05-24 10:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 159: roaches (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Orange Park', 'FL', '32073',
    6, 0.85, '2025-05-24 10:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 159: spiders (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Orange Park', 'FL', '32073',
    6, 0.85, '2025-05-24 10:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 152: roaches (Atlantic Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Atlantic Beach', 'FL', '32233',
    5, 0.75, '2025-05-21 14:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 151: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32208',
    5, 0.90, '2025-05-21 11:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 149: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32210',
    5, 0.75, '2025-05-20 14:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 148: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32209',
    5, 0.75, '2025-05-20 12:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 147: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32205',
    5, 0.90, '2025-05-19 22:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 146: flies (, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'FL', '32256',
    5, 0.85, '2025-05-19 15:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 146: wasps (, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', '', 'FL', '32256',
    5, 0.85, '2025-05-19 15:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 142: bees (Ponte Vedra Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Ponte Vedra Beach', 'FL', '32082',
    5, 0.75, '2025-05-18 14:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 140: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32225',
    5, 0.85, '2025-05-18 07:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 140: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32225',
    5, 0.85, '2025-05-18 07:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 139: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32218',
    4, 0.85, '2025-05-17 23:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 139: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32218',
    4, 0.85, '2025-05-17 23:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 136: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32246',
    5, 0.85, '2025-05-13 10:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 136: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32246',
    5, 0.85, '2025-05-13 10:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 135: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32205',
    5, 0.75, '2025-05-12 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 133: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32224',
    6, 0.90, '2025-05-09 18:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 132: bees (Yulee, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Yulee', 'FL', '32097',
    8, 0.85, '2025-05-09 11:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 132: beetles (Yulee, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Yulee', 'FL', '32097',
    8, 0.85, '2025-05-09 11:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 132: mosquitoes (Yulee, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Yulee', 'FL', '32097',
    8, 0.85, '2025-05-09 11:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 131: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32277',
    5, 0.85, '2025-05-08 18:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 131: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32277',
    5, 0.85, '2025-05-08 18:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 131: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32277',
    5, 0.85, '2025-05-08 18:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 130: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32257',
    5, 0.90, '2025-05-08 10:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 125: roaches (Middleburg,, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Middleburg,', 'FL', '32068',
    5, 0.75, '2025-05-06 20:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 124: mosquitoes (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Jacksonville', 'FL', '32211',
    5, 0.85, '2025-05-06 12:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 124: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32211',
    5, 0.85, '2025-05-06 12:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 122: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32218',
    5, 0.90, '2025-05-06 08:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 121: ants (Las Vegas, NE)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Las Vegas', 'NE', '89117',
    5, 0.85, '2025-05-06 00:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 121: rodents (Las Vegas, NE)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Las Vegas', 'NE', '89117',
    5, 0.85, '2025-05-06 00:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 120: ants (JACKSONVILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'JACKSONVILLE', 'FL', '32258',
    5, 0.85, '2025-05-05 07:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 120: mosquitoes (JACKSONVILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'JACKSONVILLE', 'FL', '32258',
    5, 0.85, '2025-05-05 07:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 120: ticks (JACKSONVILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'JACKSONVILLE', 'FL', '32258',
    5, 0.85, '2025-05-05 07:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 117: rodents (Atlantic Beach, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Atlantic Beach', 'FL', '32233',
    5, 0.75, '2025-05-01 22:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 112: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32208',
    5, 0.75, '2025-04-28 22:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 110: termites (JACKVONSILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'JACKVONSILLE', 'FL', '32208',
    4, 0.75, '2025-04-28 10:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 109: termites (JACKVONSILLE, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'JACKVONSILLE', 'FL', '32208',
    4, 0.75, '2025-04-28 10:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 108: wasps (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Jacksonville', 'FL', '32209',
    5, 0.90, '2025-04-27 13:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 107: wasps (St Augustine, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'St Augustine', 'FL', '32092',
    5, 0.75, '2025-04-26 17:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 106: wasps (Ponte Vedra, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Ponte Vedra', 'FL', '32081',
    5, 0.90, '2025-04-26 14:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 105: roaches (Baldwin, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Baldwin', 'FL', '32234',
    5, 0.75, '2025-04-25 16:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 104: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32257',
    5, 0.75, '2025-04-25 07:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 103: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32257',
    5, 0.75, '2025-04-25 07:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 102: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32222',
    6, 0.85, '2025-04-23 18:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 102: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32222',
    6, 0.85, '2025-04-23 18:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 102: termites (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Jacksonville', 'FL', '32222',
    6, 0.85, '2025-04-23 18:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 102: ticks (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Jacksonville', 'FL', '32222',
    6, 0.85, '2025-04-23 18:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 97: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32204',
    9, 0.75, '2025-04-20 21:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 96: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32219',
    5, 0.75, '2025-04-19 23:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 93: bed_bugs (Mount Olive, NC)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mount Olive', 'NC', '27006',
    5, 0.90, '2025-04-17 21:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 92: ants (Tampa, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tampa', 'FL', '33602',
    5, 0.75, '2025-04-17 07:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 91: ants (Fleming Island, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Fleming Island', 'FL', '32003',
    5, 0.85, '2025-04-15 08:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 91: bees (Fleming Island, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Fleming Island', 'FL', '32003',
    5, 0.85, '2025-04-15 08:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 90: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-04-14 21:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 90: spiders (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Jacksonville', 'FL', '32218',
    5, 0.85, '2025-04-14 21:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 89: roaches (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jacksonville', 'FL', '32205',
    8, 0.90, '2025-04-14 13:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 87: ants (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jacksonville', 'FL', '32208',
    5, 0.75, '2025-04-13 21:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 85: ants (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Orange Park', 'FL', '32073',
    5, 0.85, '2025-04-10 14:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 85: roaches (Orange Park, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Orange Park', 'FL', '32073',
    5, 0.85, '2025-04-10 14:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 81: ants (Callahan, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Callahan', 'FL', '32011',
    5, 0.75, '2025-04-06 15:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 80: rodents (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jacksonville', 'FL', '32208',
    5, 0.75, '2025-04-05 06:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 78: fleas (Mt Pleasant, TX)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Mt Pleasant', 'TX', '73949',
    5, 0.75, '2025-04-03 01:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 77: bed_bugs (BRONX, NY)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'BRONX', 'NY', '10458',
    5, 0.75, '2025-04-01 23:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 75: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32206',
    5, 0.75, '2025-04-01 20:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 74: fleas (Columbus, OH)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Columbus', 'OH', '43201',
    5, 0.75, '2025-03-31 23:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 72: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32205',
    5, 0.75, '2025-03-30 10:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 71: mosquitoes (Saint Augustine, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Saint Augustine', 'FL', '32084',
    5, 0.75, '2025-03-28 09:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 70: rodents (riverview, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'riverview', 'FL', '33578',
    4, 0.75, '2025-03-27 12:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 67: roaches (Jackosnville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Jackosnville', 'FL', '32218',
    5, 0.75, '2025-03-27 00:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 61: roaches (Middleburg, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Middleburg', 'FL', '32068',
    5, 0.85, '2025-03-23 19:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 61: rodents (Middleburg, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Middleburg', 'FL', '32068',
    5, 0.85, '2025-03-23 19:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 60: fleas (Jacksonville, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Jacksonville', 'FL', '32204',
    9, 0.75, '2025-03-20 22:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 59: termites (Adairsville, BA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Adairsville', 'BA', '30002',
    5, 0.75, '2025-03-20 22:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 58: roaches (Callahan, FL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Callahan', 'FL', '32011',
    5, 0.75, '2025-03-19 11:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;

