'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './StatusChangeConfirmModal.module.scss';

interface StatusChangeConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function StatusChangeConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: StatusChangeConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onCancel();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={24} className={styles.icon} />
        </div>

        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalDescription}>{message}</p>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
