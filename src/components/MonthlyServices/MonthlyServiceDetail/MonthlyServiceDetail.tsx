'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { usePageActions } from '@/contexts/PageActionsContext';
import { createClient } from '@/lib/supabase/client';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Settings, ChevronDown, Check, Pencil, Trash2, X } from 'lucide-react';
import { MonthlyServiceForm } from '@/components/MonthlyServices/MonthlyServiceForm/MonthlyServiceForm';
import ProjectTaskList from '@/components/Projects/ProjectTaskList/ProjectTaskList';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { Toast } from '@/components/Common/Toast';
import { ProjectTask } from '@/types/project';
import { useStarredItems } from '@/hooks/useStarredItems';
import { useUser } from '@/hooks/useUser';
import styles from './MonthlyServiceDetail.module.scss';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  week_of_month: number | null;
  due_day_of_week: number | null;
  recurrence_frequency: string | null;
  display_order: number;
  default_assigned_to: string | null;
  profiles: Profile | null;
}

interface MonthlyServiceTask {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: string | null;
  due_date: string;
  assigned_to: string | null;
  profiles: Profile | null;
}

interface CommentAttachment {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
  created_at: string;
}

interface MonthlyServiceComment {
  id: string;
  monthly_service_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
  attachments?: CommentAttachment[];
}

interface WeekProgress {
  week: number;
  completed: number;
  total: number;
  percentage: number;
  tasks: MonthlyServiceTask[];
}

interface Service {
  id: string;
  service_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_id: string;
  companies: Company;
  templates: TaskTemplate[];
  weekProgress: WeekProgress[];
}

interface MonthlyServiceDetailProps {
  service: Service;
  user: User;
  onServiceUpdate: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  cancelled: '#EF4444',
};

export function MonthlyServiceDetail({
  service,
  user,
  onServiceUpdate,
}: MonthlyServiceDetailProps) {
  const router = useRouter();
  const { setPageHeader } = usePageActions();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedMonthDayjs, setSelectedMonthDayjs] = useState<Dayjs | null>(
    () => dayjs()
  );
  const [serviceData, setServiceData] = useState<Service>(service);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const { isStarred, toggleStar } = useStarredItems();

  // Comments state
  const [comments, setComments] = useState<MonthlyServiceComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [commentAvatarError, setCommentAvatarError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const dragCounterRef = useRef(0);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const { getAvatarUrl, getDisplayName, getInitials } = useUser();

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    };
  };

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/companies', { headers });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/users?include_system=true', {
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch service data when month changes
  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
          { headers }
        );
        if (response.ok) {
          const data = await response.json();
          setServiceData(data.service);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [selectedMonth, service.id]);

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: serviceData.service_name,
      description: `${serviceData.companies.name} • Monthly Service Management`,
      customActions: (
        <div className={styles.headerActions}>
          <div className={styles.monthSelector}>
            <label htmlFor="month-select" className={styles.monthLabel}>
              Month:
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={selectedMonthDayjs}
                onChange={handleMonthChange}
                views={['year', 'month']}
                slotProps={{
                  textField: {
                    size: 'small',
                    className: styles.monthInput,
                  },
                }}
              />
            </LocalizationProvider>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className={styles.editButton}
          >
            <Settings size={18} />
            Edit Service
          </button>
        </div>
      ),
    });

    return () => setPageHeader(null);
  }, [setPageHeader, serviceData, router, selectedMonthDayjs]);

  // Fetch comments for the selected month
  const fetchComments = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/admin/monthly-services/${service.id}/comments?month=${selectedMonth}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [service.id, selectedMonth]);

  useEffect(() => {
    fetchComments();
    // Clear comment input when month changes
    setNewComment('');
    setPendingAttachments([]);
  }, [fetchComments]);

  // Convert users to mention format for RichTextEditor
  const mentionUsers = useMemo(() => {
    return users.map(u => ({
      id: u.id,
      first_name: u.first_name || null,
      last_name: u.last_name || null,
      email: u.email || null,
      avatar_url: null,
    }));
  }, [users]);

  const handleMonthChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setSelectedMonthDayjs(newValue);
      const monthStr = `${newValue.year()}-${String(newValue.month() + 1).padStart(2, '0')}`;
      setSelectedMonth(monthStr);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isRichTextEmpty = (html: string) => {
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return textContent.length === 0;
  };

  const getCommentHtml = useCallback(
    (html: string) => {
      if (typeof window === 'undefined') return html;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const mentionNodes = doc.querySelectorAll('span[data-type="mention"]');
        mentionNodes.forEach((node) => {
          const id = node.getAttribute('data-id');
          if (id && id === user.id) {
            node.setAttribute('data-mention-self', 'true');
          } else {
            node.removeAttribute('data-mention-self');
          }
        });
        return doc.body.innerHTML;
      } catch (error) {
        return html;
      }
    },
    [user.id]
  );

  const convertToProjectTask = (task: MonthlyServiceTask): ProjectTask => {
    return {
      id: task.id,
      project_id: null,
      parent_task_id: null,
      title: task.title,
      description: task.description,
      notes: null,
      is_completed: task.is_completed,
      completed_at: task.is_completed ? new Date().toISOString() : null,
      priority: (task.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      assigned_to: task.assigned_to,
      created_by: user.id,
      due_date: task.due_date,
      start_date: null,
      progress_percentage: task.is_completed ? 100 : 0,
      actual_hours: null,
      blocked_by: null,
      blocking: null,
      blocker_reason: null,
      display_order: 0,
      recurring_frequency: null,
      recurring_end_date: null,
      parent_recurring_task_id: null,
      is_recurring_template: false,
      next_recurrence_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_to_profile: task.profiles ? {
        id: task.profiles.id,
        first_name: task.profiles.first_name || '',
        last_name: task.profiles.last_name || '',
        email: task.profiles.email,
        avatar_url: undefined,
      } : null,
    };
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_completed: isCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh service data
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setServiceData(data.service);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<ProjectTask>
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh service data
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setServiceData(data.service);
      }

      // Update selected task if it's the one being edited
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Close detail panel if this task was selected
      if (selectedTask?.id === taskId) {
        setIsTaskDetailOpen(false);
        setSelectedTask(null);
      }

      // Refresh service data
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setServiceData(data.service);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const handleServiceSubmit = async (data: any) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/admin/monthly-services/${service.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update service');
    }

    // Refresh service data
    const refreshResponse = await fetch(
      `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
      { headers }
    );
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      setServiceData(data.service);
    }

    // Notify parent
    onServiceUpdate();
  };

  // Comment handlers
  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isRichTextEmpty(newComment) && pendingAttachments.length === 0) return;

    setIsSubmittingComment(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/monthly-services/${service.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          comment: newComment,
          month: selectedMonth,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const comment = await response.json();

      if (pendingAttachments.length > 0) {
        const formData = new FormData();
        pendingAttachments.forEach(file => formData.append('files', file));

        const attachmentResponse = await fetch(
          `/api/admin/monthly-services/${service.id}/comments/${comment.id}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (attachmentResponse.ok) {
          const uploadedAttachments = await attachmentResponse.json();
          comment.attachments = uploadedAttachments;
        }
      }

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setPendingAttachments([]);
    } catch (error) {
      console.error('Error posting comment:', error);
      setToastMessage('Failed to post comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStartEditComment = useCallback((comment: MonthlyServiceComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
  }, []);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleUpdateComment = useCallback(async () => {
    if (!editingCommentId) return;
    if (isRichTextEmpty(editingCommentText)) {
      setToastMessage('Comment cannot be empty.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsUpdatingComment(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/monthly-services/${service.id}/comments/${editingCommentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ comment: editingCommentText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const updatedComment = await response.json();
      setComments(prev =>
        prev.map(comment =>
          comment.id === updatedComment.id ? updatedComment : comment
        )
      );
      setEditingCommentId(null);
      setEditingCommentText('');
      setToastMessage('Comment updated.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating comment:', error);
      setToastMessage('Failed to update comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUpdatingComment(false);
    }
  }, [editingCommentId, editingCommentText, service.id]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!confirm('Delete this comment? This action cannot be undone.')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/monthly-services/${service.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setComments(prev => prev.filter(comment => comment.id !== commentId));
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentText('');
      }
      setToastMessage('Comment deleted.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setToastMessage('Failed to delete comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setDeletingCommentId(null);
    }
  }, [editingCommentId, service.id]);

  const handleCommentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setPendingAttachments(prev => [...prev, ...newFiles]);
      event.target.value = '';
    }
  };

  const removeCommentAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);

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
        setToastMessage('Some files were not added (unsupported file type)');
        setToastType('error');
        setShowToast(true);
      }
    }
  }, []);

  const rawAvatarUrl = getAvatarUrl();
  const commentAvatarUrl =
    commentAvatarError || !rawAvatarUrl || rawAvatarUrl === 'null' || rawAvatarUrl === 'undefined'
      ? null
      : rawAvatarUrl;

  return (
    <div
      className={styles.container}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >

      {/* Tasks by Week */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Tasks for {formatMonth(selectedMonth)}
        </h2>
        {loading ? (
          <div className={styles.loading}>Loading tasks...</div>
        ) : (
          <div className={styles.weeksGrid}>
            {serviceData.weekProgress.map(week => (
              <div key={week.week} className={styles.weekCard}>
                <div className={styles.weekHeader}>
                  <h3 className={styles.weekTitle}>Week {week.week}</h3>
                  <span className={styles.weekProgress}>
                    {week.completed} / {week.total}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${week.percentage}%`,
                      backgroundColor:
                        week.percentage === 100 ? '#10B981' : '#3B82F6',
                    }}
                  />
                </div>
                {week.tasks.length === 0 ? (
                  <div className={styles.noTasks}>No tasks for this week</div>
                ) : (
                  <ProjectTaskList
                    tasks={week.tasks.map(convertToProjectTask)}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onToggleStar={(taskId) => toggleStar('task', taskId)}
                    isStarred={(taskId) => isStarred('task', taskId)}
                    showHeader={false}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Service Modal */}
      <MonthlyServiceForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleServiceSubmit}
        companies={companies}
        users={users}
        service={serviceData}
      />

      {/* Comments Section */}
      <div className={styles.commentsSection}>
        <div className={styles.sectionHeader}>
          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setIsCommentsCollapsed(prev => !prev)}
            aria-label={isCommentsCollapsed ? 'Expand comments' : 'Collapse comments'}
          >
            <ChevronDown
              size={18}
              className={isCommentsCollapsed ? styles.sectionChevronCollapsed : undefined}
            />
          </button>
          <h3 className={styles.sectionTitle}>
            Comments <span className={styles.sectionCount}>({comments.length})</span>
          </h3>
        </div>
        {!isCommentsCollapsed && (
          <>
            {comments.length > 0 ? (
              <div className={styles.commentsList}>
                {comments.map(comment => {
                  const authorName = comment.user_profile
                    ? `${comment.user_profile.first_name || ''} ${comment.user_profile.last_name || ''}`.trim() || comment.user_profile.email
                    : 'Unknown';
                  const isCommentOwner = comment.user_id === user.id;
                  const isEditing = editingCommentId === comment.id;
                  const isEdited = Boolean(
                    comment.updated_at &&
                      new Date(comment.updated_at).getTime() !==
                        new Date(comment.created_at).getTime()
                  );
                  return (
                    <div
                      key={comment.id}
                      id={`monthly-service-comment-${comment.id}`}
                      className={styles.commentItem}
                    >
                      <div className={styles.commentMeta}>
                        <MiniAvatar
                          firstName={comment.user_profile?.first_name || undefined}
                          lastName={comment.user_profile?.last_name || undefined}
                          email={comment.user_profile?.email || ''}
                          avatarUrl={comment.user_profile?.avatar_url || null}
                          size="small"
                          showTooltip={true}
                          className={styles.commentAvatarMini}
                        />
                        <div className={styles.commentMetaDetails}>
                          <span className={styles.commentAuthor}>{authorName}</span>
                          <span className={styles.commentDate}>
                            {formatCommentDate(comment.created_at)}
                            {isEdited && (
                              <span className={styles.commentEdited}>edited</span>
                            )}
                          </span>
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
                            dangerouslySetInnerHTML={{ __html: getCommentHtml(comment.comment) }}
                          />
                          {comment.attachments && comment.attachments.length > 0 && (() => {
                            const imageAttachments = comment.attachments.filter(
                              (attachment) =>
                                attachment.mime_type?.startsWith('image/')
                            );
                            const fileAttachments = comment.attachments.filter(
                              (attachment) =>
                                !attachment.mime_type?.startsWith('image/')
                            );

                            return (
                              <>
                                {imageAttachments.length > 0 && (
                                  <div className={styles.commentImageAttachments}>
                                    {imageAttachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.commentImageLink}
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={attachment.file_name}
                                          className={styles.commentImage}
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {fileAttachments.length > 0 && (
                                  <div className={styles.commentAttachments}>
                                    {fileAttachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.attachmentCard}
                                      >
                                        <div className={styles.attachmentIcon}>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path
                                              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </div>
                                        <div className={styles.attachmentInfo}>
                                          <span className={styles.attachmentName}>{attachment.file_name}</span>
                                          {attachment.mime_type === 'application/pdf' && (
                                            <span className={styles.attachmentBadge}>PDF</span>
                                          )}
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.commentsEmpty}>No comments yet.</div>
            )}

            <form onSubmit={handleSubmitComment} className={styles.commentComposer}>
              {commentAvatarUrl ? (
                <Image
                  src={commentAvatarUrl}
                  alt={getDisplayName()}
                  width={32}
                  height={32}
                  className={styles.commentAvatarImage}
                  onError={() => setCommentAvatarError(true)}
                />
              ) : (
                <div className={styles.commentAvatar}>{getInitials()}</div>
              )}
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
                className={styles.commentSubmit}
                disabled={isSubmittingComment || (isRichTextEmpty(newComment) && pendingAttachments.length === 0)}
              >
                Post
              </button>
            </form>
          </>
        )}
      </div>

      {/* Edit Service Modal */}
      <MonthlyServiceForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleServiceSubmit}
        companies={companies}
        users={users}
        service={serviceData}
      />

      {/* Task Detail Panel */}
      {isTaskDetailOpen && selectedTask && (
        <ProjectTaskDetail
          task={selectedTask}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onDelete={() => selectedTask && handleDeleteTask(selectedTask.id)}
          onAddComment={async (comment: string) => {
            // TODO: Implement comment functionality
            console.log('Add comment:', comment);
          }}
          onCreateSubtask={() => {
            // TODO: Implement subtask functionality
            console.log('Create subtask');
          }}
          onUpdateProgress={async (progress: number) => {
            await handleUpdateTask(selectedTask.id, {
              progress_percentage: progress,
            });
          }}
          users={users}
          onToggleStar={(taskId) => toggleStar('task', taskId)}
          isStarred={(taskId) => isStarred('task', taskId)}
        />
      )}

      {/* File Drop Zone Overlay */}
      {isDraggingFile && (
        <div className={styles.dropZoneOverlay}>
          <div className={styles.dropZoneContent}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 32V16M24 16L18 22M24 16L30 22"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M40 32V38C40 39.0609 39.5786 40.0783 38.8284 40.8284C38.0783 41.5786 37.0609 42 36 42H12C10.9391 42 9.92172 41.5786 9.17157 40.8284C8.42143 40.0783 8 39.0609 8 38V32"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.dropZoneText}>Drop files to attach to comment</span>
            <span className={styles.dropZoneSubtext}>Images (JPEG, PNG, WebP) and documents (PDF, Word, Excel)</span>
          </div>
        </div>
      )}

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />
    </div>
  );
}
