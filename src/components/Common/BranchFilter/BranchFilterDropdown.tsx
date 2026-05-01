'use client';

import { useEffect, useRef } from 'react';
import { useBranches } from '@/hooks/useBranches';
import { useDefaultBranch } from '@/hooks/useDefaultBranch';

interface BranchFilterDropdownProps {
  companyId: string | null | undefined;
  userId: string | null | undefined;
  value: string;
  onChange: (value: string) => void;
  // When true, sets the dropdown to the user's primary branch the first
  // time it loads (after the user's default branch resolves). Subsequent
  // user selections are preserved. Set false to default to "All branches".
  applyDefault?: boolean;
  label?: string;
}

// Shared branch filter dropdown for list pages. Loads active company
// branches via useBranches; defaults the value to the user's primary
// branch via useDefaultBranch when `applyDefault` is true. Empty string
// = "All branches".
//
// Hidden entirely when the company has no branches (preserves the
// no-branches invariant — list pages look the same as today).
export function BranchFilterDropdown({
  companyId,
  userId,
  value,
  onChange,
  applyDefault = true,
  label = 'Branch:',
}: BranchFilterDropdownProps) {
  const { branches } = useBranches(companyId ?? '');
  const { branchId: defaultBranch, loading: defaultLoading } = useDefaultBranch(
    userId,
    companyId
  );
  // Track which company we've already applied the default for so a
  // company switch re-applies the new company's default. After the
  // first apply for a given company, subsequent user selections (incl.
  // "All Branches") are preserved.
  const appliedForCompanyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!applyDefault) return;
    // Wait for BOTH ids to be present. userId resolves async (useUser
    // hook) and arrives after the first render with companyId. If we
    // proceed before userId arrives we'd mark "applied" without ever
    // having tried to fetch a default.
    if (!companyId || !userId) return;
    if (defaultLoading) return;
    if (appliedForCompanyRef.current === companyId) return;

    if (defaultBranch && !value) {
      onChange(defaultBranch);
    }
    appliedForCompanyRef.current = companyId;
  }, [
    applyDefault,
    companyId,
    userId,
    defaultBranch,
    defaultLoading,
    value,
    onChange,
  ]);

  if (!companyId || branches.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontSize: 13,
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          background: '#fff',
        }}
      >
        <option value="">All Branches</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>
            {b.name}
            {b.is_primary ? ' (Primary)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
