'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import styles from './BranchesManager.module.scss';

interface Branch {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
}

interface BranchesManagerProps {
  companyId: string;
}

export default function BranchesManager({ companyId }: BranchesManagerProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchBranches = async () => {
    try {
      const res = await fetch(`/api/branches?companyId=${companyId}`);
      const data = await res.json();
      if (data.branches) setBranches(data.branches);
    } catch {
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [companyId]);

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setShowForm(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setFormName(branch.name);
    setFormDescription(branch.description ?? '');
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormDescription('');
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = (await import('@/lib/supabase/client')
        .then(m => m.createClient())
        .then(async c => {
          const { data } = await c.auth.getSession();
          return data.session?.access_token;
        }));

      if (editingId) {
        const res = await fetch(`/api/branches/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: formName, description: formDescription || null }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'Failed to update branch');
          return;
        }
      } else {
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ companyId, name: formName, description: formDescription || null }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'Failed to create branch');
          return;
        }
      }
      cancelForm();
      fetchBranches();
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (branchId: string) => {
    setSaving(true);
    try {
      const token = await import('@/lib/supabase/client')
        .then(m => m.createClient())
        .then(async c => {
          const { data } = await c.auth.getSession();
          return data.session?.access_token;
        });
      await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_primary: true }),
      });
      fetchBranches();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    setSaving(true);
    try {
      const token = await import('@/lib/supabase/client')
        .then(m => m.createClient())
        .then(async c => {
          const { data } = await c.auth.getSession();
          return data.session?.access_token;
        });
      await fetch(`/api/branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !branch.is_active }),
      });
      fetchBranches();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Are you sure? This will deactivate the branch and remove it from any assigned users.')) return;
    setSaving(true);
    try {
      const token = await import('@/lib/supabase/client')
        .then(m => m.createClient())
        .then(async c => {
          const { data } = await c.auth.getSession();
          return data.session?.access_token;
        });
      await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBranches();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading branches...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Branches</h2>
          <p className={styles.subtitle}>
            Branches are optional sub-units within your company (e.g., geographic offices or regions).
            Service areas, leads, and tickets can be assigned to a branch.
          </p>
        </div>
        <button className={styles.addButton} onClick={openCreate} disabled={saving}>
          <Plus size={16} />
          Add Branch
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editingId ? 'Edit Branch' : 'New Branch'}</h3>
          <div className={styles.formGroup}>
            <label className={styles.label}>Branch Name *</label>
            <input
              type="text"
              className={styles.input}
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g., North Office, Southwest Region"
              autoFocus
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Description (optional)</label>
            <textarea
              className={styles.textarea}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Brief description of this branch..."
              rows={2}
            />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelButton} onClick={cancelForm} disabled={saving}>
              Cancel
            </button>
            <button className={styles.saveButton} onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Branch'}
            </button>
          </div>
        </div>
      )}

      {branches.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <p>No branches yet. Add your first branch to get started.</p>
        </div>
      ) : (
        <div className={styles.branchList}>
          {branches.map(branch => (
            <div
              key={branch.id}
              className={`${styles.branchRow} ${!branch.is_active ? styles.inactive : ''}`}
            >
              <div className={styles.branchInfo}>
                <div className={styles.branchNameRow}>
                  <span className={styles.branchName}>{branch.name}</span>
                  {branch.is_primary && (
                    <span className={styles.primaryBadge}>
                      <Star size={11} />
                      Primary
                    </span>
                  )}
                  {!branch.is_active && (
                    <span className={styles.inactiveBadge}>Inactive</span>
                  )}
                </div>
                {branch.description && (
                  <span className={styles.branchDescription}>{branch.description}</span>
                )}
              </div>
              <div className={styles.branchActions}>
                {!branch.is_primary && branch.is_active && (
                  <button
                    className={styles.primaryButton}
                    onClick={() => handleSetPrimary(branch.id)}
                    disabled={saving}
                    title="Set as primary branch"
                  >
                    <Star size={14} />
                    Set Primary
                  </button>
                )}
                <button
                  className={styles.activeToggle}
                  onClick={() => handleToggleActive(branch)}
                  disabled={saving}
                >
                  {branch.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className={styles.editButton}
                  onClick={() => openEdit(branch)}
                  disabled={saving}
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(branch.id)}
                  disabled={saving}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
