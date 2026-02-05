import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ProjectDepartment } from '@/types/project';
import styles from './DepartmentSettings.module.scss';

interface DepartmentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  department: ProjectDepartment | null;
  projectsUsingDepartment: Array<{ id: string; name: string; shortcode?: string }>;
  projectCount: number;
}

export default function DepartmentDeleteModal({
  isOpen,
  onClose,
  onDelete,
  department,
  projectsUsingDepartment,
  projectCount,
}: DepartmentDeleteModalProps) {
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
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen || !department) return null;

  const hasProjects = projectCount > 0;

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Delete Department</h2>
        </div>

        <div className={styles.modalBody}>
          {hasProjects ? (
            <>
              <div className={styles.deleteWarning}>
                <div className={styles.deleteWarningTitle}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Cannot Delete Department
                </div>
                <p className={styles.deleteWarningText}>
                  This department is currently assigned to {projectCount}{' '}
                  project{projectCount !== 1 ? 's' : ''}. You must reassign or remove the department
                  from all projects before deleting it.
                </p>
              </div>

              {projectsUsingDepartment.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    Projects using this department:
                  </p>
                  <ul className={styles.projectList}>
                    {projectsUsingDepartment.map((project) => (
                      <li key={project.id} className={styles.projectListItem}>
                        {project.shortcode ? `[${project.shortcode}] ` : ''}{project.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--gray-700)', margin: 0 }}>
              Are you sure you want to delete the department &quot;{department.name}&quot;? This action
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
            {hasProjects ? 'Close' : 'Cancel'}
          </button>
          {!hasProjects && (
            <button
              type="button"
              className={`${styles.button} ${styles.danger}`}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Department'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
