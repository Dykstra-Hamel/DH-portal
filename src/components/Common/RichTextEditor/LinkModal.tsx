/**
 * Link Modal Component
 *
 * Modal for adding/editing links in the RichTextEditor
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './LinkModal.module.scss';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, openInNewTab: boolean) => void;
  initialUrl?: string;
  initialOpenInNewTab?: boolean;
}

export default function LinkModal({
  isOpen,
  onClose,
  onSave,
  initialUrl = '',
  initialOpenInNewTab = true,
}: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [openInNewTab, setOpenInNewTab] = useState(initialOpenInNewTab);

  useEffect(() => {
    setUrl(initialUrl);
    setOpenInNewTab(initialOpenInNewTab);
  }, [initialUrl, initialOpenInNewTab]);

  const handleSave = () => {
    if (url.trim()) {
      onSave(url.trim(), openInNewTab);
    }
    onClose();
  };

  const handleRemove = () => {
    onSave('', false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Add Link</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label htmlFor="link-url">URL</label>
            <input
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>

          <div className={styles.checkbox}>
            <input
              id="open-new-tab"
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
            />
            <label htmlFor="open-new-tab">Open in new tab</label>
          </div>
        </div>

        <div className={styles.footer}>
          {initialUrl && (
            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemove}
            >
              Remove Link
            </button>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
              disabled={!url.trim()}
            >
              {initialUrl ? 'Update' : 'Add Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
