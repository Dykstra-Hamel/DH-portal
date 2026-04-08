'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useStarredItems } from '@/hooks/useStarredItems';
import { useLocalStorageFilter } from '@/hooks/useLocalStorageFilter';
import ProjectForm from '@/components/Projects/ProjectForm/ProjectForm';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { ProjectKanbanView } from '@/components/ProjectManagement/ProjectKanbanView/ProjectKanbanView';
import { ProjectCardGrid } from '@/components/ProjectManagement/ProjectCardGrid/ProjectCardGrid';
import { ProjectCalendarView } from '@/components/ProjectManagement/ProjectCalendarView/ProjectCalendarView';
import { ProjectsView } from '@/components/ProjectManagement/ProjectsView/ProjectsView';
import { TemplateSelectorModal } from '@/components/ProjectTemplates/TemplateSelectorModal/TemplateSelectorModal';
import { QuickProjectModal } from '@/components/ProjectTemplates/QuickProjectModal/QuickProjectModal';
import { Task } from '@/types/taskManagement';
import { Project, User, Company, ProjectFormData, ProjectTemplate, ProjectCategory, ProjectDepartment, ProjectTask, statusOptions } from '@/types/project';
import { QuickProjectData } from '@/components/ProjectTemplates/QuickProjectModal/QuickProjectModal';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import {
  createAdminProjectChannel,
  subscribeToProjectUpdates,
  ProjectUpdatePayload,
} from '@/lib/realtime/project-channel';
import { Search, KanbanSquare, LayoutList, CalendarDays } from 'lucide-react';
import { FilterPanel } from '@/components/Common/FilterPanel/FilterPanel';
import { ViewToggle } from '@/components/Common/ViewToggle/ViewToggle';
import styles from '../../project-management/projectManagement.module.scss';

type ViewType = 'kanban' | 'list' | 'calendar';
type ProjectStatusTab = 'current' | 'new' | 'on_hold' | 'completed';

export default function AdminProjectManagementDashboard() {
  const router = useRouter();
  const { registerPageAction, setPageHeader } = usePageActions();
  const { user, profile } = useUser();
  const { selectedCompany, isLoading: companyLoading } = useCompany();
  const { isStarred, toggleStar } = useStarredItems();

  // View and modal state
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectManagement.viewPreference');
      return (saved as ViewType) || 'kanban';
    }
    return 'kanban';
  });
  const [projectStatusTab, setProjectStatusTab] = useState<ProjectStatusTab>('current');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTemplateSelectorModal, setShowTemplateSelectorModal] = useState(false);
  const [showQuickProjectModal, setShowQuickProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | undefined>();

  // State for API data
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjectsForCounts, setAllProjectsForCounts] = useState<Project[]>([]); // Unfiltered projects for tab counts
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(false);

  // Category filtering state (persisted to localStorage)
  const [selectedCategoryId, setSelectedCategoryId] = useLocalStorageFilter('pm.selectedCategoryId');
  const [availableCategories, setAvailableCategories] = useState<ProjectCategory[]>([]);

  // Department state
  const [availableDepartments, setAvailableDepartments] = useState<ProjectDepartment[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Project filter state (persisted to localStorage)
  const [filterCompanyId, setFilterCompanyId] = useLocalStorageFilter('pm.filterCompanyId');
  const [filterAssignedTo, setFilterAssignedTo] = useLocalStorageFilter('pm.filterAssignedTo');
  const [filterMemberId, setFilterMemberId] = useLocalStorageFilter('pm.filterMemberId');
  const [filterStatus, setFilterStatus] = useLocalStorageFilter('pm.filterStatus');

  // Realtime subscription refs
  const subscriptionActiveRef = useRef(false);
  const currentChannelRef = useRef<ReturnType<typeof createAdminProjectChannel> | null>(null);
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Admin and project_manager access check
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'project_manager';

  // Redirect non-admins
  useEffect(() => {
    if (profile && !isAdmin) {
      router.push('/dashboard');
    }
  }, [profile, isAdmin, router]);

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
  const convertToTask = (projectTask: ProjectTask): Task => ({
    id: projectTask.id,
    title: projectTask.title,
    description: projectTask.description || '',
    status: projectTask.is_completed ? 'completed' : 'todo',
    priority: (projectTask.priority as Task['priority']) || 'medium',
    project_id: projectTask.project_id || undefined,
    assigned_to: projectTask.assigned_to || undefined,
    due_date: projectTask.due_date || '',
    estimated_hours: 0,
    tags: [],
    created_at: projectTask.created_at || new Date().toISOString(),
    updated_at: projectTask.updated_at || new Date().toISOString(),
  });

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setIsTasksLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/project-tasks', { headers });

      if (response.ok) {
        const data: ProjectTask[] = await response.json();
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsTasksLoading(false);
    }
  }, []);

  // Fetch all projects (without category filter) for tab counts
  const fetchAllProjectsForCounts = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const url = '/api/admin/projects';
      const params = new URLSearchParams();

      // Hardcoded scope filter for admin page: show internal and both scoped projects
      params.append('scopeFilter', 'internal,both');

      // Add company filter if selected (keep this filter for counts)
      if (filterCompanyId) {
        params.append('companyId', filterCompanyId);
      }

      // Add assigned_to filter if selected (keep this filter for counts)
      if (filterAssignedTo !== undefined && filterAssignedTo !== null) {
        params.append('assignedTo', filterAssignedTo);
      }

      // Add member filter if selected
      if (filterMemberId) {
        params.append('memberId', filterMemberId);
      }

      // NOTE: Do NOT add category filter - we need all projects for accurate counts

      const response = await fetch(`${url}?${params.toString()}`, { headers });

      if (response.ok) {
        const data: Project[] = await response.json();
        setAllProjectsForCounts(data);
      } else {
        setAllProjectsForCounts([]);
      }
    } catch (error) {
      console.error('Error fetching all projects for counts:', error);
      setAllProjectsForCounts([]);
    }
  }, [filterCompanyId, filterAssignedTo, filterMemberId]);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();

      const url = '/api/admin/projects';
      const params = new URLSearchParams();

      // Hardcoded scope filter for admin page: show internal and both scoped projects
      params.append('scopeFilter', 'internal,both');

      // Add company filter if selected
      if (filterCompanyId) {
        params.append('companyId', filterCompanyId);
      }

      // Add category filter if selected (handle "billing" as special case)
      if (selectedCategoryId) {
        if (selectedCategoryId === 'billing') {
          params.append('isBillable', 'true');
        } else {
          params.append('categoryId', selectedCategoryId);
        }
      }

      // Add assigned_to filter if selected
      if (filterAssignedTo !== undefined && filterAssignedTo !== null) {
        params.append('assignedTo', filterAssignedTo);
      }

      // Add member filter if selected
      if (filterMemberId) {
        params.append('memberId', filterMemberId);
      }

      const response = await fetch(`${url}?${params.toString()}`, { headers });

      if (response.ok) {
        const data: Project[] = await response.json();
        setProjects(data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, filterCompanyId, filterAssignedTo, filterMemberId]);

  // Fetch users (admin users only)
  useEffect(() => {
    const refreshUsers = async () => {
      try {
        const headers = await getAuthHeaders();

        // Always fetch admin/system users for admin page
        const endpoint = '/api/admin/users?include_system=true';

        const response = await fetch(endpoint, { headers });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch projects when filters change
  useEffect(() => {
    fetchProjects();
  }, [selectedCategoryId, filterCompanyId, filterAssignedTo, fetchProjects]);

  // Fetch all projects for counts when non-category filters change
  useEffect(() => {
    fetchAllProjectsForCounts();
  }, [filterCompanyId, filterAssignedTo, fetchAllProjectsForCounts]);

  // Refetch projects when page becomes visible (e.g., navigating back from detail page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProjects();
        fetchAllProjectsForCounts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProjects, fetchAllProjectsForCounts]);

  // Realtime subscription for project updates (broadcast-based)
  useEffect(() => {
    if (!isAdmin) return;

    // Prevent duplicate subscriptions (e.g., Fast Refresh)
    if (subscriptionActiveRef.current && currentChannelRef.current) {
      return;
    }

    const channel = createAdminProjectChannel();
    currentChannelRef.current = channel;

    subscribeToProjectUpdates(channel, async (payload: ProjectUpdatePayload) => {
      // Skip if already fetching to avoid thrashing
      if (isFetchingRef.current) return;

      // Debounce rapid changes (e.g., bulk task updates) by 500ms
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        isFetchingRef.current = true;
        try {
          await Promise.all([
            fetchProjects(),
            fetchAllProjectsForCounts(),
            // Also refresh tasks if a project_task changed
            payload.table === 'project_tasks' ? fetchTasks() : Promise.resolve(),
          ]);
        } finally {
          isFetchingRef.current = false;
        }
      }, 500);
    });

    subscriptionActiveRef.current = true;

    return () => {
      subscriptionActiveRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (currentChannelRef.current) {
        createClient().removeChannel(currentChannelRef.current);
        currentChannelRef.current = null;
      }
    };
  }, [isAdmin, fetchProjects, fetchAllProjectsForCounts, fetchTasks]);

  // Fetch tasks on mount
  useEffect(() => {
    if (isAdmin) {
      fetchTasks();
    }
  }, [isAdmin, fetchTasks]);

  // Fetch admin categories (always from admin endpoint)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Always fetch admin/system categories for admin page
        const endpoint = '/api/admin/project-categories';
        const headers = await getAuthHeaders();
        const response = await fetch(endpoint, { headers });

        if (response.ok) {
          const categories: ProjectCategory[] = await response.json();
          setAvailableCategories(categories);
        } else {
          setAvailableCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setAvailableCategories([]);
      }
    };

    fetchCategories();
  }, []); // Fetch categories once on mount

  // Fetch admin departments (always from admin endpoint)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const endpoint = '/api/admin/project-departments';
        const headers = await getAuthHeaders();
        const response = await fetch(endpoint, { headers });

        if (response.ok) {
          const departments: ProjectDepartment[] = await response.json();
          setAvailableDepartments(departments);
        } else {
          setAvailableDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setAvailableDepartments([]);
      }
    };

    fetchDepartments();
  }, []); // Fetch departments once on mount

  // Calculate category counts for tabs - use allProjectsForCounts to ensure counts are accurate
  // even when a category filter is applied
  const categoryCounts = useMemo(() => {
    const projectsToCount = allProjectsForCounts.length > 0 ? allProjectsForCounts : projects;
    const counts: Record<string, number> = { all: projectsToCount.length };

    availableCategories.forEach((category) => {
      counts[category.id] = projectsToCount.filter((project) =>
        project.categories?.some((cat) => cat.category_id === category.id)
      ).length;
    });

    // Add billing count (projects with is_billable = true)
    counts['billing'] = projectsToCount.filter((project) => project.is_billable).length;

    return counts;
  }, [allProjectsForCounts, projects, availableCategories]);

  // Add starred status to projects
  const projectsWithStarred = useMemo(() => {
    return projects.map(project => ({
      ...project,
      is_starred: isStarred('project', project.id),
    }));
  }, [projects, isStarred]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projectsWithStarred;

    const query = searchQuery.toLowerCase();
    return projectsWithStarred.filter((project) =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.shortcode?.toLowerCase().includes(query) ||
      project.company?.name.toLowerCase().includes(query)
    );
  }, [projectsWithStarred, searchQuery]);

  const statusTabCounts = useMemo(() => {
    const isCompleteStatus = (status?: string | null) =>
      status === 'complete' || status === 'completed';
    const isNewStatus = (status?: string | null) => status === 'new';
    const isOnHoldStatus = (status?: string | null) => status === 'on_hold';

    return {
      current: projectsWithStarred.filter(
        (project) => !isNewStatus(project.status) && !isCompleteStatus(project.status) && !isOnHoldStatus(project.status)
      ).length,
      new: projectsWithStarred.filter((project) => isNewStatus(project.status)).length,
      on_hold: projectsWithStarred.filter((project) => isOnHoldStatus(project.status)).length,
      completed: projectsWithStarred.filter((project) => isCompleteStatus(project.status)).length,
    };
  }, [projectsWithStarred]);

  const visibleProjects = useMemo(() => {
    const isCompleteStatus = (status?: string | null) =>
      status === 'complete' || status === 'completed';
    const isNewStatus = (status?: string | null) => status === 'new';
    const isOnHoldStatus = (status?: string | null) => status === 'on_hold';

    let projects = filteredProjects;

    // Apply status tab filter
    if (projectStatusTab === 'new') {
      projects = projects.filter((project) => isNewStatus(project.status));
    } else if (projectStatusTab === 'on_hold') {
      projects = projects.filter((project) => isOnHoldStatus(project.status));
    } else if (projectStatusTab === 'completed') {
      projects = projects.filter((project) => isCompleteStatus(project.status));
    } else {
      // Current tab: exclude new, on_hold, and completed
      projects = projects.filter(
        (project) => !isNewStatus(project.status) && !isOnHoldStatus(project.status) && !isCompleteStatus(project.status)
      );
    }

    // Apply status dropdown filter (if selected)
    if (filterStatus) {
      projects = projects.filter((project) => project.status === filterStatus);
    }

    return projects;
  }, [filteredProjects, projectStatusTab, filterStatus]);

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

  const userTaskStatsByProject = useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};

    tasks.forEach((task) => {
      if (!task.project_id) return;
      // Only count tasks assigned to the current user
      if (task.assigned_to !== user?.id) return;

      const current = stats[task.project_id] || { completed: 0, total: 0 };
      current.total += 1;
      if (task.is_completed) {
        current.completed += 1;
      }
      stats[task.project_id] = current;
    });

    return stats;
  }, [tasks, user?.id]);

  // Register page actions
  useEffect(() => {
    registerPageAction('add-project', () => {
      setShowProjectModal(true);
    });

    registerPageAction('create-from-template', () => {
      setShowTemplateSelectorModal(true);
    });

    registerPageAction('add-task', () => {
      setShowTaskModal(true);
    });

    registerPageAction('add-task-from-template', () => {
      // TODO: Implement task template selector modal
      setShowTaskModal(true);
    });

    return () => {
      // Cleanup handled by PageActionsProvider
    };
  }, [registerPageAction]);

  // Set page header with filter panel and view toggle
  useEffect(() => {
    if (user && profile && companies.length > 0) {
      const currentUserName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || '';
      const assignableUsers = users.map(u => {
        // Handle both API formats
        const firstName = (u as any).first_name || u.profiles?.first_name || '';
        const lastName = (u as any).last_name || u.profiles?.last_name || '';
        const avatarUrl = (u as any).avatar_url || (u.profiles as any)?.avatar_url || null;
        const displayName = (u as any).display_name || `${firstName} ${lastName}`.trim() || u.email;

        return {
          id: u.id,
          email: u.email,
          display_name: displayName,
          avatar_url: avatarUrl,
          departments: (u as any).departments || [],
        };
      });

      const handleClearAllFilters = () => {
        setFilterCompanyId(null);
        setFilterAssignedTo(null);
        setSelectedCategoryId(null);
        setFilterStatus(null);
        setFilterMemberId(null);
      };

      const userOptions = [
        { value: null, label: 'All Users' },
        {
          value: user.id,
          label: currentUserName,
          subtitle: 'Myself',
          avatar: profile.avatar_url || null,
        },
        ...assignableUsers
          .filter(u => u.id !== user.id)
          .map(u => ({
            value: u.id,
            label: u.display_name,
            subtitle: u.email,
            avatar: u.avatar_url ?? null,
          })),
      ];

      setPageHeader({
        title: 'Admin Project Dashboard',
        description: 'Internal Project and Task Management',
        customActions: (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <ViewToggle
              value={currentView}
              onChange={(v) => setCurrentView(v as ViewType)}
              options={[
                { value: 'kanban', icon: <KanbanSquare size={18} />, label: 'Kanban' },
                { value: 'list', icon: <LayoutList size={16} />, label: 'List' },
                { value: 'calendar', icon: <CalendarDays size={16} />, label: 'Calendar' },
              ]}
            />
            <FilterPanel
              onClearAll={handleClearAllFilters}
              filters={[
                {
                  key: 'company',
                  label: 'Company',
                  value: filterCompanyId,
                  options: [
                    { value: null, label: 'All Companies' },
                    ...companies
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(c => ({ value: c.id, label: c.name })),
                  ],
                  onChange: setFilterCompanyId,
                  searchable: true,
                },
                {
                  key: 'category',
                  label: 'Category',
                  value: selectedCategoryId,
                  options: [
                    { value: null, label: 'All Categories' },
                    ...availableCategories
                      .filter(c => !c.is_hidden)
                      .map(c => ({ value: c.id, label: c.name })),
                    { value: 'billing', label: 'Billing' },
                  ],
                  onChange: setSelectedCategoryId,
                },
                {
                  key: 'assignedTo',
                  label: 'Assigned To',
                  value: filterAssignedTo,
                  options: userOptions,
                  onChange: setFilterAssignedTo,
                },
                {
                  key: 'member',
                  label: 'Project Member',
                  value: filterMemberId,
                  options: userOptions,
                  onChange: setFilterMemberId,
                  searchable: true,
                },
                {
                  key: 'status',
                  label: 'Status',
                  value: filterStatus,
                  options: [
                    { value: null, label: 'All Statuses' },
                    ...statusOptions.map(s => ({ value: s.value, label: s.label })),
                  ],
                  onChange: setFilterStatus,
                },
              ]}
            />
          </div>
        ),
      });
    }

    return () => setPageHeader(null);
  }, [user, profile, users, companies, filterCompanyId, filterAssignedTo, filterMemberId, selectedCategoryId, filterStatus, availableCategories, currentView, setPageHeader]);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/companies', { headers });
        if (response.ok) {
          const data: Company[] = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  // Default assigned filter to all users (null)

  const handleProjectClick = async (project: Project) => {
    // Mark mention notifications as read for this project
    if (project.has_unread_mentions && user) {
      try {
        await fetch('/api/notifications/mark-project-mentions-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: project.id,
          }),
        });
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }

    router.push(`/admin/project-management/${project.id}`);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/admin/projects/${projectId}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to delete project');
        }

        await fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleProjectSubmit = async (projectData: ProjectFormData) => {
    try {
      const headers = await getAuthHeaders();

      const method = selectedProject ? 'PUT' : 'POST';
      const url = selectedProject
        ? `/api/admin/projects/${selectedProject.id}`
        : '/api/admin/projects';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${selectedProject ? 'update' : 'create'} project`);
      }

      await fetchProjects();
      setShowProjectModal(false);
      setSelectedProject(undefined);
    } catch (error) {
      console.error('Error submitting project:', error);
      throw error;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveTask = useCallback(async (taskData: any) => {
    try {
      const headers = await getAuthHeaders();

      if (taskData.id) {
        // Update existing task
        const response = await fetch(`/api/admin/project-tasks/${taskData.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update task');
        }
      } else {
        // Create new task
        const response = await fetch('/api/admin/project-tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create task');
        }
      }

      // Refresh task list
      await fetchTasks();
      setShowTaskModal(false);
      setSelectedTask(undefined);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    }
  }, [fetchTasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/project-tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Refresh task list
      await fetchTasks();
      setShowTaskModal(false);
      setSelectedTask(undefined);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  }, [fetchTasks]);

  const handleUpdateProject = async (project: Project) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      await fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelectorModal(false);
    setShowQuickProjectModal(true);
  };

  const handleQuickProjectSubmit = useCallback(async (projectData: QuickProjectData) => {
    try {
      const headers = await getAuthHeaders();

      let dueDate = projectData.due_date;
      if (!dueDate && projectData.start_date) {
        const startDate = new Date(projectData.start_date);
        const offset =
          selectedTemplate?.default_due_date_offset_days ??
          30;
        startDate.setDate(startDate.getDate() + offset);
        dueDate = startDate.toISOString().split('T')[0];
      }

      const apiData = {
        name: projectData.project_name,
        company_id: projectData.company_id,
        requested_by: user?.id,
        start_date: projectData.start_date,
        due_date: dueDate,
      };

      const response = await fetch(`/api/admin/project-templates/${projectData.template_id}/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project from template');
      }

      await fetchProjects();
      setShowQuickProjectModal(false);
      setSelectedTemplate(undefined);
    } catch (error) {
      console.error('Error creating project from template:', error);
      throw error;
    }
  }, [fetchProjects, selectedTemplate, user]);

  const handleToggleStar = useCallback(async (projectId: string) => {
    await toggleStar('project', projectId);
    // The UI will update automatically through the isStarred check in projectsWithStarred
  }, [toggleStar]);

  // Save view preference to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectManagement.viewPreference', currentView);
    }
  }, [currentView]);

  // Don't render for non-admins (after all hooks have been called)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Project Status Tabs with Category Filter */}
      <div className={styles.tabsRow}>
        <div className={styles.tabsLeft}>
          <div className={`${styles.tabsSection} ${styles.tabsSectionCompact}`}>
            <button
              className={`${styles.categoryTab} ${projectStatusTab === 'current' ? styles.active : ''}`}
              onClick={() => setProjectStatusTab('current')}
            >
              Current Projects
              <span className={styles.tabCount}>{statusTabCounts.current}</span>
            </button>
            <button
              className={`${styles.categoryTab} ${projectStatusTab === 'new' ? styles.active : ''}`}
              onClick={() => setProjectStatusTab('new')}
            >
              New Project Requests
              <span className={styles.tabCount}>{statusTabCounts.new}</span>
            </button>
            <button
              className={`${styles.categoryTab} ${projectStatusTab === 'on_hold' ? styles.active : ''}`}
              onClick={() => setProjectStatusTab('on_hold')}
            >
              On Hold
              <span className={styles.tabCount}>{statusTabCounts.on_hold}</span>
            </button>
            <button
              className={`${styles.categoryTab} ${projectStatusTab === 'completed' ? styles.active : ''}`}
              onClick={() => setProjectStatusTab('completed')}
            >
              Completed
            </button>
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>
      </div>

      {/* View Content */}
      <div
        className={`${styles.viewContent} ${currentView !== 'kanban' ? styles.constrainedViewMode : ''}`}
      >
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading projects...</p>
          </div>
        ) : (
          <>
            {currentView === 'kanban' && (
              projectStatusTab === 'current' ? (
                <ProjectKanbanView
                  projects={visibleProjects}
                  departments={availableDepartments}
                  taskStatsByProject={taskStatsByProject}
                  userTaskStatsByProject={userTaskStatsByProject}
                  onProjectClick={handleProjectClick}
                  onUpdateProject={handleUpdateProject}
                  onToggleStar={handleToggleStar}
                />
              ) : (
                <ProjectCardGrid
                  projects={visibleProjects}
                  taskStatsByProject={taskStatsByProject}
                  userTaskStatsByProject={userTaskStatsByProject}
                  onProjectClick={handleProjectClick}
                  onToggleStar={handleToggleStar}
                  onUpdateProject={handleUpdateProject}
                />
              )
            )}
            {currentView === 'list' && (
              <div className={styles.constrainedViewPane}>
                <ProjectsView
                  projects={visibleProjects}
                  tasks={tasks.map(convertToTask)}
                  onEditProject={handleEditProject}
                  onDeleteProject={handleDeleteProject}
                  onToggleStar={handleToggleStar}
                  onProjectClick={handleProjectClick}
                />
              </div>
            )}
            {currentView === 'calendar' && (
              <div className={styles.constrainedViewPane}>
                <ProjectCalendarView
                  projects={visibleProjects}
                  onProjectClick={handleProjectClick}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Project Form Modal */}
      {showProjectModal && (
        <ProjectForm
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(undefined);
          }}
          onSubmit={handleProjectSubmit}
          editingProject={selectedProject}
          users={users}
          companies={companies}
          currentUser={user!}
          currentUserProfile={null}
          isAdmin={true}
          mode="full"
        />
      )}

      {/* Task Modal */}
      {showTaskModal && (
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
      )}

      {/* Template Selector Modal */}
      {showTemplateSelectorModal && (
        <TemplateSelectorModal
          isOpen={showTemplateSelectorModal}
          onClose={() => setShowTemplateSelectorModal(false)}
          onSelectTemplate={handleTemplateSelect}
        />
      )}

      {/* Quick Project Modal */}
      {showQuickProjectModal && selectedTemplate && (
        <QuickProjectModal
          isOpen={showQuickProjectModal}
          onClose={() => {
            setShowQuickProjectModal(false);
            setSelectedTemplate(undefined);
          }}
          onSubmit={handleQuickProjectSubmit}
          template={selectedTemplate}
          companies={companies}
        />
      )}
    </div>
  );
}
