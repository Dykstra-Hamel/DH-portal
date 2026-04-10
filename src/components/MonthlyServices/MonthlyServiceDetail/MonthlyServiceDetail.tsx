'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { createClient } from '@/lib/supabase/client';
import { scheduleScrollToElementById } from '@/lib/scroll-utils';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { ArrowLeft, Settings, ChevronDown, Check, Pencil, Trash2, X } from 'lucide-react';
import CommentReactions from '@/components/shared/CommentReactions/CommentReactions';
import { CommentReaction } from '@/types/project';
import { MonthlyServiceForm } from '@/components/MonthlyServices/MonthlyServiceForm/MonthlyServiceForm';
import { BudgetCard } from '@/components/MonthlyServices/BudgetCard/BudgetCard';
import ProjectTaskList from '@/components/Projects/ProjectTaskList/ProjectTaskList';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { Toast } from '@/components/Common/Toast';
import { ProjectTask } from '@/types/project';
import { useStarredItems } from '@/hooks/useStarredItems';
import { useUser } from '@/hooks/useUser';
import headerStyles from '@/components/Layout/GlobalLowerHeader/GlobalLowerHeader.module.scss';
import styles from './MonthlyServiceDetail.module.scss';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

/**
 * Calculate the due date for a task based on week_of_month and due_day_of_week
 * @param year - Year (YYYY)
 * @param month - Month (1-12)
 * @param weekOfMonth - Week of month (1-4)
 * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns ISO date string (YYYY-MM-DD)
 */
function calculateDueDate(
  year: number,
  month: number,
  weekOfMonth: number,
  dayOfWeek: number
): string {
  // Find the first occurrence of the target day of week in the month
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Calculate days to add to get to first occurrence of target day
  let daysToAdd = dayOfWeek - firstDayOfWeek;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }

  // Add weeks to get to the target week
  daysToAdd += (weekOfMonth - 1) * 7;

  const dueDate = new Date(year, month - 1, 1 + daysToAdd);

  // Ensure we didn't overflow into next month
  if (dueDate.getMonth() !== month - 1) {
    // If we overflowed, use the last occurrence of that day in the month
    dueDate.setDate(dueDate.getDate() - 7);
  }

  return dueDate.toISOString().split('T')[0];
}

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
  avatar_url?: string | null;
}

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  week_of_month: number | null;
  due_day_of_week: number | null;
  display_order: number;
  default_assigned_to: string | null;
  department_id: string | null;
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
  monthly_service_task_department_assignments?: {
    department_id: string;
    monthly_services_departments: {
      id: string;
      name: string;
      icon?: string;
    };
  }[];
  comments?: any[];
  activity?: any[];
  hasUnreadComments?: boolean;
  hasUnreadMentions?: boolean;
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
  reactions?: CommentReaction[];
}

interface WeekProgress {
  week: number;
  completed: number;
  total: number;
  percentage: number;
  tasks: MonthlyServiceTask[];
}

interface MonthlyServiceBudget {
  id: string;
  budget_type: 'google_ads' | 'social_media' | 'lsa';
  year: number;
  month: number;
  budgeted_amount: number;
  actual_spend: number | null;
}

interface Service {
  id: string;
  service_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  track_google_ads_budget?: boolean;
  default_google_ads_budget?: number;
  track_social_media_budget?: boolean;
  default_social_media_budget?: number;
  track_lsa_budget?: boolean;
  default_lsa_budget?: number;
  created_at: string;
  updated_at: string;
  company_id: string;
  companies: Company;
  templates: TaskTemplate[];
  weekProgress: WeekProgress[];
  budgets?: MonthlyServiceBudget[];
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
  const searchParams = useSearchParams();
  const { setPageHeader } = usePageActions();

  // Initialize month from URL query param, or default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthParam = searchParams.get('month');
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      return monthParam;
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selectedMonthDayjs, setSelectedMonthDayjs] = useState<Dayjs | null>(() => {
    const monthParam = searchParams.get('month');
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [year, month] = monthParam.split('-').map(Number);
      return dayjs(new Date(year, month - 1, 1));
    }
    return dayjs();
  });
  const [serviceData, setServiceData] = useState<Service>(service);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<{id: string; name: string; icon?: string}[]>([]);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const { isStarred, toggleStar } = useStarredItems();

  // Comments state
  const [comments, setComments] = useState<MonthlyServiceComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(
    null
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [commentAvatarError, setCommentAvatarError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Add task state
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [addTaskWeek, setAddTaskWeek] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newTaskDayOfWeek, setNewTaskDayOfWeek] = useState<number | null>(null);
  const [newTaskDepartment, setNewTaskDepartment] = useState<string>('');
  const [addToTemplate, setAddToTemplate] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const dragCounterRef = useRef(0);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const processedCommentRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const { refreshNotifications } = useNotificationContext();
  const { getAvatarUrl, getDisplayName, getInitials } = useUser();

  // Convert users to mention format for RichTextEditor
  const mentionUsers = useMemo(() => {
    return users.map(u => {
      const profile = (u as any).profiles;
      return {
        id: profile?.id || u.id,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        email: profile?.email || (u as any).email || null,
        avatar_url: profile?.avatar_url || null,
      };
    });
  }, [users]);

  // Map userId -> display name for reaction tooltips
  const reactionUserMap = useMemo(() => {
    const map: Record<string, string> = {};
    mentionUsers.forEach(u => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || '';
      if (u.id && name) map[u.id] = name;
    });
    return map;
  }, [mentionUsers]);

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

  const handleBackToMonthlyServices = useCallback(() => {
    router.push('/admin/monthly-services');
  }, [router]);

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

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/admin/monthly-services/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
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
      titleLeading: (
        <button
          type="button"
          onClick={handleBackToMonthlyServices}
          className={headerStyles.backButton}
          aria-label="Back to monthly services"
        >
          <ArrowLeft size={16} />
        </button>
      ),
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
                openTo="month"
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
  }, [setPageHeader, serviceData, router, selectedMonthDayjs, handleBackToMonthlyServices]);

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

  // Real-time subscription for comment reactions
  useEffect(() => {
    const supabase = createClient();
    const reactionsChannel = supabase
      .channel(`monthly-service-reactions:${service.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comment_reactions' }, (payload) => {
        const r = payload.new as CommentReaction & { monthly_service_comment_id?: string };
        if (!r.monthly_service_comment_id) return;
        const newReaction = { id: r.id, user_id: r.user_id, emoji: r.emoji, created_at: r.created_at };
        setComments(prev => prev.map(c => {
          if (c.id !== r.monthly_service_comment_id) return c;
          if (c.reactions?.some(x => x.id === r.id)) return c;
          return { ...c, reactions: [...(c.reactions || []), newReaction] };
        }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comment_reactions' }, (payload) => {
        const deletedId = payload.old.id as string;
        setComments(prev => prev.map(c => ({
          ...c,
          reactions: (c.reactions || []).filter(x => x.id !== deletedId),
        })));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reactionsChannel);
    };
  }, [service.id]);

  const markMentionReferenceAsRead = useCallback(
    async (referenceId: string) => {
      try {
        const response = await fetch('/api/notifications/mentions/read-by-reference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referenceType: 'monthly_service_comment',
            referenceId,
          }),
        });

        if (!response.ok) {
          console.error(
            'Error marking monthly service mention as read:',
            await response.text()
          );
          return;
        }

        await refreshNotifications();
      } catch (error) {
        console.error('Error marking monthly service mention as read:', error);
      }
    },
    [refreshNotifications]
  );

  useEffect(() => {
    const commentId = searchParams.get('commentId');
    if (!commentId) return;

    const key = `${selectedMonth}:${commentId}`;
    if (processedCommentRef.current === key) {
      return;
    }

    setIsCommentsCollapsed(false);
    setHighlightedCommentId(commentId);
    void markMentionReferenceAsRead(commentId);
    processedCommentRef.current = key;
  }, [markMentionReferenceAsRead, searchParams, selectedMonth]);

  useEffect(() => {
    if (!highlightedCommentId) return;

    return scheduleScrollToElementById(
      `monthly-service-comment-${highlightedCommentId}`,
      {
        topOffset: 120,
      }
    );
  }, [comments.length, highlightedCommentId, isCommentsCollapsed]);

  useEffect(() => {
    if (!highlightedCommentId) {
      return;
    }

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedCommentId(null);
    }, 2400);

    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [highlightedCommentId]);

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
        mentionNodes.forEach(node => {
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
    // Try to get profile data - first from task.profiles, then from users array
    let assignedToProfile = null;
    if (task.profiles) {
      assignedToProfile = {
        id: task.profiles.id,
        first_name: task.profiles.first_name || '',
        last_name: task.profiles.last_name || '',
        email: task.profiles.email,
        avatar_url: task.profiles.avatar_url || null,
      };
    } else if (task.assigned_to) {
      // Look up user in users array
      const matchingUser = users.find(u => u.id === task.assigned_to);
      if (matchingUser) {
        assignedToProfile = {
          id: matchingUser.id,
          first_name: matchingUser.first_name || '',
          last_name: matchingUser.last_name || '',
          email: matchingUser.email,
          avatar_url: matchingUser.avatar_url || null,
        };
      }
    }

    return {
      id: task.id,
      project_id: null,
      parent_task_id: null,
      title: task.title,
      description: task.description,
      notes: null,
      is_completed: task.is_completed,
      completed_at: task.is_completed ? new Date().toISOString() : null,
      priority:
        (task.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      assigned_to: task.assigned_to,
      created_by: user.id,
      due_date: task.due_date,
      start_date: null,
      progress_percentage: task.is_completed ? 100 : 0,
      actual_hours: null,
      blocks_task_id: null,
      blocked_by_task_id: null,
      blocker_reason: null,
      department_id: null,
      display_order: 0,
      recurring_frequency: null,
      recurring_end_date: null,
      parent_recurring_task_id: null,
      is_recurring_template: false,
      next_recurrence_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_to_profile: assignedToProfile,
      // Include comments and activity from the task
      comments: task.comments || [],
      activity: task.activity || [],
      // Include hasUnreadComments and hasUnreadMentions from API
      hasUnreadComments: task.hasUnreadComments,
      hasUnreadMentions: task.hasUnreadMentions,
      // Add monthly_service_id so ProjectTaskDetail can detect this is a monthly service task
      monthly_service_id: service.id,
    } as any; // Use 'as any' since monthly_service_id is not in ProjectTask type
  };

  const handleTaskClick = async (task: ProjectTask) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);

    // Optimistically update the task's unread status immediately for instant UI feedback
    setServiceData(prevData => ({
      ...prevData,
      weekProgress: prevData.weekProgress.map(week => ({
        ...week,
        tasks: week.tasks.map(t =>
          t.id === task.id ? { ...t, hasUnreadComments: false, hasUnreadMentions: false } : t
        ),
      })),
    }));

    // Mark task as viewed in the background
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/admin/tasks/${task.id}/mark-viewed`, {
        method: 'POST',
        headers,
      });

      // Refresh service data in background to ensure consistency
      onServiceUpdate();
    } catch (error) {
      console.error('Error marking task as viewed:', error);
      // On error, refresh to restore correct state
      onServiceUpdate();
    }
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

      // Update selected task if it's the one being edited.
      // Use functional updater to avoid overwriting state set by concurrent async operations
      // (e.g. onAddComment setting comments before this refresh completes).
      setSelectedTask(prev => {
        if (!prev || prev.id !== taskId) return prev;
        return { ...prev, ...updates };
      });
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

  const handleOpenAddTask = (week: number) => {
    setAddTaskWeek(week);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignedTo('');
    setNewTaskPriority('medium');
    setNewTaskDayOfWeek(null);
    setNewTaskDepartment('');
    setAddToTemplate(false);
    setShowAddTaskDialog(true);
  };

  const handleCloseAddTask = () => {
    setShowAddTaskDialog(false);
    setAddTaskWeek(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignedTo('');
    setNewTaskPriority('medium');
    setNewTaskDayOfWeek(null);
    setNewTaskDepartment('');
    setAddToTemplate(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || addTaskWeek === null) {
      setToastMessage('Task title is required');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (newTaskDayOfWeek === null) {
      setToastMessage('Please select a day of the week');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!newTaskDepartment) {
      setToastMessage('Please select a department');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsCreatingTask(true);

    try {
      const headers = await getAuthHeaders();

      // Calculate due date based on week and day of week
      const [year, month] = selectedMonth.split('-').map(Number);
      const dueDateStr = calculateDueDate(year, month, addTaskWeek, newTaskDayOfWeek);

      console.log('[Add Task] Calculated due date:', {
        selectedMonth,
        addTaskWeek,
        dayOfWeek: newTaskDayOfWeek,
        dueDate: dueDateStr,
        addToTemplate,
      });

      // Create task using the monthly service tasks endpoint
      // This endpoint handles both template addition and task creation
      const taskResponse = await fetch(`/api/admin/monthly-services/${service.id}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          assigned_to: newTaskAssignedTo || null,
          department_id: newTaskDepartment || null,
          priority: newTaskPriority,
          due_date: dueDateStr,
          add_to_template: addToTemplate,
          week_of_month: addTaskWeek,
          due_day_of_week: newTaskDayOfWeek,
        }),
      });

      if (!taskResponse.ok) {
        const errorData = await taskResponse.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const taskData = await taskResponse.json();
      console.log('[Add Task] Task created:', taskData);

      // Refresh service data
      console.log('[Add Task] Refreshing service data for month:', selectedMonth);
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        console.log('[Add Task] Refreshed data:', {
          taskCount: data.service?.weekProgress?.reduce((sum: number, w: any) => sum + w.tasks.length, 0),
          weekProgress: data.service?.weekProgress?.map((w: any) => ({
            week: w.week,
            taskCount: w.tasks.length,
          })),
        });
        setServiceData(data.service);
      } else {
        console.error('[Add Task] Failed to refresh service data:', refreshResponse.status);
      }

      // Show success message
      if (addToTemplate) {
        setToastMessage('Task created and added to template for future months');
      } else {
        setToastMessage('Task created for this month only');
      }
      setToastType('success');
      setShowToast(true);

      handleCloseAddTask();
    } catch (error) {
      console.error('Error creating task:', error);
      setToastMessage(error instanceof Error ? error.message : 'Failed to create task');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Comment handlers
  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isRichTextEmpty(newComment) && pendingAttachments.length === 0) return;

    setIsSubmittingComment(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/admin/monthly-services/${service.id}/comments`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            comment: newComment,
            month: selectedMonth,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const comment = await response.json();

      // Ensure attachments field is initialized
      if (!comment.attachments) {
        comment.attachments = [];
      }

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

  const handleStartEditComment = useCallback(
    (comment: MonthlyServiceComment) => {
      setEditingCommentId(comment.id);
      setEditingCommentText(comment.comment);
    },
    []
  );

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
      const response = await fetch(
        `/api/admin/monthly-services/${service.id}/comments/${editingCommentId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ comment: editingCommentText }),
        }
      );

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

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!confirm('Delete this comment? This action cannot be undone.')) {
        return;
      }

      setDeletingCommentId(commentId);
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/admin/monthly-services/${service.id}/comments/${commentId}`,
          {
            method: 'DELETE',
            headers,
          }
        );

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
    },
    [editingCommentId, service.id]
  );

  const handleToggleReaction = useCallback(async (commentId: string, emoji: string) => {
    const prevReaction = comments.find(c => c.id === commentId)?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      if (prevReaction) {
        return { ...c, reactions: (c.reactions || []).filter(r => r.id !== prevReaction.id) };
      }
      const tempReaction: CommentReaction = { id: `temp-${Date.now()}`, user_id: user.id, emoji, created_at: new Date().toISOString() };
      return { ...c, reactions: [...(c.reactions || []), tempReaction] };
    }));

    try {
      const response = await fetch(`/api/admin/monthly-services/${service.id}/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) throw new Error('Failed to toggle reaction');
      const result = await response.json();

      if (result.action === 'added') {
        setComments(prev => prev.map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            reactions: [
              ...(c.reactions || []).filter(r => !r.id.startsWith('temp-')),
              { id: result.reaction.id, user_id: user.id, emoji, created_at: result.reaction.created_at },
            ],
          };
        }));
      }
    } catch {
      // Revert on error
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        if (prevReaction) {
          return { ...c, reactions: [...(c.reactions || []), prevReaction] };
        }
        return { ...c, reactions: (c.reactions || []).filter(r => !r.id.startsWith('temp-')) };
      }));
    }
  }, [comments, user.id, service.id]);

  const handleCommentFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      const validFiles = droppedFiles.filter(file =>
        allowedTypes.includes(file.type)
      );

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
    commentAvatarError ||
    !rawAvatarUrl ||
    rawAvatarUrl === 'null' ||
    rawAvatarUrl === 'undefined'
      ? null
      : rawAvatarUrl;

  // Calculate total task completion for month navigation
  const totalTasks = serviceData.weekProgress.reduce(
    (sum, week) => sum + week.total,
    0
  );
  const completedTasks = serviceData.weekProgress.reduce(
    (sum, week) => sum + week.completed,
    0
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isFutureMonth = selectedMonth > currentMonth;

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1); // month - 2 because month is 1-indexed
    const newMonth = newDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month, 1); // month is already correct for next month
    const newMonth = newDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
  };

  const handleGenerateTasks = async () => {
    setIsGeneratingTasks(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/admin/monthly-services/${service.id}/generate-tasks`,
        { method: 'POST', headers, body: JSON.stringify({ month: selectedMonth }) }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate tasks');
      setToastMessage(`Generated ${data.tasksCreated} tasks for ${formatMonth(selectedMonth)}`);
      setToastType('success');
      setShowToast(true);
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setServiceData(refreshData.service);
      }
    } catch {
      setToastMessage('Failed to generate tasks');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // Budget handlers
  const handleBudgetChange = async (
    budgetType: 'google_ads' | 'social_media' | 'lsa',
    newAmount: number
  ) => {
    try {
      const headers = await getAuthHeaders();
      const [year, month] = selectedMonth.split('-').map(Number);

      const response = await fetch(
        `/api/admin/monthly-services/${service.id}/budgets`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            budget_type: budgetType,
            year,
            month,
            budgeted_amount: newAmount,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update budget');
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
      console.error('Error updating budget:', error);
      setToastMessage('Failed to update budget');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleActualSpendChange = async (
    budgetType: 'google_ads' | 'social_media' | 'lsa',
    actualSpend: number
  ) => {
    try {
      const headers = await getAuthHeaders();
      const [year, month] = selectedMonth.split('-').map(Number);

      // Get the current budget for this type (or default)
      const existingBudget = serviceData.budgets?.find(
        b => b.budget_type === budgetType
      );

      let budgetedAmount: number;
      if (existingBudget) {
        budgetedAmount = existingBudget.budgeted_amount;
      } else {
        // Use default amount if no budget record exists yet
        if (budgetType === 'google_ads') {
          budgetedAmount = serviceData.default_google_ads_budget || 5000;
        } else if (budgetType === 'social_media') {
          budgetedAmount = serviceData.default_social_media_budget || 2500;
        } else {
          budgetedAmount = serviceData.default_lsa_budget || 1500;
        }
      }

      const response = await fetch(
        `/api/admin/monthly-services/${service.id}/budgets`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            budget_type: budgetType,
            year,
            month,
            budgeted_amount: budgetedAmount,
            actual_spend: actualSpend,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update actual spend');
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

      setToastMessage('Actual spend updated');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating actual spend:', error);
      setToastMessage('Failed to update actual spend');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div
      className={styles.container}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Month Navigation */}
      <div className={styles.monthNavigation}>
        <button
          onClick={handlePreviousMonth}
          className={styles.monthNavButton}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Previous Month
        </button>
        <div className={styles.monthDisplay}>
          <div className={styles.monthName}>{formatMonth(selectedMonth)}</div>
          <div className={styles.monthStats}>
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </div>
        <button
          onClick={handleNextMonth}
          className={styles.monthNavButton}
          type="button"
        >
          Next Month
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Budget Tracking Section */}
      {(serviceData.track_google_ads_budget ||
        serviceData.track_social_media_budget ||
        serviceData.track_lsa_budget) && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Budget Tracking</h2>
          <div className={styles.budgetCardsContainer}>
            {serviceData.track_google_ads_budget && (() => {
              const budget = serviceData.budgets?.find(
                b => b.budget_type === 'google_ads'
              );
              const defaultAmount = serviceData.default_google_ads_budget || 5000;
              return (
                <BudgetCard
                  budgetType="google_ads"
                  budgetAmount={budget?.budgeted_amount || defaultAmount}
                  actualSpend={budget?.actual_spend || null}
                  onBudgetChange={(amount) => handleBudgetChange('google_ads', amount)}
                  onActualSpendChange={(spend) =>
                    handleActualSpendChange('google_ads', spend)
                  }
                />
              );
            })()}

            {serviceData.track_social_media_budget && (() => {
              const budget = serviceData.budgets?.find(
                b => b.budget_type === 'social_media'
              );
              const defaultAmount = serviceData.default_social_media_budget || 2500;
              return (
                <BudgetCard
                  budgetType="social_media"
                  budgetAmount={budget?.budgeted_amount || defaultAmount}
                  actualSpend={budget?.actual_spend || null}
                  onBudgetChange={(amount) =>
                    handleBudgetChange('social_media', amount)
                  }
                  onActualSpendChange={(spend) =>
                    handleActualSpendChange('social_media', spend)
                  }
                />
              );
            })()}

            {serviceData.track_lsa_budget && (() => {
              const budget = serviceData.budgets?.find(
                b => b.budget_type === 'lsa'
              );
              const defaultAmount = serviceData.default_lsa_budget || 1500;
              return (
                <BudgetCard
                  budgetType="lsa"
                  budgetAmount={budget?.budgeted_amount || defaultAmount}
                  actualSpend={budget?.actual_spend || null}
                  onBudgetChange={(amount) => handleBudgetChange('lsa', amount)}
                  onActualSpendChange={(spend) =>
                    handleActualSpendChange('lsa', spend)
                  }
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Tasks by Week */}
      <div className={styles.section}>
        <div className={styles.taskSectionHeader}>
          <h2 className={styles.sectionTitle}>
            Tasks for {formatMonth(selectedMonth)}
          </h2>
          {isFutureMonth && totalTasks === 0 && (
            <button
              className={styles.generateTasksButton}
              onClick={handleGenerateTasks}
              disabled={isGeneratingTasks}
              type="button"
            >
              {isGeneratingTasks ? 'Generating...' : 'Generate Tasks'}
            </button>
          )}
        </div>
        {loading ? (
          <div className={styles.loading}>Loading tasks...</div>
        ) : (
          <div className={styles.weeksContainer}>
            {serviceData.weekProgress.map(week => {
              // Group tasks by department within each week
              const tasksByDepartment = new Map<string, MonthlyServiceTask[]>();
              const noDepartmentTasks: MonthlyServiceTask[] = [];

              week.tasks.forEach(task => {
                const departmentAssignment = task.monthly_service_task_department_assignments?.[0];
                if (!departmentAssignment) {
                  noDepartmentTasks.push(task);
                } else {
                  const departmentName = departmentAssignment.monthly_services_departments?.name || 'Unknown';
                  const existingTasks = tasksByDepartment.get(departmentName);
                  if (existingTasks) {
                    existingTasks.push(task);
                  } else {
                    tasksByDepartment.set(departmentName, [task]);
                  }
                }
              });

              const departmentGroups = Array.from(tasksByDepartment.entries()).sort(
                ([nameA], [nameB]) => nameA.localeCompare(nameB)
              );

              return (
                <div key={week.week} className={styles.weekSection}>
                  <div className={styles.weekSectionHeader}>
                    <h3 className={styles.weekSectionTitle}>
                      Week {week.week}
                    </h3>
                    <div className={styles.progressBarContainer}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${week.percentage}%`,
                          }}
                        >
                          <span className={styles.progressPercentage}>
                            {week.percentage}%
                          </span>
                        </div>
                      </div>
                      <span className={styles.totalTasksLabel}>
                        Total Tasks:{' '}
                        <strong>
                          {week.completed} / {week.total}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {week.tasks.length === 0 ? (
                    <div className={styles.noTasks}>No tasks for this week</div>
                  ) : (
                    <div className={styles.taskGroupsContainer}>
                      {departmentGroups.map(([departmentName, tasks]) => (
                        <div key={departmentName} className={styles.taskGroup}>
                          <h4 className={styles.taskGroupTitle}>
                            {departmentName}
                          </h4>
                          <ProjectTaskList
                            tasks={tasks.map(convertToProjectTask)}
                            onTaskClick={handleTaskClick}
                            onToggleComplete={handleToggleComplete}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onToggleStar={taskId => toggleStar('task', taskId)}
                            isStarred={taskId => isStarred('task', taskId)}
                            showHeader={false}
                          />
                        </div>
                      ))}

                      {noDepartmentTasks.length > 0 && (
                        <div className={styles.taskGroup}>
                          <h4 className={styles.taskGroupTitle}>No Department</h4>
                          <ProjectTaskList
                            tasks={noDepartmentTasks.map(convertToProjectTask)}
                            onTaskClick={handleTaskClick}
                            onToggleComplete={handleToggleComplete}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onToggleStar={taskId => toggleStar('task', taskId)}
                            isStarred={taskId => isStarred('task', taskId)}
                            showHeader={false}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Task Button */}
                  <button
                    onClick={() => handleOpenAddTask(week.week)}
                    className={styles.addTaskButton}
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3V13M3 8H13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Add Task
                  </button>
                </div>
              );
            })}
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
        service={{
          id: serviceData.id,
          company_id: serviceData.company_id,
          service_name: serviceData.service_name,
          description: serviceData.description,
          status: serviceData.status,
          is_active: serviceData.is_active,
          track_google_ads_budget: serviceData.track_google_ads_budget,
          default_google_ads_budget: serviceData.default_google_ads_budget,
          track_social_media_budget: serviceData.track_social_media_budget,
          default_social_media_budget: serviceData.default_social_media_budget,
          track_lsa_budget: serviceData.track_lsa_budget,
          default_lsa_budget: serviceData.default_lsa_budget,
          templates: serviceData.templates.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            default_assigned_to: t.default_assigned_to,
            department_id: t.department_id || null,
            week_of_month: t.week_of_month,
            due_day_of_week: t.due_day_of_week,
            display_order: t.display_order,
          })),
        }}
      />

      {/* Comments Section */}
      <div className={styles.commentsSection}>
        <div className={styles.sectionHeader}>
          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setIsCommentsCollapsed(prev => !prev)}
            aria-label={
              isCommentsCollapsed ? 'Expand comments' : 'Collapse comments'
            }
          >
            <ChevronDown
              size={18}
              className={
                isCommentsCollapsed ? styles.sectionChevronCollapsed : undefined
              }
            />
          </button>
          <h3 className={styles.sectionTitle}>
            Comments{' '}
            <span className={styles.sectionCount}>({comments.length})</span>
          </h3>
        </div>
        {!isCommentsCollapsed && (
          <>
            {comments.length > 0 ? (
              <div className={styles.commentsList}>
                {comments.map(comment => {
                  const authorName = comment.user_profile
                    ? `${comment.user_profile.first_name || ''} ${comment.user_profile.last_name || ''}`.trim() ||
                      comment.user_profile.email
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
                      className={`${styles.commentItem} ${
                        highlightedCommentId === comment.id
                          ? styles.commentHighlight
                          : ''
                      }`}
                    >
                      <div className={styles.commentMeta}>
                        <MiniAvatar
                          firstName={
                            comment.user_profile?.first_name || undefined
                          }
                          lastName={
                            comment.user_profile?.last_name || undefined
                          }
                          email={comment.user_profile?.email || ''}
                          avatarUrl={comment.user_profile?.avatar_url || null}
                          size="small"
                          showTooltip={true}
                          className={styles.commentAvatarMini}
                        />
                        <div className={styles.commentMetaDetails}>
                          <span className={styles.commentAuthor}>
                            {authorName}
                          </span>
                          <span className={styles.commentDate}>
                            {formatCommentDate(comment.created_at)}
                            {isEdited && (
                              <span className={styles.commentEdited}>
                                edited
                              </span>
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
                                  disabled={
                                    isUpdatingComment ||
                                    isRichTextEmpty(editingCommentText)
                                  }
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
                                  onClick={() =>
                                    handleStartEditComment(comment)
                                  }
                                  aria-label="Edit comment"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.commentActionButton} ${styles.commentActionDanger}`}
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
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
                            dangerouslySetInnerHTML={{
                              __html: getCommentHtml(comment.comment),
                            }}
                          />
                          {comment.attachments &&
                            comment.attachments.length > 0 &&
                            (() => {
                              const imageAttachments =
                                comment.attachments.filter(attachment =>
                                  attachment.mime_type?.startsWith('image/')
                                );
                              const fileAttachments =
                                comment.attachments.filter(
                                  attachment =>
                                    !attachment.mime_type?.startsWith('image/')
                                );

                              return (
                                <>
                                  {imageAttachments.length > 0 && (
                                    <div
                                      className={styles.commentImageAttachments}
                                    >
                                      {imageAttachments.map(attachment => (
                                        <a
                                          key={attachment.id}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={styles.commentImageLink}
                                        >
                                          <div className={styles.commentImage}>
                                            <Image
                                              src={attachment.url}
                                              alt={attachment.file_name}
                                              fill={true}
                                              unoptimized={true}
                                              style={{ objectFit: 'contain' }}
                                            />
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  {fileAttachments.length > 0 && (
                                    <div className={styles.commentAttachments}>
                                      {fileAttachments.map(attachment => (
                                        <a
                                          key={attachment.id}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={styles.attachmentCard}
                                        >
                                          <div
                                            className={styles.attachmentIcon}
                                          >
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                            >
                                              <path
                                                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M14 2V8H20"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </div>
                                          <div
                                            className={styles.attachmentInfo}
                                          >
                                            <span
                                              className={styles.attachmentName}
                                            >
                                              {attachment.file_name}
                                            </span>
                                            {attachment.mime_type ===
                                              'application/pdf' && (
                                              <span
                                                className={
                                                  styles.attachmentBadge
                                                }
                                              >
                                                PDF
                                              </span>
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
                      <CommentReactions
                        reactions={comment.reactions || []}
                        currentUserId={user.id}
                        onToggle={(emoji) => handleToggleReaction(comment.id, emoji)}
                        userMap={reactionUserMap}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.commentsEmpty}>No comments yet.</div>
            )}

            <form
              onSubmit={handleSubmitComment}
              className={styles.commentComposer}
            >
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
                      <div
                        key={`${file.name}-${index}`}
                        className={styles.pendingAttachment}
                      >
                        <span className={styles.pendingAttachmentName}>
                          {file.name}
                        </span>
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
                disabled={
                  isSubmittingComment ||
                  (isRichTextEmpty(newComment) &&
                    pendingAttachments.length === 0)
                }
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
        service={{
          id: serviceData.id,
          company_id: serviceData.company_id,
          service_name: serviceData.service_name,
          description: serviceData.description,
          status: serviceData.status,
          is_active: serviceData.is_active,
          track_google_ads_budget: serviceData.track_google_ads_budget,
          default_google_ads_budget: serviceData.default_google_ads_budget,
          track_social_media_budget: serviceData.track_social_media_budget,
          default_social_media_budget: serviceData.default_social_media_budget,
          track_lsa_budget: serviceData.track_lsa_budget,
          default_lsa_budget: serviceData.default_lsa_budget,
          templates: serviceData.templates.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            default_assigned_to: t.default_assigned_to,
            department_id: t.department_id || null,
            week_of_month: t.week_of_month,
            due_day_of_week: t.due_day_of_week,
            display_order: t.display_order,
          })),
        }}
      />

      {/* Add Task Dialog */}
      {showAddTaskDialog && addTaskWeek !== null && (
        <div className={styles.modalOverlay} onClick={handleCloseAddTask}>
          <div className={styles.addTaskDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h3>Add Task to Week {addTaskWeek}</h3>
              <button onClick={handleCloseAddTask} className={styles.closeButton}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M15 5L5 15M5 5L15 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.dialogBody}>
              <div className={styles.formGroup}>
                <label htmlFor="taskTitle">
                  Task Title <span className={styles.required}>*</span>
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Optional description"
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="taskAssignee">Assigned To</label>
                  <select
                    id="taskAssignee"
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name || user.last_name
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className={styles.select}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="taskDayOfWeek">
                    Day of Week <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="taskDayOfWeek"
                    value={newTaskDayOfWeek ?? ''}
                    onChange={(e) => setNewTaskDayOfWeek(e.target.value !== '' ? parseInt(e.target.value) : null)}
                    className={styles.select}
                  >
                    <option value="">Select day...</option>
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="taskDepartment">
                    Department <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="taskDepartment"
                    value={newTaskDepartment}
                    onChange={(e) => setNewTaskDepartment(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Select department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={addToTemplate}
                    onChange={(e) => setAddToTemplate(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>Add to template (include in all future months)</span>
                </label>
                <p className={styles.helpText}>
                  {addToTemplate
                    ? `This task will be added to the service template and automatically created for all future months.`
                    : `This task will only be created for ${formatMonth(selectedMonth)}.`}
                </p>
              </div>
            </div>

            <div className={styles.dialogFooter}>
              <button
                onClick={handleCloseAddTask}
                className={styles.cancelButton}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className={styles.createButton}
                type="button"
                disabled={isCreatingTask || !newTaskTitle.trim()}
              >
                {isCreatingTask ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            if (!selectedTask) return;

            // Use the same user data that's displayed elsewhere in the UI
            const displayName = getDisplayName();
            const nameParts = displayName.split(' ');
            const currentUserProfile = {
              id: user.id,
              first_name: nameParts[0] || '',
              last_name: nameParts.slice(1).join(' ') || '',
              email: user.email || '',
              avatar_url: getAvatarUrl(),
            };

            // Create temporary comment for optimistic UI update
            const tempCommentId = `temp-${Date.now()}`;
            const tempComment = {
              id: tempCommentId,
              task_id: selectedTask.id,
              user_id: user.id,
              comment,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_profile: currentUserProfile,
              attachments: [],
            };

            // Optimistically add comment to UI immediately
            setSelectedTask(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                comments: [...(prev.comments || []), tempComment],
              };
            });

            try {
              const headers = await getAuthHeaders();
              const response = await fetch(`/api/admin/tasks/${selectedTask.id}/comments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ comment }),
              });
              if (!response.ok) {
                throw new Error('Failed to add comment');
              }

              const createdComment = await response.json();

              // Fetch the updated task with the real comment
              const updatedTaskResponse = await fetch(`/api/admin/tasks/${selectedTask.id}`, {
                headers,
              });
              if (updatedTaskResponse.ok) {
                const updatedTaskData = await updatedTaskResponse.json();
                // Convert to ProjectTask format and update selectedTask with real data
                const updatedTask = convertToProjectTask(updatedTaskData);
                setSelectedTask(updatedTask);
              }

              // Refresh service data to show new comment in the list
              onServiceUpdate();

              return createdComment;
            } catch (error) {
              console.error('Error adding comment:', error);
              // On error, remove the temporary comment
              setSelectedTask(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  comments: (prev.comments || []).filter(c => c.id !== tempCommentId),
                };
              });
            }
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
          onToggleStar={taskId => toggleStar('task', taskId)}
          isStarred={taskId => isStarred('task', taskId)}
          monthlyServiceDepartments={departments}
          mentionUsers={mentionUsers}
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
            <span className={styles.dropZoneText}>
              Drop files to attach to comment
            </span>
            <span className={styles.dropZoneSubtext}>
              Images (JPEG, PNG, WebP) and documents (PDF, Word, Excel)
            </span>
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
