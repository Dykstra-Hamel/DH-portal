-- Bulk Import Pest Pressure Data Points
-- Source: Form-Export-2025-11-07-13-30.csv
-- Company: 7c28392b-05f7-4379-93af-8d9e9ad549a8
-- Generated: 2025-11-07 13:31:28

DO $$
DECLARE
  company_uuid UUID := '7c28392b-05f7-4379-93af-8d9e9ad549a8';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN


  -- Form 779: bed_bugs (Bristolistol, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Bristolistol', 'VA', '',
    5, 0.75, '2025-11-06 21:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 777: bed_bugs (Needles, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Needles', 'VA', '',
    5, 0.75, '2025-11-05 21:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 772: bed_bugs (Aurora, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Aurora', 'VA', '',
    5, 0.75, '2025-11-01 23:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 769: bed_bugs (ORLANDO, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'ORLANDO', 'VA', '',
    5, 0.75, '2025-10-31 22:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 767: bed_bugs (DENVER, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'DENVER', 'VA', '',
    5, 0.75, '2025-10-31 04:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 765: ants (Santa Ana, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Santa Ana', 'VA', '',
    5, 0.75, '2025-10-31 00:04:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 759: bed_bugs (Florida, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Florida', 'VA', '',
    5, 0.75, '2025-10-29 08:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 758: bed_bugs (CENTRALIA, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'CENTRALIA', 'VA', '',
    5, 0.75, '2025-10-29 03:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 756: rodents (CHICAGO, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'CHICAGO', 'VA', '',
    5, 0.75, '2025-10-28 18:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 755: bed_bugs (Baton Rouge, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Baton Rouge', 'VA', '',
    5, 0.75, '2025-10-26 19:16:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 751: rodents (Mojave, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Mojave', 'VA', '',
    5, 0.75, '2025-10-25 19:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 747: bed_bugs (OMAHA, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'OMAHA', 'VA', '',
    5, 0.75, '2025-10-25 04:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 714: bed_bugs (Roanoke, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Roanoke', 'VA', '',
    5, 0.75, '2025-10-04 20:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 707: mosquitoes (Lake City, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Lake City', 'VA', '',
    5, 0.75, '2025-10-01 17:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 701: rodents (North Chesterfield, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'North Chesterfield', 'VA', '',
    5, 0.75, '2025-09-29 12:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 693: bed_bugs (sdb, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'sdb', 'VA', '',
    5, 0.75, '2025-09-27 03:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 692: rodents (Dallas, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Dallas', 'VA', '',
    5, 0.75, '2025-09-27 01:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 687: rodents (Longbeach, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Longbeach', 'VA', '',
    5, 0.75, '2025-09-26 04:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 685: bed_bugs (Aurora, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Aurora', 'VA', '',
    5, 0.75, '2025-09-26 02:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 683: rodents (Brooklyn, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Brooklyn', 'VA', '',
    5, 0.75, '2025-09-25 23:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 680: bed_bugs (Altamonte Springs, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Altamonte Springs', 'VA', '',
    5, 0.75, '2025-09-24 23:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 674: rodents (Richmond VA, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Richmond VA', 'VA', '',
    5, 0.75, '2025-09-23 21:25:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 672: mosquitoes (Wallops Island, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Wallops Island', 'VA', '',
    5, 0.75, '2025-09-23 16:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 667: rodents (SHREVEPORT, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'SHREVEPORT', 'VA', '',
    5, 0.75, '2025-09-22 17:39:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 665: rodents (Port Charlotte, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Port Charlotte', 'VA', '',
    5, 0.75, '2025-09-21 05:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 664: rodents (Philadelphia, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Philadelphia', 'VA', '',
    5, 0.75, '2025-09-21 00:55:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 662: bed_bugs (Glendale, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Glendale', 'VA', '',
    5, 0.75, '2025-09-20 17:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 657: ants (Lantana, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Lantana', 'VA', '',
    5, 0.85, '2025-09-19 02:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 657: bed_bugs (Lantana, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Lantana', 'VA', '',
    5, 0.85, '2025-09-19 02:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 656: rodents (Sneads, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Sneads', 'VA', '',
    5, 0.75, '2025-09-18 19:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 652: bed_bugs (Bon Aqua, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Bon Aqua', 'VA', '',
    5, 0.75, '2025-09-17 03:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 651: bed_bugs (Hearne, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Hearne', 'VA', '',
    5, 0.75, '2025-09-17 01:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 650: rodents (Newport, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Newport', 'VA', '',
    5, 0.75, '2025-09-16 21:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 649: bed_bugs (Parma, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Parma', 'VA', '',
    5, 0.75, '2025-09-16 19:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 640: rodents (Iowa City, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Iowa City', 'VA', '',
    5, 0.75, '2025-09-15 12:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 638: bed_bugs (DEER PARK, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'DEER PARK', 'VA', '',
    5, 0.75, '2025-09-15 01:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 637: rodents (CAMPOBELLO, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'CAMPOBELLO', 'VA', '',
    5, 0.75, '2025-09-14 21:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 632: rodents (Lubbock, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Lubbock', 'VA', '',
    5, 0.75, '2025-09-14 13:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 631: bed_bugs (Have, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Have', 'VA', '',
    5, 0.90, '2025-09-14 07:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 630: bed_bugs (Chicago, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Chicago', 'VA', '',
    5, 0.75, '2025-09-14 05:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 629: bed_bugs (Denver, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Denver', 'VA', '',
    5, 0.75, '2025-09-14 04:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 628: rodents (Belleville, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Belleville', 'VA', '',
    5, 0.75, '2025-09-14 00:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 625: bed_bugs (Rockford, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Rockford', 'VA', '',
    5, 0.75, '2025-09-13 23:14:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 623: rodents (manorville, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'manorville', 'VA', '',
    5, 0.75, '2025-09-12 20:19:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 617: bed_bugs (BALTIMORE, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'BALTIMORE', 'VA', '',
    5, 0.75, '2025-09-10 23:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 612: bed_bugs (San Luis obispo, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'San Luis obispo', 'VA', '',
    5, 0.75, '2025-09-10 00:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 610: bed_bugs (Virginia Beach, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Virginia Beach', 'VA', '',
    5, 0.75, '2025-09-09 22:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 608: rodents (Albuquerque, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Albuquerque', 'VA', '',
    5, 0.75, '2025-09-09 04:28:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 603: bed_bugs (SOUTH SHORE, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'SOUTH SHORE', 'VA', '',
    5, 0.75, '2025-09-08 00:29:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 600: rodents (Rolling Meadows, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Rolling Meadows', 'VA', '',
    5, 0.75, '2025-09-07 03:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 598: rodents (TUCSON, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TUCSON', 'VA', '',
    5, 0.75, '2025-09-07 01:15:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 585: rodents (Fredericksburg, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Fredericksburg', 'VA', '',
    5, 0.75, '2025-09-04 00:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 582: mosquitoes (Salisbury, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Salisbury', 'VA', '',
    5, 0.75, '2025-09-03 20:02:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 580: mosquitoes (Lynchburg, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Lynchburg', 'VA', '',
    5, 0.75, '2025-09-03 19:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 578: rodents (Tavares, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tavares', 'VA', '',
    5, 0.75, '2025-09-02 23:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 577: bed_bugs (Ash, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Ash', 'VA', '',
    5, 0.75, '2025-09-02 10:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 567: rodents (SEMINOLE, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'SEMINOLE', 'VA', '',
    5, 0.75, '2025-08-30 23:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 564: mosquitoes (West Palm Beach, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'West Palm Beach', 'VA', '',
    5, 0.75, '2025-08-29 22:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 562: rodents (Tijeras, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Tijeras', 'VA', '',
    5, 0.75, '2025-08-28 05:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 561: bed_bugs (Mesquite, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Mesquite', 'VA', '',
    5, 0.75, '2025-08-28 00:13:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 560: rodents (New York, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'New York', 'VA', '',
    5, 0.75, '2025-08-27 21:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 558: bed_bugs (FortWorth, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'FortWorth', 'VA', '',
    5, 0.75, '2025-08-27 03:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 551: rodents (Versailles, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Versailles', 'VA', '',
    5, 0.75, '2025-08-24 01:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 550: ants (Manteca, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'Manteca', 'VA', '',
    5, 0.85, '2025-08-23 21:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 550: rodents (Manteca, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Manteca', 'VA', '',
    5, 0.85, '2025-08-23 21:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 543: rodents (Euclid, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Euclid', 'VA', '',
    5, 0.75, '2025-08-21 22:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 541: rodents (Pflugerville, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Pflugerville', 'VA', '',
    5, 0.75, '2025-08-21 21:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 531: rodents (West Valley City, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'West Valley City', 'VA', '',
    5, 0.75, '2025-08-17 22:50:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 528: bed_bugs (Knoxville, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Knoxville', 'VA', '',
    5, 0.75, '2025-08-17 01:46:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 527: bed_bugs (New London, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'New London', 'VA', '',
    5, 0.75, '2025-08-16 22:09:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 522: rodents (Fernandina beach, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Fernandina beach', 'VA', '',
    5, 0.75, '2025-08-14 00:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 519: rodents (dg, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'dg', 'VA', '',
    5, 0.75, '2025-08-13 02:27:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 518: bed_bugs (Jacksonville, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Jacksonville', 'VA', '',
    5, 0.75, '2025-08-13 00:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 516: ants (San Antonio, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'ants', 'San Antonio', 'VA', '',
    5, 0.85, '2025-08-12 21:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 516: bed_bugs (San Antonio, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'San Antonio', 'VA', '',
    5, 0.85, '2025-08-12 21:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 506: mosquitoes (brownsville, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'brownsville', 'VA', '',
    5, 0.75, '2025-08-08 22:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 503: mosquitoes (dhg, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'dhg', 'VA', '',
    5, 0.75, '2025-08-08 03:41:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 501: rodents (Rosman, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Rosman', 'VA', '',
    5, 0.75, '2025-08-08 00:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 500: mosquitoes (DEL VALLEDEL VA, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'DEL VALLEDEL VA', 'VA', '',
    5, 0.75, '2025-08-07 22:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 499: bed_bugs (Seattle, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Seattle', 'VA', '',
    5, 0.75, '2025-08-07 20:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 497: bed_bugs (Rr, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Rr', 'VA', '',
    5, 0.75, '2025-08-06 18:37:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 492: bed_bugs (anna, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'anna', 'VA', '',
    5, 0.75, '2025-08-04 21:48:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 483: bed_bugs (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Richmond', 'VA', '',
    5, 0.75, '2025-08-01 19:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 481: rodents (Salem, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Salem', 'VA', '',
    5, 0.75, '2025-08-01 14:26:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 467: rodents (Narrows, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Narrows', 'VA', '',
    5, 0.75, '2025-07-29 04:11:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 461: bed_bugs (Stratford, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Stratford', 'VA', '',
    5, 0.85, '2025-07-27 20:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;

  -- Form 461: rodents (Stratford, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Stratford', 'VA', '',
    5, 0.85, '2025-07-27 20:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 460: rodents (Waukesha, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Waukesha', 'VA', '',
    5, 0.75, '2025-07-27 20:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 459: bed_bugs (GAITHERSBURG, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'GAITHERSBURG', 'VA', '',
    5, 0.75, '2025-07-27 19:49:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 455: rodents (Hazelwood, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Hazelwood', 'VA', '',
    5, 0.75, '2025-07-26 23:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 448: bed_bugs (Gibson City, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Gibson City', 'VA', '',
    5, 0.75, '2025-07-24 04:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 445: bed_bugs (Longmont, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Longmont', 'VA', '',
    5, 0.75, '2025-07-23 07:34:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 441: rodents (Bradenton, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Bradenton', 'VA', '',
    5, 0.75, '2025-07-21 19:01:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 438: rodents (Hampton, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Hampton', 'VA', '',
    5, 0.75, '2025-07-20 22:59:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 437: rodents (WESTSACRAMENTO, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'WESTSACRAMENTO', 'VA', '',
    5, 0.75, '2025-07-20 19:33:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 434: bed_bugs (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Richmond', 'VA', '',
    5, 0.75, '2025-07-20 11:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 431: bed_bugs (NEWARK, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'NEWARK', 'VA', '',
    5, 0.75, '2025-07-20 06:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 430: bed_bugs (Seattle, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Seattle', 'VA', '',
    5, 0.75, '2025-07-19 08:12:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 429: rodents (EVANSVILLE, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'EVANSVILLE', 'VA', '',
    5, 0.75, '2025-07-19 03:08:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 428: bed_bugs (Tomah, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Tomah', 'VA', '',
    5, 0.75, '2025-07-18 22:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 414: mosquitoes (Lincoln, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Lincoln', 'VA', '',
    5, 0.75, '2025-07-12 04:18:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 412: rodents (ahoskie, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'ahoskie', 'VA', '',
    5, 0.75, '2025-07-10 22:43:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 402: mosquitoes (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Richmond', 'VA', '',
    5, 0.75, '2025-07-09 15:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 394: mosquitoes (Altavista, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Altavista', 'VA', '',
    5, 0.75, '2025-07-07 22:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 386: rodents (Christiansburg, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Christiansburg', 'VA', '',
    5, 0.75, '2025-07-06 16:53:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 373: mosquitoes (Salem, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Salem', 'VA', '',
    5, 0.75, '2025-07-02 19:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 367: bed_bugs (PHILADELPHIA, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'PHILADELPHIA', 'VA', '',
    5, 0.75, '2025-06-29 01:22:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 363: rodents (TAMPA, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'TAMPA', 'VA', '',
    5, 0.75, '2025-06-27 21:36:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 362: bed_bugs (Boynton Beach, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Boynton Beach', 'VA', '',
    5, 0.75, '2025-06-27 21:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 359: bed_bugs (Salem, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Salem', 'VA', '',
    5, 0.75, '2025-06-27 16:38:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 358: mosquitoes (Henrico, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Henrico', 'VA', '',
    5, 0.75, '2025-06-27 15:42:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 304: mosquitoes (Chesterfield, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Chesterfield', 'VA', '',
    5, 0.75, '2025-06-03 09:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 281: mosquitoes (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Richmond', 'VA', '',
    5, 0.75, '2025-05-22 15:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 263: rodents (North Chesterfield, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'North Chesterfield', 'VA', '',
    5, 0.75, '2025-05-16 14:30:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 255: bed_bugs (Chesterfield, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Chesterfield', 'VA', '',
    5, 0.75, '2025-05-14 01:54:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 239: rodents (Charlottesville, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Charlottesville', 'VA', '',
    5, 0.75, '2025-05-07 14:00:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 233: rodents (Chester, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Chester', 'VA', '',
    5, 0.75, '2025-05-01 09:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 230: mosquitoes (Midlothian, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Midlothian', 'VA', '',
    5, 0.75, '2025-04-29 21:06:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 218: mosquitoes (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Richmond', 'VA', '',
    5, 0.75, '2025-04-24 14:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 210: rodents (richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'richmond', 'VA', '',
    5, 0.75, '2025-04-21 23:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 188: rodents (Sandston, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Sandston', 'VA', '',
    5, 0.75, '2025-04-07 12:07:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 181: rodents (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Richmond', 'VA', '',
    5, 0.75, '2025-03-31 16:03:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 166: mosquitoes (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Richmond', 'VA', '',
    5, 0.75, '2025-03-27 12:21:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 165: rodents (Salem, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Salem', 'VA', '',
    5, 0.75, '2025-03-26 13:31:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 142: bed_bugs (Henrico, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Henrico', 'VA', '',
    5, 0.75, '2025-02-04 07:20:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 127: rodents (Henrico, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Henrico', 'VA', '',
    5, 0.75, '2025-01-08 12:24:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 126: bed_bugs (North Chesterfield, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'North Chesterfield', 'VA', '',
    5, 0.75, '2025-01-07 03:45:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 124: bed_bugs (Chesterfield, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Chesterfield', 'VA', '',
    5, 0.75, '2025-01-01 09:58:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 112: rodents (Henrico, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'Henrico', 'VA', '',
    5, 0.75, '2024-12-11 00:44:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 107: mosquitoes (layyah, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'layyah', 'VA', '',
    5, 0.75, '2024-12-02 15:47:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 63: rodents (North chesterfield, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'rodents', 'North chesterfield', 'VA', '',
    5, 0.75, '2024-09-18 10:52:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 36: mosquitoes (Richmond, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'mosquitoes', 'Richmond', 'VA', '',
    5, 0.75, '2024-08-23 15:05:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 12: termites (Midlothian, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'termites', 'Midlothian', 'VA', '',
    4, 0.75, '2024-08-12 06:57:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  -- Form 1: bed_bugs (Ten Sleep, VA)
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    'bed_bugs', 'Ten Sleep', 'VA', '',
    5, 0.75, '2024-08-09 11:51:00-06'::timestamptz
  );

  pest_count := pest_count + 1;
  record_count := record_count + 1;

  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;

