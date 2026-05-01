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
export function useDefaultBranch(
  userId: string | null | undefined,
  companyId: string | null | undefined
): { branchId: string | null; loading: boolean } {
  const [branchId, setBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !companyId) {
      setBranchId(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // authenticatedFetch returns the parsed JSON body directly (not
        // a Response). It throws if the request fails, which we catch.
        const data = await authenticatedFetch(
          `/api/users/${userId}/default-branch?companyId=${companyId}`
        );
        if (!cancelled) setBranchId(data?.branchId ?? null);
      } catch {
        if (!cancelled) setBranchId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, companyId]);

  return { branchId, loading };
}
