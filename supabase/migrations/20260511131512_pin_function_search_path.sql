-- Pin search_path on every function in the public schema to prevent
-- search_path-hijacking attacks (the `function_search_path_mutable` lint).
--
-- Why this matters: when a function doesn't set search_path explicitly, the
-- caller's search_path is used. An attacker who can create objects in a
-- writable schema can shadow built-in names (e.g. create their own `now()` or
-- `auth.uid()`), and any SECURITY DEFINER function that calls those names
-- ends up running attacker-controlled code as the function owner. Pinning
-- search_path eliminates the attack vector.
--
-- We use `search_path = 'public, pg_temp'` so existing function bodies that
-- reference unqualified public-schema names (e.g. `projects`, `user_companies`)
-- keep working without rewriting every body. `pg_temp` is appended only so
-- that PL/pgSQL's local temp objects still resolve; it's the last entry in
-- the search list so it can't shadow public names.
--
-- The DO block iterates `pg_proc` so this works regardless of how many
-- overloads a function has (each gets its own `proconfig`). Idempotent:
-- functions that already have a pinned search_path are skipped.

DO $$
DECLARE
  func RECORD;
  altered_count int := 0;
  skipped_count int := 0;
BEGIN
  FOR func IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      p.oid    AS func_oid,
      pg_get_function_identity_arguments(p.oid) AS func_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- regular functions only; skip aggregates/windows
  LOOP
    -- Skip if proconfig already contains a search_path entry.
    IF EXISTS (
      SELECT 1
      FROM pg_proc p2
      WHERE p2.oid = func.func_oid
        AND EXISTS (
          SELECT 1 FROM unnest(COALESCE(p2.proconfig, ARRAY[]::text[])) AS opt
          WHERE opt LIKE 'search_path=%'
        )
    ) THEN
      skipped_count := skipped_count + 1;
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = ''public, pg_temp''',
        func.schema_name,
        func.func_name,
        func.func_args
      );
      altered_count := altered_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Some functions may be owned by roles we can't ALTER (e.g. extension
      -- functions that snuck into public). Log and continue rather than
      -- aborting the whole migration.
      RAISE NOTICE 'skipped %.%(%): %', func.schema_name, func.func_name, func.func_args, SQLERRM;
      skipped_count := skipped_count + 1;
    END;
  END LOOP;

  RAISE NOTICE 'pin_function_search_path: % function(s) altered, % skipped',
               altered_count, skipped_count;
END$$;

-- Verification: report functions in public that still don't have a pinned
-- search_path. NOTICE (not EXCEPTION) so the migration completes and we see
-- the diagnostics even if some extension function couldn't be altered.
DO $$
DECLARE
  unpinned_count int;
  detail RECORD;
BEGIN
  SELECT COUNT(*) INTO unpinned_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND NOT EXISTS (
      SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS opt
      WHERE opt LIKE 'search_path=%'
    );

  RAISE NOTICE 'Functions in public without a pinned search_path: %', unpinned_count;

  IF unpinned_count > 0 THEN
    FOR detail IN
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND NOT EXISTS (
          SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS opt
          WHERE opt LIKE 'search_path=%'
        )
      ORDER BY p.proname
    LOOP
      RAISE NOTICE '  -> %(%)', detail.name, detail.args;
    END LOOP;
  END IF;
END$$;
