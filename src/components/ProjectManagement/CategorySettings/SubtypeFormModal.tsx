'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { ProjectTypeSubtype, AttributeField } from '@/types/project';
import styles from './CategorySettings.module.scss';

interface SubtypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subtypeData: Partial<ProjectTypeSubtype>) => Promise<void>;
  subtype: ProjectTypeSubtype | null;
  mode: 'create' | 'edit';
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'textarea', label: 'Long Text' },
];

export default function SubtypeFormModal({
  isOpen,
  onClose,
  onSave,
  subtype,
  mode,
}: SubtypeFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasCustomAttributes, setHasCustomAttributes] = useState(false);
  const [attributeSchema, setAttributeSchema] = useState<AttributeField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && subtype) {
        setName(subtype.name);
        setDescription(subtype.description || '');
        setHasCustomAttributes(subtype.has_custom_attributes || false);
        setAttributeSchema(subtype.custom_attribute_schema || []);
      } else {
        setName('');
        setDescription('');
        setHasCustomAttributes(false);
        setAttributeSchema([]);
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
      const normalizedAttributeSchema = hasCustomAttributes
        ? attributeSchema.map((field) => {
            if (field.type !== 'select') {
              return field;
            }

            return {
              ...field,
              options: (field.options || []).map((option) => option.trim()).filter(Boolean),
            };
          })
        : [];

      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        has_custom_attributes: hasCustomAttributes,
        custom_attribute_schema: normalizedAttributeSchema,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subtype');
    } finally {
      setIsSaving(false);
    }
  };

  const addField = () => {
    const newField: AttributeField = {
      id: crypto.randomUUID(),
      label: '',
      type: 'text',
    };
    setAttributeSchema([...attributeSchema, newField]);
  };

  const removeField = (index: number) => {
    setAttributeSchema(attributeSchema.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newSchema = [...attributeSchema];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSchema.length) return;
    [newSchema[index], newSchema[targetIndex]] = [newSchema[targetIndex], newSchema[index]];
    setAttributeSchema(newSchema);
  };

  const updateField = (index: number, updates: Partial<AttributeField>) => {
    const newSchema = [...attributeSchema];
    newSchema[index] = { ...newSchema[index], ...updates };
    setAttributeSchema(newSchema);
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

            <div className={styles.attributeToggleRow}>
              <label className={styles.attributeToggleLabel}>
                <input
                  type="checkbox"
                  checked={hasCustomAttributes}
                  onChange={(e) => setHasCustomAttributes(e.target.checked)}
                />
                <span>Enable custom attribute fields for this subtype</span>
              </label>
            </div>

            {hasCustomAttributes && (
              <div className={styles.attributeFieldList}>
                <div className={styles.attributeFieldListHeader}>
                  <span className={styles.label}>Custom Fields</span>
                </div>

                {attributeSchema.map((field, index) => (
                  <div key={field.id} className={styles.attributeFieldRow}>
                    <div className={styles.attributeFieldMain}>
                      <input
                        type="text"
                        className={styles.input}
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Field label"
                      />
                      <select
                        className={styles.attributeTypeSelect}
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as AttributeField['type'], options: undefined })}
                      >
                        {FIELD_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {field.type === 'select' && (
                      <input
                        type="text"
                        className={styles.attributeOptionsInput}
                        value={field.options?.join(', ') || ''}
                        onChange={(e) =>
                          updateField(index, {
                            options: e.target.value
                              .split(',')
                              .map((option, optionIndex) =>
                                optionIndex === 0 ? option : option.replace(/^\s+/, '')
                              ),
                          })
                        }
                        placeholder="Options (comma-separated)"
                      />
                    )}

                    <div className={styles.attributeFieldActions}>
                      <button
                        type="button"
                        className={`${styles.attributeColumnButton} ${(field.columns ?? 2) === 1 ? styles.attributeColumnButtonActive : ''}`}
                        onClick={() => updateField(index, { columns: (field.columns ?? 2) === 1 ? 2 : 1 })}
                        title={(field.columns ?? 2) === 1 ? 'Half width — click for full' : 'Full width — click for half'}
                      >
                        {(field.columns ?? 2) === 1 ? '½' : '■'}
                      </button>
                      <button
                        type="button"
                        className={styles.attributeOrderButton}
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.attributeOrderButton}
                        onClick={() => moveField(index, 'down')}
                        disabled={index === attributeSchema.length - 1}
                        title="Move down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.attributeRemoveButton}
                        onClick={() => removeField(index)}
                        title="Remove field"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addFieldButton}
                  onClick={addField}
                >
                  <Plus size={14} />
                  Add Field
                </button>
              </div>
            )}
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
