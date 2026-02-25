'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useUser } from '@/hooks/useUser';
import { useStarredItems } from '@/hooks/useStarredItems';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { CalendarView } from '@/components/TaskManagement/CalendarView/CalendarView';
import { TaskListView } from '@/components/TaskManagement/TaskListView/TaskListView';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import { Task } from '@/types/taskManagement';
import { ProjectTask, Project, User } from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/project-management/projectManagement.module.scss';

type ViewType = 'list' | 'calendar' | 'archive';
type TaskWithMonthlyServiceMeta = Task & { monthly_service_id?: string | null };

interface MonthlyServiceTaskMeta {
  companyId: string | null;
  companyName: string;
  iconUrl: string | null;
  serviceName: string;
}

interface MentionListItem {
  notificationId: string;
  createdAt: string;
  read: boolean;
  title: string;
  message: string;
  referenceId: string;
  referenceType: string;
  commentText: string;
  projectId: string | null;
  projectName: string | null;
  projectShortcode: string | null;
  taskId: string | null;
  taskTitle: string | null;
  monthlyServiceId: string | null;
  monthlyServiceName: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  senderEmail: string | null;
  senderAvatarUrl: string | null;
  companyName: string | null;
  companyIconUrl: string | null;
  hasAttachments: boolean;
}

const MENTIONS_PAGE_SIZE = 5;
const PROJECTS_CARD_EXPANDED_COOKIE = 'admin_tasks_projects_expanded';

const getBooleanCookie = (name: string, fallback = false): boolean => {
  if (typeof document === 'undefined') return fallback;
  const cookieEntry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));

  if (!cookieEntry) return fallback;

  const value = decodeURIComponent(cookieEntry.slice(name.length + 1));
  return value === '1' || value === 'true';
};

const setBooleanCookie = (name: string, value: boolean, days = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value ? '1' : '0')}; expires=${expires}; path=/; SameSite=Lax`;
};

export default function AdminTasksPage() {
  const { registerPageAction } = usePageActions();
  const { markAsRead } = useNotificationContext();
  const { user } = useUser();
  const { isStarred, toggleStar, refetch: refetchStarredItems } = useStarredItems();
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskManagement.viewPreference');
      return (saved as ViewType) || 'list';
    }
    return 'list';
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  // Task detail sidebar state
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // State for API data
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mentions, setMentions] = useState<MentionListItem[]>([]);
  const [mentionsHasMore, setMentionsHasMore] = useState(false);
  const [mentionsLoading, setMentionsLoading] = useState(false);
  const [showAllMentions, setShowAllMentions] = useState(false);
  const [hasAnyMentions, setHasAnyMentions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projectsCardExpandPreference, setProjectsCardExpandPreference] =
    useState(false);
  const [projectsCardPreferenceLoaded, setProjectsCardPreferenceLoaded] =
    useState(false);

  // Helper function to get authentication headers
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
    };
  };

  // Convert ProjectTask to Task format for components
  const convertToTask = useCallback((projectTask: ProjectTask): TaskWithMonthlyServiceMeta => ({
    id: projectTask.id,
    title: projectTask.title,
    description: projectTask.description || '',
    status: projectTask.is_completed ? 'completed' : 'todo',
    priority: (projectTask.priority as Task['priority']) || 'medium',
    project_id: projectTask.project_id || undefined,
    assigned_to: projectTask.assigned_to || undefined,
    due_date: projectTask.due_date || '',
    recurring_frequency: (projectTask.recurring_frequency as Task['recurring_frequency']) || undefined,
    recurring_end_date: projectTask.recurring_end_date || undefined,
    estimated_hours: 0,
    tags: [],
    created_at: projectTask.created_at || new Date().toISOString(),
    updated_at: projectTask.updated_at || new Date().toISOString(),
    is_starred: isStarred('task', projectTask.id),
    blocked_by_task: projectTask.blocked_by_task || null,
    monthly_service_id: projectTask.monthly_service_id || null,
  }), [isStarred]);

  // Filter tasks - always show only tasks assigned to current user
  const filteredTasks = useMemo(() => {
    const convertedTasks = tasks.map(convertToTask);
    // Always filter to current user's tasks (removed toggle)
    if (user?.id) {
      return convertedTasks.filter(task => task.assigned_to === user.id);
    }
    return convertedTasks;
  }, [tasks, user?.id, convertToTask]);

  const monthlyServiceMetaByTaskId = useMemo<Record<string, MonthlyServiceTaskMeta>>(() => {
    const meta: Record<string, MonthlyServiceTaskMeta> = {};

    tasks.forEach((task) => {
      if (!task.monthly_service_id || !task.monthly_service) return;

      const company = task.monthly_service.company;
      const iconUrl = Array.isArray(company?.branding)
        ? company?.branding?.[0]?.icon_logo_url || null
        : company?.branding?.icon_logo_url || null;

      meta[task.id] = {
        companyId: company?.id || null,
        companyName: company?.name || 'Company',
        iconUrl,
        serviceName: task.monthly_service.service_name || 'Monthly Service',
      };
    });

    return meta;
  }, [tasks]);

  // Calculate task stats by project for progress bars
  const taskStatsByProject = useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};

    tasks.forEach((task) => {
      if (!task.project_id) return;
      const current = stats[task.project_id] || { completed: 0, total: 0 };
      current.total += 1;
      if (task.is_completed) {
        current.completed += 1;
      }
      stats[task.project_id] = current;
    });

    return stats;
  }, [tasks]);

  // Enrich projects with starred status and progress
  const projectsWithStarred = useMemo(() => {
    return projects.map(project => ({
      ...project,
      is_starred: isStarred('project', project.id),
      progress: taskStatsByProject[project.id] || { completed: 0, total: 0 },
    }));
  }, [projects, isStarred, taskStatsByProject]);

  // Register page actions (Add buttons in header)
  useEffect(() => {
    registerPageAction('add-task', () => {
      setShowTaskModal(true);
    });
  }, [registerPageAction]);

  // Fetch tasks from admin API
  const fetchTasks = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/project-tasks', { headers });

      if (response.ok) {
        const data: ProjectTask[] = await response.json();
        setTasks(data);
      } else {
        console.error('Error fetching tasks:', await response.text());
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  }, []);

  // Fetch projects from admin API
  const fetchProjects = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      params.append('scopeFilter', 'internal,both');

      const response = await fetch(`/api/admin/projects?${params.toString()}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error('Error fetching projects:', await response.text());
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  }, []);

  // Fetch users for task assignment
  const fetchUsers = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/users', { headers });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const checkHasAnyMentions = useCallback(async (): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        '/api/admin/notifications/mentions?unreadOnly=false&limit=1&offset=0',
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        const mentionItems: MentionListItem[] = Array.isArray(data.mentions)
          ? data.mentions
          : [];
        return mentionItems.length > 0;
      }
    } catch (error) {
      console.error('Error checking mention availability:', error);
    }
    return false;
  }, []);

  const fetchMentions = useCallback(async (options?: {
    reset?: boolean;
    offset?: number;
    unreadOnly?: boolean;
  }) => {
    const reset = options?.reset ?? false;
    const offset = options?.offset ?? 0;
    const unreadOnly = options?.unreadOnly ?? true;

    try {
      setMentionsLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/admin/notifications/mentions?unreadOnly=${unreadOnly}&limit=${MENTIONS_PAGE_SIZE}&offset=${offset}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        const nextMentions: MentionListItem[] = Array.isArray(data.mentions) ? data.mentions : [];
        if (reset) {
          setMentions(nextMentions);
        } else {
          setMentions((prev) => [
            ...prev,
            ...nextMentions.filter((next) => !prev.some((existing) => existing.notificationId === next.notificationId)),
          ]);
        }
        setMentionsHasMore(Boolean(data.hasMore));
        if (nextMentions.length > 0) {
          setHasAnyMentions(true);
        } else if (!unreadOnly) {
          setHasAnyMentions(false);
        } else if (reset) {
          const hasAny = await checkHasAnyMentions();
          setHasAnyMentions(hasAny);
        }
      } else {
        console.error('Error fetching mentions:', await response.text());
        if (reset) {
          setMentions([]);
        }
        setMentionsHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
      if (reset) {
        setMentions([]);
      }
      setMentionsHasMore(false);
    } finally {
      setMentionsLoading(false);
    }
  }, [checkHasAnyMentions]);

  // Open task detail sidebar
  const openTaskDetailById = useCallback(async (taskId: string, projectId?: string | null) => {
    try {
      const headers = await getAuthHeaders();
      const endpoint = projectId
        ? `/api/admin/projects/${projectId}/tasks/${taskId}`
        : `/api/admin/project-tasks/${taskId}`;
      const response = await fetch(endpoint, { headers });

      if (response.ok) {
        const fullTask = await response.json();
        setSelectedTaskDetail(fullTask);
        setIsTaskDetailOpen(true);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTasks(),
        fetchProjects(),
        fetchUsers(),
        fetchMentions({ reset: true, offset: 0, unreadOnly: true }),
      ]);
      setIsLoading(false);
    };

    fetchData();
  }, [fetchTasks, fetchProjects, fetchUsers, fetchMentions]);

  const handleSaveTask = useCallback(async (taskData: any) => {
    try {
      const headers = await getAuthHeaders();

      if (taskData.id) {
        // Update existing task
        const response = await fetch(`/api/admin/project-tasks/${taskData.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.due_date,
            assigned_to: taskData.assigned_to,
            project_id: taskData.project_id,
            is_completed: taskData.status === 'completed',
          }),
        });

        if (response.ok) {
          await fetchTasks();
        }
      } else {
        // Create new task
        const response = await fetch('/api/admin/project-tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority || 'medium',
            due_date: taskData.due_date,
            assigned_to: taskData.assigned_to,
            project_id: taskData.project_id,
            is_completed: false,
            category_ids: (taskData as any).category_ids,
          }),
        });

        if (response.ok) {
          await fetchTasks();
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }

    setShowTaskModal(false);
    setSelectedTask(undefined);
  }, [fetchTasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/project-tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }

    setShowTaskModal(false);
    setSelectedTask(undefined);
  }, [fetchTasks]);

  const handleTaskClick = useCallback((task: Task) => {
    openTaskDetailById(task.id, task.project_id ?? null);
  }, [openTaskDetailById]);

  const handleToggleStar = useCallback(async (taskId: string) => {
    await toggleStar('task', taskId);
    // Refetch tasks to update the starred status in the UI
    await fetchTasks();
  }, [toggleStar, fetchTasks]);

  const handleToggleStarProject = useCallback(async (projectId: string) => {
    await toggleStar('project', projectId);
    // Refetch projects to update the starred status in the UI
    await fetchProjects();
  }, [toggleStar, fetchProjects]);

  const handleInlineTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/project-tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, [fetchTasks]);

  const handleProjectClick = useCallback((project: Project) => {
    // Navigate to project detail page
    window.location.href = `/admin/project-management/${project.id}`;
  }, []);

  const handleMentionClick = useCallback(async (mention: MentionListItem) => {
    try {
      if (!mention.read) {
        // Use shared context markAsRead so bell badge updates immediately
        await markAsRead(mention.notificationId);

        if (showAllMentions) {
          setMentions((prev) =>
            prev.map((item) =>
              item.notificationId === mention.notificationId
                ? { ...item, read: true }
                : item
            )
          );
        } else {
          setMentions((prev) =>
            prev.filter((item) => item.notificationId !== mention.notificationId)
          );
        }
      }
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }

    if (mention.referenceType === 'task_comment' && mention.taskId) {
      await openTaskDetailById(mention.taskId, mention.projectId);
    } else if (mention.referenceType === 'project_comment' && mention.projectId) {
      window.location.href = `/admin/project-management/${mention.projectId}?commentId=${mention.referenceId}`;
    } else if (mention.referenceType === 'monthly_service_comment' && mention.monthlyServiceId) {
      window.location.href = `/admin/monthly-services/${mention.monthlyServiceId}?commentId=${mention.referenceId}`;
    }
  }, [markAsRead, openTaskDetailById, showAllMentions]);

  const handleShowAllMentions = useCallback(async () => {
    await fetchMentions({ reset: true, offset: 0, unreadOnly: false });
    setShowAllMentions(true);
  }, [fetchMentions]);

  const handleHideReadMentions = useCallback(async () => {
    await fetchMentions({ reset: true, offset: 0, unreadOnly: true });
    setShowAllMentions(false);
  }, [fetchMentions]);

  const loadAllPastMentions = useCallback(async (): Promise<MentionListItem[]> => {
    try {
      setMentionsLoading(true);
      const headers = await getAuthHeaders();
      const limit = 50;
      let offset = 0;
      let hasMore = true;
      const allMentions: MentionListItem[] = [];
      const seenIds = new Set<string>();

      while (hasMore) {
        const response = await fetch(
          `/api/admin/notifications/mentions?unreadOnly=false&limit=${limit}&offset=${offset}`,
          { headers }
        );

        if (!response.ok) {
          console.error('Error fetching all past mentions:', await response.text());
          break;
        }

        const data = await response.json();
        const batch: MentionListItem[] = Array.isArray(data.mentions)
          ? data.mentions
          : [];

        batch.forEach((mention) => {
          if (seenIds.has(mention.notificationId)) return;
          seenIds.add(mention.notificationId);
          allMentions.push(mention);
        });

        hasMore = Boolean(data.hasMore) && batch.length > 0;
        offset += batch.length;
      }

      setMentions(allMentions);
      setMentionsHasMore(false);
      setHasAnyMentions(allMentions.length > 0);
      return allMentions;
    } catch (error) {
      console.error('Error loading all past mentions:', error);
      return mentions;
    } finally {
      setMentionsLoading(false);
    }
  }, [mentions]);

  // Task detail sidebar handlers
  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
    if (!selectedTaskDetail) return;

    try {
      const headers = await getAuthHeaders();
      const isProjectTask = !!selectedTaskDetail.project_id;
      const endpoint = isProjectTask
        ? `/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${taskId}`
        : `/api/admin/project-tasks/${taskId}`;
      const response = await fetch(endpoint, {
        method: isProjectTask ? 'PATCH' : 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setSelectedTaskDetail(updatedTask);
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, [selectedTaskDetail, fetchTasks]);

  const handleUpdateRelatedTask = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
    if (!selectedTaskDetail) return;

    try {
      const headers = await getAuthHeaders();
      const isProjectTask = !!selectedTaskDetail.project_id;
      const endpoint = isProjectTask
        ? `/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${taskId}`
        : `/api/admin/project-tasks/${taskId}`;
      const response = await fetch(endpoint, {
        method: isProjectTask ? 'PATCH' : 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating related task:', error);
    }
  }, [selectedTaskDetail, fetchTasks]);

  const handleToggleTaskComplete = useCallback(async (taskId: string, isCompleted: boolean) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/project-tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_completed: isCompleted }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        if (selectedTaskDetail?.id === updatedTask.id) {
          setSelectedTaskDetail(updatedTask);
        }
        await fetchTasks();
      } else {
        console.error('Error updating task completion:', await response.text());
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  }, [fetchTasks, selectedTaskDetail]);

  const handleDeleteTaskFromDetail = useCallback(async () => {
    if (!selectedTaskDetail?.id) return;

    try {
      const headers = await getAuthHeaders();
      const endpoint = selectedTaskDetail.project_id
        ? `/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${selectedTaskDetail.id}`
        : `/api/admin/project-tasks/${selectedTaskDetail.id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setIsTaskDetailOpen(false);
        setSelectedTaskDetail(null);
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [selectedTaskDetail, fetchTasks]);

  const handleAddComment = useCallback(async (comment: string) => {
    if (!selectedTaskDetail?.id) return null;
    if (!selectedTaskDetail.project_id) {
      console.warn('Comments are not available for personal tasks.');
      return null;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${selectedTaskDetail.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        const createdComment = await response.json();

        // Refresh task to get new comment
        const updatedTask = await fetch(`/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${selectedTaskDetail.id}`, {
          headers,
        }).then(res => res.json());

        setSelectedTaskDetail(updatedTask);

        return createdComment;
      }
      return null;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }, [selectedTaskDetail]);

  const handleCreateSubtask = useCallback(() => {
    // For now, just close the sidebar - subtask creation would need additional implementation
    setIsTaskDetailOpen(false);
  }, []);

  const handleUpdateProgress = useCallback(async (progress: number) => {
    if (!selectedTaskDetail?.project_id || !selectedTaskDetail?.id) return;

    await handleUpdateTask(selectedTaskDetail.id, {
      progress_percentage: progress,
    });

    setSelectedTaskDetail({
      ...selectedTaskDetail,
      progress_percentage: progress,
    });
  }, [selectedTaskDetail, handleUpdateTask]);

  // Save view preference to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskManagement.viewPreference', currentView);
    }
  }, [currentView]);

  useEffect(() => {
    setProjectsCardExpandPreference(
      getBooleanCookie(PROJECTS_CARD_EXPANDED_COOKIE, false)
    );
    setProjectsCardPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    if (!projectsCardPreferenceLoaded) return;
    setBooleanCookie(
      PROJECTS_CARD_EXPANDED_COOKIE,
      projectsCardExpandPreference
    );
  }, [projectsCardExpandPreference, projectsCardPreferenceLoaded]);

  const viewTabs = (
    <div className={styles.viewTabs}>
      <button
        className={`${styles.viewTab} ${currentView === 'list' ? styles.active : ''}`}
        onClick={() => setCurrentView('list')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M0.666504 0.666687H0.674282M0.666504 5.66669H0.674282M0.666504 10.6667H0.674282M4.55539 0.666687H14.6665M4.55539 5.66669H14.6665M4.55539 10.6667H14.6665" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        List
      </button>
      <button
        className={`${styles.viewTab} ${currentView === 'calendar' ? styles.active : ''}`}
        onClick={() => setCurrentView('calendar')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
          <path d="M3.99984 0.666687V3.33335M9.33317 0.666687V3.33335M0.666504 6.00002H12.6665M1.99984 2.00002H11.3332C12.0696 2.00002 12.6665 2.59697 12.6665 3.33335V12.6667C12.6665 13.4031 12.0696 14 11.3332 14H1.99984C1.26346 14 0.666504 13.4031 0.666504 12.6667V3.33335C0.666504 2.59697 1.26346 2.00002 1.99984 2.00002Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Calendar
      </button>
      <button
        className={`${styles.viewTab} ${currentView === 'archive' ? styles.active : ''}`}
        onClick={() => setCurrentView('archive')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 5L8 2L14 5M2 5V12L8 15M2 5L8 8M14 5V12L8 15M14 5L8 8M8 8V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Archive
      </button>
    </div>
  );

  const isProjectCompletedStatus = (status?: string | null) =>
    status === 'complete' || status === 'completed';

  const activeProjects = projectsWithStarred.filter(
    (project) => !isProjectCompletedStatus(project.status)
  );
  const completedProjects = projectsWithStarred.filter((project) =>
    isProjectCompletedStatus(project.status)
  );

  const activeProjectIds = new Set(activeProjects.map((project) => project.id));
  const completedProjectIds = new Set(completedProjects.map((project) => project.id));

  // Separate personal tasks from project-based tasks
  const personalTasks = filteredTasks.filter(
    (task) =>
      task.status !== 'completed' &&
      !task.project_id &&
      !(task as TaskWithMonthlyServiceMeta).monthly_service_id
  );
  const monthlyServices = filteredTasks.filter(
    (task) =>
      task.status !== 'completed' &&
      !!(task as TaskWithMonthlyServiceMeta).monthly_service_id
  );
  const projectTasks = filteredTasks.filter(
    (task) =>
      task.status !== 'completed' &&
      !!task.project_id &&
      activeProjectIds.has(task.project_id)
  );
  const completedProjectTasks = filteredTasks.filter(
    (task) =>
      task.status === 'completed' &&
      !!task.project_id &&
      completedProjectIds.has(task.project_id)
  );
  const completedPersonalTasks = filteredTasks.filter(
    (task) =>
      task.status === 'completed' &&
      !task.project_id &&
      !(task as TaskWithMonthlyServiceMeta).monthly_service_id
  );
  const completedMonthlyServices = filteredTasks.filter(
    (task) =>
      task.status === 'completed' &&
      !!(task as TaskWithMonthlyServiceMeta).monthly_service_id
  );

  return (
    <div className={styles.pageContainer}>
      {/* View Content */}
      <div className={styles.viewContent}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading tasks...</p>
          </div>
        ) : (
          <div className={styles.taskPageLayout}>
            <div className={styles.taskMainContent}>
              {currentView === 'calendar' && (
                <div className={styles.taskViewTabsRow}>
                  {viewTabs}
                </div>
              )}
              {currentView === 'list' && (
                <TaskListView
                  tasks={projectTasks}
                  projects={activeProjects}
                  onTaskClick={handleTaskClick}
                  onDeleteTask={handleDeleteTask}
                  onToggleStar={handleToggleStar}
                  onProjectClick={handleProjectClick}
                  onToggleStarProject={handleToggleStarProject}
                  onProjectUpdate={fetchProjects}
                  onToggleComplete={handleToggleTaskComplete}
                  onUpdateTask={handleInlineTaskUpdate}
                  currentUserId={user?.id}
                  groupTasksByProject
                  viewTabsElement={viewTabs}
                  personalTasks={personalTasks}
                  monthlyServices={monthlyServices}
                  monthlyServiceMetaByTaskId={monthlyServiceMetaByTaskId}
                  mentions={mentions}
                  hasMoreMentions={mentionsHasMore}
                  mentionsLoading={mentionsLoading}
                  showAllMentions={showAllMentions}
                  hasAnyMentions={hasAnyMentions}
                  onMentionClick={handleMentionClick}
                  onLoadMoreMentions={() =>
                    fetchMentions({
                      reset: false,
                      offset: mentions.length,
                      unreadOnly: !showAllMentions,
                    })
                  }
                  onLoadAllMentions={loadAllPastMentions}
                  onShowAllMentions={handleShowAllMentions}
                  onHideReadMentions={handleHideReadMentions}
                  projectsCardExpandPreference={projectsCardExpandPreference}
                  onProjectsCardExpandPreferenceChange={
                    setProjectsCardExpandPreference
                  }
                />
              )}
              {currentView === 'calendar' && (
                <CalendarView
                  tasks={filteredTasks}
                  onTaskClick={handleTaskClick}
                />
              )}
              {currentView === 'archive' && (
                <TaskListView
                  tasks={completedProjectTasks}
                  projects={completedProjects}
                  onTaskClick={handleTaskClick}
                  onDeleteTask={handleDeleteTask}
                  onToggleStar={handleToggleStar}
                  onProjectClick={handleProjectClick}
                  onToggleStarProject={handleToggleStarProject}
                  onProjectUpdate={fetchProjects}
                  onToggleComplete={handleToggleTaskComplete}
                  onUpdateTask={handleInlineTaskUpdate}
                  currentUserId={user?.id}
                  groupTasksByProject
                  viewTabsElement={viewTabs}
                  personalTasks={completedPersonalTasks}
                  monthlyServices={completedMonthlyServices}
                  monthlyServiceMetaByTaskId={monthlyServiceMetaByTaskId}
                  mentions={mentions}
                  hasMoreMentions={mentionsHasMore}
                  mentionsLoading={mentionsLoading}
                  showAllMentions={showAllMentions}
                  hasAnyMentions={hasAnyMentions}
                  onMentionClick={handleMentionClick}
                  onLoadMoreMentions={() =>
                    fetchMentions({
                      reset: false,
                      offset: mentions.length,
                      unreadOnly: !showAllMentions,
                    })
                  }
                  onLoadAllMentions={loadAllPastMentions}
                  onShowAllMentions={handleShowAllMentions}
                  onHideReadMentions={handleHideReadMentions}
                  projectsCardExpandPreference={projectsCardExpandPreference}
                  onProjectsCardExpandPreferenceChange={
                    setProjectsCardExpandPreference
                  }
                  archiveMode
                />
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(undefined);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        projects={projects}
        users={users}
        currentUserId={user?.id}
      />

      {/* Task Detail Sidebar */}
      <ProjectTaskDetail
        task={selectedTaskDetail}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTaskDetail(null);
        }}
        onUpdate={handleUpdateTask}
        onUpdateRelatedTask={handleUpdateRelatedTask}
        onDelete={handleDeleteTaskFromDetail}
        onAddComment={handleAddComment}
        onCreateSubtask={handleCreateSubtask}
        onUpdateProgress={handleUpdateProgress}
        users={users}
        mentionUsers={users}
        currentUserId={user?.id}
        onToggleStar={(taskId) => toggleStar('task', taskId)}
        isStarred={(taskId) => isStarred('task', taskId)}
      />
    </div>
  );
}
