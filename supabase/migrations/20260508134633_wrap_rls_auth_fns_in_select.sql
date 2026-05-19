-- Phase 2: Wrap auth.<fn>() calls in (SELECT auth.<fn>()) across all public-schema
-- RLS policies, eliminating the auth_rls_initplan lint (286 policies / 108 tables).
--
-- Why: when an RLS policy references auth.uid()/auth.role()/auth.jwt()/auth.email()
-- directly, Postgres cannot mark the call as STABLE-per-statement and re-evaluates
-- it for every row. Wrapping the call in a SELECT subquery makes Postgres execute
-- it once per query. The substitution is semantically identical -- the same
-- function returns the same value -- so no row's grant/deny decision changes.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Strategy: iterate pg_policies, and for each USING/WITH CHECK expression, run an
-- idempotent three-step rewrite:
--   1. Protect already-wrapped occurrences with placeholder tokens.
--   2. Wrap any remaining bare auth.<fn>() with (SELECT auth.<fn>()).
--   3. Restore the placeholders.
-- Then ALTER POLICY only when the expression actually changed.
--
-- A snapshot of pg_policies is captured at the top so prior expressions can be
-- recovered if a regression is found.

-- ---------------------------------------------------------------------------
-- Snapshot for rollback
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public._rls_policy_snapshot_phase2;
CREATE TABLE public._rls_policy_snapshot_phase2 AS
SELECT now() AS snapshotted_at, *
FROM pg_policies
WHERE schemaname = 'public';

COMMENT ON TABLE public._rls_policy_snapshot_phase2 IS
  'Pre-rewrite snapshot from migration 20260508134633_wrap_rls_auth_fns_in_select. Safe to drop after verification.';

-- ---------------------------------------------------------------------------
-- Helper: apply the three-step wrap to a single expression text.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._wrap_auth_calls(expr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $func$
DECLARE
  out_expr text := expr;
BEGIN
  IF out_expr IS NULL THEN
    RETURN NULL;
  END IF;

  -- Step 1: protect already-wrapped forms.
  out_expr := regexp_replace(out_expr, '\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)',   '__WRAPPED_AUTH_UID__',   'gi');
  out_expr := regexp_replace(out_expr, '\(\s*select\s+auth\.role\s*\(\s*\)\s*\)',  '__WRAPPED_AUTH_ROLE__',  'gi');
  out_expr := regexp_replace(out_expr, '\(\s*select\s+auth\.jwt\s*\(\s*\)\s*\)',   '__WRAPPED_AUTH_JWT__',   'gi');
  out_expr := regexp_replace(out_expr, '\(\s*select\s+auth\.email\s*\(\s*\)\s*\)', '__WRAPPED_AUTH_EMAIL__', 'gi');

  -- Step 2: wrap any remaining bare auth.<fn>() calls. \m is a word-boundary at the
  -- start of a word so we don't match a substring inside another identifier.
  out_expr := regexp_replace(out_expr, '\mauth\.uid\s*\(\s*\)',   '(SELECT auth.uid())',   'gi');
  out_expr := regexp_replace(out_expr, '\mauth\.role\s*\(\s*\)',  '(SELECT auth.role())',  'gi');
  out_expr := regexp_replace(out_expr, '\mauth\.jwt\s*\(\s*\)',   '(SELECT auth.jwt())',   'gi');
  out_expr := regexp_replace(out_expr, '\mauth\.email\s*\(\s*\)', '(SELECT auth.email())', 'gi');

  -- Step 3: restore the placeholders.
  out_expr := replace(out_expr, '__WRAPPED_AUTH_UID__',   '(SELECT auth.uid())');
  out_expr := replace(out_expr, '__WRAPPED_AUTH_ROLE__',  '(SELECT auth.role())');
  out_expr := replace(out_expr, '__WRAPPED_AUTH_JWT__',   '(SELECT auth.jwt())');
  out_expr := replace(out_expr, '__WRAPPED_AUTH_EMAIL__', '(SELECT auth.email())');

  RETURN out_expr;
END;
$func$;

-- ---------------------------------------------------------------------------
-- Rewrite pass
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  new_qual text;
  new_check text;
  qual_changed boolean;
  check_changed boolean;
  alter_sql text;
  rewritten_count int := 0;
  skipped_count int := 0;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    new_qual  := public._wrap_auth_calls(pol.qual);
    new_check := public._wrap_auth_calls(pol.with_check);

    qual_changed  := new_qual  IS DISTINCT FROM pol.qual;
    check_changed := new_check IS DISTINCT FROM pol.with_check;

    IF NOT qual_changed AND NOT check_changed THEN
      skipped_count := skipped_count + 1;
      CONTINUE;
    END IF;

    -- Build ALTER POLICY with only the clauses we actually have.
    alter_sql := format('ALTER POLICY %I ON %I.%I',
                        pol.policyname, pol.schemaname, pol.tablename);

    IF new_qual IS NOT NULL THEN
      alter_sql := alter_sql || format(' USING (%s)', new_qual);
    END IF;

    IF new_check IS NOT NULL THEN
      alter_sql := alter_sql || format(' WITH CHECK (%s)', new_check);
    END IF;

    EXECUTE alter_sql;
    rewritten_count := rewritten_count + 1;
  END LOOP;

  RAISE NOTICE 'Phase 2 rewrite complete: % policies updated, % policies already optimized',
               rewritten_count, skipped_count;
END$$;

-- ---------------------------------------------------------------------------
-- Verification: count policies that still contain a bare auth.<fn>() after
-- temporarily protecting wrapped forms (same protection step the rewriter uses).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  unwrapped_count int;
  detail RECORD;
BEGIN
  WITH stripped AS (
    SELECT
      schemaname,
      tablename,
      policyname,
      regexp_replace(
        COALESCE(qual, '') || ' || ' || COALESCE(with_check, ''),
        '\(\s*select\s+auth\.(uid|role|jwt|email)\s*\(\s*\)\s*\)',
        '__OK__',
        'gi'
      ) AS stripped_expr
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  SELECT COUNT(*)
  INTO unwrapped_count
  FROM stripped
  WHERE stripped_expr ~* '\mauth\.(uid|role|jwt|email)\s*\(\s*\)';

  IF unwrapped_count > 0 THEN
    RAISE WARNING
      'Phase 2 verification: % policies still contain a bare auth.<fn>() call (likely inside CASE/COALESCE the rewriter intentionally skipped); review manually',
      unwrapped_count;

    FOR detail IN
      WITH stripped AS (
        SELECT
          schemaname, tablename, policyname,
          regexp_replace(
            COALESCE(qual, '') || ' || ' || COALESCE(with_check, ''),
            '\(\s*select\s+auth\.(uid|role|jwt|email)\s*\(\s*\)\s*\)',
            '__OK__', 'gi'
          ) AS stripped_expr
        FROM pg_policies
        WHERE schemaname = 'public'
      )
      SELECT schemaname, tablename, policyname
      FROM stripped
      WHERE stripped_expr ~* '\mauth\.(uid|role|jwt|email)\s*\(\s*\)'
      ORDER BY tablename, policyname
    LOOP
      RAISE NOTICE '  unwrapped: %.% / %', detail.schemaname, detail.tablename, detail.policyname;
    END LOOP;
  END IF;
END$$;

-- The helper function is only useful during this migration; drop it so it does
-- not leak into the schema's public surface area.
DROP FUNCTION IF EXISTS public._wrap_auth_calls(text);
