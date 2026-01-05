'use client';

import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import styles from './RecoverLeadModal.module.scss';

interface RecoverLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: string, notes?: string) => void;
  customerName?: string;
  isSubmitting?: boolean;
}

export function RecoverLeadModal({
  isOpen,
  onClose,
  onConfirm,
  customerName = 'this lead',
  isSubmitting = false,
}: RecoverLeadModalProps) {
  const [selectedStatus, setSelectedStatus] = useState('in_process');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedStatus, notes || undefined);
    setSelectedStatus('in_process');
    setNotes('');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in_process', label: 'In Process' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'scheduling', label: 'Scheduling' },
  ];

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.iconWrapper}>
          <RefreshCcw size={24} className={styles.icon} />
        </div>

        <h2 className={styles.modalTitle}>Recover Lead</h2>
        <p className={styles.modalDescription}>
          This will restore {customerName} to an active lead. Select the status you&apos;d like to restore this lead to.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="newStatus" className={styles.label}>
            Restore to Status
          </label>
          <select
            id="newStatus"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.select}
            disabled={isSubmitting}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="recoveryNotes" className={styles.label}>
            Notes (Optional)
          </label>
          <textarea
            id="recoveryNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={styles.textarea}
            placeholder="Why is this lead being recovered?"
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recovering...' : 'Recover Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
