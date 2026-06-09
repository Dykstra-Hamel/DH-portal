-- Fix: "relation customer_service_addresses does not exist" regression
-- Both functions reference public-schema tables without a pinned search_path,
-- causing 42P01 in some execution contexts (same pattern as 20260519210410).

-- ── ensure_single_primary_address ─────────────────────────────────────────
-- Trigger: AFTER INSERT OR UPDATE ON customer_service_addresses
-- Called by: linkCustomerToServiceAddress() in the retell webhook flow

CREATE OR REPLACE FUNCTION public.ensure_single_primary_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public, pg_temp'
AS $$
BEGIN
    IF NEW.is_primary_address = true THEN
        UPDATE public.customer_service_addresses
        SET    is_primary_address = false
        WHERE  customer_id = NEW.customer_id
        AND    id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ensure_single_primary_address() IS
  'Ensures only one primary service address per customer. Pinned search_path prevents 42P01 on customer_service_addresses lookup.';

-- ── auto_assign_quote_lead ─────────────────────────────────────────────────
-- Trigger: BEFORE INSERT ON leads
-- References customer_service_addresses and service_addresses without schema prefix

CREATE OR REPLACE FUNCTION public.auto_assign_quote_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public, pg_temp'
AS $$
DECLARE
  v_requires_quote   BOOLEAN;
  v_auto_assign      BOOLEAN;
  v_zip              TEXT;
  v_assigned_user    UUID;
BEGIN
  IF NEW.assigned_to IS NOT NULL OR NEW.selected_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT requires_quote INTO v_requires_quote
    FROM public.service_plans WHERE id = NEW.selected_plan_id;
  IF NOT COALESCE(v_requires_quote, FALSE) THEN RETURN NEW; END IF;

  SELECT (setting_value = 'true') INTO v_auto_assign
    FROM public.company_settings
    WHERE company_id = NEW.company_id
      AND setting_key = 'auto_assign_custom_quote_leads';
  IF NOT COALESCE(v_auto_assign, FALSE) THEN RETURN NEW; END IF;

  -- Step 1: customer's primary linked service address
  SELECT sa.zip_code INTO v_zip
    FROM public.customer_service_addresses csa
    JOIN public.service_addresses sa ON sa.id = csa.service_address_id
    WHERE csa.customer_id = NEW.customer_id
      AND csa.is_primary_address = true
      AND sa.zip_code IS NOT NULL AND sa.zip_code != ''
    LIMIT 1;

  -- Step 2: any linked service address (most recent)
  IF v_zip IS NULL OR v_zip = '' THEN
    SELECT sa.zip_code INTO v_zip
      FROM public.customer_service_addresses csa
      JOIN public.service_addresses sa ON sa.id = csa.service_address_id
      WHERE csa.customer_id = NEW.customer_id
        AND sa.zip_code IS NOT NULL AND sa.zip_code != ''
      ORDER BY csa.created_at DESC
      LIMIT 1;
  END IF;

  -- Step 3: last resort — direct zip on customers record
  IF v_zip IS NULL OR v_zip = '' THEN
    SELECT zip_code INTO v_zip FROM public.customers WHERE id = NEW.customer_id;
  END IF;

  IF v_zip IS NULL OR v_zip = '' THEN RETURN NEW; END IF;

  SELECT assigned_user_id INTO v_assigned_user
    FROM public.zip_code_groups
    WHERE company_id = NEW.company_id
      AND zip_codes @> ARRAY[v_zip]
      AND assigned_user_id IS NOT NULL
    LIMIT 1;

  IF v_assigned_user IS NOT NULL THEN
    NEW.assigned_to := v_assigned_user;
    NEW.lead_status := CASE WHEN NEW.lead_status = 'new' OR NEW.lead_status IS NULL
                            THEN 'in_process'
                            ELSE NEW.lead_status END;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_assign_quote_lead() IS
  'Auto-assigns leads needing custom quotes to the rep covering the customer zip. Pinned search_path prevents 42P01 on customer_service_addresses / service_addresses lookups.';
