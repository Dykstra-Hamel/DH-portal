-- Bulk Import Pest Pressure Data Points (Part 6/6)
-- Company: 8da68eed-0759-4b45-bd08-abb339cfad7b
-- Records: 5001 to 5179

DO $$
DECLARE
  company_uuid UUID := '8da68eed-0759-4b45-bd08-abb339cfad7b';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN

  -- Form 171: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    9, 0.75, '2022-05-06 05:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 170: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '',
    5, 0.75, '2022-05-05 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 168: other_pests (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson, AZ', 'AZ', '',
    5, 0.75, '2022-05-05 13:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 167: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    9, 0.90, '2022-05-04 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 166: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2022-05-04 16:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 165: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '',
    4, 0.90, '2022-05-04 13:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 164: other_pests (Saddlebrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Saddlebrooke', 'AZ', '',
    5, 0.75, '2022-05-04 13:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 163: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-05-04 10:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 162: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2022-05-04 01:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 161: termites (Tucson AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson AZ', 'AZ', '',
    5, 0.75, '2022-05-03 23:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 159: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.90, '2022-05-03 19:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 158: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2022-05-03 11:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 157: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2022-05-03 11:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 156: termites (Marana Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana Tucson', 'AZ', '',
    5, 0.75, '2022-05-02 23:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 155: ants (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson, AZ', 'AZ', '',
    6, 0.90, '2022-05-02 14:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 154: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2022-05-02 12:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 153: bees (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Chandler', 'AZ', '',
    6, 0.90, '2022-05-02 06:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 152: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-05-02 01:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 151: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    9, 0.75, '2022-05-01 11:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 150: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 148: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 149: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 147: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 146: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 145: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 144: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 143: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 142: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 140: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 141: bed_bugs (HOUSTON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'HOUSTON', 'AZ', '',
    5, 0.75, '2022-05-01 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 139: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-30 16:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 139: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-30 16:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 139: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-30 16:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 139: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-30 16:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 137: termites (MILLVILLE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'MILLVILLE', 'AZ', '',
    5, 0.75, '2022-04-30 08:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 136: termites (MILLVILLE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'MILLVILLE', 'AZ', '',
    5, 0.75, '2022-04-30 08:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 135: termites (MILLVILLE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'MILLVILLE', 'AZ', '',
    5, 0.75, '2022-04-30 08:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 134: termites (MILLVILLE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'MILLVILLE', 'AZ', '',
    5, 0.75, '2022-04-30 08:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 133: crickets (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Marana', 'AZ', '',
    6, 0.85, '2022-04-29 17:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 133: roaches (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Marana', 'AZ', '',
    6, 0.85, '2022-04-29 17:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 132: termites (Peoria, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria, AZ', 'AZ', '',
    5, 0.90, '2022-04-29 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 131: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    4, 0.75, '2022-04-29 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 130: bees (peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'peoria', 'AZ', '',
    5, 0.90, '2022-04-29 00:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 129: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.90, '2022-04-28 22:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 128: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    4, 0.75, '2022-04-28 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 127: ants (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'tucson', 'AZ', '',
    4, 0.85, '2022-04-28 11:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 127: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '',
    4, 0.85, '2022-04-28 11:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 126: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-27 21:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 126: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-27 21:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 125: other_pests (Saddlebrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Saddlebrooke', 'AZ', '',
    5, 0.75, '2022-04-27 17:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 124: other_pests (Saddlebrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Saddlebrooke', 'AZ', '',
    5, 0.75, '2022-04-27 12:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 123: other_pests (HIALEAH, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'HIALEAH', 'AZ', '',
    5, 0.75, '2022-04-27 03:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 122: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2022-04-27 00:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 121: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '',
    5, 0.75, '2022-04-26 18:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 119: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    4, 0.75, '2022-04-26 12:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 118: bees (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Ajo', 'AZ', '',
    5, 0.90, '2022-04-26 10:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 117: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    4, 0.75, '2022-04-25 19:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 116: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2022-04-25 13:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 115: bed_bugs (Tuscon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tuscon', 'AZ', '',
    5, 0.90, '2022-04-25 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 114: other_pests (Sun. City West, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sun. City West', 'AZ', '',
    5, 0.75, '2022-04-24 23:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 113: bed_bugs (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'TUCSON', 'AZ', '',
    5, 0.90, '2022-04-24 23:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 112: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2022-04-24 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 111: bees (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Ajo', 'AZ', '',
    5, 0.90, '2022-04-24 12:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 109: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-22 19:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 108: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-22 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 107: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    4, 0.75, '2022-04-22 14:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 105: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-21 19:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 105: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-21 19:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 104: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2022-04-21 18:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 103: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-21 11:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 102: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '',
    5, 0.75, '2022-04-21 08:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 101: bees (Sun City West, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Sun City West', 'AZ', '',
    5, 0.90, '2022-04-20 21:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 100: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    5, 0.75, '2022-04-20 18:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 99: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '',
    6, 0.90, '2022-04-20 16:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 98: rodents (Hudson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Hudson', 'AZ', '',
    5, 0.85, '2022-04-20 14:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 98: termites (Hudson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Hudson', 'AZ', '',
    5, 0.85, '2022-04-20 14:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 97: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2022-04-20 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 96: other_pests (Winslow, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Winslow', 'AZ', '',
    5, 0.75, '2022-04-20 11:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 95: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '',
    5, 0.75, '2022-04-20 07:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 94: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    4, 0.75, '2022-04-20 06:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 93: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '',
    6, 0.80, '2022-04-20 00:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 92: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-19 20:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 92: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-19 20:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 91: bees (SAN TAN VALLEY, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'SAN TAN VALLEY', 'AZ', '',
    9, 0.75, '2022-04-19 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 90: termites (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Ajo', 'AZ', '',
    5, 0.75, '2022-04-19 16:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 89: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    4, 0.90, '2022-04-18 20:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 88: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-18 16:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 86: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2022-04-18 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 87: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-18 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 85: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-18 16:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 84: other_pests (Eroad, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Eroad', 'AZ', '',
    5, 0.75, '2022-04-18 12:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 82: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    9, 0.90, '2022-04-18 00:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 81: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-17 19:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 81: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-17 19:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 81: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2022-04-17 19:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 80: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-17 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 79: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-17 14:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 77: other_pests (Saddlebrooke/Catalina, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Saddlebrooke/Catalina', 'AZ', '',
    5, 0.75, '2022-04-16 23:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 75: ants (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ajo', 'AZ', '',
    5, 0.75, '2022-04-16 15:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 74: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '',
    5, 0.90, '2022-04-16 13:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 73: roaches (San Manuel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'San Manuel', 'AZ', '',
    6, 0.90, '2022-04-15 12:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 72: termites (Uttarakhand, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Uttarakhand', 'AZ', '',
    5, 0.75, '2022-04-15 05:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 71: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2022-04-14 19:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 70: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '',
    5, 0.75, '2022-04-14 18:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 69: other_pests (Coolidge, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Coolidge', 'AZ', '',
    5, 0.75, '2022-04-14 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 68: other_pests (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Paradise Valley', 'AZ', '',
    5, 0.75, '2022-04-14 13:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 67: rodents (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Vail', 'AZ', '',
    5, 0.85, '2022-04-14 11:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 67: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    5, 0.85, '2022-04-14 11:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 66: other_pests (85745, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '85745', 'AZ', '',
    5, 0.75, '2022-04-13 11:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 65: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '',
    6, 0.80, '2022-04-13 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 64: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-12 21:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 62: other_pests (test, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'test', 'AZ', '',
    5, 0.75, '2022-04-12 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 61: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    6, 0.80, '2022-04-12 12:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 60: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-12 12:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 59: roaches (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Sahuarita', 'AZ', '',
    5, 0.75, '2022-04-12 11:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 58: termites (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Cave Creek', 'AZ', '',
    5, 0.90, '2022-04-12 11:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 57: other_pests (BUCKEYE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'BUCKEYE', 'AZ', '',
    9, 0.75, '2022-04-12 02:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 56: termites (John, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'John', 'AZ', '',
    5, 0.75, '2022-04-12 01:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 55: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    6, 0.90, '2022-04-11 12:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 53: other_pests (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Paradise Valley', 'AZ', '',
    5, 0.75, '2022-04-11 09:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 52: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-10 20:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 51: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '',
    5, 0.75, '2022-04-10 16:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 50: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '',
    5, 0.90, '2022-04-10 01:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 49: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-09 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 49: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-09 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 49: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-09 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 49: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-09 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 48: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    4, 0.75, '2022-04-08 23:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 47: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2022-04-08 13:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 46: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    5, 0.75, '2022-04-08 13:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 43: bees (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Chandler', 'AZ', '',
    5, 0.75, '2022-04-08 09:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 42: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-07 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 42: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-07 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 42: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-07 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 42: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    6, 0.85, '2022-04-07 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 40: ants (scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'scottsdale', 'AZ', '',
    4, 0.85, '2022-04-06 21:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 40: termites (scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'scottsdale', 'AZ', '',
    4, 0.85, '2022-04-06 21:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 39: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '',
    4, 0.90, '2022-04-06 17:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 38: other_pests (Catalina, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Catalina', 'AZ', '',
    4, 0.75, '2022-04-06 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 37: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-06 12:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 36: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '',
    5, 0.75, '2022-04-05 22:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 34: termites (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Maricopa', 'AZ', '',
    5, 0.75, '2022-04-04 19:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 32: rodents (Broken Arrow, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Broken Arrow', 'AZ', '',
    4, 0.75, '2022-04-04 06:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 31: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '',
    8, 0.85, '2022-04-04 00:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 31: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    8, 0.85, '2022-04-04 00:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 30: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '',
    4, 0.85, '2022-04-03 20:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 30: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '',
    4, 0.85, '2022-04-03 20:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 29: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '',
    5, 0.90, '2022-04-03 16:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 28: other_pests (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Green Valley', 'AZ', '',
    5, 0.75, '2022-04-03 14:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 27: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-03 11:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 26: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '',
    6, 0.80, '2022-04-02 19:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 25: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '',
    5, 0.90, '2022-04-02 09:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 24: scorpions (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Goodyear', 'AZ', '',
    5, 0.75, '2022-04-02 01:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 23: other_pests (Chandler, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler, AZ', 'AZ', '',
    5, 0.90, '2022-04-01 23:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 22: scorpions (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Scottsdale', 'AZ', '',
    5, 0.90, '2022-04-01 13:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 21: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2022-04-01 13:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 20: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '',
    5, 0.75, '2022-03-31 15:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 19: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-31 13:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 19: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-31 13:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 18: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-31 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 18: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-31 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 16: ants (Los Angeles, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Los Angeles', 'AZ', '',
    5, 0.85, '2022-03-31 06:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 16: rodents (Los Angeles, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Los Angeles', 'AZ', '',
    5, 0.85, '2022-03-31 06:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 15: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2022-03-30 18:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 14: other_pests (Lake Oswego, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lake Oswego', 'AZ', '',
    5, 0.75, '2022-03-30 17:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 13: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-30 16:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 13: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-30 16:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 12: ants (Atlanta, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Atlanta', 'AZ', '',
    4, 0.85, '2022-03-30 09:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 12: bees (Atlanta, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Atlanta', 'AZ', '',
    4, 0.85, '2022-03-30 09:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 12: rodents (Atlanta, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Atlanta', 'AZ', '',
    4, 0.85, '2022-03-30 09:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 12: termites (Atlanta, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Atlanta', 'AZ', '',
    4, 0.85, '2022-03-30 09:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 11: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    4, 0.75, '2022-03-30 01:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 10: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-03-29 22:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 9: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '',
    5, 0.75, '2022-03-29 13:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 8: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '',
    5, 0.75, '2022-03-29 12:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 6: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2022-03-29 09:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-28 11:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2022-03-28 11:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2022-03-24 10:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;
