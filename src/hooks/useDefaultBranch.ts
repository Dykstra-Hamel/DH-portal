'use client';

import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/api-client';

// Returns the current (or supplied) user's default branch in a company:
// first user_branch_assignments row -> company primary -> null.
// Used as the visual default for branch filter dropdowns and the manual
// ticket-creation form.
//
// authenticatedFetch attaches the Supabase session's Bearer token —
// the underlying endpoint (`/api/users/[id]/default-branch`) requires
// it via verifyAuth.
//
// `loading` is derived from a comparison of the current (userId, companyId)
// inputs against the pair the cached `resolved` value was fetched for.
// Storing loading as plain state caused a stale-render race: when userId
// arrived asynchronously after companyId, the hook returned `loading=false,
// branchId=null` for one render before its effect fired — long enough for
// downstream apply-default logic to read the stale snapshot and lock in
// "no default" before the real fetch ever started.
export function useDefaultBranch(
  userId: string | null | undefined,
  companyId: string | null | undefined
): { branchId: string | null; loading: boolean } {
  const [resolved, setResolved] = useState<{
    key: string;
    branchId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!userId || !companyId) {
      setResolved({ key: '', branchId: null });
      return;
    }
    const key = `${userId}:${companyId}`;
    let cancelled = false;
    (async () => {
      try {
        const data = await authenticatedFetch(
          `/api/users/${userId}/default-branch?companyId=${companyId}`
        );
        if (!cancelled) setResolved({ key, branchId: data?.branchId ?? null });
      } catch {
        if (!cancelled) setResolved({ key, branchId: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, companyId]);

  const expectedKey = userId && companyId ? `${userId}:${companyId}` : '';
  const loading = expectedKey !== '' && resolved?.key !== expectedKey;
  const branchId = loading ? null : resolved?.branchId ?? null;

  return { branchId, loading };
}
