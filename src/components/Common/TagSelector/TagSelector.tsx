import React from 'react';
import styles from './TagSelector.module.scss';

interface TagSelectorProps {
  availableTags: readonly string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
}

export function TagSelector({ availableTags, selectedTags, onChange, label }: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className={styles.tagSelectorContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.tagsGrid}>
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`${styles.tagButton} ${isSelected ? styles.selected : ''}`}
              onClick={() => toggleTag(tag)}
            >
              <span className={styles.tagText}>{tag}</span>
              {isSelected && (
                <svg
                  className={styles.checkIcon}
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {selectedTags.length > 0 && (
        <div className={styles.selectedCount}>
          {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
