import React, { useState } from 'react';
import { Comment, getUserById } from '@/types/taskManagement';
import { CommentInput } from '../CommentInput/CommentInput';
import styles from './CommentThread.module.scss';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, parentCommentId?: string) => void;
  currentUserId: string;
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  onReply: (content: string, parentCommentId: string) => void;
  currentUserId: string;
  level?: number;
}

function CommentItem({ comment, replies, onReply, currentUserId, level = 0 }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const user = getUserById(comment.user_id);
  const isCurrentUser = comment.user_id === currentUserId;

  const handleReply = (content: string) => {
    onReply(content, comment.id);
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

  const handleAddTopLevelComment = (content: string) => {
    onAddComment(content);
  };

  const handleReply = (content: string, parentCommentId: string) => {
    onAddComment(content, parentCommentId);
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
