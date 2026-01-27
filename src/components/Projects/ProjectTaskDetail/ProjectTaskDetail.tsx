'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Trash2,
  User as UserIcon,
  Calendar,
  MessageSquare,
  Check,
  CheckSquare,
  Plus,
  Activity as ActivityIcon,
  Flag,
  Pencil,
} from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import { ProjectTask, taskPriorityOptions } from '@/types/project';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
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
  highlightedCommentId?: string | null;
  onToggleStar?: (taskId: string) => void;
  isStarred?: (taskId: string) => boolean;
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
  highlightedCommentId,
  onToggleStar,
  isStarred,
}: ProjectTaskDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task?.title || '');
  const [priorityDraft, setPriorityDraft] = useState(task?.priority || 'medium');
  const [assignedToDraft, setAssignedToDraft] = useState(task?.assigned_to || '');
  const [dueDateDraft, setDueDateDraft] = useState('');
  const [startDateDraft, setStartDateDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState(task?.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isUpdatingComplete, setIsUpdatingComplete] = useState(false);

  const isAdminRole = (role?: string | null) => role === 'admin' || role === 'super_admin';

  const getUserRole = (user: any) => {
    if (user?.profiles?.role) return user.profiles.role;
    if (user?.role) return user.role;
    if (Array.isArray(user?.roles)) {
      if (user.roles.includes('admin')) return 'admin';
      if (user.roles.includes('super_admin')) return 'super_admin';
    }
    return null;
  };

  const getUserDisplayName = (user: any) => {
    const profile = user?.profiles;
    const firstName = profile?.first_name || user?.first_name || '';
    const lastName = profile?.last_name || user?.last_name || '';
    const email = profile?.email || user?.email || '';
    const name = `${firstName} ${lastName}`.trim();
    return name ? (email ? `${name} (${email})` : name) : email || 'User';
  };

  const assignableUsers = useMemo(() => {
    const shouldFilterByRole = users.some(user => getUserRole(user));
    const adminUsers = shouldFilterByRole
      ? users.filter((user) => {
          const role = getUserRole(user);
          return role ? isAdminRole(role) : false;
        })
      : users;

    if (task?.assigned_to && !adminUsers.some(user => user.id === task.assigned_to)) {
      const assignedUser = users.find(user => user.id === task.assigned_to);
      if (assignedUser) {
        return [...adminUsers, assignedUser];
      }
      if (task.assigned_to_profile) {
        return [
          ...adminUsers,
          {
            id: task.assigned_to,
            profiles: task.assigned_to_profile,
            email: task.assigned_to_profile.email,
          },
        ];
      }
    }

    return adminUsers;
  }, [task?.assigned_to, users]);

  const formatDateInput = (dateString: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
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

  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title || '');
    setPriorityDraft(task.priority || 'medium');
    setAssignedToDraft(task.assigned_to || '');
    setDueDateDraft(formatDateInput(task.due_date));
    setStartDateDraft(formatDateInput(task.start_date));
    setDescriptionDraft(task.description || '');
    setIsEditingDescription(false);
  }, [task]);

  useEffect(() => {
    if (!highlightedCommentId) return;
    const element = document.getElementById(`task-comment-${highlightedCommentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedCommentId, task?.id, task?.comments?.length]);

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

  if (!task) return null;

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

  const handleTitleSave = async () => {
    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle === task.title) {
      setTitleDraft(task.title || '');
      return;
    }

    setIsSavingTitle(true);
    try {
      await onUpdate(task.id, { title: nextTitle });
    } catch (error) {
      console.error('Error updating title:', error);
      alert('Failed to update title. Please try again.');
      setTitleDraft(task.title || '');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleTitleSave();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      setTitleDraft(task.title || '');
      event.currentTarget.blur();
    }
  };

  const handlePriorityChange = async (value: string) => {
    setPriorityDraft(value as ProjectTask['priority']);
    try {
      await onUpdate(task.id, { priority: value as ProjectTask['priority'] });
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Failed to update priority. Please try again.');
      setPriorityDraft(task.priority || 'medium');
    }
  };

  const handleAssignedToChange = async (value: string) => {
    setAssignedToDraft(value);
    try {
      await onUpdate(task.id, { assigned_to: value || null });
    } catch (error) {
      console.error('Error updating assignee:', error);
      alert('Failed to update assignee. Please try again.');
      setAssignedToDraft(task.assigned_to || '');
    }
  };

  const handleDateChange = async (field: 'due_date' | 'start_date', value: string) => {
    if (field === 'due_date') {
      setDueDateDraft(value);
    } else {
      setStartDateDraft(value);
    }
    try {
      await onUpdate(task.id, {
        [field]: value ? new Date(value).toISOString() : null,
      });
    } catch (error) {
      console.error('Error updating date:', error);
      alert('Failed to update date. Please try again.');
      setDueDateDraft(formatDateInput(task.due_date));
      setStartDateDraft(formatDateInput(task.start_date));
    }
  };

  const handleDescriptionSave = async () => {
    const nextDescription = descriptionDraft.trim();
    setIsSavingDescription(true);
    try {
      await onUpdate(task.id, { description: nextDescription ? descriptionDraft : null });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
      alert('Failed to update description. Please try again.');
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleDescriptionCancel = () => {
    setDescriptionDraft(task.description || '');
    setIsEditingDescription(false);
  };

  const handleToggleComplete = async () => {
    if (isUpdatingComplete) return;
    setIsUpdatingComplete(true);
    try {
      await onUpdate(task.id, { is_completed: !task.is_completed });
    } catch (error) {
      console.error('Error updating completion:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setIsUpdatingComplete(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sidebar} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.badges}>
              {task.is_completed && (
                <span className={styles.completedBadge}>
                  <CheckSquare size={14} />
                  Completed
                </span>
              )}
            </div>
            <div className={styles.headerActions}>
              {onToggleStar && isStarred && (
                <StarButton
                  isStarred={isStarred(task.id)}
                  onToggle={() => onToggleStar(task.id)}
                  size="medium"
                />
              )}
              <button onClick={onClose} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
          </div>
          <div className={styles.titleRow}>
            <button
              type="button"
              className={`${styles.completeToggle} ${task.is_completed ? styles.completeToggleDone : ''}`}
              onClick={handleToggleComplete}
              aria-label={task.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
              disabled={isUpdatingComplete}
            >
              {task.is_completed && <Check size={14} />}
            </button>
            <input
              type="text"
              className={`${styles.titleInput} ${task.is_completed ? styles.completed : ''}`}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              disabled={isSavingTitle}
              placeholder="Task title"
            />
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Description */}
          <div className={`${styles.section} ${styles.descriptionSection}`}>
            {isEditingDescription ? (
              <>
                <RichTextEditor
                  value={descriptionDraft}
                  onChange={setDescriptionDraft}
                  placeholder="Add a description..."
                  className={styles.richTextEditor}
                />
                <div className={styles.descriptionActions}>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={handleDescriptionSave}
                    disabled={isSavingDescription}
                  >
                    {isSavingDescription ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelEditButton}
                    onClick={handleDescriptionCancel}
                    disabled={isSavingDescription}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div
                className={styles.descriptionDisplay}
                onClick={() => setIsEditingDescription(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsEditingDescription(true);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className={styles.descriptionEditIcon} aria-hidden="true">
                  <Pencil size={14} />
                </span>
                {descriptionDraft ? (
                  <div
                    className={`${styles.description} ${styles.richTextContent}`}
                    dangerouslySetInnerHTML={{ __html: descriptionDraft }}
                  />
                ) : (
                  <div className={`${styles.description} ${styles.richTextContent} ${styles.descriptionPlaceholder}`}>
                    Add a description...
                  </div>
                )}
              </div>
            )}
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
                <select
                  className={styles.editSelect}
                  value={assignedToDraft}
                  onChange={(e) => handleAssignedToChange(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </option>
                  ))}
                </select>
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
                  <Flag size={14} />
                  Priority
                </div>
                <select
                  className={styles.editSelect}
                  value={priorityDraft}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                >
                  {taskPriorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Calendar size={14} />
                  Due Date
                </div>
                <input
                  type="date"
                  className={styles.editInput}
                  value={dueDateDraft}
                  onChange={(e) => handleDateChange('due_date', e.target.value)}
                />
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Calendar size={14} />
                  Start Date
                </div>
                <input
                  type="date"
                  className={styles.editInput}
                  value={startDateDraft}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                />
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
                  <div
                    key={comment.id}
                    id={`task-comment-${comment.id}`}
                    className={`${styles.comment} ${
                      highlightedCommentId === comment.id
                        ? styles.commentHighlight
                        : ''
                    }`}
                  >
                    <div className={styles.commentHeader}>
                      <div className={styles.commentHeaderLeft}>
                        <MiniAvatar
                          firstName={comment.user_profile?.first_name || undefined}
                          lastName={comment.user_profile?.last_name || undefined}
                          email={comment.user_profile?.email || ''}
                          avatarUrl={comment.user_profile?.avatar_url || null}
                          size="small"
                          showTooltip={true}
                        />
                        <div className={styles.commentAuthor}>
                          {comment.user_profile?.first_name} {comment.user_profile?.last_name}
                        </div>
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

          <div className={styles.deleteSection}>
            <button onClick={handleDelete} className={styles.deleteButton}>
              <Trash2 size={16} />
              Delete Task
            </button>
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
