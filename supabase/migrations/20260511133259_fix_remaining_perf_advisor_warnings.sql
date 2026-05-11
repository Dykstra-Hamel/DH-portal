-- Clear the last two performance advisor warnings.
--
-- These were missed by the earlier RLS-perf migrations:
--   1) realtime.messages.company_scoped_broadcast_access has a bare auth.uid()
--      in its USING expression. Phase 2 (20260508134633_wrap_rls_auth_fns_in_select)
--      only iterated the `public` schema, so this policy in the `realtime`
--      schema was skipped.
--   2) public.quotes."Users can view quotes for their company" was created
--      with no TO clause, which means it applies to every role (including
--      anon). Phase 3 (20260508135054_consolidate_overlapping_rls_policies)
--      scoped "Public can view quotes with valid URL" to TO anon but didn't
--      tighten the user-quotes policy, so both end up on anon for SELECT and
--      trip multiple_permissive_policies.

-- ----- 1) Wrap auth.uid() in realtime.messages policy -----
-- Recreate the policy body with the SELECT-wrapped auth.uid() call. The
-- expression is otherwise identical to the original from
-- 20250929173000_fix_company_scoped_broadcast_rls.sql.
ALTER POLICY "company_scoped_broadcast_access" ON realtime.messages
  USING (
    extension = 'broadcast'
    AND EXISTS (
      SELECT 1
      FROM public.user_companies uc
      WHERE uc.user_id = (SELECT auth.uid())
        AND uc.company_id::text = split_part(split_part(realtime.topic(), ':', 2), ':', 1)
    )
  );

-- ----- 2) Scope the quotes user-view policy to authenticated only -----
-- This makes "Users can view quotes for their company" apply to authenticated
-- users only. The anon role then only evaluates "Public can view quotes with
-- valid URL" (which is scoped TO anon), eliminating the overlap.
ALTER POLICY "Users can view quotes for their company" ON public.quotes
  TO authenticated;

-- ----- Verification -----
DO $$
DECLARE
  bare_auth_in_realtime int;
  anon_overlap_on_quotes int;
BEGIN
  -- Sanity: the realtime policy no longer references a bare auth.uid().
  SELECT COUNT(*) INTO bare_auth_in_realtime
  FROM pg_policies
  WHERE schemaname = 'realtime'
    AND tablename = 'messages'
    AND policyname = 'company_scoped_broadcast_access'
    AND qual ~ '(?<!\(SELECT )auth\.uid\s*\(\s*\)';
  RAISE NOTICE 'realtime.messages bare auth.uid() count: %', bare_auth_in_realtime;

  -- Sanity: no remaining anon-role SELECT overlap on public.quotes.
  SELECT COUNT(*) INTO anon_overlap_on_quotes
  FROM (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quotes'
      AND permissive = 'PERMISSIVE'
      AND cmd = 'SELECT'
      AND 'anon' = ANY(roles)
  ) anon_select_policies
  HAVING COUNT(*) > 1;
  RAISE NOTICE 'public.quotes anon-SELECT overlapping policies: %',
               COALESCE(anon_overlap_on_quotes, 0);
END$$;
