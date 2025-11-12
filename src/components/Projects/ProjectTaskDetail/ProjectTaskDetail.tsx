'use client';

import React, { useState } from 'react';
import {
  X,
  Edit,
  Trash2,
  User as UserIcon,
  Calendar,
  Clock,
  Target,
  MessageSquare,
  CheckSquare,
  Plus,
} from 'lucide-react';
import { ProjectTask, taskPriorityOptions } from '@/types/project';
import styles from './ProjectTaskDetail.module.scss';

interface ProjectTaskDetailProps {
  task: ProjectTask | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddComment: (comment: string) => Promise<void>;
  onCreateSubtask: () => void;
  onUpdateProgress: (progress: number) => Promise<void>;
}

export default function ProjectTaskDetail({
  task,
  onClose,
  onEdit,
  onDelete,
  onAddComment,
  onCreateSubtask,
  onUpdateProgress,
}: ProjectTaskDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [progressValue, setProgressValue] = useState(task?.progress_percentage || 0);

  if (!task) return null;

  const getPriorityColor = (priority: string) => {
    return taskPriorityOptions.find(p => p.value === priority)?.color || '#6b7280';
  };

  const getPriorityLabel = (priority: string) => {
    return taskPriorityOptions.find(p => p.value === priority)?.label || priority;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleProgressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setProgressValue(value);
  };

  const handleProgressBlur = async () => {
    if (progressValue !== task.progress_percentage) {
      await onUpdateProgress(progressValue);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task? This will also delete all subtasks and comments.')) {
      onDelete();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sidebar} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.badges}>
              <span
                className={styles.priorityBadge}
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              >
                {getPriorityLabel(task.priority)}
              </span>
              {task.is_completed && (
                <span className={styles.completedBadge}>
                  <CheckSquare size={14} />
                  Completed
                </span>
              )}
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
          <h2 className={styles.title}>{task.title}</h2>
          <div className={styles.headerActions}>
            <button onClick={onEdit} className={styles.editButton}>
              <Edit size={16} />
              Edit
            </button>
            <button onClick={handleDelete} className={styles.deleteButton}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Description */}
          {task.description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p className={styles.description}>{task.description}</p>
            </div>
          )}

          {/* Progress */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Target size={16} />
              Progress
            </h3>
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressValue}%` }}
                ></div>
              </div>
              <div className={styles.progressControls}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={handleProgressChange}
                  onMouseUp={handleProgressBlur}
                  onTouchEnd={handleProgressBlur}
                  className={styles.progressSlider}
                />
                <span className={styles.progressText}>{progressValue}%</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Details</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <UserIcon size={14} />
                  Assigned To
                </div>
                <div className={styles.detailValue}>
                  {task.assigned_to_profile ? (
                    <>
                      {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                    </>
                  ) : (
                    <span className={styles.unassigned}>Unassigned</span>
                  )}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <UserIcon size={14} />
                  Created By
                </div>
                <div className={styles.detailValue}>
                  {task.created_by_profile ? (
                    <>
                      {task.created_by_profile.first_name} {task.created_by_profile.last_name}
                    </>
                  ) : (
                    <span className={styles.unassigned}>Unknown</span>
                  )}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Calendar size={14} />
                  Due Date
                </div>
                <div className={styles.detailValue}>
                  {formatDate(task.due_date)}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Calendar size={14} />
                  Start Date
                </div>
                <div className={styles.detailValue}>
                  {formatDate(task.start_date)}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Clock size={14} />
                  Actual Hours
                </div>
                <div className={styles.detailValue}>
                  {task.actual_hours ? `${task.actual_hours}h` : 'Not tracked'}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {task.notes && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              <p className={styles.notes}>{task.notes}</p>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <CheckSquare size={16} />
                  Subtasks ({task.subtasks.length})
                </h3>
                <button onClick={onCreateSubtask} className={styles.addButton}>
                  <Plus size={14} />
                  Add
                </button>
              </div>
              <div className={styles.subtasks}>
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className={styles.subtask}>
                    <div className={styles.subtaskStatus}>
                      <input
                        type="checkbox"
                        checked={subtask.is_completed}
                        readOnly
                        className={styles.subtaskCheckbox}
                      />
                    </div>
                    <div className={styles.subtaskContent}>
                      <div className={styles.subtaskTitle}>{subtask.title}</div>
                      {subtask.assigned_to_profile && (
                        <div className={styles.subtaskAssignee}>
                          {subtask.assigned_to_profile.first_name}{' '}
                          {subtask.assigned_to_profile.last_name}
                        </div>
                      )}
                    </div>
                    <div className={styles.subtaskProgress}>
                      {subtask.progress_percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <MessageSquare size={16} />
                Comments ({task.comments?.length || 0})
              </h3>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className={styles.commentForm}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className={styles.commentInput}
                rows={3}
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className={styles.commentSubmitButton}
              >
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            {/* Comments List */}
            {task.comments && task.comments.length > 0 && (
              <div className={styles.comments}>
                {task.comments.map(comment => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAuthor}>
                        {comment.user_profile?.first_name} {comment.user_profile?.last_name}
                      </div>
                      <div className={styles.commentDate}>
                        {formatDateTime(comment.created_at)}
                      </div>
                    </div>
                    <div className={styles.commentText}>{comment.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className={styles.metadata}>
            <div>Created {formatDateTime(task.created_at)}</div>
            <div>Last updated {formatDateTime(task.updated_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
