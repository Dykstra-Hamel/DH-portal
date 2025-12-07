import React, { useState } from 'react';
import styles from './CommentInput.module.scss';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  parentCommentId?: string;
  isReply?: boolean;
  autoFocus?: boolean;
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = 'Add a comment...',
  isReply = false,
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel?.();
  };

  return (
    <form className={`${styles.commentInputForm} ${isReply ? styles.reply : ''}`} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={isReply ? 2 : 3}
      />
      <div className={styles.actions}>
        <div className={styles.characterCount}>
          {content.length > 0 && `${content.length} characters`}
        </div>
        <div className={styles.buttons}>
          {(onCancel || content.length > 0) && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  );
}
