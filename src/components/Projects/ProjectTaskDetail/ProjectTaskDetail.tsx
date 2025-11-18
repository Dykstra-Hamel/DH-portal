'use client';

import React, { useState } from 'react';
import {
  X,
  Edit,
  Trash2,
  User as UserIcon,
  Calendar,
  MessageSquare,
  CheckSquare,
  Plus,
  Activity as ActivityIcon,
} from 'lucide-react';
import { ProjectTask, taskPriorityOptions } from '@/types/project';
import styles from './ProjectTaskDetail.module.scss';

interface ProjectTaskDetailProps {
  task: ProjectTask | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onDelete: () => void;
  onAddComment: (comment: string) => Promise<void>;
  onCreateSubtask: () => void;
  onUpdateProgress: (progress: number) => Promise<void>;
  users: any[]; // List of users for assignment dropdown
}

export default function ProjectTaskDetail({
  task,
  onClose,
  onUpdate,
  onDelete,
  onAddComment,
  onCreateSubtask,
  onUpdateProgress,
  users,
}: ProjectTaskDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || null,
    due_date: task?.due_date || '',
    start_date: task?.start_date || '',
  });

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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return formatDateTime(dateString);
  };

  const getActivityMessage = (activity: any): string => {
    const priorityLabel = (priority: string) => taskPriorityOptions.find(p => p.value === priority)?.label || priority;

    switch (activity.action_type) {
      case 'created':
        return 'created this task';
      case 'completed':
        return 'marked this task as complete';
      case 'uncompleted':
        return 'reopened this task';
      case 'title_changed':
        return `changed title from "${activity.old_value}" to "${activity.new_value}"`;
      case 'description_changed':
        return 'updated the description';
      case 'notes_changed':
        return 'updated the notes';
      case 'priority_changed':
        return `changed priority from ${priorityLabel(activity.old_value)} to ${priorityLabel(activity.new_value)}`;
      case 'due_date_changed':
        if (!activity.old_value && activity.new_value) {
          return `set due date to ${new Date(activity.new_value).toLocaleDateString()}`;
        } else if (activity.old_value && !activity.new_value) {
          return 'removed the due date';
        }
        return `changed due date from ${new Date(activity.old_value).toLocaleDateString()} to ${new Date(activity.new_value).toLocaleDateString()}`;
      case 'assigned':
      case 'unassigned':
        if (activity.action_type === 'unassigned') {
          return 'unassigned this task';
        }
        return 'assigned this task';
      default:
        return activity.action_type.replace(/_/g, ' ');
    }
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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task? This will also delete all subtasks and comments.')) {
      onDelete();
    }
  };

  const handleEdit = () => {
    // Initialize form data when entering edit mode
    setEditFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || null,
      due_date: task.due_date || '',
      start_date: task.start_date || '',
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    try {
      await onUpdate(task.id, editFormData);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sidebar} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.badges}>
              {isEditMode ? (
                <select
                  className={styles.editSelect}
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  style={{ backgroundColor: getPriorityColor(editFormData.priority), color: 'white' }}
                >
                  {taskPriorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={styles.priorityBadge}
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                >
                  {getPriorityLabel(task.priority)}
                </span>
              )}
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
          <div className={styles.titleRow}>
            {!isEditMode && (
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={(e) => onUpdate(task.id, { is_completed: e.target.checked })}
                className={styles.completeCheckbox}
              />
            )}
            {isEditMode ? (
              <input
                type="text"
                className={styles.editTitleInput}
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            ) : (
              <h2 className={`${styles.title} ${task.is_completed ? styles.completed : ''}`}>
                {task.title}
              </h2>
            )}
          </div>
          <div className={styles.headerActions}>
            {isEditMode ? (
              <>
                <button onClick={handleSaveEdit} className={styles.saveButton}>
                  <CheckSquare size={16} />
                  Save
                </button>
                <button onClick={handleCancelEdit} className={styles.cancelEditButton}>
                  <X size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEdit} className={styles.editButton}>
                  <Edit size={16} />
                  Edit
                </button>
                <button onClick={handleDelete} className={styles.deleteButton}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Description */}
          {(task.description || isEditMode) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              {isEditMode ? (
                <textarea
                  className={styles.editTextarea}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                  placeholder="Add a description..."
                />
              ) : (
                <p className={styles.description}>{task.description}</p>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Details</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <UserIcon size={14} />
                  Assigned To
                </div>
                {isEditMode ? (
                  <select
                    className={styles.editSelect}
                    value={editFormData.assigned_to || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, assigned_to: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.profiles?.first_name} {user.profiles?.last_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={styles.detailValue}>
                    {task.assigned_to_profile ? (
                      <>
                        {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                      </>
                    ) : (
                      <span className={styles.unassigned}>Unassigned</span>
                    )}
                  </div>
                )}
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
                {isEditMode ? (
                  <input
                    type="date"
                    className={styles.editInput}
                    value={editFormData.due_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                  />
                ) : (
                  <div className={styles.detailValue}>
                    {formatDate(task.due_date)}
                  </div>
                )}
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Calendar size={14} />
                  Start Date
                </div>
                {isEditMode ? (
                  <input
                    type="date"
                    className={styles.editInput}
                    value={editFormData.start_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                  />
                ) : (
                  <div className={styles.detailValue}>
                    {formatDate(task.start_date)}
                  </div>
                )}
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

          {/* Activity Log */}
          {task.activity && task.activity.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <ActivityIcon size={16} />
                Activity
              </h3>
              <div className={styles.activityFeed}>
                {task.activity.map(activity => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityAvatar}>
                      {activity.user_profile?.first_name?.[0]}
                      {activity.user_profile?.last_name?.[0]}
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityText}>
                        <span className={styles.activityUser}>
                          {activity.user_profile?.first_name} {activity.user_profile?.last_name}
                        </span>{' '}
                        <span className={styles.activityAction}>
                          {getActivityMessage(activity)}
                        </span>
                      </div>
                      <div className={styles.activityTime}>
                        {getRelativeTime(activity.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
