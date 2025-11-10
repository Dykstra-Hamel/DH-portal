-- Bulk Import Pest Pressure Data Points (Part 1/6)
-- Company: 8da68eed-0759-4b45-bd08-abb339cfad7b
-- Records: 1 to 1000

DO $$
DECLARE
  company_uuid UUID := '8da68eed-0759-4b45-bd08-abb339cfad7b';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN

  -- Form 5828: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2025-11-07 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5827: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2025-11-07 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5825: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85037',
    4, 0.75, '2025-11-07 07:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5823: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.90, '2025-11-06 23:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5822: other_pests (GOODYEAR, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'GOODYEAR', 'AZ', '85338',
    5, 0.75, '2025-11-06 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5821: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85041',
    4, 0.75, '2025-11-06 10:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5809: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85234',
    5, 0.75, '2025-11-04 16:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5807: termites (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Benson', 'AZ', '85602',
    4, 0.75, '2025-11-04 16:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5802: termites (Black Canyon City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Black Canyon City', 'AZ', '85324-7521',
    5, 0.75, '2025-11-04 12:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5787: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85387',
    5, 0.75, '2025-11-01 18:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5785: ants (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Goodyear', 'AZ', '85338',
    5, 0.85, '2025-11-01 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5785: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85338',
    5, 0.85, '2025-11-01 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5784: ants (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Goodyear', 'AZ', '85338',
    5, 0.85, '2025-11-01 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5784: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85338',
    5, 0.85, '2025-11-01 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5783: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85748',
    5, 0.75, '2025-10-31 20:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5777: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85266',
    5, 0.90, '2025-10-30 16:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5770: bees (San tan valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'San tan valley', 'AZ', '85143',
    4, 0.90, '2025-10-29 19:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5766: mosquitoes (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Tucson', 'AZ', '85719',
    5, 0.75, '2025-10-28 21:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5765: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    4, 0.75, '2025-10-28 14:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5763: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85258',
    4, 0.75, '2025-10-28 12:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5760: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2025-10-27 19:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5757: ants (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Benson', 'AZ', '85602',
    6, 0.85, '2025-10-27 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5757: termites (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Benson', 'AZ', '85602',
    6, 0.85, '2025-10-27 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5754: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2025-10-26 23:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5751: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85266',
    5, 0.90, '2025-10-24 12:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5749: mosquitoes (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2025-10-24 11:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5748: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85040',
    5, 0.75, '2025-10-23 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5747: rodents (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Gilbert', 'AZ', '85295',
    5, 0.85, '2025-10-23 14:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5747: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85295',
    5, 0.85, '2025-10-23 14:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5743: mosquitoes (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2025-10-22 16:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5741: crickets (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'TUCSON', 'AZ', '85741',
    6, 0.90, '2025-10-22 01:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5739: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2025-10-21 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5738: bed_bugs (MELROSE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'MELROSE', 'AZ', '85714',
    5, 0.75, '2025-10-21 11:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5737: roaches (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Glendale', 'AZ', '85308',
    5, 0.75, '2025-10-21 06:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5736: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.90, '2025-10-20 18:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5735: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.90, '2025-10-20 14:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5734: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85209',
    9, 0.75, '2025-10-20 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5732: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    5, 0.75, '2025-10-19 21:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5727: ants (Tucsonjd@yahoo.com, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucsonjd@yahoo.com', 'AZ', '85718',
    4, 0.85, '2025-10-17 16:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5727: termites (Tucsonjd@yahoo.com, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucsonjd@yahoo.com', 'AZ', '85718',
    4, 0.85, '2025-10-17 16:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5725: termites (Catalina, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Catalina', 'AZ', '85739',
    5, 0.75, '2025-10-16 18:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5723: other_pests (Oracle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oracle', 'AZ', '85634',
    5, 0.75, '2025-10-16 15:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5722: other_pests (BENSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'BENSON', 'AZ', '85602',
    5, 0.75, '2025-10-15 20:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5720: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85023',
    6, 0.90, '2025-10-15 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5719: termites (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Valley', 'AZ', '85622',
    5, 0.90, '2025-10-14 13:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5717: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2025-10-14 12:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5715: ants (South Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'South Tucson', 'AZ', '85713',
    5, 0.85, '2025-10-14 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5715: bed_bugs (South Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'South Tucson', 'AZ', '85713',
    5, 0.85, '2025-10-14 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5715: fleas (South Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'South Tucson', 'AZ', '85713',
    5, 0.85, '2025-10-14 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5715: mosquitoes (South Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'South Tucson', 'AZ', '85713',
    5, 0.85, '2025-10-14 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5715: termites (South Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'South Tucson', 'AZ', '85713',
    5, 0.85, '2025-10-14 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5714: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    5, 0.75, '2025-10-14 00:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5711: termites (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tempe', 'AZ', '85283',
    5, 0.75, '2025-10-13 10:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5710: rodents (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Ajo', 'AZ', '',
    5, 0.75, '2025-10-11 23:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5709: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85704',
    5, 0.90, '2025-10-11 20:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5708: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.75, '2025-10-11 17:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5706: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85143',
    9, 0.75, '2025-10-10 20:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5705: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2025-10-10 19:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5703: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85388',
    5, 0.75, '2025-10-10 16:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5702: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2025-10-10 16:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5701: rodents (Carefree, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Carefree', 'AZ', '85377',
    5, 0.75, '2025-10-10 12:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5700: termites (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Valley', 'AZ', '85622',
    5, 0.90, '2025-10-10 07:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5692: other_pests (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'PHOENIX', 'AZ', '85021',
    4, 0.75, '2025-10-08 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5690: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    5, 0.75, '2025-10-08 12:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5688: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.90, '2025-10-07 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5687: termites (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Ajo', 'AZ', '85321',
    5, 0.90, '2025-10-07 00:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5686: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2025-10-06 23:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5685: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85297',
    5, 0.75, '2025-10-06 20:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5684: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    4, 0.75, '2025-10-06 18:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5682: termites (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Paradise Valley', 'AZ', '85253',
    4, 0.90, '2025-10-06 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5681: ants (Happy jack, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Happy jack', 'AZ', '86024',
    5, 0.75, '2025-10-06 15:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5677: other_pests (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MARANA', 'AZ', '85653',
    5, 0.75, '2025-10-05 20:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5676: other_pests (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MARANA', 'AZ', '85653',
    5, 0.75, '2025-10-05 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5675: other_pests (Tycson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tycson', 'AZ', '85730',
    5, 0.75, '2025-10-04 15:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5673: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    4, 0.90, '2025-10-04 15:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5669: termites (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Florence', 'AZ', '85132',
    5, 0.75, '2025-10-03 16:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5668: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85711',
    5, 0.90, '2025-10-03 10:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5665: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85284',
    5, 0.75, '2025-10-02 17:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5664: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2025-10-02 16:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5663: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    6, 0.90, '2025-10-02 15:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5661: ticks (Corona De Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Corona De Tucson', 'AZ', '85641',
    4, 0.90, '2025-10-02 12:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5659: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2025-10-01 22:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5658: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85705',
    5, 0.85, '2025-10-01 19:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5658: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    5, 0.85, '2025-10-01 19:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5654: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85706',
    5, 0.75, '2025-09-29 21:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5653: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85008',
    8, 0.90, '2025-09-29 17:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5650: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85710',
    6, 0.90, '2025-09-29 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5646: ants (Spokane, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Spokane', 'AZ', '99218',
    5, 0.85, '2025-09-27 09:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5646: roaches (Spokane, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Spokane', 'AZ', '99218',
    5, 0.85, '2025-09-27 09:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5645: ants (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Florence', 'AZ', '85132',
    6, 0.85, '2025-09-26 18:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5645: termites (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Florence', 'AZ', '85132',
    6, 0.85, '2025-09-26 18:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5644: termites (Arivaca, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Arivaca', 'AZ', '85601',
    5, 0.75, '2025-09-26 15:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5642: rodents (Spanish Fork, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Spanish Fork', 'AZ', '84660',
    5, 0.85, '2025-09-25 10:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5642: termites (Spanish Fork, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Spanish Fork', 'AZ', '84660',
    5, 0.85, '2025-09-25 10:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5641: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    4, 0.75, '2025-09-25 04:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5640: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2025-09-25 03:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5638: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.75, '2025-09-24 05:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5637: ants (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Red Rock', 'AZ', '85145',
    5, 0.85, '2025-09-23 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5637: flies (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Red Rock', 'AZ', '85145',
    5, 0.85, '2025-09-23 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5636: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    4, 0.75, '2025-09-23 12:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5635: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2025-09-22 23:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5634: scorpions (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Anthem', 'AZ', '85086',
    4, 0.85, '2025-09-22 15:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5634: termites (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Anthem', 'AZ', '85086',
    4, 0.85, '2025-09-22 15:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5633: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85383',
    4, 0.75, '2025-09-22 13:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5632: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.90, '2025-09-22 13:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5631: termites (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Valley', 'AZ', '85614',
    5, 0.75, '2025-09-21 20:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5626: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2025-09-19 18:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5624: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-09-19 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5623: termites (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'PHOENIX', 'AZ', '85007',
    5, 0.75, '2025-09-19 17:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5622: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.90, '2025-09-19 16:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5621: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.90, '2025-09-19 16:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5620: scorpions (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2025-09-19 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5619: termites (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Casa Grande', 'AZ', '',
    5, 0.90, '2025-09-19 10:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5613: bees (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2025-09-18 18:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5612: termites (New River, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'New River', 'AZ', '85087',
    9, 0.75, '2025-09-18 17:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5605: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85742',
    6, 0.90, '2025-09-16 22:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5599: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2025-09-16 13:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5597: other_pests (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tolleson', 'AZ', '85353',
    5, 0.75, '2025-09-15 23:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5595: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85254',
    4, 0.75, '2025-09-15 17:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5594: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '85249',
    5, 0.75, '2025-09-15 11:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5592: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85750',
    4, 0.75, '2025-09-14 00:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5591: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    4, 0.75, '2025-09-13 18:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5590: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85716',
    5, 0.75, '2025-09-13 16:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5589: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '85212',
    8, 0.90, '2025-09-13 16:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5586: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85029',
    5, 0.75, '2025-09-13 13:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5583: other_pests (Mesa -AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa -AZ', 'AZ', '85208',
    5, 0.75, '2025-09-13 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5582: other_pests (Mesa -AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa -AZ', 'AZ', '85208',
    5, 0.75, '2025-09-13 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5569: ants (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ajo', 'AZ', '85321',
    5, 0.85, '2025-09-12 11:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5569: roaches (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Ajo', 'AZ', '85321',
    5, 0.85, '2025-09-12 11:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5541: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.90, '2025-09-09 13:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5540: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85033',
    5, 0.75, '2025-09-09 12:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5539: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2025-09-09 10:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5536: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85155',
    5, 0.75, '2025-09-08 12:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5534: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    8, 0.90, '2025-09-07 00:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5521: other_pests (Glendale. Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale. Az', 'AZ', '85303',
    5, 0.75, '2025-09-05 21:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5520: other_pests (Glendale. Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale. Az', 'AZ', '85303',
    5, 0.75, '2025-09-05 21:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5517: rodents (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'PHOENIX', 'AZ', '85009',
    5, 0.90, '2025-09-05 12:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5516: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '85383',
    5, 0.75, '2025-09-05 11:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5514: crickets (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Glendale', 'AZ', '85308',
    6, 0.90, '2025-09-04 16:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5513: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.75, '2025-09-04 15:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5511: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85719',
    5, 0.75, '2025-09-04 13:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5509: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85143',
    7, 0.90, '2025-09-04 11:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5505: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85014',
    5, 0.75, '2025-09-03 15:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5503: other_pests (CARTERSVILLE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'CARTERSVILLE', 'AZ', '30120',
    5, 0.75, '2025-09-02 09:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5502: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2025-09-01 17:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5501: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747-0043',
    5, 0.75, '2025-08-30 13:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5500: termites (Oro valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro valley', 'AZ', '85737',
    5, 0.75, '2025-08-29 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5498: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '85730',
    5, 0.90, '2025-08-29 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5495: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    4, 0.75, '2025-08-29 11:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5493: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85024',
    5, 0.85, '2025-08-28 22:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5493: crickets (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Phoenix', 'AZ', '85024',
    5, 0.85, '2025-08-28 22:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5489: other_pests (Yountao, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Yountao', 'AZ', '853706',
    5, 0.75, '2025-08-28 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5487: other_pests (BENSALEM, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'BENSALEM', 'AZ', '19020',
    5, 0.75, '2025-08-28 18:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5486: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2025-08-28 17:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5484: ants (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Peoria', 'AZ', '85383',
    4, 0.85, '2025-08-28 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5484: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85383',
    4, 0.85, '2025-08-28 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5478: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85747',
    5, 0.85, '2025-08-27 20:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5478: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.85, '2025-08-27 20:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5477: other_pests (2124, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '2124', 'AZ', '',
    5, 0.75, '2025-08-27 18:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5472: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.85, '2025-08-27 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5472: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.85, '2025-08-27 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5470: ants (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale', 'AZ', '85259',
    4, 0.85, '2025-08-27 12:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5470: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85259',
    4, 0.85, '2025-08-27 12:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5469: rodents (Nogales, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Nogales', 'AZ', '85621',
    5, 0.75, '2025-08-27 10:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5464: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85749',
    5, 0.75, '2025-08-25 20:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5461: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85259',
    5, 0.75, '2025-08-25 19:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5460: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85045',
    5, 0.85, '2025-08-25 18:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5460: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85045',
    5, 0.85, '2025-08-25 18:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5460: spiders (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Phoenix', 'AZ', '85045',
    5, 0.85, '2025-08-25 18:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5455: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85306',
    8, 0.85, '2025-08-25 13:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5455: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85306',
    8, 0.85, '2025-08-25 13:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5454: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    4, 0.75, '2025-08-25 09:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5453: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85641',
    6, 0.85, '2025-08-25 01:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5453: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85641',
    6, 0.85, '2025-08-25 01:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5452: moths (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-08-24 20:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5451: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    4, 0.90, '2025-08-24 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5450: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    5, 0.90, '2025-08-24 12:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5449: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85745',
    5, 0.90, '2025-08-24 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5448: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-08-23 21:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5445: spiders (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Gilbert', 'AZ', '85298',
    6, 0.90, '2025-08-23 10:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5443: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-08-22 23:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5439: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85806',
    5, 0.75, '2025-08-22 11:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5435: other_pests (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Florence', 'AZ', '85132',
    5, 0.75, '2025-08-21 10:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5434: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.75, '2025-08-20 21:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5432: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    5, 0.85, '2025-08-20 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5432: scorpions (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Vail', 'AZ', '85641',
    5, 0.85, '2025-08-20 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5432: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.85, '2025-08-20 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5430: bed_bugs (Jersey City, NJ 07304, NJ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Jersey City, NJ 07304', 'NJ', '07304',
    5, 0.75, '2025-08-20 15:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5419: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.75, '2025-08-18 22:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5418: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85295',
    6, 0.80, '2025-08-18 21:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5416: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2025-08-18 17:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5412: other_pests (Some, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Some', 'AZ', '34628',
    5, 0.75, '2025-08-16 11:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5410: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    7, 0.75, '2025-08-15 23:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5408: other_pests (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'PHOENIX', 'AZ', '85021',
    4, 0.75, '2025-08-15 17:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5403: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    5, 0.75, '2025-08-14 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5398: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '85737',
    5, 0.90, '2025-08-14 15:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5397: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85757',
    5, 0.75, '2025-08-14 14:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5396: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2025-08-14 13:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5393: rodents (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Mesa', 'AZ', '',
    5, 0.75, '2025-08-13 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5392: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85716',
    5, 0.90, '2025-08-13 13:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5385: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85041',
    5, 0.75, '2025-08-12 21:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5379: other_pests (Sells, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sells', 'AZ', '85634',
    4, 0.75, '2025-08-11 15:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5377: roaches (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Ajo', 'AZ', '',
    5, 0.90, '2025-08-11 08:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5376: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '85742',
    5, 0.85, '2025-08-10 20:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5376: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85742',
    5, 0.85, '2025-08-10 20:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5375: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85747',
    5, 0.85, '2025-08-10 13:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5375: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.85, '2025-08-10 13:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5371: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85742',
    4, 0.85, '2025-08-09 12:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5371: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    4, 0.85, '2025-08-09 12:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5369: other_pests (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Buckeye', 'AZ', '85326',
    5, 0.75, '2025-08-08 19:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5368: termites (Cumming, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Cumming', 'AZ', '30040',
    4, 0.75, '2025-08-08 18:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5366: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2025-08-08 16:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5364: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2025-08-08 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5357: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85748',
    5, 0.90, '2025-08-07 15:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5353: centipedes (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', 'Vail', 'AZ', '85641',
    4, 0.90, '2025-08-05 23:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5351: rodents (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Anthem', 'AZ', '85086',
    4, 0.90, '2025-08-05 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5343: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85006',
    5, 0.75, '2025-08-04 16:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5338: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    4, 0.75, '2025-08-03 19:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5337: other_pests (Tucs6, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucs6', 'AZ', '85706',
    5, 0.75, '2025-08-03 15:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5336: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85021',
    9, 0.75, '2025-08-03 13:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5335: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    4, 0.90, '2025-08-02 21:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5333: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85658',
    5, 0.85, '2025-08-02 08:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5333: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.85, '2025-08-02 08:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5332: other_pests (Tonopah, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tonopah', 'AZ', '85354',
    5, 0.75, '2025-08-02 00:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5328: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    6, 0.90, '2025-08-01 11:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5326: ants (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'phoenix', 'AZ', '85008',
    6, 0.85, '2025-07-31 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5326: flies (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'phoenix', 'AZ', '85008',
    6, 0.85, '2025-07-31 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5326: rodents (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'phoenix', 'AZ', '85008',
    6, 0.85, '2025-07-31 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5326: termites (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'phoenix', 'AZ', '85008',
    6, 0.85, '2025-07-31 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5324: mosquitoes (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Phoenix', 'AZ', '85050',
    5, 0.85, '2025-07-31 11:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5324: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85050',
    5, 0.85, '2025-07-31 11:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5323: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2025-07-30 21:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5320: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    4, 0.75, '2025-07-30 14:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5318: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85050',
    6, 0.85, '2025-07-29 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5318: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85050',
    6, 0.85, '2025-07-29 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5318: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85050',
    6, 0.85, '2025-07-29 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5318: spiders (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Phoenix', 'AZ', '85050',
    6, 0.85, '2025-07-29 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5316: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-07-29 15:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5313: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2025-07-29 10:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5308: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '85388',
    5, 0.90, '2025-07-27 18:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5307: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2025-07-26 20:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5306: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.85, '2025-07-26 19:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5306: crickets (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Marana', 'AZ', '85653',
    5, 0.85, '2025-07-26 19:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5306: spiders (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Marana', 'AZ', '85653',
    5, 0.85, '2025-07-26 19:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5303: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2025-07-26 12:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5301: termites (Gdk, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gdk', 'AZ', '',
    5, 0.75, '2025-07-25 22:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5297: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85015',
    6, 0.90, '2025-07-25 18:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5296: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85029',
    5, 0.85, '2025-07-25 17:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5296: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85029',
    5, 0.85, '2025-07-25 17:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5286: bees (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'TUCSON', 'AZ', '85743',
    5, 0.75, '2025-07-24 17:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5285: mosquitoes (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Goodyear', 'AZ', '85338',
    4, 0.90, '2025-07-24 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5283: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85739',
    5, 0.85, '2025-07-22 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5283: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85739',
    5, 0.85, '2025-07-22 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5281: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85737',
    4, 0.75, '2025-07-22 14:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5280: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85255',
    5, 0.75, '2025-07-22 14:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5279: ants (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Florence', 'AZ', '85132',
    5, 0.85, '2025-07-22 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5279: roaches (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Florence', 'AZ', '85132',
    5, 0.85, '2025-07-22 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5279: scorpions (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Florence', 'AZ', '85132',
    5, 0.85, '2025-07-22 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5279: spiders (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Florence', 'AZ', '85132',
    5, 0.85, '2025-07-22 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5277: mosquitoes (Queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Queen creek', 'AZ', '85142',
    5, 0.75, '2025-07-21 22:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5275: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85212',
    5, 0.75, '2025-07-20 21:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5274: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2025-07-20 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5273: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '85383',
    5, 0.75, '2025-07-19 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5272: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '85207',
    5, 0.90, '2025-07-19 11:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5271: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85029',
    5, 0.75, '2025-07-17 18:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5270: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '92010',
    4, 0.75, '2025-07-17 15:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5269: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    4, 0.75, '2025-07-17 14:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5262: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85641',
    4, 0.85, '2025-07-16 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5262: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85641',
    4, 0.85, '2025-07-16 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5260: other_pests (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Ajo', 'AZ', '85321',
    5, 0.75, '2025-07-16 01:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5259: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85085',
    5, 0.90, '2025-07-15 15:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5258: scorpions (Puerto Chelem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Puerto Chelem', 'AZ', '97336',
    5, 0.75, '2025-07-15 13:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5257: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85306',
    5, 0.85, '2025-07-15 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5257: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85306',
    5, 0.85, '2025-07-15 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5252: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    5, 0.90, '2025-07-14 01:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5251: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    4, 0.75, '2025-07-13 17:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5250: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85739',
    5, 0.75, '2025-07-13 11:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5249: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85742',
    5, 0.75, '2025-07-12 23:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5245: ants (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gilbert', 'AZ', '85297',
    4, 0.75, '2025-07-11 17:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5242: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-07-10 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5232: other_pests (Payson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Payson', 'AZ', '85541',
    5, 0.75, '2025-07-07 16:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5229: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85020',
    8, 0.90, '2025-07-07 09:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5228: bees (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'TUCSON', 'AZ', '85749',
    5, 0.90, '2025-07-07 02:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5227: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2025-07-06 18:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5226: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85050',
    5, 0.75, '2025-07-06 17:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5225: termites (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Buckeye', 'AZ', '85326',
    5, 0.75, '2025-07-05 20:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5223: ants (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'San Tan Valley', 'AZ', '85144',
    5, 0.85, '2025-07-05 15:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5223: spiders (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'San Tan Valley', 'AZ', '85144',
    5, 0.85, '2025-07-05 15:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5223: termites (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Tan Valley', 'AZ', '85144',
    5, 0.85, '2025-07-05 15:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5221: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85755',
    4, 0.90, '2025-07-05 06:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5216: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85041',
    5, 0.75, '2025-07-04 11:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5215: ants (The hague, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'The hague', 'AZ', '',
    5, 0.85, '2025-07-04 06:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5215: rodents (The hague, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'The hague', 'AZ', '',
    5, 0.85, '2025-07-04 06:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5213: ants (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Maricopa', 'AZ', '85139',
    8, 0.85, '2025-07-03 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5213: flies (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Maricopa', 'AZ', '85139',
    8, 0.85, '2025-07-03 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5213: termites (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Maricopa', 'AZ', '85139',
    8, 0.85, '2025-07-03 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5210: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    4, 0.75, '2025-07-03 19:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5208: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.90, '2025-07-03 14:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5207: rodents (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Green Valley', 'AZ', '85614',
    5, 0.75, '2025-07-03 12:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5206: other_pests (CA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'CA', 'AZ', '10001',
    4, 0.90, '2025-07-03 04:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5205: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2025-07-02 22:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5203: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85086',
    4, 0.75, '2025-07-01 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5201: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85757',
    8, 0.90, '2025-07-01 09:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5200: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85756',
    5, 0.85, '2025-07-01 06:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5200: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85756',
    5, 0.85, '2025-07-01 06:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5199: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85718',
    6, 0.80, '2025-06-30 16:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5198: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85254',
    4, 0.90, '2025-06-30 15:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5197: bees (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Willcox', 'AZ', '85643',
    5, 0.75, '2025-06-30 14:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5192: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    5, 0.75, '2025-06-28 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5190: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85719',
    4, 0.90, '2025-06-28 12:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5184: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2025-06-26 20:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5178: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    5, 0.75, '2025-06-25 16:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5177: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-06-25 15:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5173: other_pests (Sun city, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sun city', 'AZ', '85351',
    5, 0.75, '2025-06-24 03:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5172: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2025-06-23 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5170: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-06-23 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5168: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-06-22 22:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5167: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.75, '2025-06-21 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5164: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742-0080',
    5, 0.75, '2025-06-20 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5160: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-20 03:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5160: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-20 03:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5160: rodents (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-20 03:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5157: termites (Gold Canyon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gold Canyon', 'AZ', '85118',
    5, 0.75, '2025-06-19 14:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5154: other_pests (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tolleson', 'AZ', '85353',
    5, 0.75, '2025-06-19 07:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5150: mosquitoes (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2025-06-18 10:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5148: rodents (jasper, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'jasper', 'AZ', '30143',
    5, 0.90, '2025-06-16 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5147: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    5, 0.75, '2025-06-16 10:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5145: other_pests (San Francisco, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Francisco', 'AZ', '94102',
    5, 0.75, '2025-06-15 20:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5143: other_pests (San Francisco, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Francisco', 'AZ', '94102',
    5, 0.75, '2025-06-15 20:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5141: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85204',
    5, 0.75, '2025-06-15 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5139: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85719',
    6, 0.90, '2025-06-13 16:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5138: termites (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Willcox', 'AZ', '85643',
    9, 0.75, '2025-06-13 11:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5134: other_pests (Sun City West, Arizona 85375, AR)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sun City West, Arizona 85375', 'AR', '85375',
    5, 0.75, '2025-06-12 14:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5133: other_pests (QUEEN CREEK, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'QUEEN CREEK', 'AZ', '85144',
    5, 0.75, '2025-06-12 11:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5131: termites (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Willcox', 'AZ', '85643',
    4, 0.75, '2025-06-11 17:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5129: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2025-06-10 11:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5128: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85748',
    6, 0.90, '2025-06-09 21:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5127: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2025-06-09 14:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5125: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2025-06-09 09:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5123: other_pests (New River, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'New River', 'AZ', '85087',
    5, 0.75, '2025-06-07 20:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5122: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2025-06-07 01:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5118: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2025-06-06 01:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5115: ants (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Avondale', 'AZ', '85323',
    4, 0.85, '2025-06-04 23:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5115: termites (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Avondale', 'AZ', '85323',
    4, 0.85, '2025-06-04 23:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5111: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5111: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5111: rodents (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5110: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5110: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5110: rodents (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5109: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5109: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5109: rodents (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'California', 'AZ', '92618',
    5, 0.85, '2025-06-04 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5108: rodents (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Mesa', 'AZ', '85209',
    5, 0.75, '2025-06-03 15:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5105: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    4, 0.75, '2025-06-03 13:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5104: other_pests (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las Vegas', 'AZ', '89044',
    5, 0.75, '2025-06-03 13:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5101: ants (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Las Vegas', 'AZ', '89044',
    5, 0.85, '2025-06-03 10:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5101: rodents (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Las Vegas', 'AZ', '89044',
    5, 0.85, '2025-06-03 10:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5100: other_pests (Waddell, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Waddell', 'AZ', '85355',
    5, 0.75, '2025-06-03 09:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5099: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2025-06-03 07:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5098: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    5, 0.75, '2025-06-03 00:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5095: other_pests (San tan valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San tan valley', 'AZ', '85150',
    4, 0.90, '2025-06-01 12:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5093: ants (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Goodyear', 'AZ', '85395',
    4, 0.85, '2025-05-31 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5093: wildlife (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Goodyear', 'AZ', '85395',
    4, 0.85, '2025-05-31 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5092: moths (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Tucson', 'AZ', '85749',
    6, 0.85, '2025-05-30 21:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5092: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85749',
    6, 0.85, '2025-05-30 21:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5089: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85743',
    5, 0.90, '2025-05-29 16:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5087: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2025-05-29 00:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5086: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85044',
    5, 0.75, '2025-05-28 18:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5085: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '85741',
    4, 0.75, '2025-05-28 18:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5083: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '85224',
    4, 0.90, '2025-05-28 18:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5081: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.90, '2025-05-28 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5079: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85086',
    5, 0.75, '2025-05-28 12:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5076: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-05-28 02:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5075: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2025-05-28 00:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5074: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '85755',
    5, 0.85, '2025-05-27 23:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5074: beetles (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Oro Valley', 'AZ', '85755',
    5, 0.85, '2025-05-27 23:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5073: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-05-27 23:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5070: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85295',
    5, 0.75, '2025-05-27 20:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5068: rodents (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'AZ', '85742',
    6, 0.80, '2025-05-27 01:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5067: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.90, '2025-05-26 23:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5065: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85716',
    5, 0.90, '2025-05-24 07:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5064: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-05-23 14:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5063: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85705',
    8, 0.85, '2025-05-23 14:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 5063: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    8, 0.85, '2025-05-23 14:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5062: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85029',
    6, 0.90, '2025-05-23 13:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5060: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2025-05-22 15:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5054: other_pests (Wittmann, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Wittmann', 'AZ', '85361',
    4, 0.75, '2025-05-20 19:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5052: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.75, '2025-05-19 16:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5049: scorpions (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2025-05-18 17:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5048: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85701',
    8, 0.90, '2025-05-18 11:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5047: bees (Bowie, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Bowie', 'AZ', '85605',
    5, 0.75, '2025-05-17 21:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5046: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2025-05-16 14:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5037: other_pests (San Simon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Simon', 'AZ', '85632',
    5, 0.75, '2025-05-13 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5036: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.75, '2025-05-12 22:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5035: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '85602',
    5, 0.75, '2025-05-12 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5034: termites (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Ajo', 'AZ', '85321',
    4, 0.90, '2025-05-12 15:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5031: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2025-05-12 13:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5030: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2025-05-12 12:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5029: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2025-05-12 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5028: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    5, 0.90, '2025-05-12 10:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5027: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2025-05-11 15:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5026: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2025-05-11 01:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5019: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    5, 0.75, '2025-05-09 12:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5017: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-05-08 20:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5016: spiders (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'TUCSON', 'AZ', '85719',
    6, 0.80, '2025-05-08 17:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5015: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2025-05-08 13:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5014: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85737',
    5, 0.75, '2025-05-08 12:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5013: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85730',
    5, 0.75, '2025-05-07 21:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5012: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85737',
    5, 0.90, '2025-05-07 19:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5011: bed_bugs (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Gilbert', 'AZ', '85296',
    5, 0.75, '2025-05-07 15:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5010: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2025-05-07 14:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5009: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85716',
    5, 0.90, '2025-05-07 13:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5007: bees (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Cave Creek', 'AZ', '85331-5465',
    6, 0.80, '2025-05-07 10:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5006: ants (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale', 'AZ', '85254',
    4, 0.90, '2025-05-06 19:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5005: bees (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Scottsdale', 'AZ', '85262',
    6, 0.90, '2025-05-06 19:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5003: other_pests (Sun City West, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sun City West', 'AZ', '85375',
    5, 0.75, '2025-05-06 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5002: bed_bugs (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mesa', 'AZ', '85208',
    5, 0.75, '2025-05-06 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5001: ticks (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Phoenix', 'AZ', '85020',
    5, 0.90, '2025-05-06 11:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 5000: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85387',
    5, 0.75, '2025-05-05 22:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4996: other_pests (Sagle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sagle', 'AZ', '83201',
    5, 0.75, '2025-05-05 12:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4995: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2025-05-04 22:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4994: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85730',
    5, 0.75, '2025-05-04 17:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4992: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85702',
    5, 0.75, '2025-05-03 23:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4991: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    4, 0.75, '2025-05-03 15:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4988: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2025-05-03 13:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4987: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85743',
    5, 0.75, '2025-05-02 15:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4985: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    4, 0.90, '2025-05-01 19:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4983: other_pests (Collinsville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Collinsville', 'AZ', '62234',
    5, 0.75, '2025-05-01 12:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4982: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    5, 0.75, '2025-05-01 12:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4981: other_pests (Waddell, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Waddell', 'AZ', '85355',
    5, 0.90, '2025-05-01 00:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4980: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85338',
    4, 0.75, '2025-04-30 16:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4979: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    5, 0.90, '2025-04-30 12:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4978: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-04-30 12:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4977: rodents (Surpise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Surpise', 'AZ', '85388',
    5, 0.90, '2025-04-29 20:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4974: other_pests (Apache Junction, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Apache Junction', 'AZ', '85120',
    5, 0.75, '2025-04-29 14:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4972: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.75, '2025-04-28 13:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4971: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85756',
    5, 0.85, '2025-04-28 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4971: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85756',
    5, 0.85, '2025-04-28 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4970: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85745',
    5, 0.75, '2025-04-28 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4969: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2025-04-27 23:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4968: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2025-04-27 21:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4967: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    4, 0.75, '2025-04-27 21:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4965: termites (Palm Springs, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Palm Springs', 'AZ', '90001',
    5, 0.75, '2025-04-27 13:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4966: termites (Palm Springs, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Palm Springs', 'AZ', '90001',
    5, 0.75, '2025-04-27 13:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4964: termites (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Buckeye', 'AZ', '85396',
    5, 0.75, '2025-04-26 23:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4963: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85298',
    5, 0.75, '2025-04-26 23:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4962: rodents (Apache Junction, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Apache Junction', 'AZ', '85120',
    5, 0.90, '2025-04-26 20:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4961: other_pests (MIAMI, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MIAMI', 'AZ', '33299',
    5, 0.75, '2025-04-26 17:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4959: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85716',
    8, 0.90, '2025-04-26 16:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4958: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2025-04-26 00:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4954: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2025-04-25 13:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4952: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85024',
    4, 0.85, '2025-04-24 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4952: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85024',
    4, 0.85, '2025-04-24 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4951: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    6, 0.90, '2025-04-24 16:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4950: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85705',
    4, 0.85, '2025-04-24 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4950: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    4, 0.85, '2025-04-24 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4949: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85042',
    9, 0.90, '2025-04-23 23:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4947: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85658',
    5, 0.90, '2025-04-23 13:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4946: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2025-04-23 11:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4945: bees (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Gilbert', 'AZ', '85233',
    5, 0.85, '2025-04-23 10:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4945: roaches (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Gilbert', 'AZ', '85233',
    5, 0.85, '2025-04-23 10:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4945: scorpions (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Gilbert', 'AZ', '85233',
    5, 0.85, '2025-04-23 10:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4944: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85747',
    5, 0.75, '2025-04-22 18:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4943: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85298',
    4, 0.75, '2025-04-22 16:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4941: other_pests (Oracle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oracle', 'AZ', '85623',
    5, 0.75, '2025-04-21 23:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4940: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747-0101',
    5, 0.75, '2025-04-21 22:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4939: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '85749',
    4, 0.90, '2025-04-21 20:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4938: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85037',
    5, 0.90, '2025-04-21 18:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4937: other_pests (Henderson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Henderson', 'AZ', '89011',
    4, 0.75, '2025-04-21 13:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4935: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85383',
    5, 0.75, '2025-04-21 11:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4934: ants (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Avondale', 'AZ', '85392',
    4, 0.85, '2025-04-20 17:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4934: termites (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Avondale', 'AZ', '85392',
    4, 0.85, '2025-04-20 17:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4933: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.90, '2025-04-20 14:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4932: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    4, 0.75, '2025-04-19 18:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4930: fleas (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Tucson', 'AZ', '85743',
    5, 0.85, '2025-04-18 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4930: ticks (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Tucson', 'AZ', '85743',
    5, 0.85, '2025-04-18 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4928: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85745',
    5, 0.75, '2025-04-18 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4927: rodents (Marna, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marna', 'AZ', '85755',
    6, 0.80, '2025-04-18 01:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4925: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85037',
    5, 0.75, '2025-04-17 19:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4924: bed_bugs (Smithfield, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Smithfield', 'CO', '81324',
    5, 0.75, '2025-04-17 14:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4923: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2025-04-17 14:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4922: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85234',
    5, 0.75, '2025-04-16 19:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4921: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '85374',
    4, 0.75, '2025-04-16 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4917: other_pests (Coolidge, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Coolidge', 'AZ', '85128',
    5, 0.75, '2025-04-15 14:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4916: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85701',
    5, 0.75, '2025-04-15 13:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4914: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.75, '2025-04-14 22:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4913: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85735',
    5, 0.75, '2025-04-14 16:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4910: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85757',
    9, 0.75, '2025-04-14 14:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4909: bed_bugs (Farmersburg, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Farmersburg', 'AZ', '52047',
    5, 0.75, '2025-04-14 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4908: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.85, '2025-04-13 21:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4908: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85743',
    5, 0.85, '2025-04-13 21:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4906: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85296',
    5, 0.75, '2025-04-13 19:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4905: other_pests (Englishtown, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Englishtown', 'AZ', '07726',
    5, 0.75, '2025-04-13 17:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4904: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2025-04-13 12:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4903: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    5, 0.90, '2025-04-13 10:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4902: bed_bugs (El Mirage, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'El Mirage', 'AZ', '85335',
    7, 0.85, '2025-04-12 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4902: moths (El Mirage, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'El Mirage', 'AZ', '85335',
    7, 0.85, '2025-04-12 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4901: other_pests (Silver Spring, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Silver Spring', 'AZ', '19973',
    4, 0.75, '2025-04-12 17:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4900: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85302',
    5, 0.75, '2025-04-12 15:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4898: ants (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'San Tan Valley', 'AZ', '85144-0047',
    5, 0.85, '2025-04-11 21:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4898: termites (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Tan Valley', 'AZ', '85144-0047',
    5, 0.85, '2025-04-11 21:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4897: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85701',
    4, 0.85, '2025-04-11 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4897: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85701',
    4, 0.85, '2025-04-11 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4896: rodents (Parks, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Parks', 'AZ', '86018',
    5, 0.75, '2025-04-11 13:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4894: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85024',
    5, 0.90, '2025-04-11 10:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4893: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85743',
    5, 0.90, '2025-04-11 09:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4892: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    9, 0.75, '2025-04-10 18:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4891: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85710',
    4, 0.75, '2025-04-10 18:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4889: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.90, '2025-04-10 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4888: other_pests (Sedona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sedona', 'AZ', '86336',
    5, 0.75, '2025-04-10 13:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4887: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85017',
    5, 0.75, '2025-04-09 19:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4886: other_pests (Wittmann, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Wittmann', 'AZ', '85361',
    5, 0.75, '2025-04-09 17:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4883: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85143',
    5, 0.75, '2025-04-09 12:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4879: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85750',
    5, 0.85, '2025-04-08 15:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4879: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    5, 0.85, '2025-04-08 15:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4876: scorpions (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Marana', 'AZ', '85743',
    5, 0.75, '2025-04-08 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4875: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2025-04-08 12:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4873: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653',
    4, 0.75, '2025-04-08 01:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4872: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2025-04-07 19:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4871: rodents (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Anthem', 'AZ', '85086',
    5, 0.90, '2025-04-07 18:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4870: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85713',
    5, 0.75, '2025-04-07 16:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4869: ants (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'San Tan Valley', 'AZ', '85140',
    4, 0.90, '2025-04-07 16:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4867: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85753',
    4, 0.85, '2025-04-07 12:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4867: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85753',
    4, 0.85, '2025-04-07 12:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4864: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85730',
    5, 0.75, '2025-04-06 19:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4863: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85037',
    5, 0.75, '2025-04-06 10:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4862: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2025-04-05 20:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4860: rodents (WITTMANN, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'WITTMANN', 'AZ', '85361',
    4, 0.75, '2025-04-05 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4856: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-04-05 10:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4853: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    4, 0.75, '2025-04-03 23:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4851: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85701',
    5, 0.75, '2025-04-02 23:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4850: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85282',
    5, 0.75, '2025-04-02 19:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4849: bed_bugs (DURHAM, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'DURHAM', 'AZ', '27713',
    5, 0.75, '2025-04-02 18:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4848: crickets (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Marana', 'AZ', '85653',
    4, 0.85, '2025-04-02 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4848: spiders (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Marana', 'AZ', '85653',
    4, 0.85, '2025-04-02 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4847: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2025-04-02 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4844: rodents (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Oro Valley', 'AZ', '85742',
    5, 0.75, '2025-04-01 16:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4843: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85714',
    5, 0.75, '2025-04-01 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4839: other_pests (Voorhees, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Voorhees', 'CO', '8043',
    5, 0.75, '2025-04-01 12:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4835: termites (New River, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'New River', 'AZ', '85087',
    5, 0.75, '2025-03-31 15:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4834: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.90, '2025-03-31 13:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4833: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2025-03-31 11:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4832: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    4, 0.75, '2025-03-30 21:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4830: other_pests (Westminster, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Westminster', 'AZ', '21157',
    5, 0.75, '2025-03-29 17:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4828: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85745',
    5, 0.90, '2025-03-28 18:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4826: termites (Waddell, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Waddell', 'AZ', '85355',
    4, 0.90, '2025-03-27 20:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4822: termites (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Anthem', 'AZ', '85086',
    5, 0.75, '2025-03-26 09:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4821: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.75, '2025-03-26 09:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4819: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    7, 0.75, '2025-03-25 14:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4818: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2025-03-25 13:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4817: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2025-03-25 13:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4816: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2025-03-25 01:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4815: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85286',
    5, 0.75, '2025-03-25 01:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4811: other_pests (Herndon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Herndon', 'AZ', '20105',
    5, 0.75, '2025-03-23 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4810: termites (Marana AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana AZ', 'AZ', '85658',
    5, 0.75, '2025-03-23 12:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4809: roaches (Roosevelt, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Roosevelt', 'AZ', '85545',
    8, 0.90, '2025-03-23 08:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4808: other_pests (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Florence', 'AZ', '85132',
    5, 0.75, '2025-03-22 22:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4807: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2025-03-22 11:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4807: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2025-03-22 11:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4806: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85037',
    5, 0.75, '2025-03-21 20:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4800: bed_bugs (Stone Mountain, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Stone Mountain', 'AZ', '30002',
    5, 0.75, '2025-03-21 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4799: other_pests (SAN TAN VALLEY, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'SAN TAN VALLEY', 'AZ', '85143',
    5, 0.90, '2025-03-20 15:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4798: bed_bugs (942 Weaver St #31, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '942 Weaver St #31', 'AZ', '78370',
    5, 0.75, '2025-03-19 18:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4797: other_pests (Casa grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Casa grande', 'AZ', '85122',
    5, 0.75, '2025-03-19 13:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4796: other_pests (Tomball, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tomball', 'AZ', '77375',
    5, 0.75, '2025-03-18 12:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4794: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-03-17 11:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4793: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85711',
    5, 0.75, '2025-03-15 15:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4792: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85746',
    5, 0.75, '2025-03-15 13:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4791: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85746',
    5, 0.75, '2025-03-15 13:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4789: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '85715',
    5, 0.85, '2025-03-14 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4789: bed_bugs (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'TUCSON', 'AZ', '85715',
    5, 0.85, '2025-03-14 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4787: other_pests (Great Falls, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Great Falls', 'AZ', '59401',
    5, 0.75, '2025-03-14 13:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4788: other_pests (Great Falls, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Great Falls', 'AZ', '59401',
    5, 0.75, '2025-03-14 13:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4785: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2025-03-13 15:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4783: bed_bugs (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Peoria', 'AZ', '85345',
    5, 0.75, '2025-03-13 11:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4782: termites (SAN DIEGO, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'SAN DIEGO', 'AZ', '92037',
    5, 0.75, '2025-03-12 21:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4781: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2025-03-12 21:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4776: other_pests (Roopville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Roopville', 'AZ', '30002',
    5, 0.75, '2025-03-12 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4775: bed_bugs (Saint Louis, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Saint Louis', 'AZ', '51640',
    5, 0.75, '2025-03-11 21:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4772: bed_bugs (Wauconda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Wauconda', 'AZ', '60002',
    5, 0.75, '2025-03-11 06:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4771: bed_bugs (Wauconda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Wauconda', 'AZ', '60002',
    5, 0.75, '2025-03-11 06:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4770: bed_bugs (Wauconda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Wauconda', 'AZ', '60002',
    5, 0.75, '2025-03-11 06:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4769: bed_bugs (Wauconda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Wauconda', 'AZ', '60002',
    5, 0.75, '2025-03-11 06:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4768: other_pests (Port Saint Lucie, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Port Saint Lucie', 'AZ', '32003',
    5, 0.75, '2025-03-10 23:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4765: other_pests (Saddlebrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Saddlebrooke', 'AZ', '85739',
    5, 0.75, '2025-03-10 14:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4763: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    5, 0.75, '2025-03-08 05:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4760: other_pests (RedRock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'RedRock', 'AZ', '85145',
    5, 0.75, '2025-03-07 03:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4758: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85310',
    5, 0.90, '2025-03-06 15:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4756: termites (Dresden, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Dresden', 'AZ', '1224',
    4, 0.75, '2025-03-06 11:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4755: bed_bugs (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Chandler', 'AZ', '85225',
    5, 0.75, '2025-03-06 02:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4754: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85706',
    5, 0.75, '2025-03-05 22:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4753: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85748',
    5, 0.75, '2025-03-05 22:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4751: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85015',
    5, 0.75, '2025-03-05 17:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4750: other_pests (Olympia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Olympia', 'AZ', '98502',
    5, 0.75, '2025-03-05 02:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4749: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85053',
    5, 0.90, '2025-03-04 23:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4748: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2025-03-04 23:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4747: termites (Nouakchott Mauritanie, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Nouakchott Mauritanie', 'AZ', '00377',
    5, 0.75, '2025-03-04 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4745: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85756',
    5, 0.90, '2025-03-04 18:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4743: bed_bugs (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Peoria', 'AZ', '85345',
    5, 0.75, '2025-03-04 04:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4742: bed_bugs (Fredericksburg, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Fredericksburg', 'AZ', '78624',
    5, 0.75, '2025-03-04 02:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4741: bed_bugs (WEST PALM BCH, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'WEST PALM BCH', 'AZ', '32003',
    5, 0.75, '2025-03-04 01:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4735: bed_bugs (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'TUCSON', 'AZ', '85739-1868',
    5, 0.90, '2025-03-03 18:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4732: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85730',
    5, 0.75, '2025-03-02 21:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4731: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2025-03-02 20:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4730: ants (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Casa Grande', 'AZ', '85122-2122',
    5, 0.75, '2025-03-01 18:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4729: ants (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Benson', 'AZ', '85602',
    5, 0.75, '2025-03-01 18:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4726: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85712',
    5, 0.85, '2025-02-28 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4726: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '85712',
    5, 0.85, '2025-02-28 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4725: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85739',
    5, 0.85, '2025-02-28 16:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4725: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85739',
    5, 0.85, '2025-02-28 16:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4720: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2025-02-26 18:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4719: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.75, '2025-02-26 13:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4718: ants (oro valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'oro valley', 'AZ', '85704',
    5, 0.85, '2025-02-25 15:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4718: termites (oro valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'oro valley', 'AZ', '85704',
    5, 0.85, '2025-02-25 15:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4717: scorpions (SURPRISE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'SURPRISE', 'AZ', '85388',
    6, 0.85, '2025-02-25 15:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4717: termites (SURPRISE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'SURPRISE', 'AZ', '85388',
    6, 0.85, '2025-02-25 15:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4716: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85658',
    6, 0.90, '2025-02-24 12:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4715: termites (Tucaon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucaon', 'AZ', '85750',
    5, 0.85, '2025-02-24 12:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4715: wasps (Tucaon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucaon', 'AZ', '85750',
    5, 0.85, '2025-02-24 12:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4713: rodents (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Glendale', 'AZ', '85306',
    5, 0.75, '2025-02-23 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4712: ants (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2025-02-22 10:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4712: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2025-02-22 10:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4711: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.90, '2025-02-21 21:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4706: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2025-02-21 13:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4704: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    4, 0.75, '2025-02-21 09:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4703: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85032',
    5, 0.75, '2025-02-20 20:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4699: other_pests (Chino, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chino', 'AZ', '91708',
    5, 0.75, '2025-02-19 02:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4698: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-02-18 22:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4697: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    5, 0.75, '2025-02-18 17:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4696: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85255',
    4, 0.90, '2025-02-18 17:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4693: termites (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Red Rock', 'AZ', '85145',
    5, 0.90, '2025-02-18 11:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4692: other_pests (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Ajo', 'AZ', '85321',
    5, 0.90, '2025-02-18 09:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4691: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85338',
    4, 0.75, '2025-02-18 08:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4689: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '85718',
    5, 0.75, '2025-02-17 19:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4686: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.90, '2025-02-17 13:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4683: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85032',
    5, 0.75, '2025-02-17 06:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4682: bed_bugs (AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'AZ', 'AZ', '85718',
    5, 0.75, '2025-02-17 03:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4681: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2025-02-16 23:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4680: bed_bugs (Maple Shade Township, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Maple Shade Township', 'AZ', '07001',
    5, 0.75, '2025-02-16 20:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4679: other_pests (Niceville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Niceville', 'AZ', '32578',
    5, 0.75, '2025-02-16 19:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4675: termites (PENSACOLA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'PENSACOLA', 'AZ', '',
    5, 0.75, '2025-02-16 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4676: termites (PENSACOLA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'PENSACOLA', 'AZ', '',
    5, 0.75, '2025-02-16 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4673: bed_bugs (pheonix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'pheonix', 'AZ', '85044',
    5, 0.75, '2025-02-16 03:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4669: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    4, 0.75, '2025-02-14 15:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4666: termites (Madison, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Madison', 'AZ', '85742',
    5, 0.75, '2025-02-13 13:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4665: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85658',
    5, 0.75, '2025-02-13 09:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4664: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85706',
    5, 0.75, '2025-02-13 00:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4661: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85716',
    8, 0.90, '2025-02-12 16:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4659: ants (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Buckeye', 'AZ', '85326',
    4, 0.85, '2025-02-12 13:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4659: termites (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Buckeye', 'AZ', '85326',
    4, 0.85, '2025-02-12 13:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4656: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85248',
    4, 0.75, '2025-02-12 10:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4655: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85213',
    5, 0.75, '2025-02-11 19:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4654: termites (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Buckeye', 'AZ', '85326',
    5, 0.90, '2025-02-11 13:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4652: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-02-11 11:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4650: bees (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2025-02-11 08:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4650: rodents (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2025-02-11 08:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4649: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85305',
    5, 0.75, '2025-02-11 00:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4647: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    5, 0.75, '2025-02-10 16:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4646: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2025-02-10 15:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4642: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-02-08 17:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4641: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85739',
    5, 0.75, '2025-02-08 16:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4639: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85051',
    5, 0.75, '2025-02-08 13:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4638: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85711',
    5, 0.85, '2025-02-07 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4638: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85711',
    5, 0.85, '2025-02-07 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4638: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85711',
    5, 0.85, '2025-02-07 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4637: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85735',
    8, 0.90, '2025-02-07 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4636: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85305',
    5, 0.75, '2025-02-07 12:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4635: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    5, 0.90, '2025-02-07 10:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4634: bees (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Mesa', 'AZ', '85209-4368',
    5, 0.85, '2025-02-06 22:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4634: roaches (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Mesa', 'AZ', '85209-4368',
    5, 0.85, '2025-02-06 22:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4634: scorpions (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Mesa', 'AZ', '85209-4368',
    5, 0.85, '2025-02-06 22:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4633: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.90, '2025-02-06 22:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4632: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2025-02-06 21:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4630: other_pests (Oro valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro valley', 'AZ', '85755',
    4, 0.75, '2025-02-06 18:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4628: ants (Hamilton, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Hamilton', 'AZ', '',
    5, 0.85, '2025-02-06 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4628: roaches (Hamilton, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Hamilton', 'AZ', '',
    5, 0.85, '2025-02-06 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4627: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    4, 0.75, '2025-02-06 11:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4623: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-02-05 12:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4622: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-02-04 22:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4621: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.75, '2025-02-04 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4619: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.90, '2025-02-03 17:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4618: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85749',
    4, 0.75, '2025-02-03 16:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4617: termites (FLORENCE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'FLORENCE', 'AZ', '85132',
    5, 0.75, '2025-02-03 14:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4616: ants (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Chandler', 'AZ', '85248',
    4, 0.85, '2025-02-03 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4616: mosquitoes (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Chandler', 'AZ', '85248',
    4, 0.85, '2025-02-03 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4616: scorpions (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Chandler', 'AZ', '85248',
    4, 0.85, '2025-02-03 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4616: spiders (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Chandler', 'AZ', '85248',
    4, 0.85, '2025-02-03 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4614: other_pests (Accra, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Accra', 'AZ', '',
    5, 0.75, '2025-02-03 08:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4613: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85713',
    5, 0.85, '2025-02-03 00:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4613: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85713',
    5, 0.85, '2025-02-03 00:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4612: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85750',
    5, 0.85, '2025-02-02 03:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4612: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85750',
    5, 0.85, '2025-02-02 03:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4611: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85748',
    5, 0.75, '2025-02-01 19:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4610: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653',
    5, 0.90, '2025-02-01 09:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4609: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2025-01-31 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4607: rodents (Petersburg, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Petersburg', 'AZ', '33702',
    6, 0.75, '2025-01-31 09:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4606: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85756',
    5, 0.75, '2025-01-30 13:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4605: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.75, '2025-01-30 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4602: ants (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4602: rodents (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4602: spiders (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4602: termites (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4603: ants (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4603: rodents (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4603: spiders (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4603: termites (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Benson', 'AZ', '85602',
    5, 0.85, '2025-01-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4601: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '857045311',
    5, 0.75, '2025-01-28 15:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4600: ants (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ajo', 'AZ', '85321',
    5, 0.85, '2025-01-28 14:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4600: bed_bugs (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Ajo', 'AZ', '85321',
    5, 0.85, '2025-01-28 14:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4599: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.75, '2025-01-28 12:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4596: termites (Tucson,, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson,', 'AZ', '85706',
    5, 0.75, '2025-01-27 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4595: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85706',
    5, 0.75, '2025-01-27 11:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4594: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85756',
    5, 0.90, '2025-01-25 23:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4593: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85741',
    4, 0.85, '2025-01-25 22:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4593: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    4, 0.85, '2025-01-25 22:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4592: termites (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'phoenix', 'AZ', '85008',
    4, 0.75, '2025-01-25 17:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4591: termites (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Maricopa', 'AZ', '85138',
    4, 0.75, '2025-01-25 15:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4590: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85737',
    5, 0.75, '2025-01-25 12:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4589: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85756',
    5, 0.75, '2025-01-25 11:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4587: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85739',
    5, 0.90, '2025-01-24 13:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4586: rodents (scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'scottsdale', 'AZ', '85257',
    5, 0.90, '2025-01-24 10:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4585: other_pests (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Green Valley', 'AZ', '85614',
    5, 0.75, '2025-01-23 19:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4584: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.75, '2025-01-23 13:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4583: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.90, '2025-01-22 18:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4582: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85056',
    4, 0.75, '2025-01-21 21:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4581: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85297',
    4, 0.75, '2025-01-21 11:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4580: rodents (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Gilbert', 'AZ', '85297',
    5, 0.75, '2025-01-21 00:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4579: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85730',
    5, 0.75, '2025-01-20 00:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4576: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.90, '2025-01-19 00:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4575: other_pests (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Cave Creek', 'AZ', '85331',
    5, 0.75, '2025-01-17 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4573: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85730',
    5, 0.85, '2025-01-16 23:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4573: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85730',
    5, 0.85, '2025-01-16 23:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4566: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85739',
    5, 0.85, '2025-01-15 15:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4566: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '85739',
    5, 0.85, '2025-01-15 15:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4565: flies (laveen village, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'laveen village', 'AZ', '85339',
    4, 0.85, '2025-01-15 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4565: termites (laveen village, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'laveen village', 'AZ', '85339',
    4, 0.85, '2025-01-15 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4564: other_pests (Oro valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro valley', 'AZ', '85737',
    5, 0.75, '2025-01-15 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4563: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    4, 0.75, '2025-01-14 17:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4562: other_pests (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'phoenix', 'AZ', '85345',
    5, 0.75, '2025-01-14 11:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4561: other_pests (Mammoth, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mammoth', 'AZ', '85618',
    5, 0.75, '2025-01-14 10:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4560: rodents (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2025-01-14 05:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4558: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85140',
    6, 0.80, '2025-01-13 19:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4555: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85730',
    4, 0.75, '2025-01-11 04:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4554: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    4, 0.90, '2025-01-11 00:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4553: ants (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Litchfield Park', 'AZ', '85340',
    5, 0.85, '2025-01-10 13:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4553: termites (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Litchfield Park', 'AZ', '85340',
    5, 0.85, '2025-01-10 13:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4552: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85742',
    5, 0.75, '2025-01-10 03:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4551: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.90, '2025-01-09 15:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4549: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85144',
    4, 0.75, '2025-01-08 16:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4548: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '',
    5, 0.75, '2025-01-08 05:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4547: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.90, '2025-01-04 21:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4546: roaches (Coolidge, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Coolidge', 'AZ', '85128',
    5, 0.85, '2025-01-04 19:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4546: rodents (Coolidge, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Coolidge', 'AZ', '85128',
    5, 0.85, '2025-01-04 19:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4542: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85718',
    5, 0.85, '2025-01-02 18:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4542: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85718',
    5, 0.85, '2025-01-02 18:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4541: termites (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Ajo', 'AZ', '85321',
    4, 0.75, '2025-01-02 17:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4540: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    4, 0.85, '2025-01-01 10:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4540: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.85, '2025-01-01 10:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4539: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85705',
    8, 0.90, '2024-12-31 02:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4538: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85304',
    4, 0.75, '2024-12-30 22:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4537: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    4, 0.85, '2024-12-30 17:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4537: ticks (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Tucson', 'AZ', '85747',
    4, 0.85, '2024-12-30 17:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4536: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-12-29 20:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4534: rodents (Sun City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Sun City', 'AZ', '85351',
    5, 0.90, '2024-12-28 09:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4533: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '',
    5, 0.75, '2024-12-28 00:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4532: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85304',
    5, 0.75, '2024-12-27 17:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4530: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-12-26 17:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4529: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2024-12-26 10:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4527: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-12-25 17:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4527: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-12-25 17:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4527: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-12-25 17:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4526: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-12-25 00:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4525: wasps (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Sahuarita', 'AZ', '85629',
    5, 0.90, '2024-12-23 21:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4524: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '85737',
    4, 0.85, '2024-12-23 20:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4524: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    4, 0.85, '2024-12-23 20:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4523: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '85730',
    5, 0.75, '2024-12-23 14:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4522: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2024-12-23 07:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4521: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-12-22 23:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4520: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85719',
    4, 0.85, '2024-12-22 14:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4520: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85719',
    4, 0.85, '2024-12-22 14:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4520: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85719',
    4, 0.85, '2024-12-22 14:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4518: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '85653',
    9, 0.75, '2024-12-21 09:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4515: rodents (Holbrook, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Holbrook', 'AZ', '86025',
    4, 0.75, '2024-12-19 12:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4514: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2024-12-18 17:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4513: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-12-16 18:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4512: bed_bugs (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'TUCSON', 'AZ', '85716',
    5, 0.75, '2024-12-15 14:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4511: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-12-15 11:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4510: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85739',
    5, 0.75, '2024-12-15 00:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4508: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-12-14 18:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4506: rodents (AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'AZ', 'AZ', '85749',
    5, 0.75, '2024-12-13 07:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4505: bees (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2024-12-12 20:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4505: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2024-12-12 20:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4504: other_pests (GILBERT, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'GILBERT', 'AZ', '85296',
    5, 0.90, '2024-12-12 18:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4502: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-12-12 13:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4501: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85716',
    5, 0.90, '2024-12-12 10:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4499: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85086',
    5, 0.85, '2024-12-10 16:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4499: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85086',
    5, 0.85, '2024-12-10 16:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4499: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85086',
    5, 0.85, '2024-12-10 16:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4497: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85255',
    5, 0.75, '2024-12-09 17:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4496: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85083',
    5, 0.90, '2024-12-09 16:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4495: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-12-09 12:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4494: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-12-08 22:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4493: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-12-08 17:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4492: termites (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Casa Grande', 'AZ', '85122',
    5, 0.75, '2024-12-08 15:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4490: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85741',
    5, 0.90, '2024-12-07 13:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4488: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-12-05 20:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4487: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85257',
    5, 0.75, '2024-12-05 19:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4486: termites (Tucson Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson Az', 'AZ', '85718',
    5, 0.75, '2024-12-05 15:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4483: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85713',
    5, 0.85, '2024-12-05 07:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4483: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85713',
    5, 0.85, '2024-12-05 07:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4482: ants (Bellemont, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Bellemont', 'AZ', '86015',
    5, 0.90, '2024-12-04 18:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4481: termites (buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'buckeye', 'AZ', '85396',
    5, 0.75, '2024-12-03 11:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4480: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.75, '2024-12-03 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4478: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-12-02 17:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4477: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85745-3223',
    8, 0.90, '2024-12-02 13:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4476: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85003',
    8, 0.90, '2024-12-01 23:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4475: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    5, 0.90, '2024-12-01 09:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4473: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-11-30 07:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4471: roaches (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'tucson', 'AZ', '85716',
    6, 0.90, '2024-11-28 06:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4470: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-11-28 01:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4467: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85301',
    6, 0.85, '2024-11-27 06:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4467: scorpions (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Glendale', 'AZ', '85301',
    6, 0.85, '2024-11-27 06:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4465: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-11-26 13:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4466: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-11-26 13:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4464: ants (vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'vail', 'AZ', '85641',
    4, 0.85, '2024-11-26 01:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4464: crickets (vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'vail', 'AZ', '85641',
    4, 0.85, '2024-11-26 01:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4464: roaches (vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'vail', 'AZ', '85641',
    4, 0.85, '2024-11-26 01:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4462: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '85202',
    4, 0.90, '2024-11-25 17:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4460: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-11-25 14:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4459: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-11-25 12:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4458: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-11-24 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4456: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85304',
    4, 0.75, '2024-11-24 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4455: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-11-23 23:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4454: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-11-23 12:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4453: moths (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'San Tan Valley', 'AZ', '85143',
    5, 0.85, '2024-11-23 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4453: termites (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Tan Valley', 'AZ', '85143',
    5, 0.85, '2024-11-23 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4448: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.90, '2024-11-21 23:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4447: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85226',
    5, 0.75, '2024-11-21 13:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4446: ants (san tan valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'san tan valley', 'AZ', '85143',
    5, 0.75, '2024-11-21 10:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4445: bed_bugs (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Marana', 'AZ', '85653',
    4, 0.90, '2024-11-20 11:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4443: ticks (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-11-19 08:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4438: ants (NYC, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'NYC', 'AZ', '10004',
    5, 0.85, '2024-11-18 09:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4438: bed_bugs (NYC, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'NYC', 'AZ', '10004',
    5, 0.85, '2024-11-18 09:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4437: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-11-17 09:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4435: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749-8738',
    5, 0.75, '2024-11-15 16:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4432: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85741',
    4, 0.90, '2024-11-14 17:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4429: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-11-14 08:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4428: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85712',
    4, 0.75, '2024-11-13 13:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4427: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.90, '2024-11-12 14:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4425: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-11-10 16:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4424: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85749',
    5, 0.90, '2024-11-10 12:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4422: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641-9337',
    5, 0.75, '2024-11-09 12:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4421: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-11-09 11:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4420: scorpions (Queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Queen creek', 'AZ', '85142',
    5, 0.90, '2024-11-09 06:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4419: scorpions (Dina, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Dina', 'AZ', '',
    5, 0.75, '2024-11-09 03:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4418: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85742',
    6, 0.90, '2024-11-08 18:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4414: bed_bugs (Globe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Globe', 'AZ', '85501',
    5, 0.75, '2024-11-08 00:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4410: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85207',
    5, 0.75, '2024-11-06 13:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4408: termites (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Laveen', 'AZ', '85339',
    9, 0.75, '2024-11-05 22:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4407: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85042',
    5, 0.90, '2024-11-05 15:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4406: other_pests (KENSAL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'KENSAL', 'AZ', '58455',
    5, 0.75, '2024-11-05 12:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4404: bed_bugs (GRANITE CITY, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'GRANITE CITY', 'AZ', '62040',
    5, 0.75, '2024-11-05 00:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4403: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-11-04 22:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4402: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85378',
    5, 0.75, '2024-11-04 14:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4401: other_pests (Fort Worth, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Fort Worth', 'AZ', '76109',
    5, 0.75, '2024-11-04 12:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4400: other_pests (Maryville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Maryville', 'AZ', '37803',
    5, 0.75, '2024-11-04 11:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4399: ants (Huachuca, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Huachuca', 'AZ', '85616',
    5, 0.75, '2024-11-04 10:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4398: other_pests (Washington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Washington', 'AZ', '63090',
    5, 0.75, '2024-11-04 10:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4396: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    4, 0.90, '2024-11-04 05:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4395: rodents (Lake Havasu City, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Lake Havasu City, AZ', 'AZ', '86404',
    5, 0.90, '2024-11-04 04:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4394: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85735',
    5, 0.90, '2024-11-03 18:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4393: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-11-03 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4392: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85374',
    4, 0.75, '2024-11-03 15:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4391: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-11-03 03:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4390: bed_bugs (Kissimmee, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Kissimmee', 'AZ', '34746',
    5, 0.75, '2024-11-02 23:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4389: bed_bugs (Vero Beach, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Vero Beach', 'AZ', '32967',
    5, 0.75, '2024-11-02 21:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4387: ants (Flagstaff, Arizona, AR)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Flagstaff, Arizona', 'AR', '86005',
    5, 0.75, '2024-11-02 17:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4385: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-11-01 20:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4384: other_pests (Montgomery, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Montgomery', 'AZ', '36116',
    5, 0.75, '2024-11-01 15:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4383: bed_bugs (arkadelphia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'arkadelphia', 'AZ', '71923',
    5, 0.90, '2024-11-01 15:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4382: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85730',
    9, 0.90, '2024-11-01 01:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4381: other_pests (HAGERSTOWN, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'HAGERSTOWN', 'AZ', '21742',
    5, 0.75, '2024-11-01 00:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4380: ants (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Goodyear', 'AZ', '85338',
    5, 0.85, '2024-10-31 21:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4380: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85338',
    5, 0.85, '2024-10-31 21:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4379: termites (QUEENSTOWN, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'QUEENSTOWN', 'AZ', '21658',
    5, 0.75, '2024-10-31 19:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4378: other_pests (braintree, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'braintree', 'AZ', '02184',
    5, 0.75, '2024-10-31 14:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4376: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    4, 0.75, '2024-10-30 22:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4375: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-10-30 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4374: other_pests (Lehigh Acres, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lehigh Acres', 'AZ', '33936',
    5, 0.75, '2024-10-30 15:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4373: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2024-10-30 15:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4372: rodents (Gold Canyon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Gold Canyon', 'AZ', '',
    4, 0.85, '2024-10-30 14:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4372: scorpions (Gold Canyon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Gold Canyon', 'AZ', '',
    4, 0.85, '2024-10-30 14:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4370: other_pests (Bradenton, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Bradenton', 'AZ', '34206',
    5, 0.75, '2024-10-30 13:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4369: other_pests (THOUSAND OAKS, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'THOUSAND OAKS', 'AZ', '91360',
    5, 0.75, '2024-10-30 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4368: other_pests (Miami, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Miami', 'AZ', '33135',
    5, 0.75, '2024-10-30 11:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4367: other_pests (Colorado Springs, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Colorado Springs', 'CO', '80909',
    5, 0.75, '2024-10-30 06:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4366: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85757',
    5, 0.90, '2024-10-30 03:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4365: other_pests (saintpetersburg, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'saintpetersburg', 'AZ', '33707',
    5, 0.75, '2024-10-29 23:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4364: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85023',
    5, 0.75, '2024-10-29 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4363: other_pests (Grove city, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Grove city', 'AZ', '16127',
    5, 0.75, '2024-10-29 15:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4362: other_pests (Iuka, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Iuka', 'AZ', '38852',
    5, 0.75, '2024-10-29 15:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4361: other_pests (La Vista, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'La Vista', 'AZ', '68128',
    5, 0.75, '2024-10-29 15:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4360: other_pests (Nashua, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Nashua', 'AZ', '03062',
    5, 0.75, '2024-10-29 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4359: other_pests (Benoit, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benoit', 'AZ', '38725',
    5, 0.75, '2024-10-29 12:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4358: other_pests (SANTA CLARITA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'SANTA CLARITA', 'AZ', '91350',
    5, 0.75, '2024-10-29 01:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4356: other_pests (HEBER SPRINGS, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'HEBER SPRINGS', 'AZ', '72543',
    5, 0.90, '2024-10-28 21:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4355: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '85718-2903',
    5, 0.75, '2024-10-28 17:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4354: other_pests (Brookfield, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Brookfield', 'AZ', '44403',
    5, 0.75, '2024-10-28 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4353: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    4, 0.75, '2024-10-28 15:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4352: bees (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2024-10-28 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4352: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2024-10-28 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4351: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.90, '2024-10-28 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4350: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-10-28 12:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4349: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85743',
    5, 0.90, '2024-10-28 11:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4348: other_pests (Eugene, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Eugene', 'AZ', '97401',
    5, 0.75, '2024-10-28 08:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4347: other_pests (HOUMA, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'HOUMA', 'LA', '70364',
    4, 0.75, '2024-10-27 20:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4346: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85284',
    5, 0.75, '2024-10-27 19:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4345: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-10-27 12:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4344: other_pests (Akron, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Akron', 'AZ', '44312-1012',
    5, 0.75, '2024-10-27 06:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4340: ants (Jonesboro, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jonesboro', 'AZ', '30236',
    5, 0.85, '2024-10-26 06:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4340: bed_bugs (Jonesboro, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Jonesboro', 'AZ', '30236',
    5, 0.85, '2024-10-26 06:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4340: rodents (Jonesboro, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Jonesboro', 'AZ', '30236',
    5, 0.85, '2024-10-26 06:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4339: other_pests (Lake Zurich, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lake Zurich', 'AZ', '60047',
    5, 0.75, '2024-10-26 02:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4338: bed_bugs (twin falls, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'twin falls', 'AZ', '83301',
    5, 0.90, '2024-10-25 22:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4337: other_pests (Little Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Little Rock', 'AZ', '72204',
    5, 0.75, '2024-10-25 10:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4336: other_pests (AURORA, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'AURORA', 'CO', '80013',
    5, 0.75, '2024-10-25 02:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4335: bed_bugs (Haxtun, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Haxtun', 'CO', '80731',
    5, 0.75, '2024-10-25 02:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4334: bed_bugs (Haxtun, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Haxtun', 'CO', '80731',
    5, 0.75, '2024-10-25 02:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4333: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-10-24 23:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4332: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85023',
    5, 0.75, '2024-10-24 22:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4331: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    4, 0.75, '2024-10-24 18:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4330: other_pests (Patterson, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Patterson', 'LA', '70392',
    5, 0.75, '2024-10-24 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4326: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85714',
    5, 0.75, '2024-10-24 07:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4325: other_pests (Port Huron, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Port Huron', 'AZ', '48060',
    5, 0.75, '2024-10-24 07:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4324: other_pests (Columbia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Columbia', 'AZ', '65203',
    5, 0.75, '2024-10-23 21:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4323: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-10-23 17:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4322: other_pests (Pensacola, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Pensacola', 'AZ', '32507',
    5, 0.75, '2024-10-23 16:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4321: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85083-7503',
    5, 0.75, '2024-10-23 16:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4320: other_pests (Pensacola, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Pensacola', 'AZ', '32506',
    5, 0.75, '2024-10-23 15:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4319: roaches (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Mesa', 'AZ', '',
    5, 0.90, '2024-10-23 13:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4318: bed_bugs (Wanda Echols, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Wanda Echols', 'AZ', '30601',
    5, 0.75, '2024-10-23 07:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4317: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85713',
    5, 0.90, '2024-10-23 00:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4316: other_pests (Baton Rouge, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Baton Rouge', 'LA', '70820',
    5, 0.75, '2024-10-22 22:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4315: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-10-22 17:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4314: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85044',
    5, 0.85, '2024-10-22 17:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4314: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85044',
    5, 0.85, '2024-10-22 17:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4313: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '85718',
    4, 0.75, '2024-10-22 15:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4312: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-10-22 15:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4311: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    5, 0.75, '2024-10-22 10:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4310: other_pests (San Diego, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Diego', 'AZ', '92115',
    5, 0.75, '2024-10-22 06:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4309: bed_bugs (lincoln, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'lincoln', 'AZ', '68521',
    5, 0.75, '2024-10-22 02:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4308: bed_bugs (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mesa', 'AZ', '85202',
    5, 0.75, '2024-10-22 01:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4307: termites (Bedford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Bedford', 'AZ', '47421',
    5, 0.75, '2024-10-22 01:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4306: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85714',
    5, 0.75, '2024-10-22 00:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4305: other_pests (Akron, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Akron', 'AZ', '44312-1012',
    5, 0.75, '2024-10-22 00:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4304: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85748',
    5, 0.75, '2024-10-21 20:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4303: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85756',
    5, 0.85, '2024-10-21 18:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4303: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85756',
    5, 0.85, '2024-10-21 18:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4302: termites (North Tonawanda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'North Tonawanda', 'AZ', '14120',
    5, 0.75, '2024-10-21 16:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4301: other_pests (Amherst, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Amherst', 'AZ', '01002',
    5, 0.75, '2024-10-21 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4300: other_pests (Mt Juliet, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mt Juliet', 'AZ', '37122',
    5, 0.75, '2024-10-21 15:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4299: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    4, 0.90, '2024-10-21 14:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4298: other_pests (Grants Pass, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Grants Pass', 'AZ', '97526-9764',
    5, 0.75, '2024-10-21 12:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4297: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2024-10-21 12:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4294: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85008',
    5, 0.75, '2024-10-21 04:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4293: other_pests (Lasvegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lasvegas', 'AZ', '89121',
    5, 0.75, '2024-10-21 02:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4292: ants (VAIL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'VAIL', 'AZ', '85641-6666',
    6, 0.90, '2024-10-20 23:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4289: other_pests (richmond, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'richmond', 'AZ', '23222',
    5, 0.75, '2024-10-20 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4288: other_pests (Eugene, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Eugene', 'AZ', '97401',
    5, 0.75, '2024-10-20 13:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4286: other_pests (Miami, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Miami', 'AZ', '33125',
    5, 0.75, '2024-10-20 12:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4284: bed_bugs (WAYNESVILLE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'WAYNESVILLE', 'AZ', '65583',
    5, 0.75, '2024-10-20 02:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4283: rodents (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Sahuarita', 'AZ', '85614',
    6, 0.90, '2024-10-19 16:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4281: roaches (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'tucson', 'AZ', '85741',
    5, 0.90, '2024-10-19 00:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4280: other_pests (Sandwich, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sandwich', 'AZ', '60548',
    5, 0.75, '2024-10-18 22:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4279: other_pests (Gilboa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilboa', 'AZ', '26671',
    5, 0.75, '2024-10-18 15:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4278: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85338',
    4, 0.90, '2024-10-18 15:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4277: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85730',
    5, 0.85, '2024-10-18 13:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4277: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85730',
    5, 0.85, '2024-10-18 13:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4276: other_pests (Jonesboro, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Jonesboro', 'AZ', '30238',
    5, 0.75, '2024-10-18 06:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4273: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85140',
    5, 0.75, '2024-10-17 20:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4272: ants (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Goodyear', 'AZ', '85395',
    4, 0.85, '2024-10-17 16:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4272: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85395',
    4, 0.85, '2024-10-17 16:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4271: other_pests (Maunabo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Maunabo', 'AZ', '00707',
    5, 0.75, '2024-10-17 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4269: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-10-17 12:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4266: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '85711',
    5, 0.90, '2024-10-17 09:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4265: other_pests (66502, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '66502', 'AZ', '66502',
    5, 0.75, '2024-10-17 03:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4264: mosquitoes (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2024-10-16 23:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4264: scorpions (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2024-10-16 23:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4264: spiders (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Queen Creek', 'AZ', '85142',
    5, 0.85, '2024-10-16 23:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4263: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '85248',
    5, 0.75, '2024-10-16 22:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4262: bed_bugs (Niantic, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Niantic', 'AZ', '6357',
    5, 0.75, '2024-10-16 22:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4261: other_pests (Herndon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Herndon', 'AZ', '20170',
    5, 0.75, '2024-10-16 17:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4260: other_pests (Lancaster, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lancaster', 'AZ', '17601',
    5, 0.75, '2024-10-16 13:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4259: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-10-16 13:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4258: other_pests (zionsville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'zionsville', 'AZ', '46077',
    5, 0.75, '2024-10-16 10:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4257: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85050',
    6, 0.80, '2024-10-16 09:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4256: other_pests (Goodwater, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodwater', 'AZ', '35072',
    5, 0.75, '2024-10-16 09:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4253: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-10-15 23:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4252: bed_bugs (andy coy, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'andy coy', 'AZ', '57675',
    5, 0.75, '2024-10-15 22:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;
