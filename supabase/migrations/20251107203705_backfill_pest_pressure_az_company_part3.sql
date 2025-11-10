-- Bulk Import Pest Pressure Data Points (Part 3/6)
-- Company: 8da68eed-0759-4b45-bd08-abb339cfad7b
-- Records: 2001 to 3000

DO $$
DECLARE
  company_uuid UUID := '8da68eed-0759-4b45-bd08-abb339cfad7b';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN

  -- Form 3134: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85041',
    5, 0.75, '2024-04-15 23:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3133: other_pests (queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'queen creek', 'AZ', '85142',
    5, 0.75, '2024-04-15 20:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3132: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    4, 0.75, '2024-04-15 19:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3131: fleas (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Vail', 'AZ', '85641',
    5, 0.85, '2024-04-15 19:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3131: ticks (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Vail', 'AZ', '85641',
    5, 0.85, '2024-04-15 19:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3129: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85718',
    4, 0.90, '2024-04-15 17:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3125: ants (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gilbert', 'AZ', '85233',
    4, 0.85, '2024-04-15 11:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3125: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85233',
    4, 0.85, '2024-04-15 11:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3122: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-04-14 22:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3122: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-04-14 22:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3121: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85730',
    5, 0.75, '2024-04-14 21:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3118: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85756',
    5, 0.90, '2024-04-14 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3117: bees (lubbock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'lubbock', 'AZ', '79403',
    5, 0.85, '2024-04-13 21:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3117: moths (lubbock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'lubbock', 'AZ', '79403',
    5, 0.85, '2024-04-13 21:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3115: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85050',
    5, 0.75, '2024-04-13 16:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3111: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-04-12 13:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3109: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85730',
    5, 0.90, '2024-04-12 12:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3107: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-04-11 23:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3108: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-04-11 23:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3106: other_pests (Phx, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phx', 'AZ', '95006',
    5, 0.75, '2024-04-11 23:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3105: ants (chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'chandler', 'AZ', '85226',
    4, 0.85, '2024-04-11 21:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3105: rodents (chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'chandler', 'AZ', '85226',
    4, 0.85, '2024-04-11 21:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3104: other_pests (San manuel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San manuel', 'AZ', '85631',
    5, 0.75, '2024-04-11 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3103: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85718',
    4, 0.75, '2024-04-11 18:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3102: ants (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Las Vegas', 'AZ', '89120',
    5, 0.85, '2024-04-11 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3102: rodents (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Las Vegas', 'AZ', '89120',
    5, 0.85, '2024-04-11 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3093: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85704',
    6, 0.90, '2024-04-10 21:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3092: bees (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2024-04-10 20:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3090: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.90, '2024-04-10 17:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3088: other_pests (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Green Valley', 'AZ', '85614',
    4, 0.75, '2024-04-10 15:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3087: ants (Sierra Vista, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sierra Vista', 'AZ', '85635',
    5, 0.75, '2024-04-10 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3086: other_pests (N/A, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'N/A', 'AZ', '',
    5, 0.90, '2024-04-10 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3085: bees (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Mesa', 'AZ', '85201',
    9, 0.90, '2024-04-10 14:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3084: ants (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Laveen', 'AZ', '85339',
    5, 0.75, '2024-04-10 14:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3078: bees (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Chandler', 'AZ', '85286',
    5, 0.75, '2024-04-09 22:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3076: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85029',
    5, 0.75, '2024-04-09 21:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3072: flies (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Queen Creek', 'AZ', '85142',
    5, 0.90, '2024-04-09 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3071: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.75, '2024-04-09 14:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3069: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-04-09 10:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3068: ants (New Delhi, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'New Delhi', 'AZ', '110046',
    4, 0.85, '2024-04-09 00:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3068: roaches (New Delhi, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'New Delhi', 'AZ', '110046',
    4, 0.85, '2024-04-09 00:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3068: rodents (New Delhi, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'New Delhi', 'AZ', '110046',
    4, 0.85, '2024-04-09 00:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3067: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.75, '2024-04-08 22:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3066: ants (Oracle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oracle', 'AZ', '85623',
    9, 0.85, '2024-04-08 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3066: bees (Oracle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oracle', 'AZ', '85623',
    9, 0.85, '2024-04-08 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3066: beetles (Oracle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Oracle', 'AZ', '85623',
    9, 0.85, '2024-04-08 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3065: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85749',
    5, 0.75, '2024-04-08 17:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3064: other_pests (Windsor, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Windsor', 'CO', '80550',
    5, 0.90, '2024-04-08 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3063: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '85653',
    6, 0.85, '2024-04-08 15:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3063: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653',
    6, 0.85, '2024-04-08 15:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3060: ants (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Peoria', 'AZ', '85382-2405',
    6, 0.80, '2024-04-08 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3059: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-04-08 09:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3058: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85737',
    9, 0.75, '2024-04-08 01:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3057: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.90, '2024-04-07 21:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3056: other_pests (N/A, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'N/A', 'AZ', '',
    5, 0.90, '2024-04-07 18:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3053: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086-1241',
    5, 0.75, '2024-04-07 10:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3052: termites (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Laveen', 'AZ', '85339',
    4, 0.90, '2024-04-06 17:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3047: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    4, 0.75, '2024-04-05 12:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3045: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-04-04 21:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3044: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    4, 0.75, '2024-04-04 17:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3039: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85144',
    5, 0.75, '2024-04-04 13:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3037: ants (Rio Rico, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Rio Rico', 'AZ', '85648',
    5, 0.75, '2024-04-04 10:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3035: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2024-04-04 09:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3034: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2024-04-04 09:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3033: ants (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-04-04 05:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3033: rodents (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-04-04 05:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3033: termites (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-04-04 05:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3032: ants (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-04-04 05:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3032: rodents (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-04-04 05:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3032: termites (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-04-04 05:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3031: termites (Kearny, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Kearny', 'AZ', '85137',
    5, 0.75, '2024-04-04 01:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3030: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85083',
    8, 0.85, '2024-04-03 22:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3030: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85083',
    8, 0.85, '2024-04-03 22:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3029: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-04-03 19:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3028: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-04-03 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3027: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-04-03 17:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3025: rodents (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Anthem', 'AZ', '85086',
    6, 0.80, '2024-04-03 15:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3024: other_pests (N/A, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'N/A', 'AZ', '',
    5, 0.90, '2024-04-03 13:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3023: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '85345',
    5, 0.90, '2024-04-03 11:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3020: ants (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Green Valley', 'AZ', '85614',
    5, 0.90, '2024-04-02 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3019: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85730',
    4, 0.90, '2024-04-02 14:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3017: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-04-02 11:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3015: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-04-02 02:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3014: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85713-4205',
    4, 0.90, '2024-04-01 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3010: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    4, 0.75, '2024-03-31 09:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3009: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-03-31 01:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3008: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-03-30 23:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3007: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-03-30 21:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3006: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2024-03-30 16:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3004: ants (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Maricopa', 'AZ', '43872',
    6, 0.85, '2024-03-30 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3004: scorpions (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Maricopa', 'AZ', '43872',
    6, 0.85, '2024-03-30 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3004: spiders (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Maricopa', 'AZ', '43872',
    6, 0.85, '2024-03-30 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3004: termites (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Maricopa', 'AZ', '43872',
    6, 0.85, '2024-03-30 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3002: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85249',
    5, 0.75, '2024-03-29 23:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3001: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.90, '2024-03-29 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3000: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    4, 0.75, '2024-03-29 14:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2997: ants (Garden Grove, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Garden Grove', 'AZ', '92841',
    4, 0.90, '2024-03-29 03:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2995: scorpions (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2024-03-29 00:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2990: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-03-28 17:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2988: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-03-27 21:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2986: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-03-27 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2984: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85706',
    5, 0.90, '2024-03-27 15:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2983: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85712',
    4, 0.75, '2024-03-27 14:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2978: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    4, 0.75, '2024-03-26 14:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2975: termites (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Benson', 'AZ', '85602',
    4, 0.75, '2024-03-25 21:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2973: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    9, 0.90, '2024-03-25 17:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2971: fleas (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Marana', 'AZ', '85653',
    9, 0.85, '2024-03-25 16:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2971: roaches (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Marana', 'AZ', '85653',
    9, 0.85, '2024-03-25 16:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2970: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85212',
    5, 0.75, '2024-03-25 14:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2968: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-03-24 17:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2965: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85140',
    5, 0.75, '2024-03-23 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2964: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-03-23 20:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2960: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-03-23 13:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2959: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-03-23 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2958: other_pests (Santan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Santan Valley', 'AZ', '85140',
    5, 0.75, '2024-03-23 11:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2956: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.90, '2024-03-23 04:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2957: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.90, '2024-03-23 04:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2949: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85742',
    5, 0.75, '2024-03-21 13:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2948: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85730',
    5, 0.75, '2024-03-21 13:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2946: other_pests (Rio Rico, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rio Rico', 'AZ', '85648',
    5, 0.75, '2024-03-20 20:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2945: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-03-20 18:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2943: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    4, 0.90, '2024-03-20 17:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2938: ants (Hartford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Hartford', 'AZ', '47914',
    5, 0.75, '2024-03-19 23:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2931: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    5, 0.75, '2024-03-19 13:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2930: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    4, 0.90, '2024-03-19 11:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2929: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85143',
    5, 0.75, '2024-03-19 11:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2926: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85083',
    5, 0.75, '2024-03-18 15:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2924: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-03-18 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2923: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '85755',
    5, 0.90, '2024-03-18 12:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2922: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '85653-9513',
    5, 0.85, '2024-03-18 07:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2922: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653-9513',
    5, 0.85, '2024-03-18 07:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2921: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85710',
    5, 0.90, '2024-03-18 03:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2919: bed_bugs (Tucdon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucdon', 'AZ', '85716',
    5, 0.75, '2024-03-18 00:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2918: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-03-17 23:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2916: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-03-17 19:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2915: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    4, 0.75, '2024-03-17 16:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2914: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2024-03-17 15:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2913: termites (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Tan Valley', 'AZ', '85143',
    5, 0.90, '2024-03-17 14:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2912: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2024-03-17 01:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2911: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-03-16 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2910: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '85712',
    5, 0.85, '2024-03-16 19:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2910: mosquitoes (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'TUCSON', 'AZ', '85712',
    5, 0.85, '2024-03-16 19:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2909: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85715',
    5, 0.90, '2024-03-16 18:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2907: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85044',
    5, 0.75, '2024-03-16 17:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2905: other_pests (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Avondale', 'AZ', '85323',
    5, 0.75, '2024-03-16 14:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2902: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-03-15 21:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2901: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-03-15 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2901: crickets (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-03-15 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2901: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-03-15 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2901: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-03-15 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2900: ants (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Goodyear', 'AZ', '85395-5708',
    5, 0.85, '2024-03-15 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2900: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85395-5708',
    5, 0.85, '2024-03-15 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2899: ants (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'PHOENIX', 'AZ', '85060',
    5, 0.75, '2024-03-15 11:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2898: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    4, 0.75, '2024-03-14 20:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2897: rodents (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Oro Valley', 'AZ', '85737',
    5, 0.85, '2024-03-14 19:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2897: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.85, '2024-03-14 19:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2896: ants (Los Angeles, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Los Angeles', 'AZ', '90065',
    4, 0.75, '2024-03-14 17:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2895: ants (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gilbert', 'AZ', '85296',
    5, 0.75, '2024-03-14 16:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2894: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85739',
    6, 0.90, '2024-03-14 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2891: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-03-14 12:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2889: other_pests (Rio rico az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rio rico az', 'AZ', '85648',
    5, 0.75, '2024-03-14 10:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2888: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85712',
    5, 0.90, '2024-03-14 03:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2887: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85712',
    5, 0.90, '2024-03-14 03:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2885: other_pests (Virginia Beach, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Virginia Beach', 'AZ', '23453',
    4, 0.75, '2024-03-13 22:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2878: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85254',
    4, 0.75, '2024-03-13 13:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2870: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85028',
    6, 0.90, '2024-03-11 22:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2869: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85857',
    5, 0.75, '2024-03-11 19:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2867: other_pests (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'phoenix', 'AZ', '85086',
    5, 0.75, '2024-03-11 15:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2866: wasps (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Gilbert', 'AZ', '85297',
    5, 0.90, '2024-03-11 15:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2865: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '85718',
    9, 0.85, '2024-03-11 14:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2865: bees (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'TUCSON', 'AZ', '85718',
    9, 0.85, '2024-03-11 14:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2865: rodents (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'AZ', '85718',
    9, 0.85, '2024-03-11 14:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2860: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-03-11 10:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2859: ants (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tempe', 'AZ', '85281',
    6, 0.85, '2024-03-11 01:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2859: roaches (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tempe', 'AZ', '85281',
    6, 0.85, '2024-03-11 01:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2858: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-03-10 20:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2856: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-03-10 19:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2854: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85387',
    5, 0.75, '2024-03-10 15:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2852: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-03-10 10:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2851: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-03-09 23:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2849: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2024-03-09 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2848: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    4, 0.75, '2024-03-09 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2843: ants (HWY 86 Sells Business Loop, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'HWY 86 Sells Business Loop', 'AZ', '85634',
    4, 0.85, '2024-03-08 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2843: bees (HWY 86 Sells Business Loop, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'HWY 86 Sells Business Loop', 'AZ', '85634',
    4, 0.85, '2024-03-08 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2843: rodents (HWY 86 Sells Business Loop, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'HWY 86 Sells Business Loop', 'AZ', '85634',
    4, 0.85, '2024-03-08 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2843: termites (HWY 86 Sells Business Loop, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'HWY 86 Sells Business Loop', 'AZ', '85634',
    4, 0.85, '2024-03-08 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2841: other_pests (VAIL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'VAIL', 'AZ', '85641-0437',
    5, 0.75, '2024-03-08 09:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2838: rodents (San manuel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'San manuel', 'AZ', '85631',
    6, 0.90, '2024-03-07 22:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2836: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-03-07 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2835: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-03-07 13:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2833: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-03-07 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2832: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    4, 0.75, '2024-03-07 12:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2831: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85013',
    5, 0.90, '2024-03-07 09:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2828: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-03-06 19:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2827: other_pests (QUEEN CREEK, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'QUEEN CREEK', 'AZ', '85142-5050',
    5, 0.75, '2024-03-06 18:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2826: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2024-03-06 17:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2824: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85704',
    6, 0.80, '2024-03-06 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2823: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2024-03-06 14:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2823: termites (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'California', 'AZ', '92618',
    5, 0.85, '2024-03-06 14:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2819: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85719',
    8, 0.90, '2024-03-05 20:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2817: other_pests (Tucson Indiana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Indiana', 'AZ', '85741',
    5, 0.75, '2024-03-05 18:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2816: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    5, 0.75, '2024-03-05 17:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2813: ants (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Maricopa', 'AZ', '85138',
    5, 0.90, '2024-03-05 14:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2812: ants (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Green Valley', 'AZ', '85614',
    5, 0.75, '2024-03-05 14:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2811: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    4, 0.75, '2024-03-05 13:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2810: other_pests (San Tan Valley, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley, AZ', 'AZ', '85140',
    5, 0.75, '2024-03-05 12:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2809: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    4, 0.75, '2024-03-05 12:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2807: scorpions (Sierra vista, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Sierra vista', 'AZ', '856501010',
    7, 0.85, '2024-03-04 19:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2807: termites (Sierra vista, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sierra vista', 'AZ', '856501010',
    7, 0.85, '2024-03-04 19:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2805: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2024-03-04 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2804: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-03-04 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2801: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85747',
    5, 0.85, '2024-03-04 11:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2801: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.85, '2024-03-04 11:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2800: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85266',
    4, 0.75, '2024-03-04 09:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2799: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-03-04 08:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2798: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-03-03 14:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2797: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-03-03 13:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2796: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-03-03 13:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2793: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85745',
    4, 0.90, '2024-03-03 10:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2789: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    5, 0.90, '2024-03-02 10:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2788: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    5, 0.90, '2024-03-02 09:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2787: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '85035',
    5, 0.75, '2024-03-02 03:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2786: other_pests (Arisona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arisona', 'AZ', '85033',
    5, 0.75, '2024-03-01 17:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2781: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85748',
    4, 0.90, '2024-03-01 14:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2780: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-03-01 14:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2779: other_pests (N/A, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'N/A', 'AZ', '',
    5, 0.90, '2024-03-01 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2778: other_pests (TOLLESON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TOLLESON', 'AZ', '85353',
    5, 0.75, '2024-03-01 11:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2774: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85383',
    4, 0.90, '2024-02-29 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2772: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    5, 0.75, '2024-02-29 13:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2771: other_pests (Tucson Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Az', 'AZ', '',
    5, 0.75, '2024-02-29 13:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2770: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2024-02-29 13:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2769: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85283',
    5, 0.75, '2024-02-29 13:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2768: other_pests (N/A, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'N/A', 'AZ', '',
    5, 0.90, '2024-02-29 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2766: other_pests (Tucson Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Arizona', 'AZ', '',
    5, 0.75, '2024-02-29 11:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2765: other_pests (Rio Rico Az., AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rio Rico Az.', 'AZ', '85648',
    5, 0.75, '2024-02-29 11:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2763: other_pests (ORO VALLEY, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'ORO VALLEY', 'AZ', '85704',
    5, 0.90, '2024-02-29 09:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2761: roaches (SAHUARITA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'SAHUARITA', 'AZ', '85629',
    6, 0.80, '2024-02-28 20:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2759: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '85750',
    4, 0.90, '2024-02-28 18:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2758: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.90, '2024-02-28 15:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2757: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '85033',
    5, 0.75, '2024-02-28 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2756: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85036',
    5, 0.75, '2024-02-28 12:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2755: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-02-28 12:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2754: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85036',
    5, 0.75, '2024-02-28 11:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2753: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2024-02-28 11:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2751: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85345',
    4, 0.90, '2024-02-28 05:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2750: bed_bugs (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Red Rock', 'AZ', '85145',
    5, 0.85, '2024-02-27 21:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2750: bees (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Red Rock', 'AZ', '85145',
    5, 0.85, '2024-02-27 21:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2746: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-02-27 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2745: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85205',
    5, 0.75, '2024-02-27 17:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2744: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    4, 0.85, '2024-02-27 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2744: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.85, '2024-02-27 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2743: ants (GILBERT, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'GILBERT', 'AZ', '85297',
    5, 0.75, '2024-02-27 14:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2741: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85144',
    5, 0.75, '2024-02-27 11:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2737: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85249',
    5, 0.75, '2024-02-27 10:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2736: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-02-27 03:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2735: ants (Maricopa Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Maricopa Arizona', 'AZ', '85139',
    5, 0.75, '2024-02-26 23:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2733: other_pests (Greenville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Greenville', 'AZ', '75401',
    5, 0.75, '2024-02-26 22:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2731: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85737-4612',
    5, 0.75, '2024-02-26 20:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2730: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85244',
    5, 0.75, '2024-02-26 17:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2728: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-02-26 17:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2727: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-02-26 16:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2724: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    6, 0.90, '2024-02-26 14:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2723: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-02-26 14:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2719: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-02-26 12:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2718: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-02-26 12:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2717: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-02-26 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2714: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-02-26 10:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2712: other_pests (Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Az', 'AZ', '85033',
    5, 0.75, '2024-02-26 08:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2710: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    4, 0.75, '2024-02-25 22:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2709: bed_bugs (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mesa', 'AZ', '85208',
    5, 0.85, '2024-02-25 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2709: bees (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Mesa', 'AZ', '85208',
    5, 0.85, '2024-02-25 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2708: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '',
    4, 0.75, '2024-02-25 20:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2707: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-02-25 19:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2704: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    4, 0.75, '2024-02-25 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2701: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-02-25 10:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2700: ants (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Mesa', 'AZ', '85208',
    5, 0.90, '2024-02-25 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2698: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-02-25 03:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2694: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85739',
    4, 0.75, '2024-02-24 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2690: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85706',
    5, 0.90, '2024-02-24 03:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2689: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85737',
    5, 0.75, '2024-02-23 23:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2685: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85748',
    5, 0.75, '2024-02-23 16:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2683: other_pests (VAIL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'VAIL', 'AZ', '85641',
    4, 0.75, '2024-02-23 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2682: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85301',
    5, 0.75, '2024-02-23 12:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2681: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85140',
    5, 0.90, '2024-02-23 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2677: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85714',
    8, 0.85, '2024-02-23 11:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2677: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85714',
    8, 0.85, '2024-02-23 11:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2677: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85714',
    8, 0.85, '2024-02-23 11:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2673: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85234',
    5, 0.75, '2024-02-23 08:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2669: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85014',
    5, 0.75, '2024-02-23 07:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2668: ants (Dallas, Texas, TX)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Dallas, Texas', 'TX', '00000',
    4, 0.85, '2024-02-23 05:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2668: bees (Dallas, Texas, TX)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Dallas, Texas', 'TX', '00000',
    4, 0.85, '2024-02-23 05:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2662: other_pests (Desert hills, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Desert hills', 'AZ', '85086',
    5, 0.75, '2024-02-22 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2659: other_pests (GILBERT, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'GILBERT', 'AZ', '85297',
    4, 0.75, '2024-02-22 13:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2657: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '85015',
    5, 0.75, '2024-02-22 13:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2656: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '85382',
    5, 0.75, '2024-02-22 13:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2655: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85037',
    5, 0.75, '2024-02-22 11:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2654: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-02-22 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2652: ants (Dallas, Texas, TX)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Dallas, Texas', 'TX', '00000',
    4, 0.85, '2024-02-22 08:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2652: bees (Dallas, Texas, TX)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Dallas, Texas', 'TX', '00000',
    4, 0.85, '2024-02-22 08:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2647: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.75, '2024-02-21 19:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2645: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85748',
    5, 0.75, '2024-02-21 10:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2644: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85747',
    5, 0.90, '2024-02-21 10:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2643: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85286',
    5, 0.90, '2024-02-21 08:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2640: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.90, '2024-02-20 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2639: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.90, '2024-02-20 19:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2636: termites (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tempe', 'AZ', '85380',
    5, 0.75, '2024-02-20 16:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2635: bees (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Litchfield Park', 'AZ', '85340',
    5, 0.90, '2024-02-20 15:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2634: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    4, 0.75, '2024-02-20 12:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2633: ants (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Litchfield Park', 'AZ', '85340',
    5, 0.90, '2024-02-20 11:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2632: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    4, 0.75, '2024-02-19 18:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2631: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85032',
    6, 0.90, '2024-02-19 17:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2630: other_pests (Arizona Phoenix., AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona Phoenix.', 'AZ', '85035',
    5, 0.75, '2024-02-19 12:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2629: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85745',
    5, 0.90, '2024-02-19 10:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2628: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85742',
    5, 0.90, '2024-02-18 23:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2627: bees (Tucson ,az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson ,az', 'AZ', '85706',
    6, 0.90, '2024-02-18 17:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2626: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85706',
    5, 0.90, '2024-02-18 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2625: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85212',
    5, 0.90, '2024-02-17 12:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2624: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85033',
    4, 0.75, '2024-02-17 09:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2622: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85009',
    5, 0.75, '2024-02-17 05:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2621: termites (surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'surprise', 'AZ', '85387',
    5, 0.90, '2024-02-17 01:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2620: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85743',
    4, 0.75, '2024-02-16 16:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2619: ants (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Anthem', 'AZ', '85086',
    4, 0.85, '2024-02-16 16:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2619: termites (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Anthem', 'AZ', '85086',
    4, 0.85, '2024-02-16 16:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2618: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '85224',
    5, 0.75, '2024-02-15 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2617: ants (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Anthem', 'AZ', '85086',
    5, 0.90, '2024-02-15 10:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2616: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85714',
    4, 0.75, '2024-02-14 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2615: rodents (Miami, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Miami', 'AZ', '33130',
    4, 0.90, '2024-02-14 10:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2614: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '85023',
    5, 0.75, '2024-02-14 01:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2613: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.90, '2024-02-13 21:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2612: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85008',
    5, 0.90, '2024-02-13 13:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2609: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '85374',
    8, 0.90, '2024-02-12 06:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2608: other_pests (Beswick, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Beswick', 'AZ', '852',
    6, 0.90, '2024-02-12 00:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2607: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    4, 0.75, '2024-02-11 13:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2606: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85086',
    4, 0.85, '2024-02-11 12:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2606: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85086',
    4, 0.85, '2024-02-11 12:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2605: other_pests (Tycson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tycson', 'AZ', '',
    5, 0.75, '2024-02-10 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2603: ants (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Anthem', 'AZ', '85086',
    4, 0.85, '2024-02-09 17:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2603: termites (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Anthem', 'AZ', '85086',
    4, 0.85, '2024-02-09 17:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2602: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85757',
    5, 0.90, '2024-02-08 16:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2601: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '85704',
    6, 0.90, '2024-02-08 12:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2600: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85748',
    5, 0.90, '2024-02-07 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2599: rodents (Kirkland, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Kirkland', 'AZ', '98083',
    5, 0.85, '2024-02-07 18:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2599: termites (Kirkland, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Kirkland', 'AZ', '98083',
    5, 0.85, '2024-02-07 18:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2598: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-02-07 11:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2596: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85742',
    5, 0.90, '2024-02-06 21:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2595: termites (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Avondale', 'AZ', '85323',
    5, 0.75, '2024-02-06 17:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2594: rodents (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Peoria', 'AZ', '85382',
    5, 0.75, '2024-02-06 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2593: rodents (Heber, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Heber', 'AZ', '85928',
    5, 0.75, '2024-02-06 05:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2590: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85140',
    5, 0.75, '2024-02-04 20:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2589: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85747',
    5, 0.90, '2024-02-04 15:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2588: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-02-04 12:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2587: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-02-03 14:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2586: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85705',
    5, 0.75, '2024-02-03 07:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2583: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    5, 0.90, '2024-02-02 08:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2581: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85298',
    5, 0.75, '2024-01-30 21:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2580: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2024-01-30 13:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2579: termites (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Paradise Valley', 'AZ', '85253',
    4, 0.90, '2024-01-30 12:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2578: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '85383',
    4, 0.75, '2024-01-30 10:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2576: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    5, 0.75, '2024-01-29 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2575: other_pests (Thomasville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Thomasville', 'AZ', '27360',
    5, 0.75, '2024-01-29 10:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2574: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    4, 0.75, '2024-01-28 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2573: other_pests (Chittagong.patiya, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chittagong.patiya', 'AZ', '4371',
    5, 0.75, '2024-01-27 10:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2572: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    4, 0.75, '2024-01-25 16:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2571: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85735',
    6, 0.85, '2024-01-23 22:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2571: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85735',
    6, 0.85, '2024-01-23 22:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2568: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    4, 0.90, '2024-01-23 08:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2566: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85020',
    5, 0.75, '2024-01-23 03:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2565: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    4, 0.90, '2024-01-22 16:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2564: termites (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Valley', 'AZ', '85622',
    5, 0.75, '2024-01-22 15:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2563: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85053',
    4, 0.85, '2024-01-22 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2563: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85053',
    4, 0.85, '2024-01-22 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2562: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '85743',
    5, 0.75, '2024-01-22 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2561: other_pests (Xianning, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Xianning', 'AZ', '437000',
    5, 0.75, '2024-01-22 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2560: bees (Tucson Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson Az', 'AZ', '85756',
    5, 0.85, '2024-01-20 20:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2560: termites (Tucson Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson Az', 'AZ', '85756',
    5, 0.85, '2024-01-20 20:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2559: termites (Buckeye AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Buckeye AZ', 'AZ', '85326',
    5, 0.75, '2024-01-20 19:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2557: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '85755',
    5, 0.85, '2024-01-19 11:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2557: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    5, 0.85, '2024-01-19 11:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2555: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2024-01-18 20:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2554: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    4, 0.90, '2024-01-17 16:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2553: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    6, 0.90, '2024-01-17 15:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2552: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85304',
    5, 0.75, '2024-01-17 15:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2551: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85710',
    5, 0.90, '2024-01-17 14:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2550: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2024-01-17 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2549: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85704',
    5, 0.85, '2024-01-17 10:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2549: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.85, '2024-01-17 10:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2547: other_pests (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Maricopa', 'AZ', '85139',
    5, 0.75, '2024-01-16 16:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2546: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '85301',
    5, 0.75, '2024-01-16 02:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2545: ants (Olympia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Olympia', 'AZ', '98502',
    4, 0.85, '2024-01-15 19:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2545: termites (Olympia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Olympia', 'AZ', '98502',
    4, 0.85, '2024-01-15 19:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2544: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2024-01-15 12:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2543: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-01-15 00:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2542: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '85033',
    5, 0.75, '2024-01-14 20:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2541: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-01-14 15:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2540: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85742',
    7, 0.85, '2024-01-14 08:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2540: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85742',
    7, 0.85, '2024-01-14 08:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2539: bed_bugs (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'tucson', 'AZ', '85711',
    5, 0.90, '2024-01-14 04:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2538: other_pests (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Cave Creek', 'AZ', '85331',
    4, 0.75, '2024-01-12 15:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2537: other_pests (-, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '-', 'AZ', '',
    5, 0.90, '2024-01-11 23:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2536: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85023',
    5, 0.75, '2024-01-11 21:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2535: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-01-11 12:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2534: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-01-11 10:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2533: ants (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson, AZ', 'AZ', '85712',
    6, 0.85, '2024-01-10 19:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2533: rodents (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson, AZ', 'AZ', '85712',
    6, 0.85, '2024-01-10 19:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2532: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85017',
    5, 0.75, '2024-01-10 18:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2531: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-01-08 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2529: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '85006',
    5, 0.75, '2024-01-06 21:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2528: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    4, 0.75, '2024-01-06 13:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2527: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85712',
    5, 0.85, '2024-01-05 21:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2527: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85712',
    5, 0.85, '2024-01-05 21:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2526: bees (Hereford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Hereford', 'AZ', '85615',
    8, 0.85, '2024-01-05 09:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2526: roaches (Hereford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Hereford', 'AZ', '85615',
    8, 0.85, '2024-01-05 09:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2525: bees (Hereford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Hereford', 'AZ', '85615',
    8, 0.85, '2024-01-05 09:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2525: roaches (Hereford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Hereford', 'AZ', '85615',
    8, 0.85, '2024-01-05 09:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2524: other_pests (Amargoza, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Amargoza', 'AZ', '89020',
    5, 0.75, '2024-01-05 01:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2523: termites (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Casa Grande', 'AZ', '85122',
    5, 0.90, '2024-01-04 15:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2522: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85017',
    5, 0.75, '2024-01-04 09:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2520: ants (Queen Cfreek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Queen Cfreek', 'AZ', '85142',
    5, 0.85, '2024-01-03 09:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2520: termites (Queen Cfreek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Cfreek', 'AZ', '85142',
    5, 0.85, '2024-01-03 09:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2519: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85020',
    5, 0.75, '2024-01-03 02:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2518: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-01-01 14:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2517: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85006',
    5, 0.75, '2024-01-01 06:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2516: termites (Tucson AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson AZ', 'AZ', '85743',
    5, 0.90, '2023-12-29 20:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2515: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85730',
    5, 0.75, '2023-12-28 16:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2514: termites (sun city west, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'sun city west', 'AZ', '85375',
    5, 0.90, '2023-12-28 15:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2513: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85712',
    5, 0.75, '2023-12-28 03:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2512: bed_bugs (Apache Junction, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Apache Junction', 'AZ', '85120',
    5, 0.90, '2023-12-27 18:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2511: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    6, 0.90, '2023-12-27 07:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2510: termites (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Tan Valley', 'AZ', '85143',
    5, 0.75, '2023-12-26 18:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2509: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '85602',
    5, 0.75, '2023-12-26 12:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2508: ants (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Las Vegas', 'AZ', '89117',
    5, 0.85, '2023-12-26 07:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2508: rodents (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Las Vegas', 'AZ', '89117',
    5, 0.85, '2023-12-26 07:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2507: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85003',
    5, 0.75, '2023-12-23 09:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2506: other_pests (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MARANA', 'AZ', '85658',
    4, 0.75, '2023-12-22 23:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2505: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85741',
    6, 0.80, '2023-12-22 21:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2504: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85711',
    5, 0.75, '2023-12-22 00:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2503: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    6, 0.75, '2023-12-21 21:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2502: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85086',
    6, 0.85, '2023-12-21 09:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2502: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85086',
    6, 0.85, '2023-12-21 09:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2502: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85086',
    6, 0.85, '2023-12-21 09:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2501: rodents (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Benson', 'AZ', '85602',
    5, 0.90, '2023-12-21 08:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2500: bed_bugs (Brooklyn Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Brooklyn Park', 'AZ', '83637',
    5, 0.75, '2023-12-20 07:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2499: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704-6200',
    5, 0.75, '2023-12-20 07:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2497: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85017',
    5, 0.85, '2023-12-20 03:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2497: beetles (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Phoenix', 'AZ', '85017',
    5, 0.85, '2023-12-20 03:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2496: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2023-12-19 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2495: ants (Arizona City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Arizona City', 'AZ', '85123',
    5, 0.85, '2023-12-19 13:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2495: termites (Arizona City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Arizona City', 'AZ', '85123',
    5, 0.85, '2023-12-19 13:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2493: ants (Arizona City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Arizona City', 'AZ', '85123',
    5, 0.85, '2023-12-18 15:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2493: termites (Arizona City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Arizona City', 'AZ', '85123',
    5, 0.85, '2023-12-18 15:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2491: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.75, '2023-12-15 10:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2490: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.75, '2023-12-14 20:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2489: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85255',
    5, 0.75, '2023-12-14 16:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2488: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.90, '2023-12-14 16:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2486: termites (Cape Coral, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Cape Coral', 'AZ', '33914',
    5, 0.75, '2023-12-13 14:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2485: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2023-12-13 13:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2484: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.90, '2023-12-12 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2483: other_pests (San Felipe Pueblo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Felipe Pueblo', 'AZ', '87001',
    5, 0.75, '2023-12-12 07:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2482: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85718',
    5, 0.75, '2023-12-11 13:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2481: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85718',
    5, 0.85, '2023-12-11 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2481: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85718',
    5, 0.85, '2023-12-11 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2480: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85201',
    5, 0.75, '2023-12-11 06:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2479: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2023-12-10 21:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2478: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85750',
    5, 0.85, '2023-12-08 18:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2478: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85750',
    5, 0.85, '2023-12-08 18:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2477: ants (Prussia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Prussia', 'AZ', '19406',
    5, 0.85, '2023-12-08 10:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2477: termites (Prussia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Prussia', 'AZ', '19406',
    5, 0.85, '2023-12-08 10:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2476: ants (Prussia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Prussia', 'AZ', '19406',
    5, 0.85, '2023-12-08 10:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2476: termites (Prussia, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Prussia', 'AZ', '19406',
    5, 0.85, '2023-12-08 10:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2475: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    6, 0.80, '2023-12-08 00:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2474: other_pests (Phionix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phionix', 'AZ', '85033',
    5, 0.75, '2023-12-07 15:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2473: other_pests (YumaI88I88I M, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'YumaI88I88I M', 'AZ', '',
    5, 0.75, '2023-12-07 15:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2468: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.90, '2023-12-06 21:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2467: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '85043',
    5, 0.75, '2023-12-06 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2466: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85713',
    5, 0.85, '2023-12-05 22:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2466: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85713',
    5, 0.85, '2023-12-05 22:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2465: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85037',
    5, 0.75, '2023-12-05 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2464: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.90, '2023-12-05 07:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2463: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.90, '2023-12-05 07:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2462: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2023-12-04 23:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2461: rodents (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Oro Valley', 'AZ', '85755-6092',
    4, 0.85, '2023-12-04 15:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2461: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755-6092',
    4, 0.85, '2023-12-04 15:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2460: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653',
    4, 0.75, '2023-12-03 14:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2459: ants (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Peoria', 'AZ', '85383',
    5, 0.85, '2023-12-01 23:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2459: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85383',
    5, 0.85, '2023-12-01 23:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2458: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2023-12-01 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2458: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2023-12-01 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2456: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85742',
    8, 0.85, '2023-11-30 19:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2456: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    8, 0.85, '2023-11-30 19:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2455: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.90, '2023-11-30 19:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2453: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85719',
    6, 0.80, '2023-11-29 17:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2452: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85288',
    4, 0.75, '2023-11-29 11:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2451: ants (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gilbert', 'AZ', '85295',
    6, 0.85, '2023-11-28 16:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2451: bees (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Gilbert', 'AZ', '85295',
    6, 0.85, '2023-11-28 16:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2448: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85757',
    4, 0.90, '2023-11-27 17:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2447: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-11-27 14:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2446: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.90, '2023-11-27 09:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2445: bed_bugs (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Gilbert', 'AZ', '85297',
    5, 0.90, '2023-11-27 09:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2444: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85716',
    6, 0.85, '2023-11-27 00:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2444: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85716',
    6, 0.85, '2023-11-27 00:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2444: ticks (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Tucson', 'AZ', '85716',
    6, 0.85, '2023-11-27 00:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2443: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85716',
    8, 0.85, '2023-11-27 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2443: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85716',
    8, 0.85, '2023-11-27 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2443: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85716',
    8, 0.85, '2023-11-27 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2443: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '85716',
    8, 0.85, '2023-11-27 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2442: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-11-21 17:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2441: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2023-11-21 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2440: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.90, '2023-11-21 12:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2439: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85747',
    5, 0.85, '2023-11-20 10:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2439: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85747',
    5, 0.85, '2023-11-20 10:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2438: termites (Fountain Hills, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Fountain Hills', 'AZ', '85268',
    5, 0.75, '2023-11-20 08:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2437: ants (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gilbert', 'AZ', '85298',
    5, 0.85, '2023-11-19 16:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2437: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85298',
    5, 0.85, '2023-11-19 16:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2436: mosquitoes (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Glendale', 'AZ', '85308',
    5, 0.85, '2023-11-19 15:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2436: scorpions (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Glendale', 'AZ', '85308',
    5, 0.85, '2023-11-19 15:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2434: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2023-11-18 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2433: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2023-11-17 21:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2432: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85706',
    5, 0.75, '2023-11-17 16:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2431: termites (New River, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'New River', 'AZ', '85087',
    5, 0.90, '2023-11-17 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2430: termites (Vail, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail, AZ', 'AZ', '85641',
    4, 0.75, '2023-11-17 09:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2429: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85212',
    5, 0.75, '2023-11-16 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2428: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85304',
    5, 0.75, '2023-11-15 14:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2427: other_pests (Arizona tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona tolleson', 'AZ', '85353',
    5, 0.75, '2023-11-15 12:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2426: other_pests (Se, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Se', 'AZ', '39008',
    5, 0.75, '2023-11-15 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2425: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85201',
    5, 0.75, '2023-11-15 00:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2424: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    6, 0.90, '2023-11-14 15:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2423: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.90, '2023-11-14 10:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2422: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2023-11-14 10:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2421: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85282',
    5, 0.75, '2023-11-14 00:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2419: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-11-13 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2418: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2023-11-13 00:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2417: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2023-11-13 00:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2416: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    5, 0.75, '2023-11-13 00:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2415: bed_bugs (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Chandler', 'AZ', '85286',
    8, 0.90, '2023-11-12 12:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2414: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85747',
    5, 0.75, '2023-11-12 10:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2412: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '85704-1089',
    5, 0.75, '2023-11-11 10:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2411: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85302',
    5, 0.75, '2023-11-11 05:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2410: bed_bugs (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mesa', 'AZ', '85201',
    5, 0.75, '2023-11-10 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2409: bed_bugs (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mesa', 'AZ', '85201',
    5, 0.75, '2023-11-10 17:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2408: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2023-11-10 08:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2407: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2023-11-10 02:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2406: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    5, 0.90, '2023-11-09 15:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2405: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-11-08 07:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2404: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85301',
    5, 0.75, '2023-11-08 04:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2403: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85739',
    5, 0.75, '2023-11-07 14:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2402: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85745',
    5, 0.90, '2023-11-07 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2401: other_pests (Pohenix, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Pohenix', 'CO', '8050',
    5, 0.75, '2023-11-07 00:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2400: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85747',
    5, 0.85, '2023-11-06 22:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2400: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '85747',
    5, 0.85, '2023-11-06 22:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2399: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718-7431',
    5, 0.75, '2023-11-06 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2398: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2023-11-06 00:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2397: rodents (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Casa Grande', 'AZ', '85122',
    5, 0.75, '2023-11-05 20:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2395: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.85, '2023-11-04 19:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2395: ticks (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Tucson', 'AZ', '85743',
    5, 0.85, '2023-11-04 19:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2394: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85716',
    6, 0.90, '2023-11-04 00:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2393: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2023-11-03 14:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2392: termites (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Tan Valley', 'AZ', '85143',
    5, 0.75, '2023-11-02 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2391: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2390: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2389: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2388: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2387: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2386: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2385: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2384: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2383: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2382: other_pests (nwsjenakgl, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'nwsjenakgl', 'AZ', '',
    5, 0.75, '2023-11-02 17:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2381: other_pests (Phoenick, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenick', 'AZ', '85051',
    5, 0.75, '2023-11-02 14:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2380: termites (Marana, AZ 85653-9176, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana, AZ 85653-9176', 'AZ', '85653-9176',
    5, 0.75, '2023-11-01 18:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2379: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85714',
    5, 0.75, '2023-11-01 13:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2378: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85707',
    5, 0.75, '2023-11-01 03:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2377: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2023-11-01 02:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2376: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85747',
    5, 0.75, '2023-10-31 21:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2375: termites (Lake Havasu city, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Lake Havasu city', 'AZ', '86406',
    5, 0.75, '2023-10-31 20:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2374: other_pests (Lake Havasu city, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lake Havasu city', 'AZ', '86406',
    5, 0.75, '2023-10-31 20:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2373: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85248',
    4, 0.75, '2023-10-31 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2372: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    5, 0.90, '2023-10-31 00:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2371: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '85033',
    5, 0.75, '2023-10-30 17:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2370: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2023-10-30 13:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2369: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    6, 0.85, '2023-10-30 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2369: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85705',
    6, 0.85, '2023-10-30 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2367: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2023-10-29 20:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2366: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2023-10-29 16:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2365: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    5, 0.85, '2023-10-29 15:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2365: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.85, '2023-10-29 15:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2363: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '85009',
    5, 0.75, '2023-10-29 01:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2362: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85757',
    5, 0.85, '2023-10-29 00:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2362: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85757',
    5, 0.85, '2023-10-29 00:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2362: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85757',
    5, 0.85, '2023-10-29 00:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2361: rodents (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Vail', 'AZ', '85641',
    5, 0.75, '2023-10-28 23:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2360: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    4, 0.75, '2023-10-28 08:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2359: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    4, 0.75, '2023-10-28 08:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2358: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-10-28 01:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2358: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-10-28 01:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2357: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2023-10-27 23:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2356: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2023-10-27 18:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2355: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    4, 0.75, '2023-10-27 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2354: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85730',
    5, 0.90, '2023-10-27 15:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2353: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '85033',
    5, 0.75, '2023-10-27 07:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2352: bed_bugs (Tucson AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson AZ', 'AZ', '85719',
    5, 0.75, '2023-10-26 03:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2351: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2023-10-25 19:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2350: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85737',
    5, 0.90, '2023-10-25 15:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2348: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85018',
    5, 0.75, '2023-10-25 11:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2347: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85746',
    4, 0.90, '2023-10-24 15:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2346: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    5, 0.90, '2023-10-24 12:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2345: ants (Jersey City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Jersey City', 'AZ', '07304',
    4, 0.75, '2023-10-24 11:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2344: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85712',
    5, 0.75, '2023-10-24 11:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2343: roaches (Sun City West, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Sun City West', 'AZ', '85375',
    5, 0.75, '2023-10-24 02:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2342: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85043',
    5, 0.75, '2023-10-23 23:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2341: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '85379',
    5, 0.75, '2023-10-23 21:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2340: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85749',
    4, 0.75, '2023-10-23 11:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2339: bed_bugs (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Benson', 'AZ', '85602',
    5, 0.90, '2023-10-23 06:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2338: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85658',
    5, 0.90, '2023-10-22 23:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2337: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-10-22 16:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2337: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-10-22 16:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2336: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-10-22 00:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2335: bed_bugs (Los Angeles, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Los Angeles', 'AZ', '90022',
    5, 0.75, '2023-10-21 02:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2334: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    4, 0.75, '2023-10-20 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2333: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.90, '2023-10-19 18:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2332: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    5, 0.90, '2023-10-19 17:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2331: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.90, '2023-10-19 16:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2330: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85757',
    5, 0.85, '2023-10-19 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2330: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85757',
    5, 0.85, '2023-10-19 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2329: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2023-10-19 13:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2328: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '85017',
    5, 0.75, '2023-10-19 05:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2327: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2023-10-19 03:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2327: termites (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'California', 'AZ', '92618',
    5, 0.85, '2023-10-19 03:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2326: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-10-18 22:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2325: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705',
    4, 0.90, '2023-10-18 16:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2324: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85281',
    5, 0.75, '2023-10-18 11:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2323: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85281',
    5, 0.75, '2023-10-18 11:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2322: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    4, 0.75, '2023-10-18 11:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2321: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    4, 0.90, '2023-10-18 10:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2320: termites (glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'glendale', 'AZ', '',
    5, 0.75, '2023-10-17 21:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2319: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    4, 0.75, '2023-10-17 18:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2318: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85009',
    5, 0.75, '2023-10-17 10:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2317: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    5, 0.75, '2023-10-17 09:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2316: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85745',
    4, 0.85, '2023-10-16 18:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2316: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    4, 0.85, '2023-10-16 18:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2315: other_pests (Tucson az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson az', 'AZ', '85746',
    5, 0.75, '2023-10-16 16:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2314: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85718',
    9, 0.75, '2023-10-16 12:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2313: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    5, 0.75, '2023-10-16 11:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2312: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    4, 0.75, '2023-10-16 11:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2311: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2023-10-16 11:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2310: roaches (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Oro Valley', 'AZ', '85737',
    5, 0.85, '2023-10-15 22:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2310: scorpions (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Oro Valley', 'AZ', '85737',
    5, 0.85, '2023-10-15 22:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2309: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    5, 0.75, '2023-10-14 20:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2308: other_pests (Sahaurita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahaurita', 'AZ', '85629',
    5, 0.90, '2023-10-14 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2307: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2023-10-14 03:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2306: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85706',
    5, 0.75, '2023-10-13 15:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2304: ants (Laveen AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Laveen AZ', 'AZ', '85339',
    5, 0.75, '2023-10-13 04:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2303: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85705-1221',
    5, 0.75, '2023-10-12 18:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2302: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85757',
    4, 0.75, '2023-10-12 10:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2301: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85083',
    5, 0.75, '2023-10-11 22:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2300: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85705',
    5, 0.75, '2023-10-11 19:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2299: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '85658',
    8, 0.85, '2023-10-09 20:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2299: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    8, 0.85, '2023-10-09 20:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2298: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85755',
    4, 0.75, '2023-10-09 19:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2297: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    9, 0.90, '2023-10-09 01:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2296: scorpions (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'TUCSON', 'AZ', '85712-5742',
    5, 0.90, '2023-10-08 23:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2295: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2023-10-08 22:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2294: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    6, 0.80, '2023-10-08 21:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2293: other_pests (Albuquerque, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Albuquerque', 'AZ', '87122',
    5, 0.75, '2023-10-08 15:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2292: bees (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Litchfield Park', 'AZ', '85340',
    5, 0.90, '2023-10-07 23:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2291: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    5, 0.90, '2023-10-06 21:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2290: other_pests (Phoenix Az., AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az.', 'AZ', '85009',
    5, 0.75, '2023-10-06 14:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2289: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85009',
    5, 0.75, '2023-10-06 14:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2288: crickets (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Peoria', 'AZ', '85382-5004',
    6, 0.85, '2023-10-06 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2288: spiders (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Peoria', 'AZ', '85382-5004',
    6, 0.85, '2023-10-06 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2287: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2286: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2285: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2284: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2283: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2282: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2281: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2280: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2279: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2278: bed_bugs (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2277: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2276: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2275: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2273: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2272: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2271: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2270: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2269: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2268: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2267: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2266: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2265: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2264: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2263: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2262: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2261: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2260: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2259: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2258: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2257: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2256: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2255: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2254: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2253: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 04:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2252: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2251: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2250: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2249: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2248: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2247: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2246: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2245: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2244: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2243: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2242: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2241: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2240: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2239: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2238: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2237: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2236: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2235: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2234: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2233: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2232: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2231: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2230: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2229: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2228: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2227: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2226: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2225: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2224: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2223: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2222: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2221: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2220: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2219: termites (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2218: bed_bugs (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2217: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2216: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2215: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2214: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2213: other_pests (porvgmgwkz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'porvgmgwkz', 'AZ', '',
    5, 0.75, '2023-10-06 03:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2212: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    4, 0.75, '2023-10-06 00:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2211: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2023-10-05 19:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2210: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2023-10-05 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2208: roaches (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Goodyear', 'AZ', '85395',
    5, 0.90, '2023-10-04 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2207: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85087',
    5, 0.75, '2023-10-04 12:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2206: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85203',
    5, 0.75, '2023-10-04 09:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2205: termites (queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'queen creek', 'AZ', '85142',
    5, 0.90, '2023-10-03 16:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2204: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85719',
    5, 0.85, '2023-10-03 14:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2204: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85719',
    5, 0.85, '2023-10-03 14:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2203: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.90, '2023-10-02 22:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2202: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    4, 0.75, '2023-10-02 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2200: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '85202-8045',
    5, 0.90, '2023-09-30 21:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2199: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85739',
    5, 0.85, '2023-09-30 20:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2199: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85739',
    5, 0.85, '2023-09-30 20:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2198: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85737',
    6, 0.90, '2023-09-30 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2197: other_pests (Palm Desert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Palm Desert', 'AZ', '85755',
    4, 0.75, '2023-09-29 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2196: spiders (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Vail', 'AZ', '85641',
    5, 0.85, '2023-09-29 16:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2196: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.85, '2023-09-29 16:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2193: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-09-28 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2191: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85003',
    5, 0.75, '2023-09-27 23:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2190: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '85023',
    5, 0.75, '2023-09-27 22:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2189: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.90, '2023-09-27 17:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2188: termites (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Goodyear', 'AZ', '85338',
    4, 0.90, '2023-09-27 16:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2187: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85012',
    5, 0.75, '2023-09-27 15:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2186: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85704',
    5, 0.75, '2023-09-27 15:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2185: bees (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Litchfield Park', 'AZ', '85340',
    6, 0.80, '2023-09-26 20:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2184: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85305',
    5, 0.75, '2023-09-26 18:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2183: rodents (Pine, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Pine', 'AZ', '',
    5, 0.75, '2023-09-26 13:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2181: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85653',
    5, 0.75, '2023-09-25 18:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2180: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2023-09-25 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2179: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85746',
    5, 0.85, '2023-09-25 13:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2179: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.85, '2023-09-25 13:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2178: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85658',
    6, 0.90, '2023-09-24 18:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2177: wildlife (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Glendale', 'AZ', '85304',
    5, 0.90, '2023-09-24 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2176: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2023-09-23 20:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2175: ants (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gilbert', 'AZ', '85296',
    9, 0.85, '2023-09-22 20:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2175: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85296',
    9, 0.85, '2023-09-22 20:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2174: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2023-09-22 11:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2172: bees (Qc, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Qc', 'AZ', '85142',
    5, 0.75, '2023-09-21 18:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2171: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85308',
    4, 0.75, '2023-09-21 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2170: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85017',
    5, 0.90, '2023-09-21 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2169: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2023-09-21 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2168: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '85023',
    5, 0.75, '2023-09-21 08:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2167: other_pests (Oro Valley, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley, AZ', 'AZ', '85755',
    5, 0.75, '2023-09-20 22:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2166: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-09-20 14:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2165: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2023-09-20 09:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2164: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85282',
    5, 0.75, '2023-09-19 11:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2163: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-09-19 08:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2162: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85713',
    9, 0.75, '2023-09-19 04:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2160: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '85710',
    5, 0.75, '2023-09-18 17:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2159: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85012',
    6, 0.80, '2023-09-18 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2158: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2023-09-18 12:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2157: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85748',
    4, 0.75, '2023-09-18 10:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2156: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2023-09-18 06:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2156: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2023-09-18 06:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2155: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2023-09-18 06:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2155: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2023-09-18 06:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2154: ants (Tucson, Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson, Az', 'AZ', '85757',
    5, 0.85, '2023-09-17 20:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2154: spiders (Tucson, Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson, Az', 'AZ', '85757',
    5, 0.85, '2023-09-17 20:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2153: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85735',
    6, 0.90, '2023-09-17 18:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2152: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2023-09-17 14:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2151: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.90, '2023-09-17 11:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2150: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    8, 0.85, '2023-09-17 03:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2150: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85704',
    8, 0.85, '2023-09-17 03:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2150: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85704',
    8, 0.85, '2023-09-17 03:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2149: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2023-09-17 02:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2148: other_pests (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Ajo', 'AZ', '85321',
    5, 0.75, '2023-09-17 02:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2147: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85085',
    5, 0.90, '2023-09-16 22:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2146: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    4, 0.85, '2023-09-16 18:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2146: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    4, 0.85, '2023-09-16 18:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2145: other_pests (Phoenix. Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix. Az', 'AZ', '85033',
    5, 0.75, '2023-09-16 01:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2144: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85704',
    6, 0.90, '2023-09-15 23:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2143: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85757',
    5, 0.75, '2023-09-15 23:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2142: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85704',
    6, 0.90, '2023-09-15 17:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2141: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    5, 0.75, '2023-09-15 13:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2139: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2023-09-14 22:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2138: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.75, '2023-09-14 18:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2137: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '85023',
    5, 0.75, '2023-09-14 12:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2136: other_pests (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Avondale', 'AZ', '85323',
    5, 0.75, '2023-09-14 12:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2135: other_pests (Nordenn y la 23, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Nordenn y la 23', 'AZ', '85021',
    5, 0.75, '2023-09-14 00:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2133: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '85023',
    5, 0.75, '2023-09-13 09:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2131: flies (Oskaloosa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Oskaloosa', 'AZ', '52577',
    4, 0.85, '2023-09-12 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2131: termites (Oskaloosa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oskaloosa', 'AZ', '52577',
    4, 0.85, '2023-09-12 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2130: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    4, 0.75, '2023-09-12 07:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2129: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85040',
    5, 0.75, '2023-09-12 07:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2128: ants (Raleigh, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Raleigh', 'AZ', '27610',
    6, 0.85, '2023-09-12 01:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2128: roaches (Raleigh, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Raleigh', 'AZ', '27610',
    6, 0.85, '2023-09-12 01:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2128: rodents (Raleigh, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Raleigh', 'AZ', '27610',
    6, 0.85, '2023-09-12 01:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2127: rodents (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2023-09-11 17:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2126: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-09-11 16:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2126: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-09-11 16:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2125: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '85021',
    5, 0.75, '2023-09-11 16:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2124: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '85021',
    5, 0.75, '2023-09-11 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2123: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2023-09-11 15:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2122: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85714',
    4, 0.90, '2023-09-11 14:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2121: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2023-09-11 14:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2120: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    6, 0.85, '2023-09-11 12:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2120: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    6, 0.85, '2023-09-11 12:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2119: termites (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Valley', 'AZ', '85614',
    5, 0.75, '2023-09-11 11:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2118: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85719',
    5, 0.75, '2023-09-10 22:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2117: other_pests (Tuscon Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tuscon Arizona', 'AZ', '84706',
    5, 0.75, '2023-09-10 20:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2115: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2023-09-10 19:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2114: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2023-09-10 15:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2113: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85741',
    5, 0.85, '2023-09-10 11:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2113: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.85, '2023-09-10 11:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2112: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.90, '2023-09-09 15:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2107: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.90, '2023-09-09 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2106: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85704',
    5, 0.75, '2023-09-09 11:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2105: other_pests (Saddlebrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Saddlebrooke', 'AZ', '85739',
    5, 0.75, '2023-09-09 10:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2104: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    4, 0.75, '2023-09-09 03:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2103: other_pests (AJO, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'AJO', 'AZ', '85321',
    5, 0.75, '2023-09-08 23:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2102: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85204',
    5, 0.75, '2023-09-08 00:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2101: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    4, 0.75, '2023-09-07 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2100: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85757',
    5, 0.75, '2023-09-07 11:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2099: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85383',
    4, 0.90, '2023-09-06 18:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2098: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-09-06 14:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2098: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-09-06 14:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2096: termites (North scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'North scottsdale', 'AZ', '85266',
    6, 0.90, '2023-09-06 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2095: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    5, 0.85, '2023-09-06 11:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2095: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    5, 0.85, '2023-09-06 11:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2094: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2023-09-05 23:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2094: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2023-09-05 23:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2093: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '85742',
    6, 0.90, '2023-09-05 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2092: ants (4416, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '4416', 'AZ', '',
    5, 0.75, '2023-09-05 18:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2090: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-09-05 16:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2089: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2023-09-05 15:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2088: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    4, 0.75, '2023-09-05 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2087: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    8, 0.85, '2023-09-05 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2087: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    8, 0.85, '2023-09-05 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2086: termites (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson, AZ', 'AZ', '85756',
    4, 0.75, '2023-09-05 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2085: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '85009',
    5, 0.75, '2023-09-05 12:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2084: roaches (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Chandler', 'AZ', '85248',
    5, 0.90, '2023-09-05 11:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2083: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85003',
    5, 0.75, '2023-09-05 01:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2082: bees (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Gilbert', 'AZ', '85233',
    5, 0.90, '2023-09-04 13:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2081: ticks (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'TUCSON', 'AZ', '85701',
    5, 0.75, '2023-09-04 04:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2080: termites (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'PHOENIX', 'AZ', '85015',
    5, 0.75, '2023-09-04 01:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2079: termites (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'PHOENIX', 'AZ', '85015',
    5, 0.75, '2023-09-04 01:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2078: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-09-03 23:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2077: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    8, 0.90, '2023-09-03 19:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2076: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    6, 0.90, '2023-09-03 09:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2075: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '85033',
    5, 0.75, '2023-09-03 02:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2074: other_pests (Chandler Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler Arizona', 'AZ', '85225',
    5, 0.75, '2023-09-03 02:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2073: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85711',
    5, 0.90, '2023-09-02 22:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2071: other_pests (Apache junction Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Apache junction Arizona', 'AZ', '85119',
    5, 0.75, '2023-09-01 08:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2070: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-09-01 06:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2069: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2023-09-01 00:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2068: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85037',
    5, 0.75, '2023-08-31 15:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2067: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    6, 0.85, '2023-08-31 11:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2067: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653',
    6, 0.85, '2023-08-31 11:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2066: bees (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Cave Creek', 'AZ', '85331',
    4, 0.85, '2023-08-31 06:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2066: rodents (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Cave Creek', 'AZ', '85331',
    4, 0.85, '2023-08-31 06:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2065: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2023-08-31 05:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2064: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2023-08-31 03:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2063: ants (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale', 'AZ', '85260',
    5, 0.90, '2023-08-30 22:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2060: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    5, 0.75, '2023-08-30 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2059: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85711',
    5, 0.75, '2023-08-30 00:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2058: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    5, 0.75, '2023-08-29 23:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2057: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85040',
    5, 0.90, '2023-08-29 19:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2056: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.90, '2023-08-29 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2055: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85051',
    5, 0.75, '2023-08-29 12:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2054: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '85323',
    5, 0.75, '2023-08-29 09:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2053: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '85323',
    5, 0.75, '2023-08-29 09:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2052: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '85323',
    5, 0.75, '2023-08-29 09:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2051: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    9, 0.85, '2023-08-28 23:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2051: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    9, 0.85, '2023-08-28 23:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2050: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    9, 0.85, '2023-08-28 23:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2050: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    9, 0.85, '2023-08-28 23:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2049: termites (Rio Rico, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Rio Rico', 'AZ', '85648',
    8, 0.90, '2023-08-28 22:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2048: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85711',
    5, 0.75, '2023-08-28 20:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2047: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.75, '2023-08-28 15:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2045: scorpions (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2023-08-28 14:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2044: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2023-08-28 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2043: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85015',
    4, 0.75, '2023-08-28 06:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2042: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    5, 0.85, '2023-08-27 21:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2042: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    5, 0.85, '2023-08-27 21:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2041: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85704',
    4, 0.85, '2023-08-27 20:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2041: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    4, 0.85, '2023-08-27 20:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2040: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.85, '2023-08-27 06:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2040: moths (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Tucson', 'AZ', '85706',
    5, 0.85, '2023-08-27 06:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2039: other_pests (Nogales arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Nogales arizona', 'AZ', '85621',
    5, 0.75, '2023-08-26 20:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2038: other_pests (Prewitt New Mexico, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Prewitt New Mexico', 'AZ', '87045',
    5, 0.75, '2023-08-26 18:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2037: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85014',
    6, 0.85, '2023-08-25 15:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2037: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85014',
    6, 0.85, '2023-08-25 15:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2035: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85756',
    4, 0.75, '2023-08-25 13:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2034: other_pests (Huntsville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Huntsville', 'AZ', '35004',
    5, 0.75, '2023-08-25 06:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2033: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85730',
    5, 0.90, '2023-08-25 05:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2032: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85714',
    5, 0.90, '2023-08-25 04:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2031: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85015',
    5, 0.75, '2023-08-24 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2030: bees (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'tucson', 'AZ', '85715',
    5, 0.85, '2023-08-24 13:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2030: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '85715',
    5, 0.85, '2023-08-24 13:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2029: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2023-08-24 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2028: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85719',
    6, 0.90, '2023-08-24 00:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2027: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.90, '2023-08-23 23:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2026: ants (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gilbert', 'AZ', '85233',
    4, 0.85, '2023-08-23 20:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2026: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85233',
    4, 0.85, '2023-08-23 20:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2025: rodents (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Glendale', 'AZ', '85308',
    5, 0.85, '2023-08-22 23:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2025: ticks (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Glendale', 'AZ', '85308',
    5, 0.85, '2023-08-22 23:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2024: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85202',
    5, 0.75, '2023-08-22 21:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2023: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '85387',
    5, 0.75, '2023-08-22 19:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2022: other_pests (Carlsbad, CA, CA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Carlsbad, CA', 'CA', '92008',
    5, 0.90, '2023-08-22 08:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2021: ants (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2023-08-21 13:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2020: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '85207',
    5, 0.90, '2023-08-21 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2019: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2019: termites (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2018: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2018: termites (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2016: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2016: termites (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2017: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2017: termites (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'California', 'AZ', '92618',
    5, 0.85, '2023-08-21 05:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2015: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85737',
    5, 0.75, '2023-08-21 02:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2014: other_pests (Hobbs, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Hobbs', 'AZ', '',
    5, 0.75, '2023-08-20 10:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2013: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85042',
    5, 0.75, '2023-08-20 07:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2012: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '85027',
    5, 0.75, '2023-08-20 01:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2011: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85757',
    5, 0.85, '2023-08-19 19:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2011: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85757',
    5, 0.85, '2023-08-19 19:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2010: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85032',
    5, 0.75, '2023-08-19 18:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2009: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2023-08-19 16:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2008: ants (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale', 'AZ', '85254',
    6, 0.85, '2023-08-19 12:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2008: bees (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Scottsdale', 'AZ', '85254',
    6, 0.85, '2023-08-19 12:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 2008: spiders (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Scottsdale', 'AZ', '85254',
    6, 0.85, '2023-08-19 12:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2005: rodents (SaddleBrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'SaddleBrooke', 'AZ', '85739',
    6, 0.90, '2023-08-17 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2004: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85015',
    5, 0.75, '2023-08-17 14:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2003: rodents (Orlando, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Orlando', 'AZ', '32801',
    5, 0.90, '2023-08-17 10:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2001: roaches (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Scottsdale', 'AZ', '85254',
    5, 0.75, '2023-08-16 10:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 2000: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.75, '2023-08-15 23:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1999: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2023-08-15 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1999: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2023-08-15 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1999: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2023-08-15 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1999: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2023-08-15 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1998: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-08-15 14:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1997: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85714',
    5, 0.75, '2023-08-15 00:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1996: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85714',
    5, 0.75, '2023-08-15 00:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1995: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2023-08-14 11:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1994: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-08-14 11:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1994: ticks (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Tucson', 'AZ', '85712',
    5, 0.85, '2023-08-14 11:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1993: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2023-08-14 11:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1992: other_pests (Mesa az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa az', 'AZ', '85201',
    5, 0.75, '2023-08-13 23:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1991: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.90, '2023-08-13 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1990: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2023-08-13 18:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1989: other_pests (Tucson Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Arizona', 'AZ', '8571',
    5, 0.75, '2023-08-13 15:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1988: other_pests (Tucson Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Arizona', 'AZ', '8571',
    5, 0.75, '2023-08-13 12:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1987: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85730',
    5, 0.85, '2023-08-13 11:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1987: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.85, '2023-08-13 11:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1986: mosquitoes (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'TUCSON', 'AZ', '85712',
    5, 0.75, '2023-08-12 20:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1984: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    4, 0.75, '2023-08-12 14:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1983: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2023-08-12 01:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1982: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85031',
    5, 0.75, '2023-08-11 17:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1981: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85035',
    5, 0.75, '2023-08-11 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1980: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85035',
    5, 0.90, '2023-08-11 16:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1979: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85033',
    4, 0.75, '2023-08-11 12:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1978: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85033',
    4, 0.75, '2023-08-11 12:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1977: ants (San Manuel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'San Manuel', 'AZ', '85631',
    6, 0.85, '2023-08-11 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1977: spiders (San Manuel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'San Manuel', 'AZ', '85631',
    6, 0.85, '2023-08-11 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1976: other_pests (Orlando, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Orlando', 'AZ', '32801',
    5, 0.90, '2023-08-10 12:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1972: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2023-08-10 12:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1970: other_pests (Rancho cucamonga, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rancho cucamonga', 'AZ', '91701',
    5, 0.75, '2023-08-10 09:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;
