-- Bulk Import Pest Pressure Data Points (Part 4/6)
-- Company: 8da68eed-0759-4b45-bd08-abb339cfad7b
-- Records: 3001 to 4000

DO $$
DECLARE
  company_uuid UUID := '8da68eed-0759-4b45-bd08-abb339cfad7b';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN

  -- Form 1969: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2023-08-10 02:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1968: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '84757',
    5, 0.85, '2023-08-10 01:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1968: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '84757',
    5, 0.85, '2023-08-10 01:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1968: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '84757',
    5, 0.85, '2023-08-10 01:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1967: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '85658',
    5, 0.75, '2023-08-09 22:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1966: other_pests (Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Az', 'AZ', '85033',
    5, 0.75, '2023-08-09 18:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1965: bees (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'TUCSON', 'AZ', '85711',
    5, 0.85, '2023-08-09 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1965: moths (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'TUCSON', 'AZ', '85711',
    5, 0.85, '2023-08-09 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1965: spiders (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'TUCSON', 'AZ', '85711',
    5, 0.85, '2023-08-09 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1964: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '85713',
    5, 0.75, '2023-08-09 17:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1963: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '85051',
    4, 0.90, '2023-08-09 01:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1962: other_pests (Alpine ca, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Alpine ca', 'AZ', '91901',
    5, 0.75, '2023-08-09 00:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1961: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '85741',
    5, 0.90, '2023-08-08 09:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1960: other_pests (Mesa Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa Az', 'AZ', '85210',
    5, 0.75, '2023-08-08 06:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1959: other_pests (Mesa Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa Az', 'AZ', '85210',
    5, 0.75, '2023-08-08 06:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1958: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85706',
    5, 0.75, '2023-08-08 03:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1957: roaches (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Surprise', 'AZ', '85388',
    5, 0.75, '2023-08-08 01:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1956: ants (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'MARANA', 'AZ', '85653',
    6, 0.85, '2023-08-08 00:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1956: rodents (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'MARANA', 'AZ', '85653',
    6, 0.85, '2023-08-08 00:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1955: other_pests (Mohave valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mohave valley', 'AZ', '86446',
    5, 0.75, '2023-08-07 17:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1954: ants (oro valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'oro valley', 'AZ', '85737',
    9, 0.75, '2023-08-07 17:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1953: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85705',
    5, 0.75, '2023-08-07 15:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1951: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '85715',
    5, 0.85, '2023-08-07 14:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1951: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85715',
    5, 0.85, '2023-08-07 14:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1950: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '85742',
    5, 0.75, '2023-08-06 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1949: other_pests (Meza Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Meza Arizona', 'AZ', '85203',
    5, 0.75, '2023-08-06 00:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1948: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '85742-9382',
    5, 0.75, '2023-08-05 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1947: ants (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Mesa', 'AZ', '85207',
    5, 0.85, '2023-08-05 09:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1947: bees (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Mesa', 'AZ', '85207',
    5, 0.85, '2023-08-05 09:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1947: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '85207',
    5, 0.85, '2023-08-05 09:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1946: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.75, '2023-08-05 00:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1945: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '85747',
    5, 0.75, '2023-08-04 21:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1944: termites (San Diego, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Diego', 'AZ', '92105-3685',
    5, 0.75, '2023-08-04 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1943: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    5, 0.75, '2023-08-04 16:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1942: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '85653',
    4, 0.75, '2023-08-04 15:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1940: other_pests (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Ajo', 'AZ', '85321',
    5, 0.75, '2023-08-04 11:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1939: other_pests (test, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'test', 'AZ', '00000',
    5, 0.75, '2023-08-04 09:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1938: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    7, 0.75, '2023-08-04 01:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1937: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-08-03 22:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1936: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '',
    5, 0.90, '2023-08-03 10:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1935: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-08-03 01:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1934: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-08-01 23:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1933: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-08-01 13:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1932: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    6, 0.85, '2023-08-01 05:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1932: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.85, '2023-08-01 05:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1931: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-08-01 00:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1930: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-07-31 20:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1929: ticks (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ticks', 'Glendale', 'AZ', '',
    5, 0.75, '2023-07-31 19:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1928: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '',
    5, 0.75, '2023-07-31 18:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1927: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-30 14:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1926: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '',
    6, 0.80, '2023-07-30 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1925: other_pests (Tucson Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Arizona', 'AZ', '',
    5, 0.75, '2023-07-30 11:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1924: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-30 00:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1923: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-29 23:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1922: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-29 23:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1921: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '',
    5, 0.75, '2023-07-29 21:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1920: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-29 18:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1919: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-29 16:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1918: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    6, 0.90, '2023-07-29 12:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1917: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '',
    4, 0.75, '2023-07-29 06:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1916: termites (PEORIA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'PEORIA', 'AZ', '',
    5, 0.90, '2023-07-28 23:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1914: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-07-28 14:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1913: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-28 07:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1912: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-07-28 02:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1911: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-27 21:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1910: termites (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Sahuarita', 'AZ', '',
    5, 0.90, '2023-07-27 19:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1909: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-07-27 10:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1908: other_pests (Consectetur aliqua, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Consectetur aliqua', 'AZ', '',
    5, 0.75, '2023-07-27 02:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1907: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-27 02:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1906: termites (Red rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Red rock', 'AZ', '',
    5, 0.75, '2023-07-26 17:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1905: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-26 15:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1901: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '',
    5, 0.90, '2023-07-26 10:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1900: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-26 07:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1897: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-26 03:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1895: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.90, '2023-07-26 00:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1894: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-25 23:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1891: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.90, '2023-07-25 18:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1889: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '',
    6, 0.85, '2023-07-25 17:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1889: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    6, 0.85, '2023-07-25 17:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1888: ants (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tolleson', 'AZ', '',
    5, 0.75, '2023-07-25 15:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1887: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-25 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1886: other_pests (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las Vegas', 'AZ', '',
    5, 0.75, '2023-07-25 13:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1885: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-25 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1884: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-25 09:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1883: ants (Mount Pleasant, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Mount Pleasant', 'AZ', '',
    5, 0.85, '2023-07-25 04:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1883: bed_bugs (Mount Pleasant, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mount Pleasant', 'AZ', '',
    5, 0.85, '2023-07-25 04:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1882: roaches (Grayson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Grayson', 'AZ', '',
    5, 0.75, '2023-07-24 21:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1881: other_pests (Phoenix, Arizona, AR)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix, Arizona', 'AR', '',
    5, 0.75, '2023-07-24 15:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1880: other_pests (Phoenix, Arizona, AR)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix, Arizona', 'AR', '',
    5, 0.75, '2023-07-24 15:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1879: termites (marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'marana', 'AZ', '',
    5, 0.75, '2023-07-24 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1878: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.90, '2023-07-24 09:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1877: bees (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Vail', 'AZ', '',
    5, 0.85, '2023-07-23 23:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1877: rodents (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Vail', 'AZ', '',
    5, 0.85, '2023-07-23 23:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1876: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-23 20:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1876: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-23 20:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1876: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-23 20:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1875: other_pests (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las Vegas', 'AZ', '',
    5, 0.75, '2023-07-23 07:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1874: other_pests (Willcox az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Willcox az', 'AZ', '',
    5, 0.75, '2023-07-23 02:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1873: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-22 19:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1873: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-22 19:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1872: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-22 17:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1871: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-21 17:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1870: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-21 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1869: other_pests (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Buckeye', 'AZ', '',
    5, 0.75, '2023-07-21 16:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1868: other_pests (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Buckeye', 'AZ', '',
    5, 0.75, '2023-07-21 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1866: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    5, 0.75, '2023-07-21 11:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1865: crickets (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Phoenix', 'AZ', '',
    9, 0.80, '2023-07-21 02:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1864: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-07-20 20:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1863: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-07-20 20:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1862: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-20 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1861: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.90, '2023-07-20 13:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1860: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    5, 0.90, '2023-07-20 11:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1859: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-20 03:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1857: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '',
    5, 0.75, '2023-07-20 03:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1858: other_pests (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chandler', 'AZ', '',
    5, 0.75, '2023-07-20 03:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1856: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-20 00:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1855: roaches (SCOTTSDALE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'SCOTTSDALE', 'AZ', '',
    6, 0.80, '2023-07-19 22:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1854: other_pests (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Florence', 'AZ', '',
    5, 0.75, '2023-07-19 15:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1852: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-19 10:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1852: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-19 10:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1851: termites (GREEN VALLEY, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'GREEN VALLEY', 'AZ', '',
    4, 0.75, '2023-07-19 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1849: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-19 09:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1848: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-19 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1847: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-18 18:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1847: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-18 18:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1846: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-07-18 17:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1842: other_pests (Mesa Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa Az', 'AZ', '',
    5, 0.75, '2023-07-18 02:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1841: scorpions (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'tucson', 'AZ', '',
    5, 0.85, '2023-07-18 01:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1841: spiders (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'tucson', 'AZ', '',
    5, 0.85, '2023-07-18 01:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1840: rodents (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Ajo', 'AZ', '',
    5, 0.75, '2023-07-18 00:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1839: flies (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Phoenix', 'AZ', '',
    8, 0.90, '2023-07-17 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1838: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-17 18:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1837: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.90, '2023-07-17 17:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1836: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    4, 0.75, '2023-07-17 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1835: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-17 02:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1834: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-07-16 20:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1833: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '',
    5, 0.75, '2023-07-16 19:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1832: other_pests (Amargosa valley nevada, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Amargosa valley nevada', 'AZ', '',
    5, 0.75, '2023-07-16 17:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1831: ants (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'tucson', 'AZ', '',
    4, 0.85, '2023-07-16 16:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1831: bees (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'tucson', 'AZ', '',
    4, 0.85, '2023-07-16 16:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1830: other_pests (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Avondale', 'AZ', '',
    5, 0.75, '2023-07-16 15:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1829: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-07-15 21:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1828: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    4, 0.85, '2023-07-15 18:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1828: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.85, '2023-07-15 18:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1828: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '',
    4, 0.85, '2023-07-15 18:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1827: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-15 14:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1827: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-15 14:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1826: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-15 12:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1825: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-15 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1824: ants (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Cave Creek', 'AZ', '',
    5, 0.90, '2023-07-14 17:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1823: wasps (Corona De Tuscon, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Corona De Tuscon', 'AZ', '',
    5, 0.75, '2023-07-14 17:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1822: ants (Waddell, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Waddell', 'AZ', '',
    5, 0.85, '2023-07-14 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1822: termites (Waddell, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Waddell', 'AZ', '',
    5, 0.85, '2023-07-14 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1821: other_pests (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tolleson', 'AZ', '',
    5, 0.75, '2023-07-14 01:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1820: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    7, 0.75, '2023-07-13 22:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1819: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-07-13 22:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1818: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.90, '2023-07-13 15:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1817: other_pests (Amargosa valley nevada 89020, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Amargosa valley nevada 89020', 'AZ', '',
    5, 0.75, '2023-07-13 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1816: other_pests (Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Az', 'AZ', '',
    5, 0.75, '2023-07-13 12:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1815: other_pests (test, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'test', 'AZ', '',
    5, 0.75, '2023-07-13 09:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1814: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-13 08:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1813: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-07-12 19:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1813: bees (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-07-12 19:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1813: rodents (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-07-12 19:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1812: other_pests (Sun City, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sun City', 'AZ', '',
    5, 0.75, '2023-07-12 14:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1811: spiders (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Sahuarita', 'AZ', '',
    4, 0.90, '2023-07-12 13:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1810: ants (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Red Rock', 'AZ', '',
    6, 0.80, '2023-07-12 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1809: ants (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Arizona', 'AZ', '',
    5, 0.75, '2023-07-12 10:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1808: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-11 20:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1807: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-07-11 18:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1806: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-11 15:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1805: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-07-11 15:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1804: wasps (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'TUCSON', 'AZ', '',
    4, 0.90, '2023-07-11 14:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1803: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-11 10:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1802: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-10 19:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1801: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-07-10 17:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1800: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-07-10 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1799: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-07-10 17:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1798: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-10 15:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1798: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-10 15:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1797: other_pests (Grand Canyon Village, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Grand Canyon Village', 'AZ', '',
    5, 0.75, '2023-07-10 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1796: other_pests (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Green Valley', 'AZ', '',
    5, 0.75, '2023-07-10 15:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1795: other_pests (Rialto ca, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rialto ca', 'AZ', '',
    5, 0.75, '2023-07-10 13:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1794: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-07-10 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1793: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-10 06:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1792: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-10 01:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1791: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '',
    5, 0.75, '2023-07-09 21:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1790: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-09 19:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1789: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-07-09 15:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1788: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-07-09 13:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1787: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-09 13:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1787: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-09 13:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1787: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-09 13:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1786: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    4, 0.90, '2023-07-09 11:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1785: other_pests (Phoenix az 85021, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az 85021', 'AZ', '',
    5, 0.75, '2023-07-09 09:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1784: other_pests (Phoenix az 85021, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az 85021', 'AZ', '',
    5, 0.75, '2023-07-09 09:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1783: other_pests (Phoenix az 85021, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az 85021', 'AZ', '',
    5, 0.75, '2023-07-09 09:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1782: other_pests (Phoenix az 85021, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az 85021', 'AZ', '',
    5, 0.90, '2023-07-09 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1781: other_pests (Phoenix az 85021, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az 85021', 'AZ', '',
    5, 0.90, '2023-07-09 09:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1779: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-08 23:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1778: rodents (Sun City West, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Sun City West', 'AZ', '',
    5, 0.75, '2023-07-08 22:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1777: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '',
    9, 0.90, '2023-07-08 12:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1776: ants (Arlington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Arlington', 'AZ', '',
    5, 0.85, '2023-07-08 11:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1776: bees (Arlington, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Arlington', 'AZ', '',
    5, 0.85, '2023-07-08 11:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1775: other_pests (Pohenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Pohenix', 'AZ', '',
    5, 0.75, '2023-07-08 02:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1774: other_pests (Tucsom, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucsom', 'AZ', '',
    5, 0.75, '2023-07-07 20:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1773: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-07 16:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1772: other_pests (Tcson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tcson', 'AZ', '',
    5, 0.75, '2023-07-07 13:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1771: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-07 13:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1770: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-07 13:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1769: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-07 13:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1768: other_pests (phoenix area, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'phoenix area', 'AZ', '',
    5, 0.75, '2023-07-07 09:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1767: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-07 00:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1766: scorpions (Tucson,AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson,AZ', 'AZ', '',
    4, 0.75, '2023-07-06 21:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1765: other_pests (1460 e bell rd phonix arizona 85022, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '1460 e bell rd phonix arizona 85022', 'AZ', '',
    5, 0.75, '2023-07-06 18:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1764: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '',
    4, 0.75, '2023-07-06 14:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1762: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-06 11:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1761: other_pests (Mesa az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa az', 'AZ', '',
    5, 0.75, '2023-07-06 10:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1760: other_pests (Mesa az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa az', 'AZ', '',
    5, 0.75, '2023-07-06 10:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1759: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '',
    5, 0.75, '2023-07-06 10:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1758: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-07-06 09:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1757: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.90, '2023-07-06 05:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1756: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-06 04:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1755: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-06 03:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1754: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-06 02:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1753: roaches (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Glendale', 'AZ', '',
    5, 0.75, '2023-07-06 01:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1752: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-05 23:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1750: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '',
    5, 0.75, '2023-07-05 19:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1749: termites (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Arizona', 'AZ', '',
    5, 0.75, '2023-07-05 17:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1748: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '',
    9, 0.75, '2023-07-05 16:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1747: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-05 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1746: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-05 10:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1746: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-05 10:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1745: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-04 23:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1745: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-07-04 23:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1744: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-07-04 14:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1742: other_pests (Arizona,, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona,', 'AZ', '',
    5, 0.75, '2023-07-04 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1743: other_pests (Arizona,, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona,', 'AZ', '',
    5, 0.75, '2023-07-04 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1740: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    6, 0.85, '2023-07-03 18:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1740: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '',
    6, 0.85, '2023-07-03 18:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1739: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-03 17:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1738: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-03 16:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1737: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-03 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1736: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-03 16:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1735: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-03 15:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1734: other_pests (Hobbs nuevo México, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Hobbs nuevo México', 'AZ', '',
    5, 0.75, '2023-07-03 14:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1733: other_pests (Litchfield Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Litchfield Park', 'AZ', '',
    5, 0.75, '2023-07-03 14:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1732: other_pests (Red rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red rock', 'AZ', '',
    5, 0.75, '2023-07-03 12:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1731: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    9, 0.75, '2023-07-03 10:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1730: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    8, 0.90, '2023-07-03 03:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1729: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-03 02:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1728: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-03 01:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1727: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-03 00:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1726: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-07-02 20:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1725: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-02 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1725: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    5, 0.85, '2023-07-02 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1724: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.90, '2023-07-02 10:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1723: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-07-02 09:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1722: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-07-02 00:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1721: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-07-01 19:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1720: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-07-01 13:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1720: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-07-01 13:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1718: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '',
    5, 0.75, '2023-07-01 05:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1717: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    9, 0.75, '2023-06-30 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1716: ants (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'tucson', 'AZ', '',
    5, 0.85, '2023-06-30 16:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1716: rodents (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'tucson', 'AZ', '',
    5, 0.85, '2023-06-30 16:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1715: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-30 13:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1714: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    7, 0.90, '2023-06-30 12:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1713: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '',
    5, 0.90, '2023-06-30 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1712: spiders (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Marana', 'AZ', '',
    5, 0.75, '2023-06-30 12:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1709: bed_bugs (London, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'London', 'AZ', '',
    5, 0.75, '2023-06-30 09:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1708: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-06-30 03:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1707: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    5, 0.75, '2023-06-29 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1706: rodents (Amarillo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Amarillo', 'AZ', '',
    5, 0.90, '2023-06-29 14:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1705: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-29 12:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1704: other_pests (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Casa Grande', 'AZ', '',
    4, 0.90, '2023-06-29 12:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1703: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '',
    5, 0.75, '2023-06-29 05:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1702: other_pests (ESoy hombre, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'ESoy hombre', 'AZ', '',
    5, 0.75, '2023-06-28 16:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1701: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '',
    5, 0.90, '2023-06-28 13:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1700: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-28 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1699: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-28 13:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1698: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-28 10:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1698: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-28 10:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1698: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-28 10:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1697: ants (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'California', 'AZ', '',
    5, 0.85, '2023-06-28 06:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1697: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '',
    5, 0.85, '2023-06-28 06:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1696: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '',
    5, 0.75, '2023-06-28 01:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1695: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-28 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1694: other_pests (ESoy hombre, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'ESoy hombre', 'AZ', '',
    5, 0.75, '2023-06-27 22:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1693: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-27 18:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1692: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-27 16:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1691: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-27 14:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1690: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-06-27 06:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1689: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-06-27 06:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1688: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-27 05:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1687: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-27 03:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1686: other_pests (Rental, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rental', 'AZ', '',
    5, 0.75, '2023-06-26 15:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1685: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-26 13:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1683: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-25 22:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1682: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    9, 0.85, '2023-06-25 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1682: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    9, 0.85, '2023-06-25 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1681: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    9, 0.85, '2023-06-25 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1681: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    9, 0.85, '2023-06-25 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1680: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '',
    5, 0.90, '2023-06-24 20:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1679: scorpions (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Vail', 'AZ', '',
    5, 0.85, '2023-06-24 15:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1679: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    5, 0.85, '2023-06-24 15:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1678: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-24 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1677: other_pests (Minneapolis, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Minneapolis', 'AZ', '',
    6, 0.90, '2023-06-24 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1676: other_pests (Si, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Si', 'AZ', '',
    5, 0.75, '2023-06-24 10:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1675: other_pests (Phoenix arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix arizona', 'AZ', '',
    5, 0.75, '2023-06-24 05:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1674: other_pests (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen', 'AZ', '',
    5, 0.75, '2023-06-24 01:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1673: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-24 01:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1672: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-24 01:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1671: other_pests (Sahaurita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahaurita', 'AZ', '',
    5, 0.75, '2023-06-23 23:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1669: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-23 15:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1668: ants (arizona city, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'arizona city', 'AZ', '',
    4, 0.85, '2023-06-23 14:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1668: termites (arizona city, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'arizona city', 'AZ', '',
    4, 0.85, '2023-06-23 14:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1667: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-23 10:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1666: mosquitoes (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Tucson', 'AZ', '',
    9, 0.90, '2023-06-23 03:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1665: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-23 03:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1664: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    5, 0.75, '2023-06-22 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1662: spiders (SanTan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'SanTan Valley', 'AZ', '',
    5, 0.75, '2023-06-22 15:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1661: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-06-22 14:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1660: bed_bugs (San Diego California c a, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'San Diego California c a', 'AZ', '',
    5, 0.75, '2023-06-22 13:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1658: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-22 07:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1657: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-22 07:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1656: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-22 07:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1655: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-21 20:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1654: crickets (Vail, az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Vail, az', 'AZ', '',
    4, 0.85, '2023-06-21 15:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1654: roaches (Vail, az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Vail, az', 'AZ', '',
    4, 0.85, '2023-06-21 15:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1654: spiders (Vail, az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Vail, az', 'AZ', '',
    4, 0.85, '2023-06-21 15:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1654: termites (Vail, az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail, az', 'AZ', '',
    4, 0.85, '2023-06-21 15:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1653: other_pests (Phoenix az 85021, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az 85021', 'AZ', '',
    5, 0.75, '2023-06-21 15:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1652: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-06-21 10:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1651: other_pests (85301, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '85301', 'AZ', '',
    5, 0.75, '2023-06-21 01:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1650: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-06-21 00:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1649: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-06-21 00:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1648: other_pests (85041, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '85041', 'AZ', '',
    5, 0.75, '2023-06-20 18:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1647: bees (Casa Grande, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Casa Grande', 'AZ', '',
    5, 0.90, '2023-06-20 16:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1646: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-06-20 14:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1645: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2023-06-20 09:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1644: crickets (Youngtown, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Youngtown', 'AZ', '',
    5, 0.75, '2023-06-19 00:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1643: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    6, 0.90, '2023-06-18 20:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1642: other_pests (Phoenix A.z 85007 4049, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix A.z 85007 4049', 'AZ', '',
    5, 0.75, '2023-06-18 08:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1641: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    4, 0.85, '2023-06-17 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1641: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    4, 0.85, '2023-06-17 20:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1640: ants (AJO, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'AJO', 'AZ', '',
    9, 0.85, '2023-06-17 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1640: bees (AJO, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'AJO', 'AZ', '',
    9, 0.85, '2023-06-17 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1640: rodents (AJO, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'AJO', 'AZ', '',
    9, 0.85, '2023-06-17 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1639: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-06-17 15:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1638: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-17 11:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1637: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-06-17 02:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1636: other_pests (Tucson Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson Az', 'AZ', '',
    5, 0.75, '2023-06-17 01:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1635: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-16 21:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1634: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-16 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1633: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-16 15:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1632: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-16 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1631: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-16 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1630: fleas (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'fleas', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-16 05:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1629: ants (Phoenix, az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix, az', 'AZ', '',
    5, 0.90, '2023-06-15 15:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1628: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-15 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1627: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-15 06:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1627: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-15 06:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1627: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-15 06:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1626: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-06-15 01:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1625: other_pests (Laveen Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen Az', 'AZ', '',
    5, 0.75, '2023-06-15 00:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1624: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '',
    5, 0.75, '2023-06-14 23:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1623: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    5, 0.75, '2023-06-14 21:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1622: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-06-14 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1621: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-14 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1621: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-14 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1621: mosquitoes (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-14 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1621: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-14 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1621: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-14 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1620: other_pests (85017, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '85017', 'AZ', '',
    5, 0.75, '2023-06-14 10:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1619: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-06-14 02:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1618: other_pests (Lorenzo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Lorenzo', 'AZ', '',
    5, 0.75, '2023-06-14 01:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1617: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-14 00:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1616: other_pests (Glenda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glenda', 'AZ', '',
    5, 0.75, '2023-06-13 23:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1615: other_pests (Glenda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glenda', 'AZ', '',
    5, 0.75, '2023-06-13 23:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1614: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-13 18:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1612: other_pests (Etuuiojkk, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Etuuiojkk', 'AZ', '',
    5, 0.75, '2023-06-13 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1613: other_pests (Etuuiojkk, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Etuuiojkk', 'AZ', '',
    5, 0.75, '2023-06-13 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1611: other_pests (Etuuio, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Etuuio', 'AZ', '',
    5, 0.75, '2023-06-13 16:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1610: rodents (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'AZ', '',
    4, 0.75, '2023-06-13 11:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1609: other_pests (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tolleson', 'AZ', '',
    5, 0.75, '2023-06-13 10:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1608: spiders (Florence, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Florence', 'AZ', '',
    5, 0.75, '2023-06-13 10:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1607: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-13 06:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1606: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '',
    6, 0.80, '2023-06-12 23:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1605: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-06-12 23:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1604: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-06-12 23:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1603: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-06-12 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1602: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '',
    6, 0.90, '2023-06-12 17:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1601: other_pests (Glenda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glenda', 'AZ', '',
    5, 0.75, '2023-06-12 16:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1600: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-12 15:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1599: moths (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'moths', 'Tucson', 'AZ', '',
    4, 0.85, '2023-06-12 14:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1599: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.85, '2023-06-12 14:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1598: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-06-12 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1597: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-12 11:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1596: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-12 11:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1596: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-12 11:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1595: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-12 11:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1595: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-12 11:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1594: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-12 06:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1593: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-11 14:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1592: other_pests (Las vegas nevadas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las vegas nevadas', 'AZ', '',
    5, 0.75, '2023-06-11 12:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1591: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-06-11 04:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1591: beetles (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-06-11 04:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1590: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-11 03:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1589: crickets (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Marana', 'AZ', '',
    6, 0.85, '2023-06-10 23:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1589: spiders (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Marana', 'AZ', '',
    6, 0.85, '2023-06-10 23:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1588: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-10 19:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1588: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-10 19:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1587: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-10 15:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1586: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-10 13:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1586: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-06-10 13:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1585: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-09 21:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1584: termites (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Gilbert', 'AZ', '',
    5, 0.75, '2023-06-09 12:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1583: other_pests (ESoy hombre, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'ESoy hombre', 'AZ', '',
    5, 0.75, '2023-06-08 21:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1582: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-08 19:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1581: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-08 19:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1580: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-06-08 17:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1579: ants (or, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'or', 'AZ', '',
    6, 0.90, '2023-06-08 14:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1578: other_pests (Phx, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phx', 'AZ', '',
    5, 0.75, '2023-06-08 13:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1577: ants (San Jose, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'San Jose', 'AZ', '',
    4, 0.75, '2023-06-08 10:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1576: other_pests (Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Az', 'AZ', '',
    5, 0.75, '2023-06-08 08:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1575: ants (Finix ARIZONA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Finix ARIZONA', 'AZ', '',
    5, 0.75, '2023-06-08 01:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1574: ants (Finix ARIZONA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Finix ARIZONA', 'AZ', '',
    5, 0.75, '2023-06-08 01:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1573: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-06-08 01:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1572: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-06-08 01:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1571: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-07 17:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1570: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-07 17:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1569: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '',
    6, 0.90, '2023-06-07 16:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1568: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-07 14:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1566: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '',
    5, 0.85, '2023-06-06 17:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1566: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    5, 0.85, '2023-06-06 17:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1565: other_pests (Finix ARIZONA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Finix ARIZONA', 'AZ', '',
    5, 0.75, '2023-06-06 14:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1563: bed_bugs (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Benson', 'AZ', '',
    5, 0.75, '2023-06-06 10:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1562: ants (marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'marana', 'AZ', '',
    5, 0.85, '2023-06-06 00:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1562: scorpions (marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'marana', 'AZ', '',
    5, 0.85, '2023-06-06 00:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1561: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-05 23:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1560: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-05 20:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1559: termites (San Diego, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'San Diego', 'AZ', '',
    5, 0.90, '2023-06-05 19:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1558: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-06-05 13:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1558: spiders (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-06-05 13:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1558: wasps (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-06-05 13:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1557: scorpions (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Buckeye', 'AZ', '',
    4, 0.85, '2023-06-05 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1557: termites (Buckeye, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Buckeye', 'AZ', '',
    4, 0.85, '2023-06-05 13:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1556: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-06-05 11:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1555: bees (AJO, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'AJO', 'AZ', '',
    5, 0.75, '2023-06-05 11:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1554: bees (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Benson', 'AZ', '',
    5, 0.90, '2023-06-05 09:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1553: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-05 00:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1552: bees (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Maricopa', 'AZ', '',
    4, 0.85, '2023-06-04 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1552: rodents (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Maricopa', 'AZ', '',
    4, 0.85, '2023-06-04 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1552: termites (Maricopa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Maricopa', 'AZ', '',
    4, 0.85, '2023-06-04 23:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1551: ants (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-06-04 20:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1550: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-04 19:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1549: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-04 19:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1548: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-06-04 16:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1547: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    5, 0.90, '2023-06-04 12:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1546: bees (AJO, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'AJO', 'AZ', '',
    5, 0.75, '2023-06-03 14:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1545: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-06-03 08:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1544: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-03 04:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1543: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-06-02 22:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1542: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    4, 0.75, '2023-06-02 19:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1541: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-06-02 19:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1540: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-02 01:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1539: scorpions (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Gilbert', 'AZ', '',
    6, 0.80, '2023-06-01 23:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1538: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    6, 0.75, '2023-06-01 22:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1537: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-06-01 20:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1536: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-06-01 20:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1535: rodents (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Cave Creek', 'AZ', '',
    5, 0.85, '2023-06-01 20:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1535: termites (Cave Creek, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Cave Creek', 'AZ', '',
    5, 0.85, '2023-06-01 20:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1534: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.75, '2023-06-01 18:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1533: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '',
    5, 0.75, '2023-06-01 17:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1532: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-06-01 15:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1531: mosquitoes (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Sahuarita', 'AZ', '',
    5, 0.75, '2023-06-01 13:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1530: ants (marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'marana', 'AZ', '',
    5, 0.85, '2023-05-31 19:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1530: roaches (marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'marana', 'AZ', '',
    5, 0.85, '2023-05-31 19:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1530: scorpions (marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'marana', 'AZ', '',
    5, 0.85, '2023-05-31 19:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1529: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-31 16:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1529: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-31 16:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1528: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-31 14:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1527: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-31 14:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1526: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-31 13:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1525: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '',
    5, 0.75, '2023-05-31 09:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1524: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    6, 0.90, '2023-05-31 01:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1523: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-30 15:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1522: other_pests (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Peoria', 'AZ', '',
    5, 0.75, '2023-05-30 15:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1521: ants (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Sahuarita', 'AZ', '',
    4, 0.85, '2023-05-30 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1521: scorpions (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Sahuarita', 'AZ', '',
    4, 0.85, '2023-05-30 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1521: spiders (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Sahuarita', 'AZ', '',
    4, 0.85, '2023-05-30 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1520: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-29 23:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1519: other_pests (Mesa az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa az', 'AZ', '',
    5, 0.75, '2023-05-29 22:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1518: other_pests (Finix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Finix', 'AZ', '',
    5, 0.75, '2023-05-29 20:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1517: ants (Finix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Finix', 'AZ', '',
    5, 0.75, '2023-05-29 19:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1515: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-29 12:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1514: termites (Nevada, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Nevada', 'AZ', '',
    5, 0.75, '2023-05-29 07:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1513: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-05-29 03:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1513: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.85, '2023-05-29 03:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1512: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-29 01:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1511: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-05-28 22:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1510: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-28 13:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1510: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-28 13:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1509: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-27 18:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1508: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-27 18:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1507: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2023-05-27 16:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1506: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-05-26 22:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1505: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-26 12:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1504: other_pests (Tonawanda, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tonawanda', 'AZ', '',
    5, 0.75, '2023-05-26 10:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1503: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-26 02:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1503: beetles (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-26 02:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1502: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-26 00:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1502: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-26 00:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1500: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.90, '2023-05-25 15:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1499: bees (Oro valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro valley', 'AZ', '',
    5, 0.90, '2023-05-25 05:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1498: spiders (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-05-24 23:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1497: spiders (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-05-24 23:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1496: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-24 09:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1495: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-24 01:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1494: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-23 20:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1493: ants (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Mesa', 'AZ', '',
    5, 0.90, '2023-05-23 19:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1491: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-05-23 11:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1490: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '',
    5, 0.75, '2023-05-23 10:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1489: bed_bugs (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Glendale', 'AZ', '',
    5, 0.75, '2023-05-23 05:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1487: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    5, 0.75, '2023-05-23 01:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1486: scorpions (Denver, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Denver', 'AZ', '',
    5, 0.75, '2023-05-23 00:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1485: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-22 22:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1484: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-22 22:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1483: other_pests (Westfield, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Westfield', 'AZ', '',
    5, 0.75, '2023-05-22 18:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1482: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.80, '2023-05-22 17:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1480: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-22 13:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1479: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-22 11:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1478: bees (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-21 21:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1477: other_pests (Chicago, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chicago', 'AZ', '',
    5, 0.75, '2023-05-21 18:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1476: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-21 18:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1475: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-05-21 13:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1475: mosquitoes (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-05-21 13:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1474: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '',
    5, 0.75, '2023-05-21 13:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1473: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-21 11:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1472: other_pests (Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Arizona', 'AZ', '',
    5, 0.75, '2023-05-21 10:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1471: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-21 09:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1470: other_pests (El centro, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'El centro', 'AZ', '',
    5, 0.75, '2023-05-20 21:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1469: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-05-19 20:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1468: ants (Rio Rico, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Rio Rico, AZ', 'AZ', '',
    6, 0.75, '2023-05-19 12:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1467: other_pests (hola, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'hola', 'AZ', '',
    5, 0.75, '2023-05-19 04:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1464: other_pests (Sandiego.cal, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sandiego.cal', 'AZ', '',
    5, 0.75, '2023-05-18 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1463: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-18 09:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1462: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-05-17 19:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1461: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    7, 0.75, '2023-05-17 17:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1460: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    6, 0.90, '2023-05-17 14:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1459: rodents (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Green Valley', 'AZ', '',
    5, 0.90, '2023-05-17 13:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1458: other_pests (Tempe, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tempe', 'AZ', '',
    5, 0.90, '2023-05-17 13:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1456: other_pests (HYDERABAD, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'HYDERABAD', 'AZ', '',
    5, 0.75, '2023-05-17 06:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1455: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-16 23:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1454: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-16 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1454: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-16 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1454: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-16 21:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1453: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-16 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1452: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-16 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1452: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-16 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1452: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-16 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1452: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '',
    6, 0.85, '2023-05-16 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1451: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-05-16 19:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1450: other_pests (Phoemy, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoemy', 'AZ', '',
    5, 0.75, '2023-05-16 09:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1449: rodents (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Glendale', 'AZ', '',
    5, 0.75, '2023-05-15 21:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1448: ants (GILBERT, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'GILBERT', 'AZ', '',
    5, 0.90, '2023-05-15 15:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1447: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-14 22:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1446: ants (SURPRISE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'SURPRISE', 'AZ', '',
    4, 0.85, '2023-05-14 21:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1446: mosquitoes (SURPRISE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'SURPRISE', 'AZ', '',
    4, 0.85, '2023-05-14 21:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1445: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-14 21:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1444: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-05-14 21:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1443: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.90, '2023-05-14 20:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1442: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-05-14 18:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1441: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-05-14 18:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1440: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '',
    4, 0.90, '2023-05-14 16:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1439: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-14 15:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1438: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-14 08:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1438: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-14 08:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1437: other_pests (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las Vegas', 'AZ', '',
    5, 0.75, '2023-05-14 02:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1436: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    5, 0.75, '2023-05-13 18:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1435: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-13 15:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1434: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-05-13 13:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1433: ants (Houston, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Houston', 'AZ', '',
    5, 0.90, '2023-05-13 01:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1432: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-05-12 20:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1431: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-05-12 20:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1429: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-12 18:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1428: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.90, '2023-05-12 14:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1427: other_pests (Green valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Green valley', 'AZ', '',
    5, 0.75, '2023-05-12 10:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1426: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-05-11 23:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1425: other_pests (Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Az', 'AZ', '',
    5, 0.75, '2023-05-11 17:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1424: bed_bugs (Phoenix, AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix, AZ', 'AZ', '',
    5, 0.75, '2023-05-11 15:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1423: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.90, '2023-05-11 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1422: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '',
    4, 0.90, '2023-05-11 11:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1421: bees (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'MARANA', 'AZ', '',
    5, 0.85, '2023-05-11 08:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1421: termites (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'MARANA', 'AZ', '',
    5, 0.85, '2023-05-11 08:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1420: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-10 23:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1419: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-10 20:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1418: mosquitoes (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Tucson', 'AZ', '',
    4, 0.85, '2023-05-10 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1418: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.85, '2023-05-10 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1417: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-05-10 03:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1417: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-05-10 03:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1416: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    8, 0.85, '2023-05-09 22:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1416: beetles (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Tucson', 'AZ', '',
    8, 0.85, '2023-05-09 22:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1415: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-09 22:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1414: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-09 18:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1413: other_pests (Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Az', 'AZ', '',
    5, 0.75, '2023-05-09 17:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1412: mosquitoes (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Mesa', 'AZ', '',
    5, 0.75, '2023-05-09 16:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1411: ants (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Mesa', 'AZ', '',
    5, 0.85, '2023-05-09 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1411: bees (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Mesa', 'AZ', '',
    5, 0.85, '2023-05-09 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1411: rodents (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Mesa', 'AZ', '',
    5, 0.85, '2023-05-09 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1411: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '',
    5, 0.85, '2023-05-09 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1410: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-09 15:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1409: other_pests (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Tan Valley', 'AZ', '',
    4, 0.75, '2023-05-09 14:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1408: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    4, 0.75, '2023-05-09 13:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1407: bed_bugs (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Vail', 'AZ', '',
    5, 0.75, '2023-05-09 12:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1406: scorpions (Saddlebrooke, Tucson, TU)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Saddlebrooke, Tucson', 'TU', '',
    5, 0.85, '2023-05-08 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1406: spiders (Saddlebrooke, Tucson, TU)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Saddlebrooke, Tucson', 'TU', '',
    5, 0.85, '2023-05-08 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1406: termites (Saddlebrooke, Tucson, TU)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Saddlebrooke, Tucson', 'TU', '',
    5, 0.85, '2023-05-08 19:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1405: other_pests (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las Vegas', 'AZ', '',
    5, 0.75, '2023-05-08 19:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1404: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.90, '2023-05-08 18:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1403: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-08 16:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1402: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    8, 0.90, '2023-05-08 16:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1400: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-08 12:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1399: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-08 09:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1399: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-08 09:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1398: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-05-07 13:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1397: roaches (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Peoria', 'AZ', '',
    5, 0.75, '2023-05-07 13:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1396: other_pests (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las Vegas', 'AZ', '',
    5, 0.75, '2023-05-06 23:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1395: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-06 07:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1394: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-06 00:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1393: other_pests (San Manuel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'San Manuel', 'AZ', '',
    5, 0.75, '2023-05-05 22:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1392: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-05-05 21:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1391: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    5, 0.75, '2023-05-05 19:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1390: termites (El Paso, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'El Paso', 'AZ', '',
    5, 0.75, '2023-05-05 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1389: rodents (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-05-05 15:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1387: bees (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Mesa', 'AZ', '',
    5, 0.90, '2023-05-05 13:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1386: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-05 01:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1385: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-05 01:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1385: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '',
    5, 0.85, '2023-05-05 01:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1384: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-05-04 23:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1384: spiders (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-05-04 23:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1383: termites (Oracle, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oracle', 'AZ', '',
    5, 0.75, '2023-05-04 18:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1382: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-04 17:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1380: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-04 15:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1378: termites (peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'peoria', 'AZ', '',
    5, 0.75, '2023-05-04 14:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1377: other_pests (Poenix arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Poenix arizona', 'AZ', '',
    5, 0.75, '2023-05-04 10:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1376: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    4, 0.90, '2023-05-03 22:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1375: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '',
    5, 0.75, '2023-05-03 18:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1374: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '',
    5, 0.75, '2023-05-03 17:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1373: termites (Coolidge, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Coolidge', 'AZ', '',
    4, 0.75, '2023-05-03 09:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1372: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-03 05:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1371: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    4, 0.85, '2023-05-02 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1371: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    4, 0.85, '2023-05-02 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1371: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    4, 0.85, '2023-05-02 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1371: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    4, 0.85, '2023-05-02 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1371: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.85, '2023-05-02 19:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1370: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '',
    9, 0.90, '2023-05-02 17:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1369: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-02 12:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1368: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    8, 0.90, '2023-05-02 00:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1367: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    6, 0.90, '2023-05-01 23:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1366: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-05-01 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1365: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.90, '2023-05-01 16:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1364: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-05-01 09:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1363: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-30 20:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1362: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-04-30 14:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1361: scorpions (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Glendale', 'AZ', '',
    5, 0.75, '2023-04-30 03:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1360: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    9, 0.90, '2023-04-29 12:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1359: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-29 01:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1358: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-28 22:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1357: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-28 19:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1356: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-28 19:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1356: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-28 19:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1355: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-28 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1355: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-28 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1354: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.90, '2023-04-28 18:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1353: roaches (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-04-28 15:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1352: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-04-28 12:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1351: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '',
    5, 0.75, '2023-04-27 19:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1350: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '',
    5, 0.75, '2023-04-27 19:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1349: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-27 19:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1348: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-27 16:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1347: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-27 12:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1346: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-27 08:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1345: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    8, 0.90, '2023-04-26 20:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1344: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-26 20:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1343: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '',
    5, 0.85, '2023-04-26 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1343: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    5, 0.85, '2023-04-26 19:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1342: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-26 17:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1340: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-04-26 10:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1339: bed_bugs (PHOENIX, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'PHOENIX', 'AZ', '',
    5, 0.75, '2023-04-26 03:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1338: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-25 23:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1337: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-25 18:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1336: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '',
    5, 0.75, '2023-04-25 17:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1335: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-25 16:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1334: other_pests (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'phoenix', 'AZ', '',
    4, 0.75, '2023-04-25 15:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1333: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-25 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1332: other_pests (Phoenix’, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix’', 'AZ', '',
    5, 0.75, '2023-04-25 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1331: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '',
    5, 0.90, '2023-04-25 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1330: rodents (USA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'USA', 'AZ', '',
    5, 0.90, '2023-04-25 00:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1329: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-24 18:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1328: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-24 17:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1327: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-24 16:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1326: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '',
    5, 0.75, '2023-04-24 15:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1325: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-24 14:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1324: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-04-24 14:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1323: other_pests (Chaparral, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Chaparral', 'AZ', '',
    5, 0.75, '2023-04-24 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1322: rodents (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Green Valley', 'AZ', '',
    5, 0.85, '2023-04-24 09:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1322: termites (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Green Valley', 'AZ', '',
    5, 0.85, '2023-04-24 09:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1321: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    4, 0.75, '2023-04-24 09:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1320: rodents (USA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'USA', 'AZ', '',
    5, 0.90, '2023-04-24 02:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1319: termites (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Laveen', 'AZ', '',
    5, 0.75, '2023-04-23 17:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1318: termites (Laveen, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Laveen', 'AZ', '',
    5, 0.75, '2023-04-23 17:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1317: ants (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Vail', 'AZ', '',
    5, 0.85, '2023-04-23 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1317: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    5, 0.85, '2023-04-23 14:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1316: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-23 11:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1315: other_pests (Poenix arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Poenix arizona', 'AZ', '',
    5, 0.75, '2023-04-23 11:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1314: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-22 17:08:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1313: other_pests (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MARANA', 'AZ', '',
    5, 0.75, '2023-04-22 16:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1312: scorpions (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-22 00:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1311: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '',
    5, 0.85, '2023-04-21 23:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1311: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    5, 0.85, '2023-04-21 23:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1310: other_pests (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'MARANA', 'AZ', '',
    5, 0.75, '2023-04-21 20:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1309: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-04-21 15:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1309: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    6, 0.85, '2023-04-21 15:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1308: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-21 13:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1307: scorpions (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tolleson', 'AZ', '',
    5, 0.85, '2023-04-21 09:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1307: spiders (Tolleson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tolleson', 'AZ', '',
    5, 0.85, '2023-04-21 09:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1306: mosquitoes (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-21 00:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1305: termites (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Scottsdale', 'AZ', '',
    6, 0.80, '2023-04-20 15:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1304: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-20 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1304: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-20 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1304: wildlife (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wildlife', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-20 13:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1303: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-20 13:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1302: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-04-20 10:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1301: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    4, 0.75, '2023-04-19 22:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1300: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-19 19:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1299: bees (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Vail', 'AZ', '',
    5, 0.85, '2023-04-19 18:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1299: spiders (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Vail', 'AZ', '',
    5, 0.85, '2023-04-19 18:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1298: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    6, 0.90, '2023-04-19 18:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1297: other_pests (Eloy, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Eloy', 'AZ', '',
    5, 0.75, '2023-04-19 15:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1296: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '',
    6, 0.85, '2023-04-19 13:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1296: beetles (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Marana', 'AZ', '',
    6, 0.85, '2023-04-19 13:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1295: bees (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Avondale', 'AZ', '',
    5, 0.75, '2023-04-19 10:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1294: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2023-04-18 23:26:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1293: other_pests (Sells, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sells', 'AZ', '',
    4, 0.90, '2023-04-18 19:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1292: other_pests (Calle ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Calle ajo', 'AZ', '',
    5, 0.75, '2023-04-18 19:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1291: bees (San Tan Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'San Tan Valley', 'AZ', '',
    5, 0.90, '2023-04-18 16:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1290: other_pests (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'tucson', 'AZ', '',
    5, 0.75, '2023-04-18 14:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1289: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-18 13:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1288: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    6, 0.90, '2023-04-18 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1287: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-04-17 22:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1286: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-17 22:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1284: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-17 17:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1282: other_pests (Pheonix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Pheonix', 'AZ', '',
    5, 0.75, '2023-04-17 12:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1281: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    9, 0.80, '2023-04-17 12:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1280: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    8, 0.85, '2023-04-17 07:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1280: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    8, 0.85, '2023-04-17 07:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1280: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    8, 0.85, '2023-04-17 07:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1279: termites (Centennial Park, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Centennial Park', 'AZ', '',
    5, 0.90, '2023-04-16 23:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1278: ants (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Glendale', 'AZ', '',
    5, 0.85, '2023-04-16 21:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1278: roaches (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Glendale', 'AZ', '',
    5, 0.85, '2023-04-16 21:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1277: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-16 11:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1276: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-16 01:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1275: other_pests (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las Vegas', 'AZ', '',
    5, 0.90, '2023-04-16 00:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1274: rodents (Green Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Green Valley', 'AZ', '',
    5, 0.90, '2023-04-15 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1273: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-04-15 16:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1272: flies (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Gilbert', 'AZ', '',
    6, 0.90, '2023-04-15 10:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1271: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-04-15 01:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1269: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '',
    6, 0.85, '2023-04-14 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1269: bees (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Marana', 'AZ', '',
    6, 0.85, '2023-04-14 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1269: roaches (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Marana', 'AZ', '',
    6, 0.85, '2023-04-14 12:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1268: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-14 10:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1267: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-14 00:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1266: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '',
    4, 0.75, '2023-04-13 14:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1265: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.90, '2023-04-12 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1264: termites (MARANA, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'MARANA', 'AZ', '',
    4, 0.90, '2023-04-12 15:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1263: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-04-12 14:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1262: other_pests (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-04-12 13:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1261: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-12 08:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1260: other_pests (Mesa AZ 85203, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa AZ 85203', 'AZ', '',
    5, 0.75, '2023-04-11 20:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1259: other_pests (Phoenix Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Az', 'AZ', '',
    5, 0.75, '2023-04-11 18:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1258: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '',
    5, 0.75, '2023-04-11 17:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1257: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    4, 0.75, '2023-04-11 15:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1256: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-11 15:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1255: other_pests (marana, az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'marana, az', 'AZ', '',
    4, 0.90, '2023-04-11 15:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1254: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-11 11:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1253: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-10 23:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1253: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-10 23:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1253: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-10 23:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1251: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '',
    4, 0.75, '2023-04-10 13:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1248: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-08 17:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1247: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-08 12:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1247: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-08 12:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1246: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-04-07 22:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1245: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-07 15:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1244: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-07 11:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1243: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-06 23:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1242: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-06 11:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1241: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-06 11:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1240: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-06 11:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1239: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-05 22:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1237: ants (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Ajo', 'AZ', '',
    5, 0.85, '2023-04-05 18:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1237: crickets (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Ajo', 'AZ', '',
    5, 0.85, '2023-04-05 18:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1237: roaches (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Ajo', 'AZ', '',
    5, 0.85, '2023-04-05 18:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1237: termites (Ajo, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Ajo', 'AZ', '',
    5, 0.85, '2023-04-05 18:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1236: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-05 16:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1234: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.90, '2023-04-05 12:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1233: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-04-04 20:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1232: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-04 19:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1231: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    6, 0.90, '2023-04-04 18:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1230: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    4, 0.85, '2023-04-04 14:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1230: beetles (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'beetles', 'Tucson', 'AZ', '',
    4, 0.85, '2023-04-04 14:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1230: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    4, 0.85, '2023-04-04 14:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1230: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    4, 0.85, '2023-04-04 14:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1230: spiders (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'spiders', 'Tucson', 'AZ', '',
    4, 0.85, '2023-04-04 14:46:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1229: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-04-03 23:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1228: flies (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'flies', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-03 18:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1228: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '',
    6, 0.85, '2023-04-03 18:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1227: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-03 13:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1227: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-04-03 13:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1226: ants (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Mesa', 'AZ', '',
    4, 0.85, '2023-04-03 12:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1226: termites (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Mesa', 'AZ', '',
    4, 0.85, '2023-04-03 12:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1225: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-04-03 09:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1224: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-03 00:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1223: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    6, 0.90, '2023-04-02 19:50:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1222: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-04-02 16:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1221: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-31 19:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1221: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-31 19:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1219: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-03-31 17:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1218: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-31 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1218: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-31 16:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1217: scorpions (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Goodyear', 'AZ', '',
    5, 0.90, '2023-03-31 15:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1216: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-03-31 14:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1215: other_pests (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'phoenix', 'AZ', '',
    6, 0.90, '2023-03-31 14:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1213: other_pests (Odessa texas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Odessa texas', 'AZ', '',
    5, 0.75, '2023-03-31 08:27:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1211: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-30 20:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1211: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-30 20:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1211: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-30 20:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1210: other_pests (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix Arizona', 'AZ', '',
    5, 0.75, '2023-03-30 16:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1209: other_pests (Benson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Benson', 'AZ', '',
    5, 0.90, '2023-03-30 14:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1208: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-03-29 16:55:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1206: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    6, 0.90, '2023-03-29 15:13:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1204: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    6, 0.85, '2023-03-29 10:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1204: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    6, 0.85, '2023-03-29 10:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1203: other_pests (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Scottsdale', 'AZ', '',
    5, 0.75, '2023-03-29 10:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1202: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    5, 0.75, '2023-03-28 22:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1201: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-28 20:58:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1200: rodents (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Marana', 'AZ', '',
    5, 0.75, '2023-03-28 12:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1199: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-28 10:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1198: ants (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-27 22:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1197: other_pests (Las vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las vegas', 'AZ', '',
    5, 0.75, '2023-03-27 17:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1196: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-27 13:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1195: other_pests (Laveen Az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Laveen Az', 'AZ', '',
    5, 0.75, '2023-03-27 11:53:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1194: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-27 10:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1193: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-27 10:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1192: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-26 17:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1191: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-26 11:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1191: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-26 11:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1190: termites (Espanola NM, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Espanola NM', 'AZ', '',
    5, 0.75, '2023-03-26 08:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1189: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-26 02:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1188: rodents (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-25 19:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1187: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-25 06:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1186: other_pests (Aguila, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Aguila', 'AZ', '',
    5, 0.75, '2023-03-24 20:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1185: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.90, '2023-03-24 14:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1184: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    4, 0.85, '2023-03-24 12:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1184: scorpions (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Tucson', 'AZ', '',
    4, 0.85, '2023-03-24 12:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1183: other_pests (Glendale Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale Arizona', 'AZ', '',
    5, 0.75, '2023-03-24 05:11:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1182: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-03-23 13:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1181: bees (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Vail', 'AZ', '',
    5, 0.85, '2023-03-23 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1181: termites (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Vail', 'AZ', '',
    5, 0.85, '2023-03-23 12:52:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1179: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-22 17:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1178: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-22 17:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1177: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-22 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1176: ants (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix Arizona', 'AZ', '',
    5, 0.85, '2023-03-21 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1176: bed_bugs (Phoenix Arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix Arizona', 'AZ', '',
    5, 0.85, '2023-03-21 21:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1175: ants (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-03-21 20:57:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1174: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-21 19:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1173: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    4, 0.85, '2023-03-21 17:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1173: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.85, '2023-03-21 17:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1172: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-03-21 13:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1171: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '',
    5, 0.90, '2023-03-21 10:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1170: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-03-21 01:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1169: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-03-20 17:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1167: other_pests (@4)&35wj, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', '@4)&35wj', 'AZ', '',
    5, 0.75, '2023-03-20 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1166: other_pests (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Sahuarita', 'AZ', '',
    4, 0.75, '2023-03-20 11:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1165: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-20 01:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1164: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-19 23:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1162: bed_bugs (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-19 19:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1161: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-19 12:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1160: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-19 00:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1159: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-18 21:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1158: termites (Chandler, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Chandler', 'AZ', '',
    5, 0.75, '2023-03-18 18:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1157: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-03-18 17:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1156: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-18 15:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1155: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-17 22:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1155: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-17 22:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1155: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-17 22:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1154: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-17 14:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1153: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '',
    4, 0.75, '2023-03-17 14:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1151: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-17 12:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1150: roaches (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'roaches', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-17 00:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1149: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '',
    8, 0.85, '2023-03-16 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1149: rodents (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Oro Valley', 'AZ', '',
    8, 0.85, '2023-03-16 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1149: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '',
    8, 0.85, '2023-03-16 15:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1148: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-16 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1147: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-16 12:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1146: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-15 17:10:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1145: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    4, 0.85, '2023-03-15 13:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1145: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.85, '2023-03-15 13:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1144: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-03-15 12:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1143: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    5, 0.75, '2023-03-15 08:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1142: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '',
    5, 0.75, '2023-03-14 23:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1141: bed_bugs (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Phoenix', 'AZ', '',
    9, 0.90, '2023-03-14 18:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1140: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-14 18:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1138: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-14 11:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1137: termites (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Oro Valley', 'AZ', '',
    5, 0.75, '2023-03-14 11:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1136: termites (New Jersey, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'New Jersey', 'AZ', '',
    4, 0.75, '2023-03-14 08:38:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1135: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-13 23:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1135: crickets (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'crickets', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-13 23:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1135: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-13 23:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1134: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-03-13 18:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1131: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-13 12:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1131: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-13 12:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1130: ants (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-13 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1130: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-03-13 12:23:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1129: other_pests (mesa arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'mesa arizona', 'AZ', '',
    5, 0.75, '2023-03-13 11:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1128: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-13 11:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1127: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-13 01:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1126: other_pests (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Marana', 'AZ', '',
    4, 0.75, '2023-03-12 17:12:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1125: termites (Avondale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Avondale', 'AZ', '',
    5, 0.75, '2023-03-12 12:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1124: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-03-12 11:49:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1123: other_pests (Red Rock, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Red Rock', 'AZ', '',
    5, 0.75, '2023-03-11 19:35:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1122: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-11 19:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1120: other_pests (Phoenix az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix az', 'AZ', '',
    5, 0.75, '2023-03-11 09:42:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1119: termites (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Glendale', 'AZ', '',
    5, 0.75, '2023-03-10 16:15:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1118: other_pests (Glendale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Glendale', 'AZ', '',
    5, 0.75, '2023-03-10 15:01:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1117: wasps (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'wasps', 'Tucson', 'AZ', '',
    6, 0.90, '2023-03-10 13:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1116: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-10 02:16:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1115: other_pests (Poihnix6029072950, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Poihnix6029072950', 'AZ', '',
    5, 0.75, '2023-03-09 17:22:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1114: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.90, '2023-03-09 16:59:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1113: other_pests (Mesa, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Mesa', 'AZ', '',
    5, 0.75, '2023-03-09 10:43:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1112: termites (Meza arizona, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Meza arizona', 'AZ', '',
    5, 0.75, '2023-03-09 07:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1111: termites (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'TUCSON', 'AZ', '',
    6, 0.90, '2023-03-08 19:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1109: other_pests (Gilbert, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Gilbert', 'AZ', '',
    5, 0.75, '2023-03-08 18:06:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1108: termites (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Paradise Valley', 'AZ', '',
    5, 0.75, '2023-03-08 16:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1107: other_pests (Phoenix AZ, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix AZ', 'AZ', '',
    5, 0.75, '2023-03-08 16:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1106: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '',
    5, 0.90, '2023-03-08 13:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1105: bees (Oro Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Oro Valley', 'AZ', '',
    5, 0.90, '2023-03-08 13:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1104: ants (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Las Vegas', 'AZ', '',
    4, 0.85, '2023-03-08 12:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1104: rodents (Las Vegas, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Las Vegas', 'AZ', '',
    4, 0.85, '2023-03-08 12:44:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1103: termites (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Surprise', 'AZ', '',
    5, 0.90, '2023-03-08 12:37:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1102: rodents (San Manuel, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'San Manuel', 'AZ', '',
    8, 0.90, '2023-03-07 23:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1100: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-07 17:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1098: other_pests (Woodside, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Woodside', 'AZ', '',
    5, 0.75, '2023-03-07 11:54:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1097: termites (Tombstone, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tombstone', 'AZ', '',
    5, 0.75, '2023-03-07 00:25:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1096: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-07 00:14:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1095: other_pests (Tucson az 85746, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson az 85746', 'AZ', '',
    5, 0.75, '2023-03-06 20:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1094: other_pests (Rio Rico, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rio Rico', 'AZ', '',
    4, 0.75, '2023-03-06 19:45:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1091: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-05 18:21:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1090: termites (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Phoenix', 'AZ', '',
    5, 0.90, '2023-03-04 10:48:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1089: bed_bugs (California, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'California', 'AZ', '',
    5, 0.90, '2023-03-04 01:28:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1088: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-03 18:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1087: ants (Fountain Hills, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Fountain Hills', 'AZ', '',
    5, 0.85, '2023-03-03 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1087: bees (Fountain Hills, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Fountain Hills', 'AZ', '',
    5, 0.85, '2023-03-03 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1087: rodents (Fountain Hills, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Fountain Hills', 'AZ', '',
    5, 0.85, '2023-03-03 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1087: termites (Fountain Hills, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Fountain Hills', 'AZ', '',
    5, 0.85, '2023-03-03 13:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1086: termites (SCOTTSDALE, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'SCOTTSDALE', 'AZ', '',
    4, 0.90, '2023-03-03 11:41:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1085: scorpions (Sahuarita, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'scorpions', 'Sahuarita', 'AZ', '',
    5, 0.75, '2023-03-02 22:07:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1084: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-03-02 21:00:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1082: other_pests (Rosenberg, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Rosenberg', 'AZ', '',
    5, 0.75, '2023-03-02 18:40:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1081: ants (Rosenberg, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Rosenberg', 'AZ', '',
    5, 0.90, '2023-03-02 18:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1080: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    4, 0.75, '2023-03-02 13:29:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1079: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-03-01 20:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1078: ants (Scottsdale, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Scottsdale', 'AZ', '',
    5, 0.90, '2023-03-01 17:36:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1077: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-03-01 16:32:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1076: bed_bugs (phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'phoenix', 'AZ', '',
    5, 0.75, '2023-03-01 11:39:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1075: other_pests (Goodyear, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Goodyear', 'AZ', '',
    5, 0.75, '2023-03-01 10:47:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1074: other_pests (Vail, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Vail', 'AZ', '',
    5, 0.75, '2023-02-28 17:20:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1073: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-02-28 10:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1072: other_pests (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Tucson', 'AZ', '',
    5, 0.75, '2023-02-27 20:02:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1071: other_pests (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'TUCSON', 'AZ', '',
    4, 0.75, '2023-02-27 18:19:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1070: ants (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Marana', 'AZ', '',
    6, 0.85, '2023-02-27 13:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1070: termites (Marana, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Marana', 'AZ', '',
    6, 0.85, '2023-02-27 13:31:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1069: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-02-26 15:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1068: other_pests (Phoenix, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Phoenix', 'AZ', '',
    5, 0.75, '2023-02-26 14:03:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1067: other_pests (Prescott valley az, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Prescott valley az', 'AZ', '',
    5, 0.75, '2023-02-25 21:18:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1066: bees (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Tucson', 'AZ', '',
    5, 0.85, '2023-02-25 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1066: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    5, 0.85, '2023-02-25 12:56:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1065: ants (Bhubaneswar, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Bhubaneswar', 'AZ', '',
    6, 0.90, '2023-02-25 06:04:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1064: termites (Peoria, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Peoria', 'AZ', '',
    4, 0.90, '2023-02-24 22:51:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1063: other_pests (Las vegaz, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Las vegaz', 'AZ', '',
    5, 0.75, '2023-02-24 18:24:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1062: bees (Paradise Valley, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Paradise Valley', 'AZ', '',
    5, 0.75, '2023-02-24 15:05:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1061: other_pests (Beverly Hills, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'other_pests', 'Beverly Hills', 'AZ', '',
    5, 0.75, '2023-02-23 13:17:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1060: ants (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-02-23 01:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1060: rodents (TUCSON, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'AZ', '',
    5, 0.85, '2023-02-23 01:09:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1059: termites (tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'tucson', 'AZ', '',
    4, 0.75, '2023-02-22 11:34:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1058: termites (Tucson, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Tucson', 'AZ', '',
    4, 0.75, '2023-02-22 11:30:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  record_count := record_count + 1;
  -- Form 1056: ants (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Surprise', 'AZ', '',
    5, 0.85, '2023-02-21 17:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;
  -- Form 1056: bees (Surprise, AZ)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bees', 'Surprise', 'AZ', '',
    5, 0.85, '2023-02-21 17:33:00-06'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;
