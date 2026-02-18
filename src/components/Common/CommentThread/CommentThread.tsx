import React, { useState } from 'react';
import { Comment, CommentAttachment, getUserById } from '@/types/taskManagement';
import { CommentInput } from '../CommentInput/CommentInput';
import styles from './CommentThread.module.scss';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, parentCommentId?: string, attachments?: File[]) => void;
  currentUserId: string;
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  onReply: (content: string, parentCommentId: string, attachments?: File[]) => void;
  currentUserId: string;
  level?: number;
}

function getFileTypeClass(mimeType: string): string {
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

function AttachmentDisplay({ attachment }: { attachment: CommentAttachment }) {
  const fileType = getFileTypeClass(attachment.mime_type);
  const isImage = attachment.mime_type.startsWith('image/');

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.attachmentItem}
      download={!isImage ? attachment.file_name : undefined}
    >
      <div className={`${styles.attachmentIcon} ${styles[fileType]}`}>
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.file_name}
            className={styles.attachmentThumbnail}
          />
        ) : (
          <FileTypeIcon type={fileType} />
        )}
      </div>
      <div className={styles.attachmentInfo}>
        <span className={styles.attachmentName}>{attachment.file_name}</span>
        <span className={styles.attachmentSize}>{formatFileSize(attachment.file_size)}</span>
      </div>
      <div className={styles.downloadIcon}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1.75V10.5M7 10.5L3.5 7M7 10.5L10.5 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M1.75 12.25H12.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </a>
  );
}

function FileTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'pdf':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    case 'word':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    case 'excel':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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

function CommentItem({ comment, replies, onReply, currentUserId, level = 0 }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const user = getUserById(comment.user_id);
  const isCurrentUser = comment.user_id === currentUserId;

  const handleReply = (content: string, attachments?: File[]) => {
    onReply(content, comment.id, attachments);
    setShowReplyInput(false);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`${styles.commentItem} ${level > 0 ? styles.reply : ''}`}>
      <div className={styles.commentHeader}>
        <div className={styles.avatarCircle}>
          {user?.first_name.charAt(0)}{user?.last_name.charAt(0)}
        </div>
        <div className={styles.commentMeta}>
          <div className={styles.authorName}>
            {user?.first_name} {user?.last_name}
            {isCurrentUser && <span className={styles.youBadge}>You</span>}
          </div>
          <div className={styles.commentTime}>{formatTimeAgo(comment.created_at)}</div>
        </div>
      </div>

      <div className={styles.commentContent}>{comment.content}</div>

      {comment.attachments && comment.attachments.length > 0 && (
        <div className={styles.attachmentsList}>
          {comment.attachments.map((attachment) => (
            <AttachmentDisplay key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}

      <div className={styles.commentActions}>
        <button
          type="button"
          className={styles.replyButton}
          onClick={() => setShowReplyInput(!showReplyInput)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M12.25 7C12.25 9.8995 9.8995 12.25 7 12.25C6.23256 12.25 5.51008 12.0762 4.86401 11.7656L1.75 12.25L2.23437 9.13599C1.92383 8.48992 1.75 7.76744 1.75 7C1.75 4.1005 4.1005 1.75 7 1.75C9.8995 1.75 12.25 4.1005 12.25 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reply
        </button>
      </div>

      {showReplyInput && (
        <div className={styles.replyInputContainer}>
          <CommentInput
            onSubmit={handleReply}
            onCancel={() => setShowReplyInput(false)}
            placeholder="Write a reply..."
            isReply={true}
            autoFocus={true}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className={styles.replies}>
          {replies.map((reply) => {
            const nestedReplies: Comment[] = []; // For now, we support one level of threading
            return (
              <CommentItem
                key={reply.id}
                comment={reply}
                replies={nestedReplies}
                onReply={onReply}
                currentUserId={currentUserId}
                level={level + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ comments, onAddComment, currentUserId }: CommentThreadProps) {
  // Organize comments into parent and replies
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId: string) =>
    comments.filter(c => c.parent_comment_id === commentId);

  const handleAddTopLevelComment = (content: string, attachments?: File[]) => {
    onAddComment(content, undefined, attachments);
  };

  const handleReply = (content: string, parentCommentId: string, attachments?: File[]) => {
    onAddComment(content, parentCommentId, attachments);
  };

  return (
    <div className={styles.commentThreadContainer}>
      <div className={styles.addCommentSection}>
        <CommentInput onSubmit={handleAddTopLevelComment} />
      </div>

      {topLevelComments.length > 0 ? (
        <div className={styles.commentsList}>
          <div className={styles.commentsHeader}>
            <h4 className={styles.commentsTitle}>
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h4>
          </div>
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              onReply={handleReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M40 24C40 32.8366 32.8366 40 24 40C20.7969 40 17.7487 39.0351 15.1612 37.3587L8 40L10.6413 32.8388C8.96492 30.2513 8 27.2031 8 24C8 15.1634 15.1634 8 24 8C32.8366 8 40 15.1634 40 24Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
