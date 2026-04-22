'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useUser } from '@/hooks/useUser';
import { useStarredItems } from '@/hooks/useStarredItems';
import { useLocalStorageFilter } from '@/hooks/useLocalStorageFilter';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { CalendarView } from '@/components/TaskManagement/CalendarView/CalendarView';
import { TaskListView } from '@/components/TaskManagement/TaskListView/TaskListView';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import { ViewToggle } from '@/components/Common/ViewToggle/ViewToggle';
import { FilterPanel } from '@/components/Common/FilterPanel/FilterPanel';
import { Task } from '@/types/taskManagement';
import { ProjectTask, Project, User, statusOptions as projectStatusOptions } from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import { LayoutList, CalendarDays, Archive, Search } from 'lucide-react';
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
  proofId: string | null;
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
  const { registerPageAction, setPageHeader } = usePageActions();
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

  // Filter state (lifted from TaskListView, persisted to localStorage)
  const [statusFilter, setStatusFilter] = useLocalStorageFilter('tasks.statusFilter', 'all');
  const [companyFilter, setCompanyFilter] = useLocalStorageFilter('tasks.companyFilter', 'all');
  const [dueDateFilter, setDueDateFilter] = useLocalStorageFilter('tasks.dueDateFilter', 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when it opens
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

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
    created_by: projectTask.created_by,
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

  const convertedTasks = useMemo(
    () => tasks.map(convertToTask),
    [tasks, convertToTask]
  );

  // Filter tasks - always show only tasks assigned to current user
  const filteredTasks = useMemo(() => {
    // Always filter to current user's tasks (removed toggle)
    if (user?.id) {
      return convertedTasks.filter(task => task.assigned_to === user.id);
    }
    return convertedTasks;
  }, [convertedTasks, user?.id]);

  const assignedOutTasks = useMemo(() => {
    if (!user?.id) return [];

    return convertedTasks.filter(
      (task) =>
        task.created_by === user.id &&
        !!task.assigned_to &&
        task.assigned_to !== user.id
    );
  }, [convertedTasks, user?.id]);

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

  const contentAndSocialMediaTaskIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((task) => {
      const depts = task.monthly_service_task_department_assignments || [];
      if (depts.some(d => d.department?.name === 'Content' || d.department?.name === 'Social Media')) {
        ids.add(task.id);
      }
    });
    return ids;
  }, [tasks]);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(project => {
      if (project.company?.id && project.company?.name) {
        map.set(project.company.id, project.company.name);
      }
    });
    Object.values(monthlyServiceMetaByTaskId).forEach(meta => {
      if (meta.companyId && meta.companyName) {
        map.set(meta.companyId, meta.companyName);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, monthlyServiceMetaByTaskId]);

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

  // Set page header with view toggle and filters
  useEffect(() => {
    setPageHeader({
      title: 'My Tasks',
      description: 'Your assigned tasks across all projects',
      customActions: (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <div className={`${styles.searchToggleWrapper} ${isSearchOpen ? styles.searchToggleWrapperOpen : ''}`}>
            <button
              className={styles.searchIconButton}
              type="button"
              aria-label="Search tasks"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={16} />
            </button>
            <div className={`${styles.searchExpandable} ${isSearchOpen ? styles.searchExpandableOpen : ''}`}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchExpandableInput}
                onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                onKeyDown={e => { if (e.key === 'Escape') { setIsSearchOpen(false); setSearchQuery(''); } }}
              />
            </div>
          </div>
          <ViewToggle
            value={currentView}
            onChange={(v) => setCurrentView(v as ViewType)}
            options={[
              { value: 'list', icon: <LayoutList size={16} />, label: 'List' },
              { value: 'calendar', icon: <CalendarDays size={16} />, label: 'Calendar' },
              { value: 'archive', icon: <Archive size={16} />, label: 'Archive' },
            ]}
          />
          <FilterPanel
            onClearAll={() => {
              setStatusFilter('all');
              setCompanyFilter('all');
              setDueDateFilter('all');
            }}
            filters={[
              {
                key: 'company',
                label: 'Company',
                value: companyFilter === 'all' ? null : companyFilter,
                options: [
                  { value: null, label: 'All Companies' },
                  ...companyOptions.map(c => ({ value: c.id, label: c.name })),
                ],
                onChange: (v) => setCompanyFilter(v ?? 'all'),
                searchable: true,
              },
              ...(currentView !== 'archive' ? [
                {
                  key: 'dueDate',
                  label: 'Due Date',
                  value: dueDateFilter === 'all' ? null : dueDateFilter,
                  options: [
                    { value: null, label: 'All Due Dates' },
                    { value: 'today', label: 'Today' },
                    { value: 'this_week', label: 'This Week' },
                    { value: 'this_month', label: 'This Month' },
                    { value: 'next_30_days', label: 'Next 30 Days' },
                  ],
                  onChange: (v: string | null) => setDueDateFilter(v ?? 'all'),
                },
                {
                  key: 'status',
                  label: 'Status',
                  value: statusFilter === 'all' ? null : statusFilter,
                  options: [
                    { value: null, label: 'All Statuses' },
                    ...projectStatusOptions.map(s => ({ value: s.value, label: s.label })),
                  ],
                  onChange: (v: string | null) => setStatusFilter(v ?? 'all'),
                },
              ] : []),
            ]}
          />
        </div>
      ),
    });
    return () => setPageHeader(null);
  }, [currentView, companyFilter, dueDateFilter, statusFilter, searchQuery, isSearchOpen, companyOptions, setPageHeader]);

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
    } else if (mention.referenceType === 'proof' && mention.projectId) {
      const proofId = mention.proofId || mention.referenceId;
      window.location.href = `/admin/project-management/${mention.projectId}?tab=proofs&proofId=${proofId}&proofFeedbackId=${mention.referenceId}`;
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

  const handleTaskCommentMentionsRead = useCallback(
    (commentIds: string[]) => {
      if (commentIds.length === 0) return;

      const commentIdSet = new Set(commentIds);
      setMentions((prev) =>
        showAllMentions
          ? prev.map((item) =>
              item.referenceType === 'task_comment' &&
              commentIdSet.has(item.referenceId)
                ? { ...item, read: true }
                : item
            )
          : prev.filter(
              (item) =>
                !(
                  item.referenceType === 'task_comment' &&
                  commentIdSet.has(item.referenceId)
                )
            )
      );
    },
    [showAllMentions]
  );

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
        if (isCompleted && isStarred('task', taskId)) {
          await toggleStar('task', taskId);
        }
        await fetchTasks();
      } else {
        console.error('Error updating task completion:', await response.text());
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  }, [fetchTasks, selectedTaskDetail, isStarred, toggleStar]);

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
      !!(task as TaskWithMonthlyServiceMeta).monthly_service_id &&
      !contentAndSocialMediaTaskIds.has(task.id)
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
  const assignedOutPersonalTasks = assignedOutTasks.filter(
    (task) =>
      task.status !== 'completed' &&
      !task.project_id &&
      !(task as TaskWithMonthlyServiceMeta).monthly_service_id
  );
  const completedAssignedOutPersonalTasks = assignedOutTasks.filter(
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
                  users={users}
                  groupTasksByProject
                  statusFilter={statusFilter ?? undefined}
                  companyFilter={companyFilter ?? undefined}
                  dueDateFilter={dueDateFilter ?? undefined}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  personalTasks={personalTasks}
                  assignedPersonalTasks={assignedOutPersonalTasks}
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
                  users={users}
                  groupTasksByProject
                  companyFilter={companyFilter ?? undefined}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  personalTasks={completedPersonalTasks}
                  assignedPersonalTasks={completedAssignedOutPersonalTasks}
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
        onTaskCommentMentionsRead={handleTaskCommentMentionsRead}
        onToggleStar={(taskId) => toggleStar('task', taskId)}
        isStarred={(taskId) => isStarred('task', taskId)}
      />
    </div>
  );
}
