'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  X,
  Trash2,
  User as UserIcon,
  Calendar,
  MessageSquare,
  Check,
  CheckSquare,
  Plus,
  ChevronDown,
  Activity as ActivityIcon,
  Flag,
  Pencil,
  Tag,
  Lock,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import { ProjectTask, taskPriorityOptions, ProjectCategory, ProjectDepartment } from '@/types/project';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { formatProjectShortcode } from '@/lib/formatProjectShortcode';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';
import styles from './ProjectTaskDetail.module.scss';

interface ProjectTaskDetailProps {
  task: ProjectTask | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onUpdateRelatedTask?: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onDelete: () => void;
  onAddComment: (comment: string) => Promise<void>;
  onCreateSubtask: () => void;
  onUpdateProgress: (progress: number) => Promise<void>;
  users: any[]; // List of users for assignment dropdown
  highlightedCommentId?: string | null;
  onToggleStar?: (taskId: string) => void;
  isStarred?: (taskId: string) => boolean;
  availableCategories?: ProjectCategory[]; // Available categories for this project
  projectMembers?: Array<{ user_id: string }>; // Project members
  projectAssignedTo?: string | null; // Project's assigned_to user
  availableTasks?: ProjectTask[]; // All tasks in project for dependency selection
  departments?: ProjectDepartment[];
}

export default function ProjectTaskDetail({
  task,
  onClose,
  onUpdate,
  onUpdateRelatedTask,
  onDelete,
  onAddComment,
  onCreateSubtask,
  onUpdateProgress,
  users,
  highlightedCommentId,
  onToggleStar,
  isStarred,
  availableCategories = [],
  availableTasks = [],
  departments = [],
}: ProjectTaskDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task?.title || '');
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const [priorityDraft, setPriorityDraft] = useState(task?.priority || 'medium');
  const [assignedToDraft, setAssignedToDraft] = useState(task?.assigned_to || '');
  const [dueDateDraft, setDueDateDraft] = useState('');
  const [startDateDraft, setStartDateDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState(task?.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isUpdatingComplete, setIsUpdatingComplete] = useState(false);
  const [isActivityCollapsed, setIsActivityCollapsed] = useState(true);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [blocksTaskId, setBlocksTaskId] = useState<string>('');
  const [blockedByTaskId, setBlockedByTaskId] = useState<string>('');
  const [departmentDraft, setDepartmentDraft] = useState(task?.department_id || '');
  const [blockedTaskDepartmentDraft, setBlockedTaskDepartmentDraft] = useState('');
  const [parentTaskDraft, setParentTaskDraft] = useState<string>(task?.parent_task_id || '');
  const priorityRef = useRef<HTMLDivElement>(null);

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');

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
    // Allow assignment to any admin user
    let filteredUsers = users.filter(user => isAdminRole(getUserRole(user)));

    // Always include current assignee even if not a member
    const currentAssignee = task?.assigned_to || assignedToDraft;
    if (currentAssignee && !filteredUsers.some(u => (u.profiles?.id || u.id) === currentAssignee)) {
      const assignedUser = users.find(u => (u.profiles?.id || u.id) === currentAssignee);
      if (assignedUser) {
        filteredUsers = [...filteredUsers, assignedUser];
      } else if (task?.assigned_to_profile) {
        // If assigned user not found in users list but we have the profile, add it
        filteredUsers = [
          ...filteredUsers,
          {
            id: task.assigned_to,
            profiles: task.assigned_to_profile,
            email: task.assigned_to_profile.email,
          },
        ];
      }
    }

    return filteredUsers;
  }, [task?.assigned_to, task?.assigned_to_profile, assignedToDraft, users]);

  const formatDateInput = (dateString: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  // Format a date-only string (YYYY-MM-DD) to local date without timezone conversion
  const formatDateOnly = (dateString: string): string => {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    if (!year || !month || !day) return 'Invalid Date';

    // Create date in local timezone
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const formatDateWithTime = (dateString: string | null) => {
    if (!dateString) {
      return { datePart: 'Unknown', timePart: 'Unknown' };
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { datePart: 'Invalid Date', timePart: 'Invalid Date' };
    }
    const datePart = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return { datePart, timePart };
  };

  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title || '');
    setPriorityDraft(task.priority || 'medium');
    setAssignedToDraft(task.assigned_to || '');
    setDueDateDraft(formatDateInput(task.due_date));
    setStartDateDraft(formatDateInput(task.start_date));
    setDescriptionDraft(task.description || '');
    setDepartmentDraft(task.department_id || '');
    setIsEditingDescription(false);
    // Set selected categories from task
    const categoryIds = task.categories?.map(cat => cat.id) || [];
    setSelectedCategoryIds(categoryIds.slice(0, 1));

    // Set dependency state
    setBlocksTaskId(task.blocks_task_id || '');
    setBlockedByTaskId(task.blocked_by_task_id || '');
    setParentTaskDraft(task.parent_task_id || '');
    setIsActivityCollapsed(true);
    setIsPriorityOpen(false);
  }, [task]);

  useEffect(() => {
    if (!blocksTaskId) {
      setBlockedTaskDepartmentDraft('');
      return;
    }
    const blockedTask = availableTasks.find(t => t.id === blocksTaskId);
    setBlockedTaskDepartmentDraft(blockedTask?.department_id || '');
  }, [availableTasks, blocksTaskId]);

  useEffect(() => {
    const textarea = titleInputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [titleDraft]);

  useEffect(() => {
    if (!isPriorityOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setIsPriorityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPriorityOpen]);

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
          return `set due date to ${formatDateOnly(activity.new_value)}`;
        } else if (activity.old_value && !activity.new_value) {
          return 'removed the due date';
        }
        return `changed due date from ${formatDateOnly(activity.old_value)} to ${formatDateOnly(activity.new_value)}`;
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

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const handleBlocksTaskChange = async (taskId: string) => {
    setBlocksTaskId(taskId);
    try {
      await onUpdate(task.id, { blocks_task_id: taskId || null });
    } catch (error) {
      console.error('Error updating blocks_task_id:', error);
      setBlocksTaskId(task.blocks_task_id || '');
    }
  };

  const handleBlockedByTaskChange = async (taskId: string) => {
    setBlockedByTaskId(taskId);
    try {
      const updates: Partial<ProjectTask> = { blocked_by_task_id: taskId || null };
      if (!taskId) {
        updates.department_id = null;
        setDepartmentDraft('');
      }
      await onUpdate(task.id, updates);
    } catch (error) {
      console.error('Error updating blocked_by_task_id:', error);
      setBlockedByTaskId(task.blocked_by_task_id || '');
    }
  };

  const handleDepartmentChange = async (departmentId: string) => {
    setDepartmentDraft(departmentId);
    try {
      await onUpdate(task.id, { department_id: departmentId || null });
    } catch (error) {
      console.error('Error updating department:', error);
      setDepartmentDraft(task.department_id || '');
    }
  };

  const handleBlockedTaskDepartmentChange = async (departmentId: string) => {
    setBlockedTaskDepartmentDraft(departmentId);
    if (!blocksTaskId) return;
    try {
      const updateRelated = onUpdateRelatedTask || onUpdate;
      await updateRelated(blocksTaskId, { department_id: departmentId || null });
    } catch (error) {
      console.error('Error updating blocked task department:', error);
      const blockedTask = availableTasks.find(t => t.id === blocksTaskId);
      setBlockedTaskDepartmentDraft(blockedTask?.department_id || '');
    }
  };

  const handleParentTaskChange = async (taskId: string) => {
    setParentTaskDraft(taskId);
    try {
      await onUpdate(task.id, { parent_task_id: taskId || null });
    } catch (error) {
      console.error('Error updating parent_task_id:', error);
      setParentTaskDraft(task.parent_task_id || '');
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

    // Check if task is blocked
    if (!task.is_completed && task.blocked_by_task && !task.blocked_by_task.is_completed) {
      setErrorTitle('Cannot Complete Task');
      setErrorMessage(`This task is blocked by "${task.blocked_by_task.title}". Please complete the blocking task first.`);
      setShowErrorModal(true);
      return;
    }

    // Check if task has incomplete subtasks
    if (!task.is_completed && task.subtasks && task.subtasks.length > 0) {
      const incompleteSubtasks = task.subtasks.filter(subtask => !subtask.is_completed);
      if (incompleteSubtasks.length > 0) {
        const subtaskList = incompleteSubtasks.map(st => `• ${st.title}`).join('\n');
        setErrorTitle('Cannot Complete Task');
        setErrorMessage(`This task has ${incompleteSubtasks.length} incomplete subtask${incompleteSubtasks.length > 1 ? 's' : ''}:\n\n${subtaskList}\n\nPlease complete all subtasks first.`);
        setShowErrorModal(true);
        return;
      }
    }

    setIsUpdatingComplete(true);
    try {
      await onUpdate(task.id, { is_completed: !task.is_completed });
    } catch (error) {
      console.error('Error updating completion:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update task';
      setErrorTitle('Error');
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsUpdatingComplete(false);
    }
  };

  const handleCategoryChange = async (categoryId: string | null) => {
    const previousSelectedIds = selectedCategoryIds;
    const isNoneOption = !categoryId;
    const isCurrentlySelected = !isNoneOption && selectedCategoryIds.includes(categoryId);
    const newSelectedIds = isNoneOption ? [] : isCurrentlySelected ? [] : [categoryId];

    if (isNoneOption && previousSelectedIds.length === 0) {
      return;
    }

    setSelectedCategoryIds(newSelectedIds);

    try {
      // Update categories via API
      await onUpdate(task.id, { category_ids: newSelectedIds } as any);
    } catch (error) {
      console.error('Error updating categories:', error);
      alert('Failed to update categories. Please try again.');
      // Revert on error
      setSelectedCategoryIds(previousSelectedIds);
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
                  size="xlarge"
                />
              )}
              <div ref={priorityRef} className={styles.priorityDropdown}>
                <button
                  type="button"
                  className={styles.priorityButton}
                  onClick={() => setIsPriorityOpen((prev) => !prev)}
                  style={{
                    borderColor: taskPriorityOptions.find(option => option.value === priorityDraft)?.color,
                    color: taskPriorityOptions.find(option => option.value === priorityDraft)?.color,
                  }}
                  aria-label="Change priority"
                >
                  <Flag size={14} />
                  <span className={styles.priorityButtonText}>
                    {taskPriorityOptions.find(option => option.value === priorityDraft)?.label || 'Priority'}
                  </span>
                  <ChevronDown size={14} className={isPriorityOpen ? styles.priorityChevronOpen : ''} />
                </button>
                {isPriorityOpen && (
                  <div className={styles.priorityMenu}>
                    {taskPriorityOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        className={styles.priorityMenuItem}
                        onClick={() => {
                          handlePriorityChange(option.value);
                          setIsPriorityOpen(false);
                        }}
                      >
                        <span
                          className={styles.priorityDot}
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className={styles.projectPill}>
                {task.project_id
                  ? task.project?.shortcode
                    ? formatProjectShortcode(task.project.shortcode)
                    : task.project?.name || 'Personal Task'
                  : 'Personal Task'}
              </span>
              <button onClick={onClose} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
          </div>
          <div className={styles.titleRow}>
            <button
              type="button"
              className={`${styles.completeToggle} ${
                task.is_completed ? styles.completeToggleDone : ''
              } ${
                task.blocked_by_task && !task.blocked_by_task.is_completed ? styles.completeToggleBlocked : ''
              }`}
              onClick={handleToggleComplete}
              aria-label={
                task.blocked_by_task && !task.blocked_by_task.is_completed
                  ? 'Task is blocked'
                  : task.is_completed
                  ? 'Mark task incomplete'
                  : 'Mark task complete'
              }
              disabled={isUpdatingComplete}
              title={
                task.blocked_by_task && !task.blocked_by_task.is_completed
                  ? `Blocked by: ${task.blocked_by_task.title}`
                  : undefined
              }
            >
              {task.blocked_by_task && !task.blocked_by_task.is_completed ? (
                <Lock size={14} />
              ) : task.is_completed ? (
                <Check size={14} />
              ) : null}
            </button>
            <textarea
              className={`${styles.titleInput} ${task.is_completed ? styles.completed : ''}`}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              disabled={isSavingTitle}
              placeholder="Task title"
              rows={1}
              ref={titleInputRef}
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
                  <Tag size={14} />
                  Category
                </div>
                <select
                  className={styles.editSelect}
                  value={selectedCategoryIds[0] || ''}
                  onChange={(e) => handleCategoryChange(e.target.value || null)}
                >
                  <option value="">No Category</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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

          {/* Dependencies */}
          {task.project_id && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Task Dependencies</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>
                    <CheckSquare size={14} />
                    Is Blocking
                  </div>
                  <select
                    className={styles.editSelect}
                    value={blocksTaskId}
                    onChange={(e) => handleBlocksTaskChange(e.target.value)}
                  >
                    <option value="">None</option>
                    {availableTasks
                      .filter(t => t.id !== task?.id && t.id !== blockedByTaskId)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </div>

                {blocksTaskId && departments.length > 0 ? (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>
                      <Flag size={14} />
                      Move Project When Complete
                    </div>
                    <select
                      className={styles.editSelect}
                      value={blockedTaskDepartmentDraft}
                      onChange={(e) => handleBlockedTaskDepartmentChange(e.target.value)}
                    >
                      <option value="">Stay where it is</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    {blockedTaskDepartmentDraft && (
                      <span className={styles.detailHint}>
                        Applies to the blocked task this one is holding up.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={styles.detailItemPlaceholder} />
                )}

                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>
                    <CheckSquare size={14} />
                    Is Blocked By
                  </div>
                  <select
                    className={styles.editSelect}
                    value={blockedByTaskId}
                    onChange={(e) => handleBlockedByTaskChange(e.target.value)}
                  >
                    <option value="">None</option>
                    {availableTasks
                      .filter(t => t.id !== task?.id && t.id !== blocksTaskId)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} {!t.is_completed && '⏳'}
                        </option>
                      ))}
                  </select>
                </div>

                {blockedByTaskId && departments.length > 0 ? (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>
                      <Flag size={14} />
                      Move Project When Unblocked
                    </div>
                    <select
                      className={styles.editSelect}
                      value={departmentDraft}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                    >
                      <option value="">Stay where it is</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <span className={styles.detailHint}>
                      If set, the project will move when the blocking task completes.
                    </span>
                  </div>
                ) : (
                  <div className={styles.detailItemPlaceholder} />
                )}

                {(!task.subtasks || task.subtasks.length === 0) && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>
                      <Layers size={14} />
                      Parent Task
                    </div>
                    <select
                      className={styles.editSelect}
                      value={parentTaskDraft}
                      onChange={(e) => handleParentTaskChange(e.target.value)}
                    >
                      <option value="">None</option>
                      {availableTasks
                        .filter(t => {
                          // Exclude current task
                          if (t.id === task?.id) return false;
                          // Only allow top-level tasks (not subtasks themselves)
                          if (t.parent_task_id) return false;
                          // Always include the current parent task if one exists
                          if (t.id === task?.parent_task_id) return true;
                          // Exclude tasks that already have subtasks (other than potentially this task)
                          const hasOtherSubtasks = availableTasks.some(st =>
                            st.parent_task_id === t.id && st.id !== task?.id
                          );
                          if (hasOtherSubtasks) return false;
                          return true;
                        })
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                    <span className={styles.detailHint}>
                      Makes this task a subtask of the selected parent task.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

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
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <ActivityIcon size={16} />
                  Activity
                  <button
                    type="button"
                    className={`${styles.sectionToggleIcon} ${isActivityCollapsed ? styles.sectionToggleIconCollapsed : ''}`}
                    onClick={() => setIsActivityCollapsed(prev => !prev)}
                    aria-label={isActivityCollapsed ? 'Expand activity log' : 'Collapse activity log'}
                  >
                    <ChevronDown size={16} />
                  </button>
                </h3>
              </div>
              {!isActivityCollapsed && (
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
              )}
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
            <div>
              {(() => {
                const { datePart, timePart } = formatDateWithTime(task.created_at);
                const createdBy = task.created_by_profile
                  ? `${task.created_by_profile.first_name} ${task.created_by_profile.last_name}`
                  : 'Unknown';
                return (
                  <>Created by {createdBy} on {datePart} at {timePart}</>
                );
              })()}
            </div>
            <div>Last updated {formatDateTime(task.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <ConfirmationModal
          isOpen={showErrorModal}
          title={errorTitle}
          message={errorMessage}
          confirmText="OK"
          cancelText=""
          onConfirm={() => setShowErrorModal(false)}
          onCancel={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
}
