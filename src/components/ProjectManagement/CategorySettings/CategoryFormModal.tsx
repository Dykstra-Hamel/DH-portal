import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ProjectCategory } from '@/types/project';
import CategoryBadge from './CategoryBadge';
import styles from './CategorySettings.module.scss';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<ProjectCategory>) => Promise<void>;
  category?: ProjectCategory | null; // If editing, pass existing category
  mode: 'create' | 'edit';
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  category,
  mode,
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setColor(category.color || '#3b82f6');
      setIcon(category.icon || '');
    } else {
      // Reset form when creating new
      setName('');
      setDescription('');
      setColor('#3b82f6');
      setIcon('');
    }
    setError('');
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        ...(category?.id ? { id: category.id } : {}),
        name: name.trim(),
        description: description.trim() || null,
        color: color || null,
        icon: icon.trim() || null,
      });

      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
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

  // Preview category for badge
  const previewCategory: ProjectCategory = {
    id: 'preview',
    name: name || 'Preview',
    description,
    color,
    icon,
    sort_order: 0,
    is_system_default: false,
    company_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'create' ? 'Create New Category' : 'Edit Category'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Design, Development, Marketing"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.formLabel}>
                Description
              </label>
              <textarea
                id="description"
                className={styles.formTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for this category"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="color" className={styles.formLabel}>
                Color
              </label>
              <div className={styles.colorPicker}>
                <input
                  type="color"
                  id="color"
                  className={styles.colorInput}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className={styles.colorPreview}>
                  <CategoryBadge category={previewCategory} />
                  <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                    Preview
                  </span>
                </div>
              </div>
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
                placeholder="e.g., 🎨, 💻, 📝"
                disabled={isSubmitting}
              />
            </div>

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
                ? 'Create Category'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
