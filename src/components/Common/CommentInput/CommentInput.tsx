import React, { useState, useRef, useCallback } from 'react';
import styles from './CommentInput.module.scss';

// Allowed attachment types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface CommentInputProps {
  onSubmit: (content: string, attachments?: File[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  parentCommentId?: string;
  isReply?: boolean;
  autoFocus?: boolean;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word')) return 'word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
  return 'file';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type not allowed: ${file.name}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (max 10MB): ${file.name}`;
    }
    return null;
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    setAttachmentError(null);
    const newFiles: File[] = [];

    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        setAttachmentError(error);
        return;
      }
      // Check for duplicates
      const isDuplicate = pendingAttachments.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (!isDuplicate) {
        newFiles.push(file);
      }
    }

    setPendingAttachments((prev) => [...prev, ...newFiles]);
  }, [pendingAttachments, validateFile]);

  const removeAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  }, [addFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && pendingAttachments.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), pendingAttachments.length > 0 ? pendingAttachments : undefined);
      setContent('');
      setPendingAttachments([]);
      setAttachmentError(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setPendingAttachments([]);
    setAttachmentError(null);
    onCancel?.();
  };

  return (
    <form className={`${styles.commentInputForm} ${isReply ? styles.reply : ''}`} onSubmit={handleSubmit}>
      <div
        className={`${styles.textareaContainer} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={isReply ? 2 : 3}
        />
        {isDragOver && (
          <div className={styles.dropOverlay}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 16V8M12 8L8 12M12 8L16 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>Drop files here</span>
          </div>
        )}
      </div>

      {pendingAttachments.length > 0 && (
        <div className={styles.attachmentPreviews}>
          {pendingAttachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className={styles.attachmentPreview}>
              <div className={`${styles.fileIcon} ${styles[getFileIcon(file.type)]}`}>
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className={styles.imageThumbnail}
                  />
                ) : (
                  <FileTypeIcon type={getFileIcon(file.type)} />
                )}
              </div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeAttachment(index)}
                aria-label={`Remove ${file.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M11 3L3 11M3 3L11 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {attachmentError && (
        <div className={styles.attachmentError}>{attachmentError}</div>
      )}

      <div className={styles.actions}>
        <div className={styles.leftActions}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className={styles.hiddenFileInput}
          />
          <button
            type="button"
            className={styles.attachmentButton}
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M15.75 8.24917L9.31166 14.6875C8.50621 15.493 7.41574 15.9439 6.27916 15.9439C5.14259 15.9439 4.05212 15.493 3.24666 14.6875C2.44121 13.8821 1.99036 12.7916 1.99036 11.655C1.99036 10.5184 2.44121 9.42796 3.24666 8.6225L9.685 2.18417C10.2214 1.64776 10.9469 1.34521 11.7037 1.34521C12.4606 1.34521 13.1861 1.64776 13.7225 2.18417C14.2589 2.72058 14.5614 3.44608 14.5614 4.20292C14.5614 4.95975 14.2589 5.68525 13.7225 6.22167L7.27666 12.66C7.00846 12.9282 6.6457 13.0795 6.26729 13.0795C5.88888 13.0795 5.52613 12.9282 5.25792 12.66C4.98971 12.3918 4.83844 12.029 4.83844 11.6506C4.83844 11.2722 4.98971 10.9095 5.25792 10.6413L11.3225 4.58417"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className={styles.characterCount}>
            {content.length > 0 && `${content.length} characters`}
            {pendingAttachments.length > 0 && (
              <span className={styles.attachmentCount}>
                {pendingAttachments.length} {pendingAttachments.length === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>
        </div>
        <div className={styles.buttons}>
          {(onCancel || content.length > 0 || pendingAttachments.length > 0) && (
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
            disabled={(!content.trim() && pendingAttachments.length === 0) || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  );
}

function FileTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'pdf':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="6" y="17" fill="currentColor" fontSize="6" fontWeight="bold">PDF</text>
        </svg>
      );
    case 'word':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="6" y="17" fill="currentColor" fontSize="5" fontWeight="bold">DOC</text>
        </svg>
      );
    case 'excel':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="6" y="17" fill="currentColor" fontSize="5" fontWeight="bold">XLS</text>
        </svg>
      );
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
