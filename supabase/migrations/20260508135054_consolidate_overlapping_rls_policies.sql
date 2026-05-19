-- Phase 3: Consolidate overlapping permissive RLS policies (multiple_permissive_policies lint).
--
-- This migration eliminates 295 (role, action) overlap warnings across 59 tables.
-- The fixes fall into five patterns; each is applied in its own section below.
--
--   Pattern A: Drop redundant "Service role can manage X" policies. The service_role
--              Postgres role has bypassrls=true in Supabase, so these never run for
--              service_role and never grant for any other role -- they're no-ops.
--
--   Pattern C: Drop SELECT-only "view" policies that overlap with a broader
--              "manage" FOR ALL policy whose USING expression is identical.
--              The migration only drops when the FOR ALL USING is at least as
--              permissive (text-equality check) as the SELECT USING, so we
--              never tighten access by accident.
--
--   Pattern D: Split a FOR ALL "manage" policy into FOR INSERT / FOR UPDATE /
--              FOR DELETE so the existing FOR SELECT policy is the only one
--              evaluated on reads.
--
--   Pattern E: Consolidate legacy + optimized user policies into a single per-
--              action policy whose USING/WITH CHECK is the union (OR) of all
--              prior expressions. This preserves access semantics exactly --
--              users who could read/write before still can. (No tightening.)
--
--   Pattern B: Same OR-consolidation idea, but applied to "Admin FOR ALL" +
--              "User FOR <action>" pairs. Implemented via a shared helper
--              that captures live qual/with_check from pg_policies (already
--              wrapped in Phase 2) and re-emits them inside one consolidated
--              CREATE POLICY per action.
--
-- A snapshot of pg_policies is captured at the top so prior policies can be
-- reconstructed by hand if any access regression appears.

-- ---------------------------------------------------------------------------
-- Snapshot for rollback
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public._rls_policy_snapshot_phase3;
CREATE TABLE public._rls_policy_snapshot_phase3 AS
SELECT now() AS snapshotted_at, *
FROM pg_policies
WHERE schemaname = 'public';

COMMENT ON TABLE public._rls_policy_snapshot_phase3 IS
  'Pre-consolidation snapshot from migration 20260508135054_consolidate_overlapping_rls_policies. Safe to drop after verification.';

-- ============================================================================
-- Pattern A -- Drop service-role policies (~80 lints across 12 tables)
-- ============================================================================
-- service_role bypasses RLS via bypassrls=true, so these policies never gate
-- access for any role. Dropping is functionally invisible.

DROP POLICY IF EXISTS "Service role can manage AI cache"           ON public.ai_cache;
DROP POLICY IF EXISTS "Service role can manage AI contexts"        ON public.ai_contexts;
DROP POLICY IF EXISTS "Service role can manage AI usage"           ON public.ai_usage;
DROP POLICY IF EXISTS "Service role can manage pest pressure data" ON public.pest_pressure_data_points;
DROP POLICY IF EXISTS "Service role can manage ML models"          ON public.pest_pressure_ml_models;
DROP POLICY IF EXISTS "Service role can manage predictions"        ON public.pest_pressure_predictions;
DROP POLICY IF EXISTS "Service role can manage all SMS data"       ON public.sms_conversations;
DROP POLICY IF EXISTS "Service role can manage all SMS logs"       ON public.sms_logs;
DROP POLICY IF EXISTS "Service role can manage all SMS messages"   ON public.sms_messages;
DROP POLICY IF EXISTS "Service role full access"                   ON public.unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can manage weather cache"      ON public.weather_cache;
DROP POLICY IF EXISTS "Allow service role to read profiles for admin operations" ON public.profiles;

-- ============================================================================
-- Pattern C -- Drop SELECT-only view policies redundant under FOR ALL manage
-- ============================================================================
-- For each pair below the FOR ALL "manage" policy and the FOR SELECT "view"
-- policy share the same USING expression, so the SELECT policy is fully
-- redundant. We guard with a runtime equality check so a divergence in the
-- live policies will skip the drop and emit a NOTICE instead.

CREATE OR REPLACE FUNCTION public._drop_if_select_redundant(
  p_table       text,
  p_select_pol  text,
  p_manage_pol  text
)
RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
  q_sel    text;
  q_manage text;
BEGIN
  SELECT qual INTO q_sel    FROM pg_policies WHERE schemaname='public' AND tablename=p_table AND policyname=p_select_pol;
  SELECT qual INTO q_manage FROM pg_policies WHERE schemaname='public' AND tablename=p_table AND policyname=p_manage_pol;

  IF q_sel IS NULL THEN
    RAISE NOTICE '%: SELECT-only policy % not found; nothing to drop', p_table, p_select_pol;
    RETURN;
  END IF;

  IF q_manage IS NULL THEN
    RAISE NOTICE '%: manage policy % not found; leaving SELECT policy in place', p_table, p_manage_pol;
    RETURN;
  END IF;

  IF regexp_replace(q_sel, '\s+', ' ', 'g') = regexp_replace(q_manage, '\s+', ' ', 'g') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_select_pol, p_table);
  ELSE
    RAISE NOTICE '%: SELECT (%) and manage (%) USING expressions differ; not dropping. Inspect manually.',
      p_table, p_select_pol, p_manage_pol;
  END IF;
END;
$func$;

SELECT public._drop_if_select_redundant('add_on_services',
  'Users can view add-ons for their company',
  'Users can manage add-ons for their company');

SELECT public._drop_if_select_redundant('addon_service_plan_eligibility',
  'Users can view eligibility for their company',
  'Users can manage eligibility for their company');

SELECT public._drop_if_select_redundant('company_pricing_settings',
  'Allow users to view their company pricing settings',
  'Allow users to manage their company pricing settings');

SELECT public._drop_if_select_redundant('specialty_plan_lines',
  'Users can view specialty lines for their company plans',
  'Users can manage specialty lines for their company plans');

SELECT public._drop_if_select_redundant('monthly_service_budgets',
  'Admins can view monthly service budgets',
  'Admins can manage monthly service budgets');

SELECT public._drop_if_select_redundant('monthly_service_content_pieces',
  'Admins can view monthly service content pieces',
  'Admins can manage monthly service content pieces');

SELECT public._drop_if_select_redundant('monthly_service_task_department_assignments',
  'Admins can view MS task dept assignments',
  'Admins can manage MS task dept assignments');

DROP FUNCTION public._drop_if_select_redundant(text, text, text);

-- ============================================================================
-- Pattern D -- Split FOR ALL into per-action so SELECT has only one policy
-- ============================================================================
-- These tables already have a *_select_optimized policy. The matching
-- *_all_optimized policy is split into INSERT/UPDATE/DELETE so the SELECT path
-- evaluates only the SELECT policy.

CREATE OR REPLACE FUNCTION public._split_for_all_into_per_action(
  p_table       text,
  p_for_all_pol text,
  p_new_prefix  text,
  p_role        text DEFAULT 'authenticated'
)
RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
  v_using text;
  v_check text;
BEGIN
  SELECT qual, with_check INTO v_using, v_check
  FROM pg_policies
  WHERE schemaname='public' AND tablename=p_table AND policyname=p_for_all_pol;

  IF v_using IS NULL AND v_check IS NULL THEN
    RAISE NOTICE 'split_for_all: % on % not found; skipping', p_for_all_pol, p_table;
    RETURN;
  END IF;

  -- Drop first so we don't leave a transient duplicate.
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_for_all_pol, p_table);

  -- INSERT: only WITH CHECK (fall back to USING if check is NULL since FOR ALL
  -- treats USING as both qual and check when only USING is given).
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR INSERT TO %I WITH CHECK (%s)',
    p_new_prefix || '_insert', p_table, p_role, COALESCE(v_check, v_using)
  );
  -- UPDATE: USING + WITH CHECK
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO %I USING (%s) WITH CHECK (%s)',
    p_new_prefix || '_update', p_table, p_role, v_using, COALESCE(v_check, v_using)
  );
  -- DELETE: USING only
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR DELETE TO %I USING (%s)',
    p_new_prefix || '_delete', p_table, p_role, v_using
  );
END;
$func$;

SELECT public._split_for_all_into_per_action('brands',                 'brands_all_optimized',                 'brands');
SELECT public._split_for_all_into_per_action('email_template_library', 'email_template_library_all_optimized', 'email_template_library');
SELECT public._split_for_all_into_per_action('pest_types',             'pest_types_all_optimized',             'pest_types');

-- automation_executions: FOR ALL admin policy + SELECT optimized. Same shape as
-- Pattern D but the FOR ALL is named "Company admins can modify automation
-- executions" instead of *_all_optimized.
SELECT public._split_for_all_into_per_action('automation_executions',
  'Company admins can modify automation executions',
  'automation_executions');

DROP FUNCTION public._split_for_all_into_per_action(text, text, text, text);

-- ============================================================================
-- Pattern B + E -- OR-merge admin FOR ALL with user per-action policies
-- ============================================================================
-- Helper: drops all listed input policies (admin + users) and re-emits one
-- consolidated policy per action whose USING/WITH CHECK is the OR of every
-- input policy's expression. This guarantees no row that was previously
-- accessible becomes inaccessible.
--
-- p_input_policies is the COMPLETE list of policy names to merge for this table
-- (do NOT separate "admin" vs "user" -- list them all and the helper handles
-- the rest by reading the snapshot).

CREATE OR REPLACE FUNCTION public._merge_into_per_action(
  p_table          text,
  p_input_policies text[],
  p_new_prefix     text,
  p_role           text DEFAULT 'authenticated'
)
RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
  pol_name        text;
  action_label    text;
  combined_using  text;
  combined_check  text;
  rec             RECORD;
  -- Track whether this run found anything to merge.
  any_found       boolean := false;
  actions         text[] := ARRAY['SELECT','INSERT','UPDATE','DELETE'];
BEGIN
  -- Drop all input policies first so we can safely re-emit new ones.
  FOREACH pol_name IN ARRAY p_input_policies LOOP
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=p_table AND policyname=pol_name) THEN
      any_found := true;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, p_table);
  END LOOP;

  IF NOT any_found THEN
    RAISE NOTICE 'merge_into_per_action: none of the listed policies exist on %; skipping', p_table;
    RETURN;
  END IF;

  -- For each action, OR together every input policy that applies to it
  -- (cmd = action_label or cmd = 'ALL').
  FOREACH action_label IN ARRAY actions LOOP
    combined_using := NULL;
    combined_check := NULL;

    FOR rec IN
      SELECT qual, with_check, cmd
      FROM public._rls_policy_snapshot_phase3
      WHERE schemaname='public'
        AND tablename=p_table
        AND policyname = ANY(p_input_policies)
        AND (cmd = action_label OR cmd = 'ALL')
      ORDER BY (cmd = action_label) DESC, policyname
    LOOP
      -- USING side -- only meaningful for SELECT/UPDATE/DELETE.
      IF rec.qual IS NOT NULL AND action_label IN ('SELECT', 'UPDATE', 'DELETE') THEN
        combined_using := CASE
          WHEN combined_using IS NULL THEN format('(%s)', rec.qual)
          ELSE combined_using || ' OR ' || format('(%s)', rec.qual)
        END;
      END IF;

      -- WITH CHECK side -- only meaningful for INSERT/UPDATE.
      -- Postgres treats `FOR ALL USING (X)` as if WITH CHECK (X) was also given,
      -- but pg_policies.with_check is NULL in that case. For cmd = 'ALL' we
      -- fall back to qual when with_check is missing so the new policy keeps
      -- the same effective check for INSERT/UPDATE.
      IF action_label IN ('INSERT', 'UPDATE') THEN
        DECLARE
          eff_check text := CASE
            WHEN rec.with_check IS NOT NULL THEN rec.with_check
            WHEN rec.cmd = 'ALL'           THEN rec.qual   -- USING serves as check
            WHEN rec.cmd = 'UPDATE'        THEN rec.qual   -- same default for UPDATE
            ELSE NULL
          END;
        BEGIN
          IF eff_check IS NOT NULL THEN
            combined_check := CASE
              WHEN combined_check IS NULL THEN format('(%s)', eff_check)
              ELSE combined_check || ' OR ' || format('(%s)', eff_check)
            END;
          END IF;
        END;
      END IF;
    END LOOP;

    -- For INSERT, Postgres requires WITH CHECK (no USING). If only USING was
    -- collected (FOR ALL policies whose qual functions as both), promote it.
    -- For SELECT and DELETE, only USING is allowed (no WITH CHECK).
    IF action_label = 'INSERT' THEN
      IF combined_check IS NULL AND combined_using IS NOT NULL THEN
        combined_check := combined_using;
      END IF;
      combined_using := NULL;  -- never emit USING on INSERT
    ELSIF action_label IN ('SELECT', 'DELETE') THEN
      combined_check := NULL;  -- never emit WITH CHECK on SELECT/DELETE
    END IF;

    -- Skip the action if there's nothing to grant on it.
    IF action_label IN ('SELECT', 'DELETE') AND combined_using IS NULL THEN
      CONTINUE;
    END IF;
    IF action_label = 'INSERT' AND combined_check IS NULL THEN
      CONTINUE;
    END IF;
    IF action_label = 'UPDATE' AND combined_using IS NULL AND combined_check IS NULL THEN
      CONTINUE;
    END IF;

    -- TO PUBLIC must be emitted as the unquoted keyword; %I would quote it as
    -- "public" (an invalid role name in this context).
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR %s TO %s %s %s',
      p_new_prefix || '_' || lower(action_label),
      p_table,
      action_label,
      CASE WHEN lower(p_role) = 'public' THEN 'PUBLIC' ELSE quote_ident(p_role) END,
      CASE WHEN combined_using IS NOT NULL THEN format('USING (%s)', combined_using) ELSE '' END,
      CASE WHEN combined_check IS NOT NULL THEN format('WITH CHECK (%s)', combined_check) ELSE '' END
    );
  END LOOP;
END;
$func$;

-- ----------------------------------------------------------------------
-- Pattern B invocations -- admin FOR ALL + per-action user policies
-- ----------------------------------------------------------------------

-- Simple admin + single-view-policy tables
SELECT public._merge_into_per_action('project_activity', ARRAY[
  'Super admins have full access to project activity',
  'Users can view activity for accessible projects'
], 'project_activity');

SELECT public._merge_into_per_action('project_task_activity', ARRAY[
  'Super admins have full access to task activity',
  'Users can view activity for accessible tasks'
], 'project_task_activity');

SELECT public._merge_into_per_action('project_task_templates', ARRAY[
  'Super admins have full access to task templates',
  'Authenticated users can view task templates'
], 'project_task_templates');

SELECT public._merge_into_per_action('project_template_category_assignments', ARRAY[
  'Admins full access to template categories',
  'Users can view template categories'
], 'project_template_category_assignments');

SELECT public._merge_into_per_action('project_template_members', ARRAY[
  'Admins full access template members',
  'Users view active template members'
], 'project_template_members');

SELECT public._merge_into_per_action('project_template_tasks', ARRAY[
  'Admins full access to template tasks',
  'Users can view tasks of active templates'
], 'project_template_tasks');

SELECT public._merge_into_per_action('project_templates', ARRAY[
  'Admins full access to templates',
  'Users can view active templates'
], 'project_templates');

SELECT public._merge_into_per_action('project_type_subtypes', ARRAY[
  'Admins have full access to project type subtypes',
  'Users can view project type subtypes'
], 'project_type_subtypes');

SELECT public._merge_into_per_action('company_discounts', ARRAY[
  'Admins can manage company discounts',
  'Users can view company discounts'
], 'company_discounts');

SELECT public._merge_into_per_action('company_features', ARRAY[
  'Admins can manage company features',
  'Users can view their company features'
], 'company_features');

SELECT public._merge_into_per_action('widget_domains', ARRAY[
  'Admins can manage all widget domains',
  'Company users can view their widget domains'
], 'widget_domains');

SELECT public._merge_into_per_action('campaign_batch_schedule', ARRAY[
  'Company admins can manage batch schedules',
  'Users can read batch schedules for their companies'
], 'campaign_batch_schedule');

SELECT public._merge_into_per_action('campaign_contact_list_members', ARRAY[
  'Company admins can manage contact list members',
  'Users can read contact list members for their companies'
], 'campaign_contact_list_members');

SELECT public._merge_into_per_action('campaign_contact_lists', ARRAY[
  'Company admins can manage contact lists',
  'Users can read contact lists for their companies'
], 'campaign_contact_lists');

SELECT public._merge_into_per_action('campaigns', ARRAY[
  'Company admins can manage campaigns',
  'Users can read campaigns for their companies'
], 'campaigns');

SELECT public._merge_into_per_action('recurring_schedules', ARRAY[
  'Company admins and managers can manage recurring schedules',
  'Company members can view recurring schedules'
], 'recurring_schedules');

SELECT public._merge_into_per_action('route_optimization_jobs', ARRAY[
  'Company admins and managers can manage optimization jobs',
  'Company members can view optimization jobs'
], 'route_optimization_jobs');

SELECT public._merge_into_per_action('technician_schedules', ARRAY[
  'Company admins and managers can manage tech schedules',
  'Company members can view tech schedules'
], 'technician_schedules');

SELECT public._merge_into_per_action('monthly_services_departments', ARRAY[
  'Admins can manage MS departments',
  'Authenticated users can view MS departments'
], 'monthly_services_departments');

-- Public-readable system tables: anon role merges legacy "Public can read" with admin manage
SELECT public._merge_into_per_action('system_sales_cadence_steps', ARRAY[
  'Admins can manage system cadence steps',
  'Public can read steps of active system cadences'
], 'system_sales_cadence_steps', 'public');

SELECT public._merge_into_per_action('system_sales_cadences', ARRAY[
  'Admins can manage system cadences',
  'Public can read active system cadences'
], 'system_sales_cadences', 'public');

-- Tables with multiple user policies (one per action)
SELECT public._merge_into_per_action('monthly_service_comments', ARRAY[
  'Super admins have full access to monthly service comments',
  'Users can view comments on monthly services in their companies',
  -- PG truncates identifiers at 63 chars; the original "...companies" became
  -- "...companie" when the policy was created. Match the stored name.
  'Users can create comments on monthly services in their companie',
  'Users can update their own monthly service comments',
  'Users can delete their own monthly service comments'
], 'monthly_service_comments');

SELECT public._merge_into_per_action('project_comments', ARRAY[
  'Admins and PMs have full access to project comments',
  'Users can view comments on accessible projects',
  'Users can create comments on accessible projects',
  'Users can update their own comments',
  'Users can delete their own comments',
  'project_managers can create project comments'
], 'project_comments');

SELECT public._merge_into_per_action('project_members', ARRAY[
  'Admins full access',
  'Users view accessible',
  'Users add to managed',
  'Users remove manual from managed'
], 'project_members');

SELECT public._merge_into_per_action('project_task_comments', ARRAY[
  'Super admins have full access to task comments',
  'Users can view comments on accessible tasks',
  'Users can create comments on accessible tasks',
  'Users can update their own comments'
], 'project_task_comments');

SELECT public._merge_into_per_action('project_task_views', ARRAY[
  'Super admins have full access to task views',
  'Users can view their own task views',
  'Users can insert their own task views',
  'Users can update their own task views'
], 'project_task_views');

SELECT public._merge_into_per_action('project_tasks', ARRAY[
  'Super admins have full access to project tasks',
  'Users can view tasks in their company projects',
  'Users can view monthly service tasks in their companies',
  'Users can manage monthly service tasks in their companies',
  'Users can update monthly service tasks in their companies'
], 'project_tasks');

-- Two FOR ALL admin policies + a user view policy
SELECT public._merge_into_per_action('project_departments', ARRAY[
  'Admins can manage system departments',
  'Company admins can manage company departments',
  'Users can view departments'
], 'project_departments');

-- Notifications: 7 policies in original; INSERT and UPDATE have one each so we
-- only need to merge the SELECT triple and DELETE pair. Pass all the policies
-- that overlap; merge_into_per_action only emits actions that have grants.
SELECT public._merge_into_per_action('notifications', ARRAY[
  'Users can view their own notifications',
  'Company managers can view company notifications',
  'Global admins can view all notifications',
  'Users can delete their own notifications',
  'Company managers can delete company notifications'
], 'notifications');

-- ----------------------------------------------------------------------
-- Pattern E invocations -- legacy + optimized user policies, OR-merge
-- (preserves access semantics exactly; never tightens)
-- ----------------------------------------------------------------------

-- call_records: two near-duplicate company-access policies; OR'd they're the
-- union of accessible rows.
SELECT public._merge_into_per_action('call_records', ARRAY[
  'call_records_company_access',
  'call_records_user_company_access'
], 'call_records');

-- companies: legacy broad SELECT + simplified successor.
SELECT public._merge_into_per_action('companies', ARRAY[
  'Allow authenticated users and service role to view companies',
  'companies_select_simplified'
], 'companies_select_merged');
-- Rename to canonical name for cleanliness.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='companies_select_merged_select') THEN
    ALTER POLICY "companies_select_merged_select" ON public.companies RENAME TO "companies_select_simplified";
  END IF;
END$$;

-- leads: 4 legacy "Allow authenticated users to ..." policies + leads_all_consolidated.
SELECT public._merge_into_per_action('leads', ARRAY[
  'Allow authenticated users to view leads',
  'Allow authenticated users to insert leads',
  'Allow authenticated users to update leads',
  'Allow authenticated users to delete leads',
  'leads_all_consolidated'
], 'leads_consolidated');

-- profiles: legacy "Allow service role to read profiles for admin operations"
-- was already dropped in Pattern A. The remaining lint is the overlap with
-- profiles_company_access -- already handled by the Pattern A drop. Nothing
-- additional needed here.

-- user_departments: legacy "Company managers can ..." granted via user_companies
-- role check; optimized successor uses profiles role check + user_shares_company_with.
-- These check different criteria; OR-merging preserves access for both populations.
SELECT public._merge_into_per_action('user_departments', ARRAY[
  'Company managers can view department assignments',
  'Global admins can view all departments',
  'Company managers can assign departments',
  'Company managers can update departments',
  'Company managers can remove departments',
  'user_departments_company_access',
  'user_departments_modify',
  'user_departments_update_policy',
  'user_departments_delete_policy'
], 'user_departments');

-- ----------------------------------------------------------------------
-- Per-table special cases
-- ----------------------------------------------------------------------

-- ----- campaign_landing_pages -----
-- "Allow authenticated users to manage landing pages" (FOR ALL authenticated) +
-- "Allow public read for landing pages" (FOR SELECT public). The public SELECT
-- is intentional anonymous access; scope the authenticated FOR ALL to non-
-- SELECT actions so SELECT has only the public-read policy.
DO $$
DECLARE
  v_qual text;
BEGIN
  SELECT qual INTO v_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='campaign_landing_pages'
    AND policyname='Allow authenticated users to manage landing pages';

  IF v_qual IS NULL THEN
    RAISE NOTICE 'campaign_landing_pages manage policy not found; skipping';
    RETURN;
  END IF;

  EXECUTE format('CREATE POLICY "Allow authenticated users to insert landing pages" ON public.campaign_landing_pages FOR INSERT TO authenticated WITH CHECK (%s)', v_qual);
  EXECUTE format('CREATE POLICY "Allow authenticated users to update landing pages" ON public.campaign_landing_pages FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', v_qual, v_qual);
  EXECUTE format('CREATE POLICY "Allow authenticated users to delete landing pages" ON public.campaign_landing_pages FOR DELETE TO authenticated USING (%s)', v_qual);

  DROP POLICY IF EXISTS "Allow authenticated users to manage landing pages" ON public.campaign_landing_pages;
  -- "Allow public read for landing pages" stays (SELECT, public).
END$$;

-- ----- projects -----
-- Has legacy named policies "Create projects"/"Update projects"/"View projects"
-- (per-action) plus projects_all_optimized (FOR ALL) plus projects_select_optimized
-- (FOR SELECT). Strategy: merge the per-action legacy policies with the matching
-- optimized successor, leaving one per action.
SELECT public._merge_into_per_action('projects', ARRAY[
  'Create projects',
  'Update projects',
  'View projects',
  'projects_all_optimized',
  'projects_select_optimized'
], 'projects_optimized');

-- ----- quotes -----
-- "Public can view quotes with valid URL" (token-based public access) + "Users
-- can view quotes for their company" (authenticated). Scope the public-token
-- policy to TO anon so authenticated users only evaluate the company-scoped
-- policy. (We do NOT consolidate via OR here because that would add per-row
-- token validation cost to every authenticated query.)
DO $$
DECLARE
  v_qual text;
BEGIN
  SELECT qual INTO v_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='quotes' AND policyname='Public can view quotes with valid URL';

  IF v_qual IS NULL THEN
    RAISE NOTICE 'quotes public-view policy not found; skipping';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Public can view quotes with valid URL" ON public.quotes;
  EXECUTE format('CREATE POLICY "Public can view quotes with valid URL" ON public.quotes FOR SELECT TO anon USING (%s)', v_qual);
END$$;

-- ============================================================================
-- Cleanup helpers
-- ============================================================================
DROP FUNCTION public._merge_into_per_action(text, text[], text, text);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  remaining int;
  detail RECORD;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM (
    SELECT schemaname, tablename, roles, cmd
    FROM pg_policies
    WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
    GROUP BY schemaname, tablename, roles, cmd
    HAVING COUNT(*) > 1
  ) overlap_groups;  -- "overlaps" alone is the SQL OVERLAPS keyword in PG

  IF remaining > 0 THEN
    RAISE WARNING 'Phase 3 verification: % overlapping (table, role, action) groups remain. See _rls_policy_snapshot_phase3 for the prior state.', remaining;
    FOR detail IN
      SELECT tablename, cmd, roles, COUNT(*) AS n,
             string_agg(policyname, ', ') AS policies
      FROM pg_policies
      WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
      GROUP BY tablename, cmd, roles
      HAVING COUNT(*) > 1
      ORDER BY tablename, cmd
    LOOP
      RAISE NOTICE '  %.% [% on %]: % overlapping -> %',
        'public', detail.tablename, detail.cmd, detail.roles, detail.n, detail.policies;
    END LOOP;
  ELSE
    RAISE NOTICE 'Phase 3 verification: no overlapping policies remain.';
  END IF;
END$$;
