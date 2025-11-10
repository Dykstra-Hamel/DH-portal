-- Bulk Import Pest Pressure Data Points
-- Source: Form-Export-2025-11-07-15-03.csv
-- Company: 8da68eed-0759-4b45-bd08-abb339cfad7b
-- Generated: 2025-11-07 15:04:02

DO $$
DECLARE
  company_uuid UUID := '8da68eed-0759-4b45-bd08-abb339cfad7b';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN


  -- Form 5782: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85745',
    6, 0.90, '2025-10-31 18:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5773: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85351',
    5, 0.90, '2025-10-30 14:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5771: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85142',
    4, 0.85, '2025-10-29 23:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5771: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85142',
    4, 0.85, '2025-10-29 23:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5750: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85205',
    4, 0.75, '2025-10-24 11:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5745: rodents (Rd, #2)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Rd', '#2', '85715',
    4, 0.75, '2025-10-23 09:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5744: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85122',
    4, 0.90, '2025-10-22 20:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5730: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85212',
    5, 0.90, '2025-10-18 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5728: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85323',
    5, 0.75, '2025-10-17 19:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5726: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85212',
    5, 0.75, '2025-10-16 19:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5724: mosquitoes (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'AZ', '85302',
    4, 0.75, '2025-10-16 16:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5721: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85143',
    6, 0.90, '2025-10-15 19:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5718: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85321',
    5, 0.75, '2025-10-14 13:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5713: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85043',
    5, 0.75, '2025-10-13 18:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5704: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85212',
    5, 0.85, '2025-10-10 18:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5704: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85212',
    5, 0.85, '2025-10-10 18:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5691: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85718',
    5, 0.75, '2025-10-08 12:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5689: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85212-8821',
    5, 0.85, '2025-10-07 19:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5689: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85212-8821',
    5, 0.85, '2025-10-07 19:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5683: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85742',
    8, 0.90, '2025-10-06 17:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5666: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85331',
    4, 0.85, '2025-10-02 19:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5666: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85331',
    4, 0.85, '2025-10-02 19:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5662: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85123',
    4, 0.75, '2025-10-02 12:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5657: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85704',
    5, 0.85, '2025-10-01 18:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5657: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85704',
    5, 0.85, '2025-10-01 18:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5655: silverfish (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'silverfish', '', 'AZ', '85355',
    5, 0.75, '2025-09-30 16:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5572: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85737',
    5, 0.90, '2025-09-12 14:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5543: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85743',
    5, 0.75, '2025-09-09 15:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5537: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85050',
    5, 0.75, '2025-09-08 12:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5535: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85373',
    5, 0.90, '2025-09-08 10:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5504: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85747',
    4, 0.75, '2025-09-02 18:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5499: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85719',
    5, 0.75, '2025-08-29 21:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5473: crickets (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Marana', 'AZ', '85653',
    8, 0.90, '2025-08-27 15:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5466: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85712',
    4, 0.75, '2025-08-26 15:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5413: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85298',
    6, 0.90, '2025-08-16 12:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5409: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85339',
    4, 0.85, '2025-08-15 23:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5409: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85339',
    4, 0.85, '2025-08-15 23:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5406: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85718',
    5, 0.75, '2025-08-15 15:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5380: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85704',
    4, 0.85, '2025-08-12 15:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5380: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85704',
    4, 0.85, '2025-08-12 15:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5344: crickets (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'AZ', '85718',
    5, 0.75, '2025-08-04 16:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5339: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '94111',
    4, 0.75, '2025-08-04 02:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5295: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85745',
    5, 0.85, '2025-07-25 16:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5295: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85745',
    5, 0.85, '2025-07-25 16:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5255: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85016',
    5, 0.90, '2025-07-14 16:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5231: crickets (E, 3R)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'E', '3R', '85251',
    6, 0.90, '2025-07-07 13:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5196: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85623',
    6, 0.90, '2025-06-30 11:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5186: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85233',
    6, 0.85, '2025-06-27 11:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5186: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85233',
    6, 0.85, '2025-06-27 11:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5186: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85233',
    6, 0.85, '2025-06-27 11:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5181: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85741',
    4, 0.75, '2025-06-26 13:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5175: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85388',
    6, 0.90, '2025-06-24 17:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5166: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85304',
    5, 0.75, '2025-06-21 10:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5165: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85755',
    5, 0.75, '2025-06-20 17:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5153: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85016',
    5, 0.90, '2025-06-18 21:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5140: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85711',
    8, 0.90, '2025-06-13 21:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5116: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85705',
    5, 0.75, '2025-06-05 14:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5114: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85207',
    5, 0.90, '2025-06-04 19:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5091: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85718',
    4, 0.75, '2025-05-30 14:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5080: mosquitoes (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', '', 'AZ', '85737',
    5, 0.85, '2025-05-28 13:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5080: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85737',
    5, 0.85, '2025-05-28 13:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5071: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85704',
    5, 0.75, '2025-05-27 21:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5066: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85085',
    4, 0.90, '2025-05-26 19:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5059: ants (DILWORTH, MI)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'DILWORTH', 'MI', '56529',
    5, 0.85, '2025-05-22 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 5059: bees (DILWORTH, MI)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'DILWORTH', 'MI', '56529',
    5, 0.85, '2025-05-22 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5042: rodents (AZ, US)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'AZ', 'US', '85042',
    5, 0.75, '2025-05-15 12:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5032: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85260',
    4, 0.75, '2025-05-12 14:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 5025: bees (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'AZ', '85755',
    5, 0.90, '2025-05-10 11:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4998: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85048',
    5, 0.90, '2025-05-05 14:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4997: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85746-8350',
    5, 0.75, '2025-05-05 13:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4986: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85086',
    9, 0.90, '2025-05-01 20:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4960: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85739',
    5, 0.85, '2025-04-26 17:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4960: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85739',
    5, 0.85, '2025-04-26 17:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4911: bees (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'AZ', '85331-5875',
    4, 0.90, '2025-04-14 16:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4899: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85653',
    4, 0.85, '2025-04-12 13:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4899: bees (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'AZ', '85653',
    4, 0.85, '2025-04-12 13:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4899: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85653',
    4, 0.85, '2025-04-12 13:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4895: termites (85748, AN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '85748', 'AN', '85748',
    5, 0.75, '2025-04-11 12:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4890: silverfish (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'silverfish', '', 'AZ', '85251',
    4, 0.90, '2025-04-10 14:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4884: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '74012',
    5, 0.85, '2025-04-09 14:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4884: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '74012',
    5, 0.85, '2025-04-09 14:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4882: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85234',
    6, 0.85, '2025-04-09 02:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4882: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85234',
    6, 0.85, '2025-04-09 02:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4878: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85730',
    5, 0.75, '2025-04-08 15:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4877: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85737',
    5, 0.85, '2025-04-08 14:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4877: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85737',
    5, 0.85, '2025-04-08 14:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4877: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85737',
    5, 0.85, '2025-04-08 14:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4868: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85707',
    4, 0.90, '2025-04-07 13:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4866: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85641',
    5, 0.75, '2025-04-07 11:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4865: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85710',
    5, 0.90, '2025-04-06 23:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4859: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '38801',
    5, 0.75, '2025-04-05 15:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4855: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85392',
    5, 0.75, '2025-04-04 19:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4846: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85145',
    4, 0.75, '2025-04-02 04:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4845: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85658',
    9, 0.90, '2025-04-01 22:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4827: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85653',
    5, 0.75, '2025-03-28 11:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4813: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85018',
    5, 0.90, '2025-03-24 12:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4784: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85709',
    5, 0.85, '2025-03-13 13:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4784: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85709',
    5, 0.85, '2025-03-13 13:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4780: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85086',
    5, 0.85, '2025-03-12 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4780: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85086',
    5, 0.85, '2025-03-12 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4779: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '26505',
    4, 0.90, '2025-03-12 12:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4773: spiders (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'AZ', '85710',
    5, 0.75, '2025-03-11 14:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4767: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85007',
    5, 0.75, '2025-03-10 21:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4766: ants (Tennessee, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tennessee', 'UN', '37140',
    9, 0.85, '2025-03-10 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4766: rodents (Tennessee, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tennessee', 'UN', '37140',
    9, 0.85, '2025-03-10 14:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4759: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85755-5861',
    5, 0.75, '2025-03-06 16:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4757: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85388',
    5, 0.90, '2025-03-06 14:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4744: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85711',
    4, 0.90, '2025-03-04 16:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4740: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '90001',
    5, 0.75, '2025-03-04 00:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4724: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85622',
    5, 0.75, '2025-02-28 13:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4721: ants (Tennessee, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tennessee', 'UN', '37140',
    9, 0.85, '2025-02-27 11:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4721: rodents (Tennessee, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tennessee', 'UN', '37140',
    9, 0.85, '2025-02-27 11:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4710: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '123456',
    5, 0.75, '2025-02-21 15:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4707: bees (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'AZ', '85643',
    5, 0.75, '2025-02-21 13:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4701: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85308',
    4, 0.75, '2025-02-19 17:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4700: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85716',
    5, 0.75, '2025-02-19 10:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4695: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85706',
    6, 0.80, '2025-02-18 11:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4690: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85321',
    5, 0.75, '2025-02-17 21:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4678: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85746',
    5, 0.75, '2025-02-16 17:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4672: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85710',
    5, 0.85, '2025-02-15 22:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4672: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85710',
    5, 0.85, '2025-02-15 22:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4671: moths (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', '', 'AZ', '85711',
    8, 0.90, '2025-02-15 16:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4670: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85714',
    4, 0.90, '2025-02-15 11:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4668: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85750',
    5, 0.85, '2025-02-14 12:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4668: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85750',
    5, 0.85, '2025-02-14 12:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4662: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85743',
    6, 0.90, '2025-02-12 17:56:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4660: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '91355',
    4, 0.75, '2025-02-12 14:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4615: roaches (ave, AP)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'ave', 'AP', '85719',
    5, 0.75, '2025-02-03 13:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4608: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85710',
    5, 0.75, '2025-01-31 15:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4597: silverfish (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'silverfish', '', 'AZ', '85339',
    4, 0.90, '2025-01-27 22:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4572: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85750',
    5, 0.85, '2025-01-16 19:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4572: wildlife (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', '', 'AZ', '85750',
    5, 0.85, '2025-01-16 19:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4571: bed_bugs (Way, BA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Way', 'BA', '85712',
    5, 0.75, '2025-01-16 17:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4567: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '75219',
    4, 0.75, '2025-01-15 20:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4544: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85622',
    8, 0.90, '2025-01-04 00:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4519: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85713',
    5, 0.75, '2024-12-22 14:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4507: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85658',
    5, 0.75, '2024-12-13 15:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4503: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '11201',
    4, 0.75, '2024-12-12 14:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4500: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85658',
    5, 0.85, '2024-12-11 13:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4500: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85658',
    5, 0.85, '2024-12-11 13:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4485: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85755',
    5, 0.85, '2024-12-05 13:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4485: spiders (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'AZ', '85755',
    5, 0.85, '2024-12-05 13:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4484: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85144',
    4, 0.75, '2024-12-05 11:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4469: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85142',
    5, 0.75, '2024-11-27 13:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4452: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85748',
    4, 0.75, '2024-11-23 11:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4450: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85718',
    5, 0.90, '2024-11-22 10:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4449: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85743',
    5, 0.75, '2024-11-22 08:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4444: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85016',
    5, 0.90, '2024-11-19 20:32:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4434: bed_bugs (ave, HO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'ave', 'HO', '85705',
    5, 0.90, '2024-11-15 12:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4433: bees (AZ, US)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'AZ', 'US', '85713',
    5, 0.85, '2024-11-14 19:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4433: flies (AZ, US)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'AZ', 'US', '85713',
    5, 0.85, '2024-11-14 19:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4431: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85716',
    5, 0.75, '2024-11-14 13:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4416: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '86015',
    6, 0.85, '2024-11-08 10:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4416: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '86015',
    6, 0.85, '2024-11-08 10:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4412: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85016',
    5, 0.90, '2024-11-07 15:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4371: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-10-30 14:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4343: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85745',
    5, 0.90, '2024-10-26 23:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4342: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85658',
    6, 0.80, '2024-10-26 17:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4341: roaches (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Marana', 'AZ', '85653',
    5, 0.90, '2024-10-26 11:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4295: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85706',
    5, 0.75, '2024-10-21 07:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4275: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '21211',
    5, 0.75, '2024-10-18 02:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4248: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85712',
    5, 0.85, '2024-10-15 15:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4248: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85712',
    5, 0.85, '2024-10-15 15:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4248: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85712',
    5, 0.85, '2024-10-15 15:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4227: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85382',
    6, 0.80, '2024-10-12 14:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4214: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85755',
    5, 0.75, '2024-10-11 13:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4204: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85713',
    5, 0.75, '2024-10-10 00:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4199: crickets (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'AZ', '85704',
    6, 0.80, '2024-10-09 09:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4188: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85741',
    6, 0.85, '2024-10-07 23:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4188: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85741',
    6, 0.85, '2024-10-07 23:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4185: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85739',
    4, 0.85, '2024-10-07 15:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4185: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85739',
    4, 0.85, '2024-10-07 15:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4171: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85730',
    4, 0.85, '2024-10-05 19:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4171: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85730',
    4, 0.85, '2024-10-05 19:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4157: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85737',
    5, 0.75, '2024-10-04 01:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4139: crickets (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'AZ', '85756',
    5, 0.85, '2024-10-01 16:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4139: spiders (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'AZ', '85756',
    5, 0.85, '2024-10-01 16:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4135: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85602',
    4, 0.75, '2024-09-30 17:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4134: roaches (Crest, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Crest', 'UN', '85750',
    5, 0.85, '2024-09-30 12:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4134: scorpions (Crest, UN)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Crest', 'UN', '85750',
    5, 0.85, '2024-09-30 12:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4130: bees (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'AZ', '85710',
    5, 0.85, '2024-09-29 18:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4130: beetles (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', '', 'AZ', '85710',
    5, 0.85, '2024-09-29 18:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4130: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85710',
    5, 0.85, '2024-09-29 18:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4122: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85043',
    5, 0.85, '2024-09-27 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4122: spiders (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'AZ', '85043',
    5, 0.85, '2024-09-27 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4100: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85641',
    5, 0.75, '2024-09-24 20:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4075: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85745',
    5, 0.90, '2024-09-21 10:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4069: roaches (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', '', 'AZ', '85745',
    5, 0.85, '2024-09-19 22:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4069: scorpions (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', '', 'AZ', '85745',
    5, 0.85, '2024-09-19 22:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4069: spiders (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'AZ', '85745',
    5, 0.85, '2024-09-19 22:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4068: ticks (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', '', 'AZ', '85335',
    5, 0.75, '2024-09-19 21:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4045: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85641',
    4, 0.75, '2024-09-16 18:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4032: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85706',
    5, 0.75, '2024-09-14 10:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 4010: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85705',
    4, 0.85, '2024-09-10 23:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 4010: spiders (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', '', 'AZ', '85705',
    4, 0.85, '2024-09-10 23:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3976: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85629',
    5, 0.75, '2024-09-06 19:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3975: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85629',
    5, 0.75, '2024-09-06 19:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3964: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85741',
    5, 0.75, '2024-09-05 03:35:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3957: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85321',
    9, 0.75, '2024-09-04 14:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3924: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85742',
    6, 0.80, '2024-08-29 20:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3923: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85718',
    5, 0.75, '2024-08-29 11:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3918: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85044',
    4, 0.75, '2024-08-28 17:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3910: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85087',
    4, 0.85, '2024-08-27 14:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 3910: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85087',
    4, 0.85, '2024-08-27 14:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3903: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85743',
    5, 0.85, '2024-08-26 14:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 3903: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '85743',
    5, 0.85, '2024-08-26 14:17:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3902: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85326',
    4, 0.75, '2024-08-26 12:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3883: bed_bugs (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '', 'AZ', '38930',
    5, 0.75, '2024-08-22 01:40:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3881: crickets (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', '', 'AZ', '85719',
    6, 0.90, '2024-08-21 20:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3879: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85742',
    5, 0.75, '2024-08-21 18:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3876: ants (Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Creek', 'AZ', '85331',
    5, 0.90, '2024-08-21 13:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3828: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85653',
    6, 0.80, '2024-08-17 22:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3814: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85757',
    5, 0.90, '2024-08-13 12:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3797: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85623',
    6, 0.80, '2024-08-05 18:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3786: bees (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', '', 'AZ', '85745',
    6, 0.85, '2024-08-02 16:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 3786: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '85745',
    6, 0.85, '2024-08-02 16:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3784: flies (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', '', 'AZ', '85212',
    4, 0.75, '2024-08-02 14:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3781: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '20724',
    5, 0.85, '2024-08-01 19:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 3781: rodents (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', '', 'AZ', '20724',
    5, 0.85, '2024-08-01 19:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3780: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85756',
    5, 0.85, '2024-08-01 16:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 3780: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85756',
    5, 0.85, '2024-08-01 16:10:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3770: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85140',
    4, 0.75, '2024-07-30 18:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3767: ants (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '', 'AZ', '85355',
    5, 0.85, '2024-07-29 22:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 3767: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85355',
    5, 0.85, '2024-07-29 22:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3765: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85253',
    4, 0.90, '2024-07-29 18:23:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 3758: termites (, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', '', 'AZ', '85355',
    6, 0.90, '2024-07-26 11:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;

