/**
 * Dynamic List Editor Component
 *
 * Reusable component for managing dynamic lists:
 * - Simple strings (bullets, tags)
 * - Objects with multiple fields (FAQs, services, links)
 */

'use client';

import { useState } from 'react';
import styles from './DynamicListEditor.module.scss';

export type FieldConfig = {
  name: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
  required?: boolean;
};

interface DynamicListEditorProps {
  label: string;
  items: any[];
  onChange: (items: any[]) => void;
  fields: FieldConfig[];
  addButtonText?: string;
  helpText?: string;
  emptyText?: string;
}

export default function DynamicListEditor({
  label,
  items,
  onChange,
  fields,
  addButtonText = 'Add Item',
  helpText,
  emptyText = 'No items added yet.',
}: DynamicListEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    // Create new item with empty values for each field
    const newItem: any = {};
    fields.forEach((field) => {
      newItem[field.name] = '';
    });

    onChange([...items, newItem]);
    setExpandedIndex(items.length);
  };

  const handleUpdate = (index: number, fieldName: string, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [fieldName]: value,
    };
    onChange(updatedItems);
  };

  const handleDelete = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedItems = [...items];
    [updatedItems[index - 1], updatedItems[index]] = [
      updatedItems[index],
      updatedItems[index - 1],
    ];
    onChange(updatedItems);
    if (expandedIndex === index) {
      setExpandedIndex(index - 1);
    } else if (expandedIndex === index - 1) {
      setExpandedIndex(index);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const updatedItems = [...items];
    [updatedItems[index], updatedItems[index + 1]] = [
      updatedItems[index + 1],
      updatedItems[index],
    ];
    onChange(updatedItems);
    if (expandedIndex === index) {
      setExpandedIndex(index + 1);
    } else if (expandedIndex === index + 1) {
      setExpandedIndex(index);
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getItemPreview = (item: any) => {
    // Get the first field value as preview
    const firstField = fields[0];
    const value = item[firstField.name];
    return value || '(Empty)';
  };

  return (
    <div className={styles.editor}>
      <label className={styles.label}>{label}</label>
      {helpText && <p className={styles.helpText}>{helpText}</p>}

      {items.length === 0 ? (
        <p className={styles.emptyText}>{emptyText}</p>
      ) : (
        <div className={styles.list}>
          {items.map((item, index) => (
            <div key={index} className={styles.item}>
              <div className={styles.itemHeader} onClick={() => toggleExpanded(index)}>
                <div className={styles.itemPreview}>
                  <span className={styles.itemNumber}>{index + 1}.</span>
                  <span className={styles.itemText}>{getItemPreview(item)}</span>
                </div>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(index);
                    }}
                    className={styles.moveButton}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 15L12 9L6 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(index);
                    }}
                    className={styles.moveButton}
                    disabled={index === items.length - 1}
                    aria-label="Move down"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    className={styles.deleteButton}
                    aria-label="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.expandButton}
                    aria-label={expandedIndex === index ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {expandedIndex === index && (
                <div className={styles.itemFields}>
                  {fields.map((field) => (
                    <div key={field.name} className={styles.field}>
                      <label className={styles.fieldLabel}>
                        {field.label}
                        {field.required && <span className={styles.required}>*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={item[field.name] || ''}
                          onChange={(e) => handleUpdate(index, field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className={styles.textarea}
                          rows={4}
                        />
                      ) : (
                        <input
                          type="text"
                          value={item[field.name] || ''}
                          onChange={(e) => handleUpdate(index, field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className={styles.input}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={handleAdd} className={styles.addButton}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {addButtonText}
      </button>
    </div>
  );
}
