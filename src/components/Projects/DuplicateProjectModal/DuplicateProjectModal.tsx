'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import styles from './DuplicateProjectModal.module.scss';

interface Company {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (name: string, companyId: string, dueDate: string) => Promise<void>;
  defaultName: string;
  defaultCompanyId: string;
}

export default function DuplicateProjectModal({
  isOpen,
  onClose,
  onDuplicate,
  defaultName,
  defaultCompanyId,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultCompanyId);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setSelectedCompanyId(defaultCompanyId);
      setDueDate('');
      setError(null);
    }
  }, [isOpen, defaultName, defaultCompanyId]);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/admin/companies', {
          headers: {
            ...(session?.access_token && {
              Authorization: `Bearer ${session.access_token}`,
            }),
          },
        });
        if (!res.ok) throw new Error('Failed to fetch companies');
        const data = await res.json();
        setCompanies(data);
      } catch {
        setError('Failed to load companies');
      }
    };

    fetchCompanies();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!selectedCompanyId) {
      setError('Please select a company');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onDuplicate(name.trim(), selectedCompanyId, dueDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate project');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <ModalTop title="Duplicate Project" onClose={onClose} />
      <ModalMiddle>
        <div className={styles.field}>
          <label htmlFor="duplicate-project-name">Project Name</label>
          <input
            id="duplicate-project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="duplicate-company-select">Company</label>
          <select
            id="duplicate-company-select"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className={styles.select}
            disabled={loading}
          >
            <option value="">-- Select a company --</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="duplicate-due-date">Due Date</label>
          <input
            id="duplicate-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </ModalMiddle>
      <ModalBottom>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.duplicateButton}
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !selectedCompanyId || !dueDate}
        >
          {loading ? 'Duplicating...' : 'Duplicate'}
        </button>
      </ModalBottom>
    </Modal>
  );
}
