import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ProjectCategory } from '@/types/project';
import styles from './CategorySettings.module.scss';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  category: ProjectCategory | null;
  projectsUsingCategory: Array<{ id: string; name: string }>;
  isInternal: boolean; // true for admin, false for company
}

export default function CategoryDeleteModal({
  isOpen,
  onClose,
  onDelete,
  category,
  projectsUsingCategory,
  isInternal,
}: CategoryDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, [isOpen]);

  const handleDelete = async () => {
    setError('');
    setIsDeleting(true);

    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen || !category) return null;

  const hasProjects = projectsUsingCategory.length > 0;

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Delete Category</h2>
        </div>

        <div className={styles.modalBody}>
          {hasProjects ? (
            <>
              <div className={styles.deleteWarning}>
                <div className={styles.deleteWarningTitle}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Category In Use
                </div>
                <p className={styles.deleteWarningText}>
                  This category is currently assigned to {projectsUsingCategory.length}{' '}
                  project{projectsUsingCategory.length !== 1 ? 's' : ''}. If you delete this category,
                  the projects will remain but will no longer have this category assigned.
                </p>
              </div>

              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Projects using this category:
                </p>
                <ul className={styles.projectList}>
                  {projectsUsingCategory.map((project) => (
                    <li key={project.id} className={styles.projectListItem}>
                      {project.name}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--gray-700)', margin: '16px 0 0 0' }}>
                Are you sure you want to delete the category &quot;{category.name}&quot;? This action
                cannot be undone.
              </p>
            </>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--gray-700)', margin: 0 }}>
              Are you sure you want to delete the category &quot;{category.name}&quot;? This action
              cannot be undone.
            </p>
          )}

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.danger}`}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Category'}
          </button>
        </div>
      </div>
    </div>
  );
}
