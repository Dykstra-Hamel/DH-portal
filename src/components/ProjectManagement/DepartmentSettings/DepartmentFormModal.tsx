import React, { useState, useEffect } from 'react';
import { ProjectDepartment } from '@/types/project';
import styles from './DepartmentSettings.module.scss';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (department: Partial<ProjectDepartment>) => Promise<void>;
  department?: ProjectDepartment | null; // If editing, pass existing department
  mode: 'create' | 'edit';
}

export default function DepartmentFormModal({
  isOpen,
  onClose,
  onSave,
  department,
  mode,
}: DepartmentFormModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (department) {
      setName(department.name || '');
      setIcon(department.icon || '');
    } else {
      // Reset form when creating new
      setName('');
      setIcon('');
    }
    setError('');
  }, [department, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Department name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        ...(department?.id ? { id: department.id } : {}),
        name: name.trim(),
        icon: icon.trim() || null,
      });

      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'create' ? 'Create New Department' : 'Edit Department'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>
                Department Name *
              </label>
              <input
                type="text"
                id="name"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Software, Design, Content"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="icon" className={styles.formLabel}>
                Icon (Optional)
              </label>
              <input
                type="text"
                id="icon"
                className={styles.formInput}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g., 💻 🎨 📝"
                disabled={isSubmitting}
              />
              <small className={styles.formHint}>
                Add an emoji or icon to help visually identify this department
              </small>
            </div>

            {(name || icon) && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Preview</label>
                <div className={styles.preview}>
                  {icon && <span className={styles.previewIcon}>{icon}</span>}
                  <span className={styles.previewName}>{name || 'Department Name'}</span>
                </div>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.primary}`}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                ? 'Create Department'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
