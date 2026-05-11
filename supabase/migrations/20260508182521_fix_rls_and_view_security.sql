-- Fix the 16 ERROR-level findings from the Supabase security advisor:
--   * 11 rls_disabled_in_public  -> drop 2 snapshot tables, enable RLS on 9 others
--   * 5  security_definer_view   -> switch each to invoker-rights via ALTER VIEW
--
-- All access patterns were chosen with the user (see plan file). Service-role
-- bypasses RLS, so server-side triggers and admin API routes that use the
-- service-role key continue to work without policy changes.

-- ============================================================================
-- A1. Drop the leftover RLS snapshot tables
-- ============================================================================
-- These were created by 20260508134633_wrap_rls_auth_fns_in_select.sql and
-- 20260508135054_consolidate_overlapping_rls_policies.sql as defensive
-- rollback aids. The migrations have been verified in production; the
-- snapshots are no longer needed and shouldn't sit in the public schema.

DROP TABLE IF EXISTS public._rls_policy_snapshot_phase2;
DROP TABLE IF EXISTS public._rls_policy_snapshot_phase3;

-- ============================================================================
-- A2. lead_assignment_debug -- enable RLS, admin-only SELECT
-- ============================================================================
-- The original migration set DISABLE ROW LEVEL SECURITY for write convenience.
-- The trigger that writes to it runs as service_role (bypassrls = true), so
-- writes still work after enabling RLS. We add only a SELECT policy because
-- nothing in the app inserts/updates/deletes through PostgREST.

ALTER TABLE public.lead_assignment_debug ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_assignment_debug_admin_select ON public.lead_assignment_debug;
CREATE POLICY lead_assignment_debug_admin_select ON public.lead_assignment_debug
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- A3. Company-scoped tables (5)
-- ============================================================================
-- Standard pattern: global admins always have access; company members access
-- rows whose company_id is in their user_companies. Junction tables traverse
-- to the parent table for the company_id check.

-- ----- products (has company_id) -----
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_insert ON public.products;
DROP POLICY IF EXISTS products_update ON public.products;
DROP POLICY IF EXISTS products_delete ON public.products;

CREATE POLICY products_select ON public.products
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY products_insert ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY products_update ON public.products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY products_delete ON public.products
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );

-- ----- google_places_listings (has company_id) -----
ALTER TABLE public.google_places_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS google_places_listings_select ON public.google_places_listings;
DROP POLICY IF EXISTS google_places_listings_insert ON public.google_places_listings;
DROP POLICY IF EXISTS google_places_listings_update ON public.google_places_listings;
DROP POLICY IF EXISTS google_places_listings_delete ON public.google_places_listings;

CREATE POLICY google_places_listings_select ON public.google_places_listings
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY google_places_listings_insert ON public.google_places_listings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY google_places_listings_update ON public.google_places_listings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY google_places_listings_delete ON public.google_places_listings
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );

-- ----- campaign_image_usage (junction; company via company_images) -----
ALTER TABLE public.campaign_image_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campaign_image_usage_select ON public.campaign_image_usage;
DROP POLICY IF EXISTS campaign_image_usage_insert ON public.campaign_image_usage;
DROP POLICY IF EXISTS campaign_image_usage_update ON public.campaign_image_usage;
DROP POLICY IF EXISTS campaign_image_usage_delete ON public.campaign_image_usage;

CREATE POLICY campaign_image_usage_select ON public.campaign_image_usage
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM company_images ci
      WHERE ci.id = campaign_image_usage.company_image_id
        AND ci.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY campaign_image_usage_insert ON public.campaign_image_usage
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM company_images ci
      WHERE ci.id = campaign_image_usage.company_image_id
        AND ci.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY campaign_image_usage_update ON public.campaign_image_usage
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM company_images ci
      WHERE ci.id = campaign_image_usage.company_image_id
        AND ci.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM company_images ci
      WHERE ci.id = campaign_image_usage.company_image_id
        AND ci.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY campaign_image_usage_delete ON public.campaign_image_usage
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM company_images ci
      WHERE ci.id = campaign_image_usage.company_image_id
        AND ci.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );

-- ----- service_plan_products (junction; company via service_plans) -----
ALTER TABLE public.service_plan_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_plan_products_select ON public.service_plan_products;
DROP POLICY IF EXISTS service_plan_products_insert ON public.service_plan_products;
DROP POLICY IF EXISTS service_plan_products_update ON public.service_plan_products;
DROP POLICY IF EXISTS service_plan_products_delete ON public.service_plan_products;

CREATE POLICY service_plan_products_select ON public.service_plan_products
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_products.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY service_plan_products_insert ON public.service_plan_products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_products.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY service_plan_products_update ON public.service_plan_products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_products.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_products.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY service_plan_products_delete ON public.service_plan_products
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_products.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );

-- ----- service_plan_recommended_addons (junction; company via service_plans) -----
ALTER TABLE public.service_plan_recommended_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_plan_recommended_addons_select ON public.service_plan_recommended_addons;
DROP POLICY IF EXISTS service_plan_recommended_addons_insert ON public.service_plan_recommended_addons;
DROP POLICY IF EXISTS service_plan_recommended_addons_update ON public.service_plan_recommended_addons;
DROP POLICY IF EXISTS service_plan_recommended_addons_delete ON public.service_plan_recommended_addons;

CREATE POLICY service_plan_recommended_addons_select ON public.service_plan_recommended_addons
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_recommended_addons.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY service_plan_recommended_addons_insert ON public.service_plan_recommended_addons
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_recommended_addons.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY service_plan_recommended_addons_update ON public.service_plan_recommended_addons
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_recommended_addons.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_recommended_addons.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );
CREATE POLICY service_plan_recommended_addons_delete ON public.service_plan_recommended_addons
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
    OR EXISTS (
      SELECT 1 FROM service_plans sp
      WHERE sp.id = service_plan_recommended_addons.plan_id
        AND sp.company_id IN (
          SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
        )
    )
  );

-- ============================================================================
-- A4. project_template_task_category_assignments
-- ============================================================================
-- Templates are admin-managed but viewable by every authenticated user, mirror
-- the pattern used by other project_template_* tables.

ALTER TABLE public.project_template_task_category_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ptca_select ON public.project_template_task_category_assignments;
DROP POLICY IF EXISTS ptca_insert ON public.project_template_task_category_assignments;
DROP POLICY IF EXISTS ptca_update ON public.project_template_task_category_assignments;
DROP POLICY IF EXISTS ptca_delete ON public.project_template_task_category_assignments;

CREATE POLICY ptca_select ON public.project_template_task_category_assignments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ptca_insert ON public.project_template_task_category_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY ptca_update ON public.project_template_task_category_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY ptca_delete ON public.project_template_task_category_assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );

-- ============================================================================
-- A5. Admin-only pest-pressure tables (2)
-- ============================================================================

ALTER TABLE public.admin_pest_pressure_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_pest_pressure_models_select ON public.admin_pest_pressure_models;
DROP POLICY IF EXISTS admin_pest_pressure_models_insert ON public.admin_pest_pressure_models;
DROP POLICY IF EXISTS admin_pest_pressure_models_update ON public.admin_pest_pressure_models;
DROP POLICY IF EXISTS admin_pest_pressure_models_delete ON public.admin_pest_pressure_models;

CREATE POLICY admin_pest_pressure_models_select ON public.admin_pest_pressure_models
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY admin_pest_pressure_models_insert ON public.admin_pest_pressure_models
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY admin_pest_pressure_models_update ON public.admin_pest_pressure_models
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY admin_pest_pressure_models_delete ON public.admin_pest_pressure_models
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );

ALTER TABLE public.admin_pest_pressure_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_pest_pressure_predictions_select ON public.admin_pest_pressure_predictions;
DROP POLICY IF EXISTS admin_pest_pressure_predictions_insert ON public.admin_pest_pressure_predictions;
DROP POLICY IF EXISTS admin_pest_pressure_predictions_update ON public.admin_pest_pressure_predictions;
DROP POLICY IF EXISTS admin_pest_pressure_predictions_delete ON public.admin_pest_pressure_predictions;

CREATE POLICY admin_pest_pressure_predictions_select ON public.admin_pest_pressure_predictions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY admin_pest_pressure_predictions_insert ON public.admin_pest_pressure_predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY admin_pest_pressure_predictions_update ON public.admin_pest_pressure_predictions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY admin_pest_pressure_predictions_delete ON public.admin_pest_pressure_predictions
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
              AND role IN ('admin', 'super_admin'))
  );

-- ============================================================================
-- A6. Switch the 5 flagged views to security_invoker
-- ============================================================================
-- Without this option, Postgres views run as the *owner* and bypass the
-- querying user's RLS. Setting security_invoker = true makes each view
-- enforce RLS based on whoever's running the query, which is what the
-- security_definer_view lint requires.

ALTER VIEW public.performance_monitoring         SET (security_invoker = true);
ALTER VIEW public.execution_email_metrics        SET (security_invoker = true);
ALTER VIEW public.campaign_email_metrics         SET (security_invoker = true);
ALTER VIEW public.admin_pest_pressure_aggregated SET (security_invoker = true);
ALTER VIEW public.active_pest_pressure_models    SET (security_invoker = true);

-- ============================================================================
-- A7. Verification
-- ============================================================================
-- Counts public-schema tables without RLS and views without security_invoker.
-- NOTICE (not EXCEPTION) so we can see the diagnostics without aborting if
-- some Postgres-internal or extension-owned object is in the count.

DO $$
DECLARE
  rls_off_count int;
  invoker_off_count int;
  detail RECORD;
BEGIN
  SELECT COUNT(*) INTO rls_off_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity;

  RAISE NOTICE 'Tables in public without RLS: %', rls_off_count;

  IF rls_off_count > 0 THEN
    FOR detail IN
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND NOT c.relrowsecurity
      ORDER BY c.relname
    LOOP
      RAISE NOTICE '  -> %', detail.relname;
    END LOOP;
  END IF;

  SELECT COUNT(*) INTO invoker_off_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND NOT EXISTS (
      SELECT 1 FROM unnest(COALESCE(c.reloptions, ARRAY[]::text[])) AS opt
      WHERE opt = 'security_invoker=true'
    );

  RAISE NOTICE 'Views in public without security_invoker: %', invoker_off_count;

  IF invoker_off_count > 0 THEN
    FOR detail IN
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'v'
        AND NOT EXISTS (
          SELECT 1 FROM unnest(COALESCE(c.reloptions, ARRAY[]::text[])) AS opt
          WHERE opt = 'security_invoker=true'
        )
      ORDER BY c.relname
    LOOP
      RAISE NOTICE '  -> %', detail.relname;
    END LOOP;
  END IF;
END$$;
