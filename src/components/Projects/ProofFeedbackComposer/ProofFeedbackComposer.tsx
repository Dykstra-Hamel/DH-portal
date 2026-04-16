'use client';

import React, { useState, useRef, useEffect } from 'react';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import styles from './ProofFeedbackComposer.module.scss';

const isRichTextEmpty = (html: string) => {
  const textContent = html.replace(/<[^>]*>/g, '').trim();
  return textContent.length === 0;
};

interface ProofFeedbackComposerProps {
  mentionUsers?: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
    uploaded_avatar_url?: string | null;
  }>;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

export default function ProofFeedbackComposer({
  mentionUsers,
  onSubmit,
  onCancel,
}: ProofFeedbackComposerProps) {
  const [comment, setComment] = useState('');
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editable = composerRef.current?.querySelector<HTMLElement>('[contenteditable="true"]');
    editable?.focus();
  }, []);

  const submitComment = () => {
    if (isRichTextEmpty(comment)) return;
    onSubmit(comment);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitComment();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitComment();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      ref={composerRef}
      className={styles.composer}
      onClick={(e) => e.stopPropagation()}
      onKeyDownCapture={handleKeyDown}
    >
      <form onSubmit={handleSubmit}>
        <RichTextEditor
          value={comment}
          onChange={setComment}
          placeholder="Add feedback... Use @ to mention someone"
          className={styles.editor}
          compact
          mentionUsers={mentionUsers}
        />
        <p className={styles.hint}>Cmd/Ctrl+Enter to submit</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton} disabled={isRichTextEmpty(comment)}>
            Add Pin
          </button>
        </div>
      </form>
    </div>
  );
}
