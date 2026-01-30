'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ProjectTypeSubtype } from '@/types/project';
import styles from './CategorySettings.module.scss';

interface SubtypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subtypeData: Partial<ProjectTypeSubtype>) => Promise<void>;
  subtype: ProjectTypeSubtype | null;
  mode: 'create' | 'edit';
}

export default function SubtypeFormModal({
  isOpen,
  onClose,
  onSave,
  subtype,
  mode,
}: SubtypeFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && subtype) {
        setName(subtype.name);
        setDescription(subtype.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, mode, subtype]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subtype');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'create' ? 'Create Subtype' : 'Edit Subtype'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="subtype-name">
                Name *
              </label>
              <input
                id="subtype-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter subtype name"
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="subtype-description">
                Description
              </label>
              <textarea
                id="subtype-description"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
