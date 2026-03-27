'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import styles from './BranchSelector.module.scss';

interface Branch {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_primary: boolean;
}

interface BranchSelectorProps {
  userId: string;
  companyId: string;
  disabled?: boolean;
}

export interface BranchSelectorHandle {
  save: () => Promise<boolean>;
}

const BranchSelector = forwardRef<BranchSelectorHandle, BranchSelectorProps>(
  function BranchSelector({ userId, companyId, disabled = false }, ref) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!companyId || !userId) return;
      loadData();
    }, [userId, companyId]);

    const loadData = async () => {
      setLoading(true);
      try {
        const [branchRes, assignRes] = await Promise.all([
          fetch(`/api/branches?companyId=${companyId}`),
          fetch(`/api/users/${userId}/branches?companyId=${companyId}`, {
            headers: await getAuthHeader(),
          }),
        ]);
        const branchData = await branchRes.json();
        const assignData = await assignRes.json();
        setBranches((branchData.branches ?? []).filter((b: Branch) => b.is_active));
        setSelectedIds((assignData.assignments ?? []).map((a: { branch_id: string }) => a.branch_id));
      } catch {
        setError('Failed to load branch data');
      } finally {
        setLoading(false);
      }
    };

    const getAuthHeader = async (): Promise<Record<string, string>> => {
      const token = await import('@/lib/supabase/client')
        .then(m => m.createClient())
        .then(async c => {
          const { data } = await c.auth.getSession();
          return data.session?.access_token;
        });
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const handleToggle = (branchId: string) => {
      setSelectedIds(prev =>
        prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
      );
    };

    const handleSave = useCallback(async (): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const headers = await getAuthHeader();
        const res = await fetch(`/api/users/${userId}/branches`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ companyId, branchIds: selectedIds }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'Failed to save branch assignments');
          return false;
        }
        return true;
      } catch {
        setError('Failed to save branch assignments');
        return false;
      } finally {
        setSaving(false);
      }
    }, [userId, companyId, selectedIds]);

    useImperativeHandle(ref, () => ({
      save: handleSave,
    }), [handleSave]);

    if (loading) return <div className={styles.loading}>Loading branches...</div>;

    return (
      <div className={styles.container}>
        <p className={styles.hint}>
          Select branches this user is restricted to. Leave all unchecked for access to all branches.
        </p>
        {error && <div className={styles.error}>{error}</div>}
        {branches.length === 0 ? (
          <div className={styles.empty}>No branches configured for this company.</div>
        ) : (
          <>
            <div className={styles.list}>
              {branches.map(branch => (
                <label key={branch.id} className={`${styles.option} ${selectedIds.includes(branch.id) ? styles.selected : ''} ${disabled || saving ? styles.disabled : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(branch.id)}
                    onChange={() => handleToggle(branch.id)}
                    disabled={disabled || saving}
                    className={styles.checkbox}
                  />
                  <div className={styles.info}>
                    <span className={styles.name}>{branch.name}</span>
                    {branch.is_primary && <span className={styles.primaryBadge}>Primary</span>}
                    {branch.description && <span className={styles.description}>{branch.description}</span>}
                  </div>
                </label>
              ))}
            </div>
            <div className={styles.summary}>
              {selectedIds.length === 0
                ? <span className={styles.allAccess}>All branches (unrestricted)</span>
                : <span>{selectedIds.length} branch{selectedIds.length !== 1 ? 'es' : ''} selected</span>
              }
            </div>
          </>
        )}
      </div>
    );
  }
);

export default BranchSelector;
