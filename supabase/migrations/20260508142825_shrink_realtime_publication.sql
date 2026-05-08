-- Shrink the supabase_realtime publication.
--
-- The publication currently includes 17 tables, but only 5 of them are actually
-- consumed via postgres_changes in the frontend. The other 12 were migrated to
-- broadcast channels (see /src/lib/realtime/*-channel.ts) some time ago but
-- never removed from the publication. Every byte of WAL written to those
-- tables is still being scanned by `realtime.list_changes` on every poll
-- (~98.8% of total DB CPU per the most recent Supabase Query Performance
-- report).
--
-- Broadcast channels do not depend on the publication, so dropping these
-- tables has zero effect on the broadcast-based UIs.

DO $$
DECLARE
  victims text[] := ARRAY[
    'campaigns',
    'campaign_batch_schedule',
    'campaign_concurrency_tracker',
    'campaign_contact_list_members',
    'campaign_contact_lists',
    'campaign_executions',
    'customers',
    'leads',
    'notifications',
    'support_cases',
    'tickets',
    'call_records'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY victims LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
      RAISE NOTICE 'dropped public.% from supabase_realtime', t;
    ELSE
      RAISE NOTICE 'public.% not in publication, skipping', t;
    END IF;
  END LOOP;
END$$;

-- Log the remaining set so the migration output makes the new state obvious.
DO $$
DECLARE
  remaining text;
BEGIN
  SELECT string_agg(tablename, ', ' ORDER BY tablename)
  INTO remaining
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime' AND schemaname = 'public';

  RAISE NOTICE 'supabase_realtime now contains: %', COALESCE(remaining, '(empty)');
END$$;
