/**
 * AI Modal Component
 *
 * Modal for AI-powered text editing in the RichTextEditor
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './AIModal.module.scss';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: string) => void;
  selectedText: string;
  mode: 'edit' | 'insert';
  documentContext?: string;
  companyId?: string;
}

export default function AIModal({ isOpen, onClose, onApply, selectedText, mode, documentContext, companyId }: AIModalProps) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setResult('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const body = mode === 'edit'
        ? { selectedText, prompt: prompt.trim(), mode, companyId }
        : { prompt: prompt.trim(), mode, documentContext, companyId };

      const response = await fetch('/api/ai/edit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate result. Please try again.');
        return;
      }

      setResult(data.result);
    } catch {
      setError('Failed to connect to AI service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setResult('');
    handleGenerate();
  };

  const handleApply = () => {
    onApply(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{mode === 'edit' ? 'Edit with AI' : 'Add Content with AI'}</h3>
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
          {mode === 'edit' && (
            <div className={styles.section}>
              <label className={styles.label}>Selected text</label>
              <div className={styles.selectedTextPreview}>{selectedText}</div>
            </div>
          )}

          <div className={styles.section}>
            <label className={styles.label} htmlFor="ai-prompt">
              Instruction
            </label>
            <textarea
              id="ai-prompt"
              className={styles.promptTextarea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'edit'
                  ? 'e.g. Rewrite in a more casual tone...'
                  : 'e.g. Add a paragraph about seasonal pest activity...'
              }
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (!result) handleGenerate();
                }
              }}
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {isLoading && (
            <div className={styles.loadingWrapper}>
              <div className={styles.loadingSpinner} />
              <span>Generating...</span>
            </div>
          )}

          {result && !isLoading && (
            <div className={styles.section}>
              <label className={styles.label}>Result preview</label>
              <div
                className={styles.resultPreview}
                dangerouslySetInnerHTML={{ __html: result }}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {result && !isLoading && (
              <button
                type="button"
                className={styles.regenerateButton}
                onClick={handleRegenerate}
              >
                Regenerate
              </button>
            )}
          </div>
          <div className={styles.footerRight}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            {!result ? (
              <button
                type="button"
                className={styles.generateButton}
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
              >
                Generate
              </button>
            ) : (
              <button
                type="button"
                className={styles.applyButton}
                onClick={handleApply}
                disabled={isLoading}
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
