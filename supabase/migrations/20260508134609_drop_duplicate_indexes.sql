-- Phase 1: Drop duplicate indexes flagged by Supabase performance advisor.
--
-- Each pair below has two indexes on the same column. The constraint-backed
-- index (or the UNIQUE index, when present) cannot be dropped without losing
-- the constraint, so the duplicate to drop is the redundant manual one. Query
-- plans are unchanged because the planner uses either index identically.

-- 1. campaigns.campaign_id: UNIQUE column constraint already creates
--    `campaigns_campaign_id_key`; the manual `idx_campaigns_campaign_id` is
--    redundant.
DROP INDEX IF EXISTS public.idx_campaigns_campaign_id;

-- 2. quotes.quote_token: UNIQUE column constraint already creates
--    `quotes_quote_token_key`; the manual `idx_quotes_quote_token` is
--    redundant.
DROP INDEX IF EXISTS public.idx_quotes_quote_token;

-- 3. quotes.lead_id: a non-unique `idx_quotes_lead_id` was created in the
--    initial quotes migration, then a UNIQUE `idx_quotes_lead_id_unique` was
--    added later to enforce one-quote-per-lead. The UNIQUE index can be used
--    anywhere the non-unique one was, so the non-unique is redundant. (Not in
--    the CSV lint output but flagged by pg_index group-by checks.)
DROP INDEX IF EXISTS public.idx_quotes_lead_id;

-- ---------------------------------------------------------------------------
-- Diagnostic verification
-- ---------------------------------------------------------------------------
-- List any remaining duplicate index groups across the public schema. We
-- RAISE NOTICE per group so they show up in the migration log without aborting
-- the migration; aborting hides the names of the indexes that need attention.
DO $$
DECLARE
  detail RECORD;
  remaining_groups int := 0;
BEGIN
  FOR detail IN
    SELECT
      n.nspname    AS schema_name,
      c.relname    AS table_name,
      i.indkey::text AS index_columns,
      array_agg(ic.relname ORDER BY ic.relname) AS index_names
    FROM pg_index i
    JOIN pg_class ic ON ic.oid = i.indexrelid
    JOIN pg_class c  ON c.oid  = i.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    GROUP BY n.nspname, c.relname, i.indkey
    HAVING COUNT(*) > 1
    ORDER BY c.relname
  LOOP
    remaining_groups := remaining_groups + 1;
    RAISE NOTICE 'duplicate-index group on %.% (cols=%): %',
      detail.schema_name, detail.table_name, detail.index_columns, detail.index_names;
  END LOOP;

  IF remaining_groups = 0 THEN
    RAISE NOTICE 'Phase 1 verification: no duplicate indexes remain in public schema.';
  ELSE
    RAISE NOTICE 'Phase 1 verification: % duplicate index group(s) still present (see notices above for names).', remaining_groups;
  END IF;
END$$;
