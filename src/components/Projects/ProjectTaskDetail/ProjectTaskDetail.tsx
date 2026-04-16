'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  X,
  Trash2,
  Download,
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
  ExternalLink,
} from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import { ImageLightbox } from '@/components/Common/ImageLightbox/ImageLightbox';
import { createClient } from '@/lib/supabase/client';
import { sanitizeFileName } from '@/lib/storage-utils';
import {
  ProjectTask,
  taskPriorityOptions,
  ProjectCategory,
  ProjectDepartment,
} from '@/types/project';
import CommentReactions from '@/components/shared/CommentReactions/CommentReactions';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { formatProjectShortcode } from '@/lib/formatProjectShortcode';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { scheduleScrollToElementById } from '@/lib/scroll-utils';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';
import styles from './ProjectTaskDetail.module.scss';

interface MentionUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  uploaded_avatar_url?: string | null;
}

interface ProjectTaskDetailProps {
  task: ProjectTask | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onUpdateRelatedTask?: (
    taskId: string,
    updates: Partial<ProjectTask>
  ) => Promise<void>;
  onDelete: () => void;
  onAddComment: (comment: string) => Promise<any | null>;
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
  monthlyServiceDepartments?: Array<{
    id: string;
    name: string;
    icon?: string;
  }>; // For monthly service tasks
  departments?: ProjectDepartment[];
  mentionUsers?: MentionUser[]; // Users available for @mentions
  currentUserId?: string; // Current user's ID for checking comment ownership
  onTaskCommentMentionsRead?: (commentIds: string[]) => void;
  hideContentPieceLink?: boolean;
  onToggleReaction?: (commentId: string, emoji: string) => void;
  reactionUserMap?: Record<string, string>;
}

type UploadProgressState = {
  active: boolean;
  completed: number;
  total: number;
};

const EMPTY_UPLOAD_PROGRESS: UploadProgressState = {
  active: false,
  completed: 0,
  total: 0,
};

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
  monthlyServiceDepartments = [],
  departments = [],
  mentionUsers,
  currentUserId,
  onTaskCommentMentionsRead,
  hideContentPieceLink,
  onToggleReaction,
  reactionUserMap,
}: ProjectTaskDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [commentUploadProgress, setCommentUploadProgress] =
    useState<UploadProgressState>(EMPTY_UPLOAD_PROGRESS);
  const [isDraggingOverCommentComposer, setIsDraggingOverCommentComposer] = useState(false);
  const commentComposerDragCounterRef = useRef(0);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [currentLightboxImages, setCurrentLightboxImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [titleDraft, setTitleDraft] = useState(task?.title || '');
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const [priorityDraft, setPriorityDraft] = useState(
    task?.priority || 'medium'
  );
  const [assignedToDraft, setAssignedToDraft] = useState(
    task?.assigned_to || ''
  );
  const [dueDateDraft, setDueDateDraft] = useState('');
  const [, setStartDateDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState(
    task?.description || ''
  );
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isUpdatingComplete, setIsUpdatingComplete] = useState(false);
  const [isActivityCollapsed, setIsActivityCollapsed] = useState(true);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [blocksTaskId, setBlocksTaskId] = useState<string>('');
  const [blockedByTaskId, setBlockedByTaskId] = useState<string>('');
  const [monthlyServiceDepartmentId, setMonthlyServiceDepartmentId] =
    useState<string>('');
  const [isUpdatingDepartment, setIsUpdatingDepartment] = useState(false);
  const [contentPieceId, setContentPieceId] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [isUpdatingContentType, setIsUpdatingContentType] = useState(false);
  const [contentPieceTopicDraft, setContentPieceTopicDraft] = useState<string>('');
  const [contentPieceTitleDraft, setContentPieceTitleDraft] = useState<string>('');
  const [contentPieceLinkDraft, setContentPieceLinkDraft] = useState<string>('');
  const [departmentDraft, setDepartmentDraft] = useState(
    task?.department_id || ''
  );
  const [blockedTaskDepartmentDraft, setBlockedTaskDepartmentDraft] =
    useState('');
  const [parentTaskDraft, setParentTaskDraft] = useState<string>(
    task?.parent_task_id || ''
  );
  const priorityRef = useRef<HTMLDivElement>(null);
  const processedVisibleTaskMentionsRef = useRef<string | null>(null);
  const { refreshNotifications } = useNotificationContext();

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');

  const isAdminRole = (role?: string | null) =>
    role === 'admin' || role === 'super_admin';

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
    if (
      currentAssignee &&
      !filteredUsers.some(u => (u.profiles?.id || u.id) === currentAssignee)
    ) {
      const assignedUser = users.find(
        u => (u.profiles?.id || u.id) === currentAssignee
      );
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
    if (diffMins < 60)
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
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
    setDescriptionDraft(task.description || '');
    setDepartmentDraft(task.department_id || '');
    setIsEditingDescription(false);
    // Set selected categories from task
    const categoryIds = task.categories?.map(cat => cat.id) || [];
    setSelectedCategoryIds(categoryIds.slice(0, 1));

    // Set dependency state
    setBlocksTaskId(task.blocks_task_id || '');
    setBlockedByTaskId(task.blocked_by_task_id || '');

    // Fetch monthly service department assignment if this is a monthly service task
    if ((task as any).monthly_service_id) {
      fetchMonthlyServiceDepartment(task.id);
      fetchContentPiece(task.id, (task as any).monthly_service_id);
    } else {
      setMonthlyServiceDepartmentId('');
      setContentPieceId(null);
      setContentType('');
      setContentPieceTopicDraft('');
      setContentPieceTitleDraft('');
      setContentPieceLinkDraft('');
    }
    setParentTaskDraft(task.parent_task_id || '');
    setIsActivityCollapsed(true);
    setIsPriorityOpen(false);
  }, [task]);

  const fetchMonthlyServiceDepartment = async (taskId: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        // Extract department from join table
        const departmentAssignment =
          data.monthly_service_task_department_assignments?.[0];
        setMonthlyServiceDepartmentId(
          departmentAssignment?.department_id || ''
        );
      }
    } catch (error) {
      console.error('Error fetching monthly service department:', error);
    }
  };

  const fetchContentPiece = async (taskId: string, monthlyServiceId: string) => {
    try {
      const response = await fetch(
        `/api/admin/monthly-services/${monthlyServiceId}/content?task_id=${taskId}`
      );
      if (response.ok) {
        const data = await response.json();
        const piece = data.contentPieces?.[0] || null;
        setContentPieceId(piece?.id || null);
        setContentType(piece?.content_type || '');
        setContentPieceTopicDraft(piece?.topic || '');
        setContentPieceTitleDraft(piece?.title || '');
        setContentPieceLinkDraft(piece?.link || '');
      }
    } catch (error) {
      console.error('Error fetching content piece:', error);
    }
  };

  const handleContentTypeChange = async (newType: string) => {
    if (!task) return;
    const monthlyServiceId = (task as any).monthly_service_id;
    if (!monthlyServiceId) return;

    const previousType = contentType;
    setContentType(newType);
    setIsUpdatingContentType(true);

    try {
      if (contentPieceId) {
        // Update existing content piece
        const response = await fetch(
          `/api/admin/monthly-services/${monthlyServiceId}/content/${contentPieceId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content_type: newType || null }),
          }
        );
        if (!response.ok) throw new Error('Failed to update content type');
      } else {
        // Create new content piece linked to this task
        const response = await fetch(
          `/api/admin/monthly-services/${monthlyServiceId}/content`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task_id: task.id,
              content_type: newType || null,
            }),
          }
        );
        if (!response.ok) throw new Error('Failed to create content piece');
        const data = await response.json();
        setContentPieceId(data.contentPiece?.id || null);
      }
    } catch (error) {
      console.error('Error updating content type:', error);
      setContentType(previousType);
    } finally {
      setIsUpdatingContentType(false);
    }
  };

  const handleContentPieceFieldSave = async (
    field: 'topic' | 'title' | 'link',
    value: string
  ) => {
    if (!task) return;
    const monthlyServiceId = (task as any).monthly_service_id;
    if (!monthlyServiceId) return;
    // Nothing to save and no record to create
    if (!value && !contentPieceId) return;

    try {
      if (!contentPieceId) {
        // No content piece yet — create one with this field value included
        const response = await fetch(
          `/api/admin/monthly-services/${monthlyServiceId}/content`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: task.id, [field]: value }),
          }
        );
        if (!response.ok) throw new Error('Failed to create content piece');
        const data = await response.json();
        const newId = data.contentPiece?.id || null;
        if (newId) setContentPieceId(newId);
      } else {
        // Existing content piece — just PATCH the field
        await fetch(
          `/api/admin/monthly-services/${monthlyServiceId}/content/${contentPieceId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value || null }),
          }
        );
      }
    } catch (error) {
      console.error(`Error saving content piece ${field}:`, error);
    }
  };

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
      if (
        priorityRef.current &&
        !priorityRef.current.contains(event.target as Node)
      ) {
        setIsPriorityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPriorityOpen]);

  useEffect(() => {
    if (!highlightedCommentId) return;

    return scheduleScrollToElementById(`task-comment-${highlightedCommentId}`, {
      topOffset: 24,
    });
  }, [highlightedCommentId, task?.id, task?.comments?.length]);

  const markVisibleTaskMentionsAsRead = useCallback(
    async (commentIds: string[]) => {
      if (commentIds.length === 0) return;

      try {
        const response = await fetch(
          '/api/notifications/mentions/read-by-reference',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referenceType: 'task_comment',
              referenceIds: commentIds,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            'Error marking task mentions as read:',
            await response.text()
          );
          return;
        }

        const data = await response.json().catch(() => null);
        if (data?.markedCount > 0) {
          onTaskCommentMentionsRead?.(commentIds);
          await refreshNotifications();
        }
      } catch (error) {
        console.error('Error marking task mentions as read:', error);
      }
    },
    [onTaskCommentMentionsRead, refreshNotifications]
  );

  useEffect(() => {
    if (!task?.id || !Array.isArray(task.comments) || task.comments.length === 0) {
      return;
    }

    const commentIds = task.comments
      .map((comment) => comment.id)
      .filter((id): id is string => Boolean(id));

    if (commentIds.length === 0) {
      return;
    }

    const commentSignature = task.comments
      .map((comment) => `${comment.id}:${comment.updated_at}`)
      .join('|');
    const nextKey = `${task.id}:${commentSignature}`;

    if (processedVisibleTaskMentionsRef.current === nextKey) {
      return;
    }

    processedVisibleTaskMentionsRef.current = nextKey;
    void markVisibleTaskMentionsAsRead(commentIds);
  }, [markVisibleTaskMentionsAsRead, task?.comments, task?.id]);

  // Helper function for validating rich text content
  const isRichTextEmpty = (html: string): boolean => {
    const stripped = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    return stripped.length === 0;
  };

  // Comment editing callbacks
  const handleStartEditComment = useCallback((comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
  }, []);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleUpdateComment = useCallback(async () => {
    if (!task || !editingCommentId) return;

    if (isRichTextEmpty(editingCommentText)) {
      alert('Comment cannot be empty.');
      return;
    }

    setIsUpdatingComment(true);
    try {
      const response = await fetch(`/api/admin/tasks/${task.id}/comments/${editingCommentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editingCommentText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      // Trigger a refresh by calling onUpdate with empty updates
      // This will cause the parent component to refetch the task data
      await onUpdate(task.id, {});

      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    } finally {
      setIsUpdatingComment(false);
    }
  }, [editingCommentId, editingCommentText, task, onUpdate]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!task) return;
    if (!confirm('Delete this comment? This action cannot be undone.')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      const response = await fetch(`/api/admin/tasks/${task.id}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Trigger a refresh by calling onUpdate with empty updates
      await onUpdate(task.id, {});

      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentText('');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setDeletingCommentId(null);
    }
  }, [editingCommentId, task, onUpdate]);

  // File attachment handlers
  const handleCommentFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setPendingAttachments(prev => [...prev, ...newFiles]);
      event.target.value = ''; // Reset so same file can be selected again
    }
  }, []);

  const removeCommentAttachment = useCallback((index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCommentComposerDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commentComposerDragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOverCommentComposer(true);
    }
  }, []);

  const handleCommentComposerDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commentComposerDragCounterRef.current--;
    if (commentComposerDragCounterRef.current === 0) {
      setIsDraggingOverCommentComposer(false);
    }
  }, []);

  const handleCommentComposerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleCommentComposerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commentComposerDragCounterRef.current = 0;
    setIsDraggingOverCommentComposer(false);

    // Allowed file types for attachments
    const allowedTypes = [
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(file => allowedTypes.includes(file.type));

      if (validFiles.length > 0) {
        setPendingAttachments(prev => [...prev, ...validFiles]);
      }

      if (validFiles.length < droppedFiles.length) {
        alert('Some files were not added (unsupported file type)');
      }
    }
  }, []);

  // Image lightbox handlers
  const handleDownloadCommentAttachment = useCallback(async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  }, []);

  const handleCommentImageClick = useCallback((commentImages: Array<{ id: string; url: string; name: string }>, imageId: string) => {
    const index = commentImages.findIndex(img => img.id === imageId);
    if (index !== -1) {
      setCurrentLightboxImages(commentImages);
      setLightboxImageIndex(index);
      setLightboxOpen(true);
    }
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
    setCurrentLightboxImages([]);
  }, []);

  const handleNavigateLightbox = useCallback((index: number) => {
    setLightboxImageIndex(index);
  }, []);

  const getActivityMessage = (activity: any): string => {
    const priorityLabel = (priority: string) =>
      taskPriorityOptions.find(p => p.value === priority)?.label || priority;

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

  const commentUploadPercent =
    commentUploadProgress.total > 0
      ? Math.round(
          (commentUploadProgress.completed / commentUploadProgress.total) * 100
        )
      : 0;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRichTextEmpty(newComment) && pendingAttachments.length === 0) return;

    setIsSubmittingComment(true);
    try {
      // Create comment and get the ID back immediately
      const createdComment = await onAddComment(newComment);

      if (!createdComment || !createdComment.id) {
        throw new Error('Failed to create comment');
      }

      // Upload attachments if any
      if (pendingAttachments.length > 0) {
        const supabase = createClient();
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        setCommentUploadProgress({
          active: true,
          completed: 0,
          total: pendingAttachments.length,
        });

        const uploadResults = await Promise.allSettled(
          pendingAttachments.map(async (file) => {
            if (file.size > MAX_FILE_SIZE) {
              throw new Error(`File "${file.name}" exceeds 50MB limit`);
            }

            const timestamp = Date.now();
            const sanitizedName = sanitizeFileName(file.name);
            const filePath = `comment-attachments/tasks/${task.id}/${createdComment.id}/${timestamp}-${sanitizedName}`;

            const { error: uploadError } = await supabase.storage
              .from('brand-assets')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              throw new Error(
                `Failed to upload "${file.name}": ${uploadError.message}`
              );
            }

            setCommentUploadProgress((prev) => ({
              ...prev,
              completed: Math.min(prev.total, prev.completed + 1),
            }));

            return {
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            };
          })
        );

        const fileMetadata = uploadResults
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<{
              file_path: string;
              file_name: string;
              file_size: number;
              mime_type: string;
            }> => result.status === 'fulfilled'
          )
          .map((result) => result.value);

        const firstFailedUpload = uploadResults.find(
          (result) => result.status === 'rejected'
        );

        if (firstFailedUpload) {
          if (fileMetadata.length > 0) {
            await supabase.storage
              .from('brand-assets')
              .remove(fileMetadata.map((file) => file.file_path));
          }
          const reason = (firstFailedUpload as PromiseRejectedResult).reason;
          throw reason instanceof Error
            ? reason
            : new Error('Failed to upload one or more attachments');
        }

        // Save metadata via API
        const attachmentResponse = await fetch(
          `/api/admin/tasks/${task.id}/comments/${createdComment.id}/attachments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: fileMetadata }),
          }
        );

        if (!attachmentResponse.ok) {
          // Clean up uploaded files if metadata save fails
          for (const metadata of fileMetadata) {
            await supabase.storage.from('brand-assets').remove([metadata.file_path]);
          }
          throw new Error('Failed to save attachment metadata');
        }
      }

      setNewComment('');
      setPendingAttachments([]);
      // Final refresh to show attachments
      await onUpdate(task.id, {});
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
      setCommentUploadProgress(EMPTY_UPLOAD_PROGRESS);
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this task? This will also delete all subtasks and comments.'
      )
    ) {
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

  const handleTitleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
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

  const handleDateChange = async (
    field: 'due_date',
    value: string
  ) => {
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
    }
  };

  const handleMonthlyServiceDepartmentChange = async (departmentId: string) => {
    const previousValue = monthlyServiceDepartmentId;
    setMonthlyServiceDepartmentId(departmentId);
    setIsUpdatingDepartment(true);
    try {
      const response = await fetch(
        `/api/admin/tasks/${task.id}/monthly-service-department`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ department_id: departmentId || null }),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to update department');
      }

      // Trigger parent refresh by calling onUpdate with empty updates
      // This will cause MonthlyServiceDetail to refetch the service data and update department groupings
      await onUpdate(task.id, {});
    } catch (error) {
      console.error('Error updating monthly service department:', error);
      alert('Failed to update department. Please try again.');
      setMonthlyServiceDepartmentId(previousValue);
    } finally {
      setIsUpdatingDepartment(false);
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
      const updates: Partial<ProjectTask> = {
        blocked_by_task_id: taskId || null,
      };
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
      await updateRelated(blocksTaskId, {
        department_id: departmentId || null,
      });
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
      await onUpdate(task.id, {
        description: nextDescription ? descriptionDraft : null,
      });
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
    if (
      !task.is_completed &&
      task.blocked_by_task &&
      !task.blocked_by_task.is_completed
    ) {
      setErrorTitle('Cannot Complete Task');
      setErrorMessage(
        `This task is blocked by "${task.blocked_by_task.title}". Please complete the blocking task first.`
      );
      setShowErrorModal(true);
      return;
    }

    // Check if task has incomplete subtasks
    if (!task.is_completed && task.subtasks && task.subtasks.length > 0) {
      const incompleteSubtasks = task.subtasks.filter(
        subtask => !subtask.is_completed
      );
      if (incompleteSubtasks.length > 0) {
        const subtaskList = incompleteSubtasks
          .map(st => `• ${st.title}`)
          .join('\n');
        setErrorTitle('Cannot Complete Task');
        setErrorMessage(
          `This task has ${incompleteSubtasks.length} incomplete subtask${incompleteSubtasks.length > 1 ? 's' : ''}:\n\n${subtaskList}\n\nPlease complete all subtasks first.`
        );
        setShowErrorModal(true);
        return;
      }
    }

    setIsUpdatingComplete(true);
    try {
      await onUpdate(task.id, { is_completed: !task.is_completed });
    } catch (error) {
      console.error('Error updating completion:', error);
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to update task';
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
    const isCurrentlySelected =
      !isNoneOption && selectedCategoryIds.includes(categoryId);
    const newSelectedIds = isNoneOption
      ? []
      : isCurrentlySelected
        ? []
        : [categoryId];

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
    <>
      {/* Image Lightbox */}
      {lightboxOpen && currentLightboxImages.length > 0 && (
        <ImageLightbox
          images={currentLightboxImages}
          currentIndex={lightboxImageIndex}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigateLightbox}
        />
      )}

      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.sidebar} onClick={e => e.stopPropagation()}>
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
                  onClick={() => setIsPriorityOpen(prev => !prev)}
                  style={{
                    borderColor: taskPriorityOptions.find(
                      option => option.value === priorityDraft
                    )?.color,
                    color: taskPriorityOptions.find(
                      option => option.value === priorityDraft
                    )?.color,
                  }}
                  aria-label="Change priority"
                >
                  <Flag size={14} />
                  <span className={styles.priorityButtonText}>
                    {taskPriorityOptions.find(
                      option => option.value === priorityDraft
                    )?.label || 'Priority'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={isPriorityOpen ? styles.priorityChevronOpen : ''}
                  />
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
                  : task.monthly_service_id
                    ? 'Monthly Service'
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
                task.blocked_by_task && !task.blocked_by_task.is_completed
                  ? styles.completeToggleBlocked
                  : ''
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
              onChange={e => setTitleDraft(e.target.value)}
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
                onKeyDown={event => {
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
                  <div
                    className={`${styles.description} ${styles.richTextContent} ${styles.descriptionPlaceholder}`}
                  >
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
                  onChange={e => handleAssignedToChange(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category - only show for project tasks, not monthly service tasks */}
              {!(task as any)?.monthly_service_id && (
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>
                    <Tag size={14} />
                    Category
                  </div>
                  <select
                    className={styles.editSelect}
                    value={selectedCategoryIds[0] || ''}
                    onChange={e => handleCategoryChange(e.target.value || null)}
                  >
                    <option value="">No Category</option>
                    {availableCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Monthly Service Department - only show for monthly service tasks */}
              {(task as any)?.monthly_service_id &&
                monthlyServiceDepartments.length > 0 && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>
                      <Tag size={14} />
                      MS Department
                    </div>
                    <select
                      className={styles.editSelect}
                      value={monthlyServiceDepartmentId}
                      onChange={e =>
                        handleMonthlyServiceDepartmentChange(e.target.value)
                      }
                      disabled={isUpdatingDepartment}
                    >
                      <option value="">No Department</option>
                      {monthlyServiceDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              {/* Content Type - only show when MS Department is Content */}
              {(task as any)?.monthly_service_id &&
                monthlyServiceDepartments.find(
                  d => d.id === monthlyServiceDepartmentId && d.name === 'Content'
                ) && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>
                      <Layers size={14} />
                      Content Type
                    </div>
                    <select
                      className={styles.editSelect}
                      value={contentType}
                      onChange={e => handleContentTypeChange(e.target.value)}
                      disabled={isUpdatingContentType}
                    >
                      <option value="">Select type...</option>
                      <option value="blog">Blog</option>
                      <option value="evergreen">Evergreen</option>
                      <option value="location">Location</option>
                      <option value="pillar">Pillar</option>
                      <option value="cluster">Cluster</option>
                      <option value="pest_id">Pest ID</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

              {(task as any)?.monthly_service_id &&
                monthlyServiceDepartments.find(
                  d => d.id === monthlyServiceDepartmentId && d.name === 'Content'
                ) && (
                  <>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Topic</div>
                      <input
                        type="text"
                        className={styles.editInput}
                        value={contentPieceTopicDraft}
                        onChange={e => setContentPieceTopicDraft(e.target.value)}
                        onBlur={() => handleContentPieceFieldSave('topic', contentPieceTopicDraft)}
                        placeholder="Enter topic..."
                      />
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Title</div>
                      <input
                        type="text"
                        className={styles.editInput}
                        value={contentPieceTitleDraft}
                        onChange={e => setContentPieceTitleDraft(e.target.value)}
                        onBlur={() => handleContentPieceFieldSave('title', contentPieceTitleDraft)}
                        placeholder="Enter title..."
                      />
                    </div>
                    <div className={styles.detailItemFullWidth}>
                      <div className={styles.detailLabel}>URL</div>
                      <input
                        type="text"
                        className={styles.editInput}
                        value={contentPieceLinkDraft}
                        onChange={e => setContentPieceLinkDraft(e.target.value)}
                        onBlur={() => handleContentPieceFieldSave('link', contentPieceLinkDraft)}
                        placeholder="https://..."
                      />
                    </div>
                    {contentPieceId && !hideContentPieceLink && (
                      <div className={styles.detailItemFullWidth}>
                        <a
                          href={`/admin/content-pieces/${contentPieceId}`}
                          className={styles.contentPieceLink}
                        >
                          <ExternalLink size={13} />
                          View full content piece
                        </a>
                      </div>
                    )}
                    {hideContentPieceLink && (task as any)?.monthly_service_id && (
                      <div className={styles.detailItemFullWidth}>
                        <a
                          href={`/admin/monthly-services/${(task as any).monthly_service_id}`}
                          className={styles.contentPieceLink}
                        >
                          <ExternalLink size={13} />
                          View monthly service
                        </a>
                      </div>
                    )}
                  </>
                )}

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Calendar size={14} />
                  Due Date
                </div>
                <input
                  type="date"
                  className={styles.editInput}
                  value={dueDateDraft}
                  onChange={e => handleDateChange('due_date', e.target.value)}
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
                    onChange={e => handleBlocksTaskChange(e.target.value)}
                  >
                    <option value="">None</option>
                    {availableTasks
                      .filter(
                        t => t.id !== task?.id && t.id !== blockedByTaskId
                      )
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
                      onChange={e =>
                        handleBlockedTaskDepartmentChange(e.target.value)
                      }
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
                    onChange={e => handleBlockedByTaskChange(e.target.value)}
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
                      onChange={e => handleDepartmentChange(e.target.value)}
                    >
                      <option value="">Stay where it is</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <span className={styles.detailHint}>
                      If set, the project will move when the blocking task
                      completes.
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
                      onChange={e => handleParentTaskChange(e.target.value)}
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
                          const hasOtherSubtasks = availableTasks.some(
                            st =>
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
            <form
              onSubmit={handleSubmitComment}
              className={styles.commentForm}
              onDragEnter={handleCommentComposerDragEnter}
              onDragLeave={handleCommentComposerDragLeave}
              onDragOver={handleCommentComposerDragOver}
              onDrop={handleCommentComposerDrop}
            >
              <div className={styles.commentInputWrapper}>
                <RichTextEditor
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Add a comment... Use @ to mention someone"
                  className={styles.commentRichEditor}
                  compact
                  mentionUsers={mentionUsers}
                />
                {pendingAttachments.length > 0 && (
                  <div className={styles.pendingAttachments}>
                    {pendingAttachments.map((file, index) => (
                      <div key={`${file.name}-${index}`} className={styles.pendingAttachment}>
                        <span className={styles.pendingAttachmentName}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeCommentAttachment(index)}
                          className={styles.removeAttachmentButton}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {commentUploadProgress.active && (
                  <div className={styles.uploadProgressContainer}>
                    <div className={styles.uploadProgressLabel}>
                      Uploading attachments {commentUploadProgress.completed}/
                      {commentUploadProgress.total} ({commentUploadPercent}%)
                    </div>
                    <div className={styles.uploadProgressBar}>
                      <div
                        className={styles.uploadProgressFill}
                        style={{ width: `${commentUploadPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={commentFileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleCommentFileSelect}
                className={styles.hiddenFileInput}
              />
              <button
                type="button"
                className={styles.attachButton}
                onClick={() => commentFileInputRef.current?.click()}
                title="Attach file"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M15.75 8.25L9.31 14.69C8.5 15.49 7.41 15.94 6.28 15.94C5.14 15.94 4.05 15.49 3.25 14.69C2.44 13.88 1.99 12.79 1.99 11.66C1.99 10.52 2.44 9.43 3.25 8.62L9.69 2.18C10.22 1.65 10.95 1.35 11.7 1.35C12.46 1.35 13.19 1.65 13.72 2.18C14.26 2.72 14.56 3.45 14.56 4.2C14.56 4.96 14.26 5.69 13.72 6.22L7.28 12.66C7.01 12.93 6.65 13.08 6.27 13.08C5.89 13.08 5.53 12.93 5.26 12.66C4.99 12.39 4.84 12.03 4.84 11.65C4.84 11.27 4.99 10.91 5.26 10.64L11.32 4.58"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="submit"
                disabled={isSubmittingComment || (isRichTextEmpty(newComment) && pendingAttachments.length === 0)}
                className={styles.commentSubmitButton}
              >
                {isSubmittingComment
                  ? commentUploadProgress.active
                    ? `Uploading ${commentUploadPercent}%`
                    : 'Posting...'
                  : 'Post Comment'}
              </button>
            </form>

            {/* Comments List */}
            {task.comments && task.comments.length > 0 && (
              <div className={styles.comments}>
                {task.comments.map(comment => {
                  const isCommentOwner = currentUserId && comment.user_id === currentUserId;
                  const isEditing = editingCommentId === comment.id;
                  const isEdited = comment.updated_at && comment.created_at !== comment.updated_at;

                  return (
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
                            firstName={
                              comment.user_profile?.first_name || undefined
                            }
                            lastName={
                              comment.user_profile?.last_name || undefined
                            }
                            email={comment.user_profile?.email || ''}
                            avatarUrl={comment.user_profile?.uploaded_avatar_url || comment.user_profile?.avatar_url || null}
                            size="small"
                            showTooltip={true}
                          />
                          <div className={styles.commentAuthor}>
                            {comment.user_profile?.first_name}{' '}
                            {comment.user_profile?.last_name}
                          </div>
                        </div>
                        <div className={styles.commentHeaderRight}>
                          <div className={styles.commentDate}>
                            {formatDateTime(comment.created_at)}
                            {isEdited && (
                              <span className={styles.commentEdited}> (edited)</span>
                            )}
                          </div>
                          {isCommentOwner && (
                            <div className={styles.commentActions}>
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className={styles.commentActionButton}
                                    onClick={handleUpdateComment}
                                    aria-label="Save comment"
                                    disabled={isUpdatingComment || isRichTextEmpty(editingCommentText)}
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.commentActionButton}
                                    onClick={handleCancelEditComment}
                                    aria-label="Cancel edit"
                                    disabled={isUpdatingComment}
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={styles.commentActionButton}
                                    onClick={() => handleStartEditComment(comment)}
                                    aria-label="Edit comment"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.commentActionButton} ${styles.commentActionDanger}`}
                                    onClick={() => handleDeleteComment(comment.id)}
                                    aria-label="Delete comment"
                                    disabled={deletingCommentId === comment.id}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <RichTextEditor
                          value={editingCommentText}
                          onChange={setEditingCommentText}
                          placeholder="Edit comment..."
                          className={styles.commentEditRichEditor}
                          compact
                          mentionUsers={mentionUsers}
                        />
                      ) : (
                        <>
                          <div
                            className={styles.commentText}
                            dangerouslySetInnerHTML={{ __html: comment.comment }}
                          />
                          {comment.attachments && comment.attachments.length > 0 && (() => {
                            const imageAttachments = comment.attachments.filter(
                              (attachment: { mime_type?: string | null }) =>
                                attachment.mime_type?.startsWith('image/')
                            );
                            const fileAttachments = comment.attachments.filter(
                              (attachment: { mime_type?: string | null }) =>
                                !attachment.mime_type?.startsWith('image/')
                            );

                            const commentLightboxImages = imageAttachments.map((att: any) => ({
                              id: att.id,
                              url: att.url,
                              name: att.file_name
                            }));

                            return (
                              <>
                                {imageAttachments.length > 0 && (
                                  <div className={styles.commentImages}>
                                    {imageAttachments.map((attachment: { id: string; url: string; file_name: string }) => (
                                      <div
                                        key={attachment.id}
                                        className={styles.commentImage}
                                        onClick={() => handleCommentImageClick(commentLightboxImages, attachment.id)}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={attachment.file_name}
                                          loading="lazy"
                                        />
                                        <button
                                          className={styles.commentImageDownload}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadCommentAttachment(attachment.url, attachment.file_name);
                                          }}
                                          aria-label="Download image"
                                        >
                                          <Download size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {fileAttachments.length > 0 && (
                                  <div className={styles.commentAttachments}>
                                    {fileAttachments.map((attachment: { id: string; url: string; file_name: string; mime_type?: string | null }) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.commentFile}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                          <path
                                            d="M9.33333 1.33334H4C3.46957 1.33334 2.96086 1.54405 2.58579 1.91913C2.21071 2.2942 2 2.80291 2 3.33334V12.6667C2 13.1971 2.21071 13.7058 2.58579 14.0809C2.96086 14.456 3.46957 14.6667 4 14.6667H12C12.5304 14.6667 13.0391 14.456 13.4142 14.0809C13.7893 13.7058 14 13.1971 14 12.6667V6L9.33333 1.33334Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M9.33333 1.33334V6H14"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                        <span>{attachment.file_name}</span>
                                        <button
                                          className={styles.commentFileDownload}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDownloadCommentAttachment(attachment.url, attachment.file_name);
                                          }}
                                          aria-label="Download file"
                                        >
                                          <Download size={13} />
                                        </button>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                      {onToggleReaction && currentUserId && (
                        <CommentReactions
                          reactions={comment.reactions || []}
                          currentUserId={currentUserId}
                          onToggle={(emoji) => onToggleReaction(comment.id, emoji)}
                          userMap={reactionUserMap}
                        />
                      )}
                    </div>
                  );
                })}
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
                    aria-label={
                      isActivityCollapsed
                        ? 'Expand activity log'
                        : 'Collapse activity log'
                    }
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
                            {activity.user_profile?.first_name}{' '}
                            {activity.user_profile?.last_name}
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
                const { datePart, timePart } = formatDateWithTime(
                  task.created_at
                );
                const createdBy = task.created_by_profile
                  ? `${task.created_by_profile.first_name} ${task.created_by_profile.last_name}`
                  : 'Unknown';
                return (
                  <>
                    Created by {createdBy} on {datePart} at {timePart}
                  </>
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
    </>
  );
}
