'use client';

import { useState, useEffect } from 'react';

export interface Branch {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_primary: boolean;
}

export function useBranches(companyId: string | null | undefined) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setBranches([]);
      return;
    }

    setLoading(true);
    fetch(`/api/branches?companyId=${companyId}`)
      .then(r => r.json())
      .then(d => setBranches((d.branches ?? []).filter((b: Branch) => b.is_active)))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  return { branches, loading };
}
