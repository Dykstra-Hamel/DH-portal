-- Bulk Import Pest Pressure Data Points (Part 2/6)
-- Company: 8da68eed-0759-4b45-bd08-abb339cfad7b
-- Records: 1001 to 2000

DO $$
DECLARE
  company_uuid UUID := '8da68eed-0759-4b45-bd08-abb339cfad7b';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN

  -- Form 4251: termites (IOWA FALLS, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'IOWA FALLS', 'AZ', '50126',
    5, 0.75, '2024-10-15 20:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4250: other_pests (Holmdel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Holmdel', 'AZ', '07733',
    5, 0.75, '2024-10-15 18:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4247: other_pests (Pgh, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Pgh', 'AZ', '15222',
    5, 0.75, '2024-10-15 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4246: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '85629',
    6, 0.90, '2024-10-15 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4244: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85035',
    6, 0.85, '2024-10-14 22:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4244: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85035',
    6, 0.85, '2024-10-14 22:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4243: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85755',
    5, 0.75, '2024-10-14 19:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4241: other_pests (Pensacola, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Pensacola', 'AZ', '32507',
    5, 0.75, '2024-10-14 18:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4240: termites (Evansville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Evansville', 'AZ', '57715',
    5, 0.75, '2024-10-14 17:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4239: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.90, '2024-10-14 15:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4238: termites (Sahaurita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahaurita', 'AZ', '85629',
    5, 0.75, '2024-10-14 14:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4237: bed_bugs (cocoa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'cocoa', 'AZ', '62695',
    5, 0.75, '2024-10-14 14:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4236: other_pests (Terre Haute, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Terre Haute', 'AZ', '47803',
    5, 0.75, '2024-10-14 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4234: scorpions (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'San Tan Valley', 'AZ', '85140',
    5, 0.75, '2024-10-14 12:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4232: other_pests (Bedford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Bedford', 'AZ', '47421',
    5, 0.75, '2024-10-14 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4230: bed_bugs (kenova, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'kenova', 'AZ', '25530',
    5, 0.85, '2024-10-13 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4230: rodents (kenova, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'kenova', 'AZ', '25530',
    5, 0.85, '2024-10-13 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4229: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-10-12 20:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4226: termites (Benoit, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Benoit', 'AZ', '38725',
    5, 0.75, '2024-10-12 14:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4225: termites (Myrtle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Myrtle', 'AZ', '38650',
    5, 0.75, '2024-10-12 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4224: other_pests (Moss Point, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Moss Point', 'AZ', '39562',
    5, 0.75, '2024-10-12 12:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4223: termites (RED ROCK, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'RED ROCK', 'AZ', '85145',
    5, 0.75, '2024-10-12 12:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4222: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85083',
    5, 0.75, '2024-10-12 11:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4220: other_pests (Loch Lomond, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Loch Lomond', 'AZ', '95461',
    5, 0.75, '2024-10-12 05:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4219: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-10-11 18:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4218: other_pests (Loch Lomond, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Loch Lomond', 'AZ', '95461',
    5, 0.75, '2024-10-11 16:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4217: termites (Northport, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Northport', 'AZ', '11768',
    5, 0.75, '2024-10-11 16:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4216: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85658',
    5, 0.90, '2024-10-11 16:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4215: other_pests (Grants Pass, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Grants Pass', 'AZ', '97526-9764',
    5, 0.75, '2024-10-11 14:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4213: bed_bugs (West Bend, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'West Bend', 'AZ', '53095',
    5, 0.75, '2024-10-11 02:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4212: termites (Corinth, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Corinth', 'AZ', '38834',
    5, 0.75, '2024-10-11 01:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4211: other_pests (KENSAL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'KENSAL', 'AZ', '58455',
    5, 0.75, '2024-10-11 01:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4210: other_pests (Hampton, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Hampton', 'AZ', '23661',
    5, 0.75, '2024-10-10 23:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4209: mosquitoes (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Tucson', 'AZ', '85739',
    6, 0.85, '2024-10-10 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4209: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85739',
    6, 0.85, '2024-10-10 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4209: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85739',
    6, 0.85, '2024-10-10 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4209: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85739',
    6, 0.85, '2024-10-10 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4209: ticks (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Tucson', 'AZ', '85739',
    6, 0.85, '2024-10-10 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4208: other_pests (Racine, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Racine', 'AZ', '53406',
    5, 0.75, '2024-10-10 15:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4207: other_pests (Charlotte, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Charlotte', 'AZ', '28278',
    5, 0.75, '2024-10-10 08:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4206: bed_bugs (kent, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'kent', 'AZ', '98031',
    5, 0.75, '2024-10-10 01:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4205: termites (Carthage, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Carthage', 'AZ', '13619',
    5, 0.75, '2024-10-10 00:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4203: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85018',
    5, 0.75, '2024-10-09 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4201: other_pests (Denver, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Denver', 'CO', '80238',
    5, 0.75, '2024-10-09 12:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4200: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85714',
    5, 0.75, '2024-10-09 10:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4198: bed_bugs (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Glendale', 'AZ', '85303',
    5, 0.75, '2024-10-09 05:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4197: bed_bugs (NEW ORLEANS, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'NEW ORLEANS', 'LA', '70119',
    5, 0.75, '2024-10-09 04:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4196: bed_bugs (NEW ORLEANS, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'NEW ORLEANS', 'LA', '70119',
    5, 0.75, '2024-10-09 04:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4195: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    4, 0.75, '2024-10-08 19:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4194: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-10-08 18:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4192: bees (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Chandler', 'AZ', '85286-7633',
    5, 0.85, '2024-10-08 11:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4192: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '85286-7633',
    5, 0.85, '2024-10-08 11:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4191: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85739',
    5, 0.75, '2024-10-08 11:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4190: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85006',
    5, 0.75, '2024-10-08 09:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4189: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85706',
    5, 0.85, '2024-10-08 05:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4189: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85706',
    5, 0.85, '2024-10-08 05:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4189: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85706',
    5, 0.85, '2024-10-08 05:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4187: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85143',
    5, 0.75, '2024-10-07 19:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4186: other_pests (Bloomington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Bloomington', 'AZ', '77951',
    5, 0.75, '2024-10-07 18:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4184: other_pests (west Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'west Park', 'AZ', '33023',
    5, 0.75, '2024-10-07 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4183: other_pests (Midwest City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Midwest City', 'AZ', '73110',
    5, 0.75, '2024-10-07 08:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4182: scorpions (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-10-06 23:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4181: other_pests (GREEN VALLEY, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'GREEN VALLEY', 'AZ', '85614',
    5, 0.75, '2024-10-06 22:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4180: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    8, 0.90, '2024-10-06 18:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4179: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2024-10-06 17:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4178: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2024-10-06 16:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4177: termites (Beaver Dam, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Beaver Dam', 'AZ', '42320',
    5, 0.75, '2024-10-06 14:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4176: ants (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale', 'AZ', '85254',
    6, 0.85, '2024-10-06 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4176: bees (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Scottsdale', 'AZ', '85254',
    6, 0.85, '2024-10-06 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4174: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85741',
    4, 0.85, '2024-10-06 09:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4174: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    4, 0.85, '2024-10-06 09:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4170: other_pests (bronx, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'bronx', 'AZ', '10467',
    5, 0.75, '2024-10-05 19:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4169: bees (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2024-10-05 10:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4168: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85749',
    5, 0.90, '2024-10-05 10:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4167: other_pests (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MARANA', 'AZ', '85658',
    5, 0.75, '2024-10-05 10:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4164: other_pests (Dunmor, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Dunmor', 'AZ', '42339',
    5, 0.75, '2024-10-04 22:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4162: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    4, 0.90, '2024-10-04 21:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4160: other_pests (Rapid City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rapid City', 'AZ', '57702',
    5, 0.75, '2024-10-04 18:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4159: termites (Rocky Mount, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Rocky Mount', 'AZ', '24151',
    5, 0.75, '2024-10-04 13:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4158: other_pests (Patterson, LA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Patterson', 'LA', '70392',
    5, 0.75, '2024-10-04 02:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4156: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85033',
    5, 0.75, '2024-10-04 00:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4155: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2024-10-03 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4154: other_pests (Newport, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Newport', 'AZ', '72112',
    5, 0.75, '2024-10-03 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4152: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    4, 0.90, '2024-10-03 14:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4151: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-10-03 14:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4150: termites (Carefree, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Carefree', 'AZ', '85377',
    4, 0.75, '2024-10-03 11:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4149: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85735',
    5, 0.75, '2024-10-03 00:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4147: termites (Columbus, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Columbus', 'AZ', '43223',
    5, 0.75, '2024-10-02 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4146: other_pests (GA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'GA', 'AZ', '30542',
    5, 0.75, '2024-10-02 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4145: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    6, 0.90, '2024-10-02 13:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4144: ants (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Chandler', 'AZ', '',
    6, 0.85, '2024-10-02 10:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4144: mosquitoes (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Chandler', 'AZ', '',
    6, 0.85, '2024-10-02 10:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4142: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85029',
    5, 0.75, '2024-10-02 00:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4141: other_pests (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Casa Grande', 'AZ', '85122',
    5, 0.75, '2024-10-01 22:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4140: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2024-10-01 16:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4138: other_pests (North Tonawanda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'North Tonawanda', 'AZ', '14120',
    5, 0.75, '2024-10-01 12:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4137: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    5, 0.90, '2024-10-01 10:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4136: other_pests (COLO SPGS, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'COLO SPGS', 'CO', '80923',
    5, 0.75, '2024-09-30 22:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4133: bed_bugs (ATLANTA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'ATLANTA', 'AZ', '30318',
    5, 0.75, '2024-09-30 04:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4132: termites (FORT WORTH, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'FORT WORTH', 'AZ', '76120',
    5, 0.75, '2024-09-30 03:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4131: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85741',
    6, 0.90, '2024-09-30 00:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4129: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85029',
    5, 0.75, '2024-09-29 17:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4128: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85029',
    5, 0.75, '2024-09-29 17:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4127: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85298',
    5, 0.90, '2024-09-29 14:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4126: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85302',
    4, 0.75, '2024-09-29 12:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4125: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85234',
    5, 0.75, '2024-09-29 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4124: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85714',
    5, 0.75, '2024-09-29 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4121: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    4, 0.75, '2024-09-27 10:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4120: other_pests (ZION, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'ZION', 'AZ', '60099',
    5, 0.75, '2024-09-27 07:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4119: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85201',
    5, 0.90, '2024-09-26 21:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4118: bed_bugs (PICO RIVERA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'PICO RIVERA', 'AZ', '90660',
    5, 0.75, '2024-09-26 20:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4116: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.75, '2024-09-26 16:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4110: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-09-25 21:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4109: other_pests (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MARANA', 'AZ', '85653',
    5, 0.75, '2024-09-25 21:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4107: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2024-09-25 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4106: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641-2047',
    5, 0.85, '2024-09-25 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4106: rodents (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Vail', 'AZ', '85641-2047',
    5, 0.85, '2024-09-25 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4105: bed_bugs (CHESTER, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'CHESTER', 'AZ', '29706',
    5, 0.75, '2024-09-25 06:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4104: bed_bugs (Port Angeles, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Port Angeles', 'AZ', '98362',
    5, 0.75, '2024-09-25 04:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4103: bed_bugs (CHOCTAW, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'CHOCTAW', 'AZ', '73020',
    5, 0.75, '2024-09-24 23:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4102: bed_bugs (Oklahoma City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Oklahoma City', 'AZ', '73129',
    5, 0.75, '2024-09-24 22:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4101: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2024-09-24 20:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4098: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2024-09-24 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4096: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-09-24 12:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4095: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85027',
    5, 0.75, '2024-09-23 22:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4094: other_pests (Gold Canyon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gold Canyon', 'AZ', '85118',
    5, 0.75, '2024-09-23 18:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4093: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756-5122',
    5, 0.75, '2024-09-23 14:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4092: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85206',
    5, 0.75, '2024-09-23 13:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4091: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85254',
    5, 0.90, '2024-09-23 01:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4090: bed_bugs (Piqua, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Piqua', 'AZ', '45356',
    5, 0.75, '2024-09-22 23:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4089: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-09-22 21:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4087: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-09-22 19:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4086: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2024-09-22 16:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4085: bed_bugs (Castaic, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Castaic', 'AZ', '91384',
    5, 0.75, '2024-09-22 14:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4084: bed_bugs (Castaic, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Castaic', 'AZ', '91384',
    5, 0.75, '2024-09-22 14:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4083: bed_bugs (Castaic, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Castaic', 'AZ', '91384',
    5, 0.75, '2024-09-22 14:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4082: roaches (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tempe', 'AZ', '85282',
    9, 0.75, '2024-09-22 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4081: bed_bugs (TEMECULA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'TEMECULA', 'AZ', '92589',
    5, 0.75, '2024-09-22 04:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4080: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2024-09-22 02:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4079: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-09-21 20:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4076: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.90, '2024-09-21 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4074: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85741',
    5, 0.75, '2024-09-21 01:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4073: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85086',
    6, 0.90, '2024-09-20 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4072: other_pests (BEMIDJI, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'BEMIDJI', 'AZ', '56601',
    5, 0.75, '2024-09-20 03:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4071: bed_bugs (SAINT PAUL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'SAINT PAUL', 'AZ', '55122',
    5, 0.75, '2024-09-20 01:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4070: termites (MARIETTA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'MARIETTA', 'AZ', '30064',
    5, 0.75, '2024-09-19 23:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4067: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85710',
    8, 0.90, '2024-09-19 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4066: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85024',
    5, 0.75, '2024-09-19 19:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4065: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-09-19 18:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4063: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-09-19 17:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4062: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.90, '2024-09-19 01:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4061: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-09-18 18:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4057: bed_bugs (honolulu, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'honolulu', 'AZ', '96826',
    5, 0.75, '2024-09-17 21:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4056: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    9, 0.85, '2024-09-17 20:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4056: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    9, 0.85, '2024-09-17 20:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4055: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-09-17 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4053: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    4, 0.90, '2024-09-17 13:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4052: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85143',
    4, 0.75, '2024-09-17 13:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4051: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-09-17 11:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4050: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85745',
    6, 0.90, '2024-09-17 06:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4049: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-09-17 04:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4048: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-09-17 01:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4047: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.90, '2024-09-16 22:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4046: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85713',
    5, 0.90, '2024-09-16 20:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4044: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85741',
    5, 0.85, '2024-09-16 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4044: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85741',
    5, 0.85, '2024-09-16 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4043: crickets (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Sahuarita', 'AZ', '85629',
    6, 0.85, '2024-09-16 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4043: spiders (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Sahuarita', 'AZ', '85629',
    6, 0.85, '2024-09-16 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4042: moths (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'TUCSON', 'AZ', '85719',
    5, 0.85, '2024-09-16 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4042: roaches (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'TUCSON', 'AZ', '85719',
    5, 0.85, '2024-09-16 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4041: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-09-16 11:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4040: bed_bugs (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Glendale', 'AZ', '85302',
    5, 0.75, '2024-09-16 02:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4039: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85747',
    4, 0.75, '2024-09-15 19:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4038: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-09-15 14:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4037: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-09-15 07:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4036: roaches (Phx, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phx', 'AZ', '85003',
    6, 0.90, '2024-09-15 03:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4035: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    4, 0.75, '2024-09-14 14:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4034: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-09-14 12:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4033: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    5, 0.75, '2024-09-14 11:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4031: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2024-09-13 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4031: roaches (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2024-09-13 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4031: rodents (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2024-09-13 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4031: scorpions (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Sahuarita', 'AZ', '85629',
    5, 0.85, '2024-09-13 14:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4030: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2024-09-13 13:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4029: centipedes (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', 'tucson', 'AZ', '87515',
    6, 0.85, '2024-09-13 03:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4029: crickets (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'tucson', 'AZ', '87515',
    6, 0.85, '2024-09-13 03:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4029: scorpions (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'tucson', 'AZ', '87515',
    6, 0.85, '2024-09-13 03:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4028: other_pests (CARTERSVILLE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'CARTERSVILLE', 'AZ', '30120',
    5, 0.75, '2024-09-13 00:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4027: other_pests (Scottadale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottadale', 'AZ', '85262',
    5, 0.75, '2024-09-12 19:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4026: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85015',
    5, 0.75, '2024-09-12 18:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4025: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85015',
    5, 0.75, '2024-09-12 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4023: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-09-12 13:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4022: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85747',
    5, 0.90, '2024-09-12 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4021: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    4, 0.75, '2024-09-12 11:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4019: bed_bugs (OCALA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'OCALA', 'AZ', '34480',
    5, 0.90, '2024-09-12 02:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4018: other_pests (Lake Worth, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lake Worth', 'AZ', '33467',
    5, 0.75, '2024-09-12 01:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4017: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85719',
    4, 0.75, '2024-09-12 01:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4016: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-09-11 23:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4016: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-09-11 23:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4015: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2024-09-11 15:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4013: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2024-09-11 01:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4014: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2024-09-11 01:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4012: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.75, '2024-09-11 01:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4011: bed_bugs (Wilmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Wilmington', 'AZ', '19806',
    5, 0.75, '2024-09-10 23:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4008: termites (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix Az', 'AZ', '85083',
    4, 0.75, '2024-09-10 19:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4007: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '85747',
    5, 0.75, '2024-09-10 15:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4006: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-09-10 01:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4005: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.90, '2024-09-10 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4004: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-09-10 00:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 4004: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-09-10 00:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4003: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-09-09 23:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4002: other_pests (Maricopa Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Maricopa Arizona', 'AZ', '85138',
    5, 0.75, '2024-09-09 21:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 4001: termites (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Ajo', 'AZ', '85321',
    4, 0.75, '2024-09-09 20:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3998: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85755',
    5, 0.75, '2024-09-09 17:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3997: ants (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Willcox', 'AZ', '85643',
    5, 0.85, '2024-09-09 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3997: rodents (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Willcox', 'AZ', '85643',
    5, 0.85, '2024-09-09 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3997: termites (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Willcox', 'AZ', '85643',
    5, 0.85, '2024-09-09 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3997: wasps (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Willcox', 'AZ', '85643',
    5, 0.85, '2024-09-09 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3996: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85735',
    5, 0.75, '2024-09-09 14:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3995: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-09-09 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3993: other_pests (1467308, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '1467308', 'AZ', '85305',
    5, 0.75, '2024-09-09 04:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3992: bed_bugs (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'TUCSON', 'AZ', '85747',
    5, 0.90, '2024-09-09 01:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3991: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-09-08 22:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3989: ants (Tucson, Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson, Az', 'AZ', '85710',
    6, 0.85, '2024-09-08 17:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3989: spiders (Tucson, Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson, Az', 'AZ', '85710',
    6, 0.85, '2024-09-08 17:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3988: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85741',
    6, 0.90, '2024-09-08 16:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3987: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    4, 0.85, '2024-09-08 14:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3987: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85704',
    4, 0.85, '2024-09-08 14:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3987: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    4, 0.85, '2024-09-08 14:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3986: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-09-08 14:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3985: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-09-08 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3984: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710-1803',
    5, 0.75, '2024-09-08 00:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3983: bed_bugs (Coarsegold, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Coarsegold', 'AZ', '93614',
    5, 0.75, '2024-09-08 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3982: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85748',
    5, 0.90, '2024-09-07 21:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3981: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-09-07 19:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3980: termites (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tolleson', 'AZ', '85353',
    5, 0.90, '2024-09-07 15:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3979: moths (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Tucson', 'AZ', '85713',
    5, 0.85, '2024-09-07 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3979: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85713',
    5, 0.85, '2024-09-07 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3979: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85713',
    5, 0.85, '2024-09-07 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3977: scorpions (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'PHOENIX', 'AZ', '85017',
    6, 0.80, '2024-09-07 02:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3974: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2024-09-06 10:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3973: other_pests (camden, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'camden', 'AZ', '45311',
    5, 0.75, '2024-09-06 05:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3972: other_pests (Sun City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sun City', 'AZ', '85373',
    5, 0.75, '2024-09-06 00:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3971: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '85742',
    5, 0.75, '2024-09-05 19:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3969: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    5, 0.75, '2024-09-05 15:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3968: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-09-05 14:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3967: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-09-05 14:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3966: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85704',
    5, 0.90, '2024-09-05 09:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3965: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85711',
    4, 0.75, '2024-09-05 07:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3963: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-09-04 21:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3962: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85745',
    6, 0.85, '2024-09-04 19:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3962: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85745',
    6, 0.85, '2024-09-04 19:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3962: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85745',
    6, 0.85, '2024-09-04 19:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3960: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-09-04 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3959: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85715',
    5, 0.75, '2024-09-04 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3958: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85015',
    5, 0.90, '2024-09-04 15:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3956: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-09-04 10:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3956: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-09-04 10:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3955: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85040',
    5, 0.75, '2024-09-04 09:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3954: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85719',
    5, 0.75, '2024-09-03 23:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3952: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    5, 0.75, '2024-09-03 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3951: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.90, '2024-09-03 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3949: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-09-03 13:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3948: bed_bugs (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'tucson', 'AZ', '',
    5, 0.75, '2024-09-03 11:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3947: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-09-02 21:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3947: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-09-02 21:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3946: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85383',
    5, 0.75, '2024-09-02 13:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3945: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-09-02 11:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3943: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-09-02 02:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3942: other_pests (MANILLA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MANILLA', 'AZ', '51454',
    4, 0.75, '2024-09-01 22:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3941: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '85381',
    5, 0.75, '2024-09-01 20:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3940: ants (CHANDLER, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'CHANDLER', 'AZ', '85224',
    9, 0.85, '2024-09-01 20:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3940: bees (CHANDLER, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'CHANDLER', 'AZ', '85224',
    9, 0.85, '2024-09-01 20:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3940: rodents (CHANDLER, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'CHANDLER', 'AZ', '85224',
    9, 0.85, '2024-09-01 20:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3939: bed_bugs (Unknown, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Unknown', 'AZ', '87420',
    5, 0.75, '2024-09-01 04:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3938: bed_bugs (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Peoria', 'AZ', '85351',
    5, 0.75, '2024-09-01 03:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3936: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-08-31 17:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3935: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85207',
    5, 0.75, '2024-08-31 15:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3934: other_pests (NORTHMIAMIBEACH, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'NORTHMIAMIBEACH', 'AZ', '33160',
    5, 0.75, '2024-08-31 01:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3933: bed_bugs (st augustine, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'st augustine', 'AZ', '32085',
    5, 0.75, '2024-08-31 01:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3932: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-08-31 00:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3931: scorpions (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Chandler', 'AZ', '85249',
    5, 0.75, '2024-08-30 20:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3930: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85043',
    5, 0.85, '2024-08-30 18:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3930: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85043',
    5, 0.85, '2024-08-30 18:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3928: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    5, 0.75, '2024-08-30 09:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3927: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85711',
    5, 0.85, '2024-08-30 00:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3927: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85711',
    5, 0.85, '2024-08-30 00:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3926: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85658',
    4, 0.75, '2024-08-29 22:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3925: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85742',
    6, 0.80, '2024-08-29 20:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3922: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85756',
    6, 0.90, '2024-08-29 00:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3921: termites (VAIL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'VAIL', 'AZ', '85641',
    5, 0.90, '2024-08-28 20:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3920: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2024-08-28 20:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3919: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-08-28 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3916: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-08-28 15:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3913: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85020',
    5, 0.90, '2024-08-27 22:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3911: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85705',
    5, 0.75, '2024-08-27 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3909: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-08-27 14:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3908: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-08-26 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3907: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.75, '2024-08-26 17:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3906: ants (Chandler, Arizona, AR)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Chandler, Arizona', 'AR', '85286',
    6, 0.85, '2024-08-26 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3906: rodents (Chandler, Arizona, AR)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Chandler, Arizona', 'AR', '85286',
    6, 0.85, '2024-08-26 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3906: termites (Chandler, Arizona, AR)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler, Arizona', 'AR', '85286',
    6, 0.85, '2024-08-26 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3905: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85737',
    5, 0.75, '2024-08-26 16:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3904: bed_bugs (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'TUCSON', 'AZ', '85711',
    4, 0.75, '2024-08-26 14:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3900: other_pests (Tucson Estates, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Estates', 'AZ', '85613',
    5, 0.75, '2024-08-26 09:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3899: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-08-25 20:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3898: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    9, 0.75, '2024-08-25 19:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3897: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-08-25 13:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3896: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85033',
    5, 0.75, '2024-08-25 07:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3895: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2024-08-25 05:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3894: rodents (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Oro Valley', 'AZ', '85755',
    5, 0.85, '2024-08-24 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3894: wasps (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Oro Valley', 'AZ', '85755',
    5, 0.85, '2024-08-24 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3894: wildlife (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Oro Valley', 'AZ', '85755',
    5, 0.85, '2024-08-24 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3893: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-08-24 01:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3891: bed_bugs (Phx, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phx', 'AZ', '85018',
    5, 0.75, '2024-08-23 20:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3890: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-08-23 17:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3889: other_pests (AAnthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'AAnthem', 'AZ', '85086',
    5, 0.75, '2024-08-23 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3887: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85748',
    5, 0.75, '2024-08-23 13:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3882: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85701',
    5, 0.90, '2024-08-22 01:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3878: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-08-21 15:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3877: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-08-21 15:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3875: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85032',
    5, 0.75, '2024-08-21 12:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3871: other_pests (qnaycfucot, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qnaycfucot', 'AZ', '',
    5, 0.75, '2024-08-21 05:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3870: other_pests (qtuppjrosb, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qtuppjrosb', 'AZ', '',
    5, 0.75, '2024-08-21 05:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3869: other_pests (qtuppjrosb, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qtuppjrosb', 'AZ', '',
    5, 0.75, '2024-08-21 05:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3868: other_pests (qtuppjrosb, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qtuppjrosb', 'AZ', '',
    5, 0.75, '2024-08-21 05:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3867: other_pests (qnaycfucot, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qnaycfucot', 'AZ', '',
    5, 0.75, '2024-08-21 05:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3866: other_pests (qnaycfucot, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qnaycfucot', 'AZ', '',
    5, 0.75, '2024-08-21 05:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3865: other_pests (qnaycfucot, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qnaycfucot', 'AZ', '',
    5, 0.75, '2024-08-21 05:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3863: other_pests (qtuppjrosb, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qtuppjrosb', 'AZ', '',
    5, 0.75, '2024-08-21 05:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3862: other_pests (qtuppjrosb, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qtuppjrosb', 'AZ', '',
    5, 0.75, '2024-08-21 05:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3859: other_pests (qnaycfucot, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qnaycfucot', 'AZ', '',
    5, 0.75, '2024-08-21 05:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3858: other_pests (qnaycfucot, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'qnaycfucot', 'AZ', '',
    5, 0.75, '2024-08-21 05:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3852: bed_bugs (Winston Salem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Winston Salem', 'AZ', '27103',
    5, 0.75, '2024-08-21 01:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3851: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.90, '2024-08-21 00:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3849: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-08-20 22:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3847: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85739',
    5, 0.75, '2024-08-20 17:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3846: ants (Lawrenceville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Lawrenceville', 'AZ', '30044',
    8, 0.85, '2024-08-20 16:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3846: mosquitoes (Lawrenceville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Lawrenceville', 'AZ', '30044',
    8, 0.85, '2024-08-20 16:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3846: roaches (Lawrenceville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Lawrenceville', 'AZ', '30044',
    8, 0.85, '2024-08-20 16:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3846: spiders (Lawrenceville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Lawrenceville', 'AZ', '30044',
    8, 0.85, '2024-08-20 16:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3845: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85745',
    6, 0.90, '2024-08-20 14:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3844: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85741',
    5, 0.85, '2024-08-20 14:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3844: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85741',
    5, 0.85, '2024-08-20 14:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3844: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85741',
    5, 0.85, '2024-08-20 14:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3843: scorpions (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Chandler', 'AZ', '85286',
    5, 0.75, '2024-08-20 02:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3842: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85658-5202',
    5, 0.85, '2024-08-19 22:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3842: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85658-5202',
    5, 0.85, '2024-08-19 22:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3842: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658-5202',
    5, 0.85, '2024-08-19 22:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3841: rodents (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Paradise Valley', 'AZ', '85253',
    6, 0.85, '2024-08-19 22:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3841: scorpions (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Paradise Valley', 'AZ', '85253',
    6, 0.85, '2024-08-19 22:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3841: spiders (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Paradise Valley', 'AZ', '85253',
    6, 0.85, '2024-08-19 22:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3841: termites (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Paradise Valley', 'AZ', '85253',
    6, 0.85, '2024-08-19 22:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3841: wasps (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Paradise Valley', 'AZ', '85253',
    6, 0.85, '2024-08-19 22:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3840: rodents (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Oro Valley', 'AZ', '85737',
    4, 0.90, '2024-08-19 22:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3839: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    4, 0.75, '2024-08-19 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3837: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    4, 0.75, '2024-08-19 16:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3836: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    4, 0.90, '2024-08-19 14:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3835: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-08-19 13:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3833: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85255',
    5, 0.75, '2024-08-19 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3832: termites (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Valley', 'AZ', '85614',
    5, 0.75, '2024-08-19 00:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3831: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-08-18 21:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3830: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    4, 0.75, '2024-08-18 18:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3829: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85206',
    5, 0.75, '2024-08-17 23:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3827: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    6, 0.80, '2024-08-17 21:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3826: crickets (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'tucson', 'AZ', '85716',
    5, 0.75, '2024-08-17 12:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3825: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85757',
    5, 0.90, '2024-08-16 23:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3823: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85712',
    4, 0.75, '2024-08-15 19:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3822: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    4, 0.75, '2024-08-15 15:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3819: bees (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Scottsdale', 'AZ', '85260',
    5, 0.85, '2024-08-14 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3819: beetles (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Scottsdale', 'AZ', '85260',
    5, 0.85, '2024-08-14 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3819: centipedes (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', 'Scottsdale', 'AZ', '85260',
    5, 0.85, '2024-08-14 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3819: spiders (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Scottsdale', 'AZ', '85260',
    5, 0.85, '2024-08-14 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3817: bed_bugs (Tucson az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson az', 'AZ', '',
    5, 0.75, '2024-08-14 12:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3816: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-08-14 08:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3815: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    4, 0.90, '2024-08-13 13:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3813: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '85755-9116',
    6, 0.85, '2024-08-13 11:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3813: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755-9116',
    6, 0.85, '2024-08-13 11:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3811: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85255',
    5, 0.75, '2024-08-12 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3810: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    6, 0.80, '2024-08-12 11:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3809: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    5, 0.75, '2024-08-12 02:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3808: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85704',
    5, 0.90, '2024-08-10 15:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3806: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-08-09 18:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3806: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-08-09 18:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3804: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-08-08 05:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3804: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-08-08 05:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3804: spiders (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-08-08 05:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3803: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85711',
    5, 0.75, '2024-08-07 23:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3802: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85711',
    5, 0.75, '2024-08-07 23:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3801: termites (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Tan Valley', 'AZ', '85140',
    5, 0.75, '2024-08-07 11:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3799: rodents (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Queen Creek', 'AZ', '851452',
    5, 0.90, '2024-08-06 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3798: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85022',
    4, 0.75, '2024-08-06 10:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3796: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85741',
    4, 0.75, '2024-08-05 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3795: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-08-05 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3793: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2024-08-05 10:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3792: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85747',
    5, 0.85, '2024-08-05 08:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3792: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85747',
    5, 0.85, '2024-08-05 08:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3791: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-08-04 20:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3790: bees (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tempe', 'AZ', '85284',
    6, 0.85, '2024-08-04 18:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3790: beetles (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Tempe', 'AZ', '85284',
    6, 0.85, '2024-08-04 18:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3789: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-08-03 22:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3788: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-08-03 22:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3785: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '87755',
    5, 0.90, '2024-08-02 15:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3783: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85140',
    5, 0.75, '2024-08-02 11:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3782: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.90, '2024-08-02 00:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3778: scorpions (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Mesa', 'AZ', '85201',
    5, 0.75, '2024-08-01 14:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3777: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85749',
    5, 0.90, '2024-08-01 13:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3776: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85719',
    5, 0.75, '2024-08-01 01:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3774: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-07-31 14:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3773: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-07-31 12:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3772: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '85021',
    5, 0.75, '2024-07-31 01:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3771: ants (ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'ajo', 'AZ', '85321',
    6, 0.85, '2024-07-30 19:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3771: rodents (ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'ajo', 'AZ', '85321',
    6, 0.85, '2024-07-30 19:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3771: termites (ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'ajo', 'AZ', '85321',
    6, 0.85, '2024-07-30 19:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3768: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-07-30 11:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3766: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-07-29 18:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3764: bed_bugs (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Maricopa', 'AZ', '85139',
    5, 0.85, '2024-07-29 16:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3764: bees (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Maricopa', 'AZ', '85139',
    5, 0.85, '2024-07-29 16:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3763: other_pests (Queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen creek', 'AZ', '85142',
    5, 0.75, '2024-07-29 12:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3762: other_pests (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Maricopa', 'AZ', '85138',
    5, 0.75, '2024-07-28 13:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3761: scorpions (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Mesa', 'AZ', '85209',
    4, 0.90, '2024-07-27 23:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3760: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-07-27 00:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3759: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85286',
    5, 0.75, '2024-07-26 21:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3757: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85718',
    5, 0.85, '2024-07-26 09:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3757: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85718',
    5, 0.85, '2024-07-26 09:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3757: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.85, '2024-07-26 09:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3756: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2024-07-25 15:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3755: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85048',
    5, 0.75, '2024-07-25 13:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3754: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.90, '2024-07-25 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3753: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85029',
    5, 0.75, '2024-07-25 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3752: other_pests (Nashville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Nashville', 'AZ', '37217',
    5, 0.75, '2024-07-25 11:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3751: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85297',
    5, 0.75, '2024-07-24 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3750: ants (Scottsdale, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale, AZ', 'AZ', '85253',
    4, 0.90, '2024-07-24 09:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3749: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-07-24 01:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3748: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85374',
    5, 0.90, '2024-07-24 00:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3746: other_pests (scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'scottsdale', 'AZ', '85255',
    5, 0.90, '2024-07-23 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3745: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85718',
    5, 0.75, '2024-07-23 11:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3743: ants (Gold Canyon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Gold Canyon', 'AZ', '85118',
    9, 0.85, '2024-07-23 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3743: termites (Gold Canyon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gold Canyon', 'AZ', '85118',
    9, 0.85, '2024-07-23 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3742: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704-4702',
    5, 0.75, '2024-07-23 02:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3740: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85653',
    8, 0.90, '2024-07-22 21:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3739: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-07-22 15:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3738: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    4, 0.75, '2024-07-22 15:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3737: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85050',
    5, 0.75, '2024-07-22 12:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3736: flies (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2024-07-22 07:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3736: moths (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Phoenix', 'AZ', '85085',
    5, 0.85, '2024-07-22 07:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3735: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85723',
    4, 0.75, '2024-07-21 10:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3734: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-07-20 21:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3733: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85712',
    5, 0.85, '2024-07-20 14:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3733: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85712',
    5, 0.85, '2024-07-20 14:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3732: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2024-07-20 11:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3731: scorpions (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Chandler', 'AZ', '85225',
    5, 0.85, '2024-07-19 20:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3731: spiders (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Chandler', 'AZ', '85225',
    5, 0.85, '2024-07-19 20:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3730: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2024-07-19 14:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3729: bees (St. Petersburg, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'St. Petersburg', 'AZ', '33702',
    5, 0.90, '2024-07-19 12:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3728: ants (Surprisee, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Surprisee', 'AZ', '85374',
    6, 0.90, '2024-07-18 23:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3727: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-07-18 21:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3726: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-07-18 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3725: bed_bugs (Eloy, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Eloy', 'AZ', '85131',
    5, 0.75, '2024-07-18 12:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3724: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85257',
    5, 0.75, '2024-07-18 01:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3723: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-07-17 20:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3722: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-07-17 20:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3721: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-07-17 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3720: bees (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'tucson', 'AZ', '85741',
    6, 0.85, '2024-07-17 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3720: mosquitoes (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'tucson', 'AZ', '85741',
    6, 0.85, '2024-07-17 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3719: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2024-07-17 17:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3718: scorpions (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Mesa', 'AZ', '85209',
    5, 0.75, '2024-07-17 13:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3717: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2024-07-17 13:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3716: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.90, '2024-07-17 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3715: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85021',
    5, 0.75, '2024-07-17 02:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3714: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    4, 0.75, '2024-07-16 20:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3713: other_pests (Nogales, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Nogales', 'AZ', '85621',
    5, 0.75, '2024-07-16 20:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3711: ants (scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'scottsdale', 'AZ', '85255',
    9, 0.85, '2024-07-15 17:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3711: bees (scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'scottsdale', 'AZ', '85255',
    9, 0.85, '2024-07-15 17:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3710: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2024-07-15 16:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3709: other_pests (Tolleson arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tolleson arizona', 'AZ', '85353',
    5, 0.75, '2024-07-15 15:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3708: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-07-15 15:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3707: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85718',
    4, 0.85, '2024-07-15 14:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3707: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    4, 0.85, '2024-07-15 14:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3706: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '85737',
    9, 0.90, '2024-07-14 17:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3705: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    9, 0.75, '2024-07-14 10:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3704: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-07-14 09:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3703: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-07-13 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3702: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-07-13 14:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3701: wasps (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Red Rock', 'AZ', '85145',
    6, 0.90, '2024-07-13 00:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3699: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2024-07-12 18:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3698: wasps (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Sahuarita', 'AZ', '85629',
    5, 0.90, '2024-07-12 16:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3697: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2024-07-12 16:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3696: other_pests (Eloy, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Eloy', 'AZ', '85131',
    5, 0.75, '2024-07-12 13:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3695: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85741',
    6, 0.85, '2024-07-12 11:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3695: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85741',
    6, 0.85, '2024-07-12 11:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3694: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.90, '2024-07-12 02:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3693: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85705',
    9, 0.90, '2024-07-11 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3691: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85297',
    4, 0.75, '2024-07-11 22:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3690: ants (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Chandler', 'AZ', '85225',
    9, 0.75, '2024-07-11 16:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3689: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85757',
    5, 0.85, '2024-07-11 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3689: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85757',
    5, 0.85, '2024-07-11 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3689: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85757',
    5, 0.85, '2024-07-11 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3689: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85757',
    5, 0.85, '2024-07-11 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3689: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85757',
    5, 0.85, '2024-07-11 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3688: other_pests (Casa Grange, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Casa Grange', 'AZ', '',
    5, 0.75, '2024-07-11 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3687: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '85020',
    5, 0.75, '2024-07-11 00:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3686: bees (Miami, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Miami', 'AZ', '26241',
    7, 0.85, '2024-07-10 16:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3686: scorpions (Miami, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Miami', 'AZ', '26241',
    7, 0.85, '2024-07-10 16:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3685: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-07-10 16:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3684: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-07-10 12:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3684: roaches (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-07-10 12:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3684: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-07-10 12:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3684: scorpions (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-07-10 12:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3683: bees (TUCSON, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'TUCSON, AZ', 'AZ', '85739',
    5, 0.90, '2024-07-09 16:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3682: scorpions (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Mesa', 'AZ', '85207',
    5, 0.75, '2024-07-09 10:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3681: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-07-09 10:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3679: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '85043',
    5, 0.75, '2024-07-09 04:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3677: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85233',
    9, 0.75, '2024-07-08 22:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3676: other_pests (Tucson az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson az', 'AZ', '85756',
    5, 0.75, '2024-07-08 21:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3675: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '85718',
    4, 0.75, '2024-07-08 17:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3673: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-07-08 15:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3672: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    4, 0.85, '2024-07-08 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3672: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '85743',
    4, 0.85, '2024-07-08 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3672: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85743',
    4, 0.85, '2024-07-08 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3671: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85711',
    4, 0.75, '2024-07-08 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3670: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85710',
    5, 0.85, '2024-07-08 11:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3670: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85710',
    5, 0.85, '2024-07-08 11:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3669: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85296',
    4, 0.75, '2024-07-08 11:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3668: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '85602',
    5, 0.75, '2024-07-08 09:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3667: ants (Hobart, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Hobart', 'AZ', '46342',
    5, 0.90, '2024-07-08 07:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3666: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2024-07-08 02:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3666: rodents (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'California', 'AZ', '92618',
    5, 0.85, '2024-07-08 02:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3664: other_pests (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson, AZ', 'AZ', '85747',
    5, 0.75, '2024-07-07 15:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3663: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85755',
    6, 0.85, '2024-07-07 14:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3663: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '85755',
    6, 0.85, '2024-07-07 14:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3662: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85745',
    5, 0.85, '2024-07-07 14:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3662: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85745',
    5, 0.85, '2024-07-07 14:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3661: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    4, 0.75, '2024-07-07 12:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3660: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85743',
    6, 0.80, '2024-07-07 12:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3658: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-07-07 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3657: termites (Gold Canyon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gold Canyon', 'AZ', '85118',
    5, 0.75, '2024-07-06 16:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3656: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-07-05 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3655: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '85741',
    5, 0.90, '2024-07-05 15:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3654: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '85254',
    5, 0.75, '2024-07-05 13:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3651: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85736',
    4, 0.75, '2024-07-04 01:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3650: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85041',
    5, 0.75, '2024-07-03 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3649: bees (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2024-07-03 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3648: other_pests (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Surprise', 'AZ', '85379',
    5, 0.75, '2024-07-02 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3647: scorpions (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Surprise', 'AZ', '85387',
    5, 0.75, '2024-07-02 23:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3646: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85706',
    5, 0.90, '2024-07-02 14:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3644: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2024-07-02 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3643: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-07-02 11:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3642: ants (Hobart, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Hobart', 'AZ', '46342',
    4, 0.90, '2024-07-02 06:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3641: other_pests (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'phoenix', 'AZ', '85018',
    5, 0.75, '2024-07-02 01:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3640: bed_bugs (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Las Vegas', 'AZ', '89117',
    5, 0.75, '2024-07-01 22:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3639: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '85641',
    5, 0.75, '2024-07-01 22:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3638: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.90, '2024-07-01 20:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3637: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-07-01 20:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3636: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85008',
    5, 0.75, '2024-07-01 17:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3635: other_pests (Hereford, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Hereford', 'AZ', '85615',
    4, 0.75, '2024-07-01 13:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3634: crickets (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Phoenix', 'AZ', '85042',
    5, 0.85, '2024-06-30 23:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3634: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85042',
    5, 0.85, '2024-06-30 23:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3633: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2024-06-30 22:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3632: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-06-30 22:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3630: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-06-30 17:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3628: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2024-06-29 23:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3627: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85704',
    5, 0.90, '2024-06-29 22:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3626: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2024-06-29 18:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3625: scorpions (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'TUCSON', 'AZ', '85706',
    9, 0.85, '2024-06-29 16:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3625: ticks (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'TUCSON', 'AZ', '85706',
    9, 0.85, '2024-06-29 16:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3624: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-06-29 14:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3623: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-06-29 10:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3622: ants (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'phoenix', 'AZ', '85023',
    5, 0.75, '2024-06-29 01:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3621: roaches (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Scottsdale', 'AZ', '85254',
    5, 0.75, '2024-06-28 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3619: other_pests (Tuczon Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tuczon Arizona', 'AZ', '85756',
    5, 0.75, '2024-06-28 16:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3618: ants (Naples, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Naples', 'AZ', '34120',
    5, 0.90, '2024-06-28 16:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3616: roaches (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Mesa', 'AZ', '85209',
    4, 0.75, '2024-06-28 14:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3615: ants (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Mesa', 'AZ', '85201',
    4, 0.85, '2024-06-28 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3615: roaches (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Mesa', 'AZ', '85201',
    4, 0.85, '2024-06-28 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3614: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-06-28 14:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3613: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '85658',
    5, 0.90, '2024-06-28 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3612: other_pests (Albuquerque, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Albuquerque', 'AZ', '87111',
    5, 0.75, '2024-06-28 11:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3611: ants (Johnstown, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Johnstown', 'CO', '80534',
    5, 0.90, '2024-06-28 09:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3610: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '85035',
    5, 0.75, '2024-06-28 04:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3609: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-06-27 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3608: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85205',
    5, 0.75, '2024-06-27 18:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3607: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.90, '2024-06-27 18:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3606: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.75, '2024-06-27 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3605: wasps (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Phoenix', 'AZ', '85085',
    5, 0.90, '2024-06-27 17:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3604: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-06-27 17:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3603: bees (Saddlebrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Saddlebrooke', 'AZ', '85739',
    5, 0.85, '2024-06-27 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3603: roaches (Saddlebrooke, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Saddlebrooke', 'AZ', '85739',
    5, 0.85, '2024-06-27 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3602: bees (Johnstown, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Johnstown', 'CO', '80534',
    6, 0.90, '2024-06-27 11:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3601: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    5, 0.75, '2024-06-27 09:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3600: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '85339',
    5, 0.75, '2024-06-27 09:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3599: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85739',
    9, 0.90, '2024-06-26 22:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3598: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-06-26 17:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3597: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-06-26 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3596: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85742',
    7, 0.85, '2024-06-26 15:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3596: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85742',
    7, 0.85, '2024-06-26 15:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3595: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85027',
    4, 0.75, '2024-06-26 15:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3594: other_pests (San Manuel Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Manuel Arizona', 'AZ', '85631',
    5, 0.75, '2024-06-26 15:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3593: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    5, 0.75, '2024-06-26 13:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3592: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    5, 0.75, '2024-06-26 12:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3591: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85301',
    5, 0.75, '2024-06-26 09:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3590: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-06-26 01:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3589: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85298',
    5, 0.75, '2024-06-25 19:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3588: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-06-25 17:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3587: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85743',
    4, 0.75, '2024-06-25 16:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3586: ants (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Buckeye', 'AZ', '85396',
    5, 0.85, '2024-06-25 12:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3586: termites (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Buckeye', 'AZ', '85396',
    5, 0.85, '2024-06-25 12:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3585: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85306',
    5, 0.85, '2024-06-25 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3585: bees (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Glendale', 'AZ', '85306',
    5, 0.85, '2024-06-25 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3585: ticks (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Glendale', 'AZ', '85306',
    5, 0.85, '2024-06-25 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3584: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85715',
    5, 0.75, '2024-06-25 10:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3583: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85021',
    5, 0.75, '2024-06-25 01:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3582: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '85629',
    5, 0.75, '2024-06-25 01:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3581: other_pests (Phx, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phx', 'AZ', '85033',
    5, 0.75, '2024-06-24 18:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3580: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85303',
    5, 0.75, '2024-06-24 17:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3579: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85051',
    5, 0.75, '2024-06-24 16:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3578: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    8, 0.90, '2024-06-24 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3577: ants (Sacramento, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sacramento', 'AZ', '95814',
    4, 0.90, '2024-06-24 06:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3575: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85716',
    5, 0.90, '2024-06-23 19:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3573: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85017',
    4, 0.85, '2024-06-23 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3573: moths (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Phoenix', 'AZ', '85017',
    4, 0.85, '2024-06-23 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3571: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-06-23 13:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3570: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85021',
    5, 0.75, '2024-06-23 09:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3569: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85043-6557',
    5, 0.75, '2024-06-23 08:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3567: other_pests (D, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'D', 'AZ', '',
    5, 0.75, '2024-06-22 13:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3565: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85202',
    4, 0.75, '2024-06-22 08:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3564: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85339',
    5, 0.75, '2024-06-22 07:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3563: crickets (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Glendale', 'AZ', '85303',
    5, 0.85, '2024-06-22 05:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3563: roaches (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Glendale', 'AZ', '85303',
    5, 0.85, '2024-06-22 05:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3562: bees (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Glendale', 'AZ', '85305',
    6, 0.90, '2024-06-21 14:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3561: ants (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Casa Grande', 'AZ', '85122',
    5, 0.85, '2024-06-21 13:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3561: termites (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Casa Grande', 'AZ', '85122',
    5, 0.85, '2024-06-21 13:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3560: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    5, 0.75, '2024-06-21 12:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3559: ants (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Willcox', 'AZ', '85643',
    5, 0.85, '2024-06-21 10:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3559: rodents (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Willcox', 'AZ', '85643',
    5, 0.85, '2024-06-21 10:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3558: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85301',
    5, 0.75, '2024-06-21 09:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3557: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85037',
    4, 0.75, '2024-06-21 08:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3555: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-06-20 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3554: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85715',
    5, 0.90, '2024-06-20 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3552: other_pests (Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Az', 'AZ', '85051',
    5, 0.75, '2024-06-20 12:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3551: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85262',
    5, 0.75, '2024-06-20 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3550: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85020',
    5, 0.75, '2024-06-20 12:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3549: ants (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale', 'AZ', '85254',
    6, 0.90, '2024-06-20 12:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3548: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85020',
    5, 0.75, '2024-06-20 12:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3547: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '85755',
    6, 0.85, '2024-06-20 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3547: roaches (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Oro Valley', 'AZ', '85755',
    6, 0.85, '2024-06-20 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3547: spiders (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Oro Valley', 'AZ', '85755',
    6, 0.85, '2024-06-20 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3546: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-06-20 10:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3545: other_pests (scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'scottsdale', 'AZ', '85254',
    5, 0.75, '2024-06-20 08:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3544: other_pests (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Buckeye', 'AZ', '85326',
    5, 0.75, '2024-06-20 03:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3543: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85742',
    4, 0.85, '2024-06-19 22:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3543: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85742',
    4, 0.85, '2024-06-19 22:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3542: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85857',
    5, 0.75, '2024-06-19 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3541: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-06-19 17:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3540: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85140',
    5, 0.90, '2024-06-19 16:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3539: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85719',
    6, 0.85, '2024-06-19 16:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3539: beetles (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Tucson', 'AZ', '85719',
    6, 0.85, '2024-06-19 16:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3539: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85719',
    6, 0.85, '2024-06-19 16:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3538: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85741',
    4, 0.90, '2024-06-19 15:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3537: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85741',
    4, 0.90, '2024-06-19 15:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3536: other_pests (El mirage, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'El mirage', 'AZ', '85307',
    5, 0.75, '2024-06-19 04:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3534: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85719',
    5, 0.85, '2024-06-18 21:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3534: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85719',
    5, 0.85, '2024-06-18 21:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3532: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85711',
    5, 0.85, '2024-06-18 14:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3532: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85711',
    5, 0.85, '2024-06-18 14:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3531: bed_bugs (Sacramento, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Sacramento', 'AZ', '95814',
    4, 0.90, '2024-06-18 06:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3530: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.75, '2024-06-17 20:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3529: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2024-06-17 19:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3528: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85739',
    5, 0.85, '2024-06-17 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3528: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85739',
    5, 0.85, '2024-06-17 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3527: ants (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Surprise', 'AZ', '85387',
    5, 0.75, '2024-06-17 17:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3526: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.75, '2024-06-17 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3525: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    4, 0.75, '2024-06-17 14:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3524: other_pests (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson, AZ', 'AZ', '85713',
    5, 0.75, '2024-06-17 14:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3523: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85737',
    5, 0.75, '2024-06-17 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3519: termites (Naples, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Naples', 'AZ', '34110',
    5, 0.90, '2024-06-17 08:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3518: other_pests (Apache Junction, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Apache Junction', 'AZ', '85120',
    5, 0.90, '2024-06-17 07:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3517: other_pests (Algodones, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Algodones', 'AZ', '87001',
    5, 0.75, '2024-06-17 07:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3516: ants (Sacramento, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sacramento', 'AZ', '95814',
    4, 0.90, '2024-06-17 05:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3515: scorpions (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Scottsdale', 'AZ', '85255',
    5, 0.75, '2024-06-16 19:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3514: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85711',
    8, 0.90, '2024-06-16 12:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3513: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85743',
    7, 0.90, '2024-06-16 10:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3512: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85756',
    5, 0.90, '2024-06-15 22:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3511: ants (ORO VALLEY, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'ORO VALLEY', 'AZ', '85755',
    5, 0.75, '2024-06-15 20:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3510: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-06-15 16:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3509: other_pests (Willcox, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Willcox', 'AZ', '85643',
    5, 0.75, '2024-06-15 16:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3508: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85006',
    9, 0.85, '2024-06-15 13:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3508: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85006',
    9, 0.85, '2024-06-15 13:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3508: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85006',
    9, 0.85, '2024-06-15 13:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3507: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-06-15 12:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3506: rodents (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'AZ', '85704',
    5, 0.75, '2024-06-15 00:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3505: ants (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Chandler', 'AZ', '85224',
    5, 0.85, '2024-06-14 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3505: rodents (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Chandler', 'AZ', '85224',
    5, 0.85, '2024-06-14 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3504: termites (Oracle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oracle', 'AZ', '85623',
    5, 0.75, '2024-06-14 15:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3503: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85296',
    5, 0.75, '2024-06-13 19:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3501: other_pests (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Avondale', 'AZ', '85323',
    5, 0.75, '2024-06-13 10:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3500: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2024-06-13 01:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3499: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-06-12 18:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3498: scorpions (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Glendale', 'AZ', '85308',
    6, 0.85, '2024-06-12 16:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3498: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85308',
    6, 0.85, '2024-06-12 16:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3497: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '85382-6463',
    4, 0.90, '2024-06-12 14:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3495: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85739',
    6, 0.75, '2024-06-12 09:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3494: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85295',
    5, 0.75, '2024-06-11 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3493: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.90, '2024-06-11 16:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3492: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-06-11 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3492: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-06-11 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3492: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-06-11 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3492: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85743',
    5, 0.85, '2024-06-11 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3491: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-06-11 15:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3490: other_pests (Oro Valley, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley, AZ', 'AZ', '85755',
    5, 0.75, '2024-06-11 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3489: mosquitoes (Dallas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Dallas', 'AZ', '',
    5, 0.75, '2024-06-11 08:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3488: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-06-10 22:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3487: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85746',
    5, 0.75, '2024-06-10 19:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3486: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85718',
    5, 0.75, '2024-06-10 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3484: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '85048',
    5, 0.85, '2024-06-09 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3484: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85048',
    5, 0.85, '2024-06-09 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3484: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '85048',
    5, 0.85, '2024-06-09 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3483: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85735',
    5, 0.85, '2024-06-09 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3483: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85735',
    5, 0.85, '2024-06-09 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3483: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '85735',
    5, 0.85, '2024-06-09 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3482: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85755',
    5, 0.90, '2024-06-09 11:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3481: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85746',
    5, 0.90, '2024-06-08 21:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3480: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '3813',
    5, 0.75, '2024-06-07 21:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3479: other_pests (Hendersonville, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Hendersonville', 'AZ', '37075',
    5, 0.75, '2024-06-07 21:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3478: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '85742-6607',
    4, 0.75, '2024-06-07 20:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3477: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2024-06-07 13:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3475: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-06-07 11:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3474: other_pests (Sacramento, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sacramento', 'AZ', '95814',
    5, 0.90, '2024-06-07 06:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3473: rodents (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'tucson', 'AZ', '85757',
    5, 0.75, '2024-06-06 21:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3470: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    8, 0.90, '2024-06-05 19:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3468: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '85225',
    5, 0.90, '2024-06-05 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3467: other_pests (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Anthem', 'AZ', '85086',
    5, 0.75, '2024-06-05 09:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3466: scorpions (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Oro Valley', 'AZ', '85737',
    6, 0.90, '2024-06-05 01:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3465: other_pests (Maggie Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Maggie Valley', 'AZ', '28751',
    5, 0.75, '2024-06-04 20:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3464: centipedes (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'centipedes', 'Oro Valley', 'AZ', '85737',
    5, 0.85, '2024-06-04 20:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3464: scorpions (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Oro Valley', 'AZ', '85737',
    5, 0.85, '2024-06-04 20:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3463: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85748',
    5, 0.85, '2024-06-04 19:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3463: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85748',
    5, 0.85, '2024-06-04 19:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3462: termites (Hialeah, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Hialeah', 'AZ', '33012',
    5, 0.75, '2024-06-04 17:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3461: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '85750',
    5, 0.90, '2024-06-04 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3459: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85711',
    4, 0.75, '2024-06-04 00:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3456: other_pests (Arizona city, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona city', 'AZ', '85123',
    5, 0.75, '2024-06-03 18:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3455: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2024-06-03 16:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3454: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '85710',
    5, 0.90, '2024-06-03 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3452: bees (Marana Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana Arizona', 'AZ', '85653',
    5, 0.75, '2024-06-03 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3451: ants (Solitude Square, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Solitude Square', 'AZ', '90589',
    4, 0.90, '2024-06-03 02:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3450: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-06-02 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3448: rodents (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'AZ', '85749',
    6, 0.85, '2024-06-01 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3448: spiders (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'TUCSON', 'AZ', '85749',
    6, 0.85, '2024-06-01 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3446: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85742',
    5, 0.85, '2024-05-31 21:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3446: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85742',
    5, 0.85, '2024-05-31 21:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3445: other_pests (Atlanta, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Atlanta', 'AZ', '30324',
    5, 0.75, '2024-05-31 17:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3444: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85301',
    5, 0.75, '2024-05-31 13:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3443: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85735',
    5, 0.75, '2024-05-31 13:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3442: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2024-05-31 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3441: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85749',
    5, 0.75, '2024-05-31 01:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3440: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-05-31 01:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3440: spiders (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Marana', 'AZ', '85653',
    5, 0.85, '2024-05-31 01:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3439: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85032',
    5, 0.75, '2024-05-31 01:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3438: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-05-31 00:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3436: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-05-30 19:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3435: ants (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Surprise', 'AZ', '85387',
    5, 0.85, '2024-05-30 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3435: rodents (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Surprise', 'AZ', '85387',
    5, 0.85, '2024-05-30 17:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3434: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-05-30 12:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3433: mosquitoes (Mesa AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Mesa AZ', 'AZ', '85212',
    5, 0.75, '2024-05-30 09:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3432: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '85602',
    5, 0.75, '2024-05-29 22:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3431: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-05-29 21:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3430: other_pests (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Casa Grande', 'AZ', '85122',
    5, 0.75, '2024-05-29 21:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3429: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85304',
    6, 0.85, '2024-05-29 19:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3429: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85304',
    6, 0.85, '2024-05-29 19:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3428: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85143',
    5, 0.90, '2024-05-29 19:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3427: ants (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Red Rock', 'AZ', '85145-4052',
    5, 0.85, '2024-05-29 16:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3427: termites (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Red Rock', 'AZ', '85145-4052',
    5, 0.85, '2024-05-29 16:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3425: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    4, 0.75, '2024-05-29 13:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3424: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-05-29 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3423: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '85298',
    4, 0.75, '2024-05-29 09:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3422: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85747',
    5, 0.75, '2024-05-28 21:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3420: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85742',
    5, 0.90, '2024-05-28 13:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3419: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85716',
    5, 0.75, '2024-05-28 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3418: ants (QUEEN CREEK, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'QUEEN CREEK', 'AZ', '85142',
    4, 0.85, '2024-05-28 09:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3418: termites (QUEEN CREEK, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'QUEEN CREEK', 'AZ', '85142',
    4, 0.85, '2024-05-28 09:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3417: ants (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Las Vegas', 'AZ', '89117',
    5, 0.85, '2024-05-28 08:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3417: bed_bugs (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Las Vegas', 'AZ', '89117',
    5, 0.85, '2024-05-28 08:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3417: rodents (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Las Vegas', 'AZ', '89117',
    5, 0.85, '2024-05-28 08:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3416: other_pests (Hobart, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Hobart', 'AZ', '46342',
    5, 0.90, '2024-05-28 05:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3415: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-05-27 20:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3412: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.90, '2024-05-27 09:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3411: rodents (Hobart, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Hobart', 'AZ', '46342',
    4, 0.75, '2024-05-27 04:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3410: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-05-26 12:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3409: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '85338',
    5, 0.75, '2024-05-25 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3408: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85719',
    5, 0.90, '2024-05-25 18:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3407: scorpions (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tempe', 'AZ', '85284',
    6, 0.90, '2024-05-25 15:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3405: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-05-25 09:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3404: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85710',
    5, 0.75, '2024-05-25 07:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3403: roaches (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Glendale', 'AZ', '85310',
    9, 0.90, '2024-05-25 01:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3402: other_pests (Queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen creek', 'AZ', '85142',
    5, 0.75, '2024-05-24 16:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3399: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '85755',
    9, 0.75, '2024-05-24 12:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3398: ants (Hobart, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Hobart', 'AZ', '46342',
    4, 0.90, '2024-05-24 05:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3395: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85016',
    5, 0.75, '2024-05-23 16:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3394: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85730',
    4, 0.75, '2024-05-23 14:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3391: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-05-23 11:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3390: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2024-05-23 02:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3390: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2024-05-23 02:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3389: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '92618',
    5, 0.85, '2024-05-23 02:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3389: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '92618',
    5, 0.85, '2024-05-23 02:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3388: ants (GILBERT, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'GILBERT', 'AZ', '85295',
    4, 0.85, '2024-05-22 23:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3388: roaches (GILBERT, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'GILBERT', 'AZ', '85295',
    4, 0.85, '2024-05-22 23:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3387: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85747',
    5, 0.90, '2024-05-22 18:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3385: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-05-22 15:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3382: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-05-22 00:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3381: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-05-21 21:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3379: moths (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-05-21 18:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3378: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85225',
    5, 0.75, '2024-05-21 18:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3376: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '85305',
    5, 0.90, '2024-05-21 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3374: other_pests (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Green Valley', 'AZ', '85614',
    5, 0.75, '2024-05-20 12:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3373: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85742',
    5, 0.90, '2024-05-20 12:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3372: bees (VAIL, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'VAIL', 'AZ', '85641',
    5, 0.75, '2024-05-20 11:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3371: ants (Hobart, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Hobart', 'AZ', '46342',
    4, 0.90, '2024-05-20 03:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3370: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    5, 0.75, '2024-05-19 17:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3369: other_pests (Fhoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Fhoenix', 'AZ', '85008',
    5, 0.75, '2024-05-19 17:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3366: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85705',
    5, 0.75, '2024-05-19 04:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3365: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    5, 0.90, '2024-05-18 13:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3364: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '85641',
    4, 0.75, '2024-05-18 09:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3363: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2024-05-17 19:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3362: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85739',
    5, 0.75, '2024-05-17 18:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3361: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2024-05-17 11:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3360: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '85658',
    5, 0.85, '2024-05-17 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3360: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.85, '2024-05-17 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3358: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85742',
    6, 0.85, '2024-05-17 04:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3358: beetles (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Tucson', 'AZ', '85742',
    6, 0.85, '2024-05-17 04:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3357: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85742',
    5, 0.85, '2024-05-17 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3357: beetles (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Tucson', 'AZ', '85742',
    5, 0.85, '2024-05-17 03:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3355: ants (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Benson', 'AZ', '85602',
    8, 0.85, '2024-05-16 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3355: roaches (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Benson', 'AZ', '85602',
    8, 0.85, '2024-05-16 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3355: spiders (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Benson', 'AZ', '85602',
    8, 0.85, '2024-05-16 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3355: termites (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Benson', 'AZ', '85602',
    8, 0.85, '2024-05-16 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3354: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85710',
    4, 0.90, '2024-05-16 17:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3351: ants (2735 Scranton Road, Cleveland, CL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '2735 Scranton Road, Cleveland', 'CL', '',
    5, 0.85, '2024-05-16 11:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3351: bed_bugs (2735 Scranton Road, Cleveland, CL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '2735 Scranton Road, Cleveland', 'CL', '',
    5, 0.85, '2024-05-16 11:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3350: ants (2735 Scranton Road, Cleveland, CL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', '2735 Scranton Road, Cleveland', 'CL', '44113',
    5, 0.85, '2024-05-16 11:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3350: bed_bugs (2735 Scranton Road, Cleveland, CL)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', '2735 Scranton Road, Cleveland', 'CL', '44113',
    5, 0.85, '2024-05-16 11:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3349: ants (Miami, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Miami', 'AZ', '33155',
    5, 0.90, '2024-05-16 02:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3348: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85234',
    5, 0.75, '2024-05-15 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3347: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85736',
    5, 0.75, '2024-05-15 16:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3346: wasps (Tucson, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson, AZ', 'AZ', '85739',
    5, 0.90, '2024-05-15 10:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3344: rodents (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Scottsdale', 'AZ', '85260',
    6, 0.90, '2024-05-15 01:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3343: bees (Phoenix, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix, AZ', 'AZ', '85006',
    6, 0.90, '2024-05-14 19:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3342: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '85712',
    5, 0.75, '2024-05-14 17:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3340: mosquitoes (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-05-14 02:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3335: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    5, 0.75, '2024-05-13 19:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3334: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85051',
    5, 0.85, '2024-05-13 16:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3334: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '85051',
    5, 0.85, '2024-05-13 16:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3333: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '85641',
    5, 0.75, '2024-05-13 13:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3332: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85730',
    5, 0.75, '2024-05-13 09:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3330: rodents (queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'queen creek', 'AZ', '85142',
    5, 0.85, '2024-05-12 22:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3330: scorpions (queen creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'queen creek', 'AZ', '85142',
    5, 0.85, '2024-05-12 22:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3329: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85757',
    8, 0.90, '2024-05-10 23:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3328: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '32000',
    5, 0.85, '2024-05-10 18:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3328: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '32000',
    5, 0.85, '2024-05-10 18:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3327: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85083',
    5, 0.75, '2024-05-10 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3326: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85756',
    5, 0.75, '2024-05-10 13:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3323: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '85756',
    4, 0.75, '2024-05-10 01:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3320: other_pests (Detroit, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Detroit', 'AZ', '48243',
    6, 0.75, '2024-05-09 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3321: other_pests (Detroit, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Detroit', 'AZ', '48243',
    6, 0.75, '2024-05-09 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3319: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85748',
    5, 0.75, '2024-05-09 11:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3318: other_pests (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Farmington', 'AZ', '87402',
    5, 0.90, '2024-05-09 06:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3317: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-05-08 22:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3316: ants (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Avondale', 'AZ', '85392',
    5, 0.75, '2024-05-08 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3315: wasps (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Surprise', 'AZ', '85379',
    4, 0.90, '2024-05-08 20:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3305: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '85042',
    6, 0.85, '2024-05-08 08:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3305: beetles (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Phoenix', 'AZ', '85042',
    6, 0.85, '2024-05-08 08:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3304: other_pests (Boston, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Boston', 'AZ', '02132',
    6, 0.75, '2024-05-08 07:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3303: other_pests (Sacramento, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sacramento', 'AZ', '95814',
    5, 0.90, '2024-05-08 06:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3302: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85718',
    5, 0.85, '2024-05-07 20:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3302: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85718',
    5, 0.85, '2024-05-07 20:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3301: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '85225',
    5, 0.75, '2024-05-07 18:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3300: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    4, 0.75, '2024-05-07 17:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3299: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '85210',
    4, 0.75, '2024-05-07 17:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3298: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '85653',
    6, 0.90, '2024-05-07 16:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3296: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '85705',
    5, 0.90, '2024-05-07 16:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3295: termites (Stockbridge, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Stockbridge', 'AZ', '30281',
    5, 0.75, '2024-05-07 14:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3294: ants (new york, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'new york', 'AZ', '32445',
    5, 0.85, '2024-05-07 09:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3294: termites (new york, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'new york', 'AZ', '32445',
    5, 0.85, '2024-05-07 09:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3293: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85755-9109',
    5, 0.75, '2024-05-06 22:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3291: rodents (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Gilbert', 'AZ', '85296',
    4, 0.90, '2024-05-06 18:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3290: other_pests (N/A, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'N/A', 'AZ', '',
    5, 0.90, '2024-05-06 17:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3289: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-05-06 15:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3288: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-05-06 13:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3287: other_pests (Rio Rico, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rio Rico', 'AZ', '85648',
    5, 0.75, '2024-05-06 12:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3286: ants (Paris, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Paris', 'AZ', '',
    5, 0.85, '2024-05-06 02:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3286: bees (Paris, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Paris', 'AZ', '',
    5, 0.85, '2024-05-06 02:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3286: rodents (Paris, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Paris', 'AZ', '',
    5, 0.85, '2024-05-06 02:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3286: termites (Paris, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Paris', 'AZ', '',
    5, 0.85, '2024-05-06 02:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3283: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '85145',
    5, 0.75, '2024-05-05 18:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3281: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-05-05 17:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3280: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2024-05-04 20:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3279: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    6, 0.80, '2024-05-04 19:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3278: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    6, 0.80, '2024-05-04 19:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3277: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-05-04 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3276: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85719',
    4, 0.75, '2024-05-04 15:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3274: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85009',
    4, 0.85, '2024-05-04 12:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3274: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '85009',
    4, 0.85, '2024-05-04 12:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3272: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85711',
    5, 0.75, '2024-05-03 23:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3271: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85705',
    4, 0.75, '2024-05-03 17:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3270: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-05-03 16:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3269: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85086',
    5, 0.75, '2024-05-03 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3268: ants (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Peoria', 'AZ', '85383',
    6, 0.90, '2024-05-03 15:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3267: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85730',
    5, 0.90, '2024-05-03 14:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3266: bees (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Paradise Valley', 'AZ', '85253',
    9, 0.90, '2024-05-02 17:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3265: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85742',
    5, 0.75, '2024-05-02 15:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3264: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85756',
    4, 0.75, '2024-05-02 11:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3263: ants (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-05-02 05:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3263: bed_bugs (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Farmington', 'AZ', '87402',
    4, 0.85, '2024-05-02 05:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3260: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85085',
    5, 0.75, '2024-05-01 14:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3259: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85083',
    5, 0.75, '2024-05-01 13:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3257: bees (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Vail', 'AZ', '85641',
    5, 0.85, '2024-05-01 05:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3257: rodents (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Vail', 'AZ', '85641',
    5, 0.85, '2024-05-01 05:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3256: bees (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Vail', 'AZ', '85641',
    5, 0.85, '2024-05-01 05:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3256: rodents (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Vail', 'AZ', '85641',
    5, 0.85, '2024-05-01 05:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3255: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85233',
    5, 0.75, '2024-04-30 21:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3254: bees (Sells, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Sells', 'AZ', '85634',
    5, 0.75, '2024-04-30 18:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3249: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85745',
    5, 0.75, '2024-04-30 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3247: bees (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Vail', 'AZ', '85641-5975',
    5, 0.90, '2024-04-30 11:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3245: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '85630',
    5, 0.75, '2024-04-29 18:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3244: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-04-29 17:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3242: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85711',
    4, 0.75, '2024-04-29 14:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3241: termites (Anthem, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Anthem', 'AZ', '85086',
    4, 0.75, '2024-04-29 14:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3238: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85741-1113',
    5, 0.90, '2024-04-29 13:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3237: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85743',
    5, 0.75, '2024-04-29 12:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3236: bed_bugs (Sells, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Sells', 'AZ', '85634',
    5, 0.75, '2024-04-29 04:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3235: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85719',
    5, 0.75, '2024-04-28 23:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3233: ants (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Surprise', 'AZ', '85387',
    5, 0.75, '2024-04-28 18:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3232: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2024-04-28 15:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3230: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85749',
    6, 0.80, '2024-04-28 10:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3229: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '',
    5, 0.75, '2024-04-27 14:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3228: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85719',
    9, 0.90, '2024-04-26 20:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3227: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85302',
    6, 0.85, '2024-04-26 18:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3227: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '85302',
    6, 0.85, '2024-04-26 18:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3226: termites (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2024-04-26 18:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3225: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85658',
    5, 0.75, '2024-04-26 16:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3220: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85716',
    6, 0.90, '2024-04-26 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3219: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-04-26 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3218: ants (Sacramento, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sacramento', 'AZ', '95814',
    4, 0.90, '2024-04-26 05:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3217: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '85140',
    5, 0.75, '2024-04-25 17:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3216: mosquitoes (Greeley, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Greeley', 'CO', '80631',
    5, 0.85, '2024-04-25 16:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3216: rodents (Greeley, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Greeley', 'CO', '80631',
    5, 0.85, '2024-04-25 16:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3215: spiders (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Chandler', 'AZ', '85249',
    5, 0.85, '2024-04-25 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3215: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '85249',
    5, 0.85, '2024-04-25 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3214: termites (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Avondale', 'AZ', '85323',
    9, 0.90, '2024-04-25 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3213: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85209',
    5, 0.75, '2024-04-25 13:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3211: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-04-25 06:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3211: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    5, 0.85, '2024-04-25 06:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3210: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '85201',
    5, 0.75, '2024-04-25 00:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3209: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '85283',
    5, 0.75, '2024-04-24 21:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3206: ants (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Red Rock', 'AZ', '85145',
    5, 0.85, '2024-04-24 11:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3206: spiders (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Red Rock', 'AZ', '85145',
    5, 0.85, '2024-04-24 11:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3204: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85743',
    4, 0.90, '2024-04-23 19:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3201: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-04-23 16:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3200: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2024-04-23 08:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3197: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85716',
    5, 0.85, '2024-04-22 23:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3197: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85716',
    5, 0.85, '2024-04-22 23:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3196: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85704',
    5, 0.75, '2024-04-22 23:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3195: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85713',
    5, 0.75, '2024-04-22 19:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3193: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '85087',
    5, 0.75, '2024-04-22 19:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3192: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85296',
    4, 0.75, '2024-04-22 17:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3191: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85714',
    4, 0.75, '2024-04-22 16:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3187: other_pests (marana, az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'marana, az', 'AZ', '85653',
    5, 0.75, '2024-04-22 13:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3186: crickets (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Mesa', 'AZ', '85209',
    5, 0.85, '2024-04-22 11:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3186: spiders (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Mesa', 'AZ', '85209',
    5, 0.85, '2024-04-22 11:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3185: ants (Hobart, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Hobart', 'AZ', '46342',
    4, 0.90, '2024-04-22 05:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3184: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85742',
    5, 0.75, '2024-04-21 23:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3183: other_pests (Coolidge, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Coolidge', 'AZ', '85128',
    4, 0.75, '2024-04-21 20:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3182: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85719',
    4, 0.90, '2024-04-21 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3180: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85757',
    5, 0.75, '2024-04-21 12:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3179: ants (Minneapolis, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Minneapolis', 'AZ', '55408',
    4, 0.75, '2024-04-21 11:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3177: scorpions (Sierra Vista, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Sierra Vista', 'AZ', '85650',
    5, 0.75, '2024-04-21 00:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3174: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '85233',
    5, 0.75, '2024-04-20 11:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3173: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85743',
    5, 0.90, '2024-04-19 19:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3170: ants (Solitude Square, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Solitude Square', 'AZ', '90589',
    4, 0.90, '2024-04-19 04:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3169: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '85255',
    5, 0.75, '2024-04-18 20:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3166: rodents (Cave Creek, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Cave Creek, AZ', 'AZ', '85331',
    4, 0.90, '2024-04-18 19:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3165: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '85710',
    5, 0.75, '2024-04-18 17:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3163: other_pests (Queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Queen Creek', 'AZ', '85142',
    5, 0.75, '2024-04-18 15:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3162: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85750',
    5, 0.75, '2024-04-18 15:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3161: scorpions (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Surprise', 'AZ', '85387',
    5, 0.75, '2024-04-18 15:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3160: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '85387',
    5, 0.75, '2024-04-18 15:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3159: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85741',
    5, 0.75, '2024-04-18 14:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3156: other_pests (Broomfield, CO)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Broomfield', 'CO', '80023',
    5, 0.75, '2024-04-18 10:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3155: rodents (queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'queen Creek', 'AZ', '85142',
    5, 0.85, '2024-04-18 10:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 3155: wildlife (queen Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'queen Creek', 'AZ', '85142',
    5, 0.85, '2024-04-18 10:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3151: other_pests (Tucson Az. 85713, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Az. 85713', 'AZ', '85713',
    5, 0.90, '2024-04-17 13:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3149: flies (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Litchfield Park', 'AZ', '85340',
    5, 0.75, '2024-04-17 13:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3146: other_pests (-, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '-', 'AZ', '',
    5, 0.90, '2024-04-17 06:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3145: termites (Farmington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Farmington', 'AZ', '87402',
    5, 0.90, '2024-04-17 06:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3144: termites (Sun City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sun City', 'AZ', '85351',
    5, 0.75, '2024-04-16 22:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3143: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '85301',
    5, 0.75, '2024-04-16 19:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3139: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85739',
    5, 0.90, '2024-04-16 14:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3138: bees (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'TUCSON', 'AZ', '85757',
    5, 0.75, '2024-04-16 14:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3137: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85754',
    5, 0.75, '2024-04-16 14:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 3136: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '85741',
    5, 0.90, '2024-04-16 12:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;
