'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useStarredItems } from '@/hooks/useStarredItems';
import ProjectForm from '@/components/Projects/ProjectForm/ProjectForm';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { ProjectKanbanView } from '@/components/ProjectManagement/ProjectKanbanView/ProjectKanbanView';
import { ProjectCalendarView } from '@/components/ProjectManagement/ProjectCalendarView/ProjectCalendarView';
import { ProjectsView } from '@/components/ProjectManagement/ProjectsView/ProjectsView';
import { TemplateSelectorModal } from '@/components/ProjectTemplates/TemplateSelectorModal/TemplateSelectorModal';
import { QuickProjectModal } from '@/components/ProjectTemplates/QuickProjectModal/QuickProjectModal';
import { Task } from '@/types/taskManagement';
import { Project, User, Company, ProjectFormData, ProjectTemplate, ProjectCategory, ProjectTask } from '@/types/project';
import { QuickProjectData } from '@/components/ProjectTemplates/QuickProjectModal/QuickProjectModal';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Search } from 'lucide-react';
import styles from '../../project-management/projectManagement.module.scss';

type ViewType = 'kanban' | 'list' | 'calendar';

export default function AdminProjectManagementDashboard() {
  const router = useRouter();
  const { registerPageAction, setPageHeader } = usePageActions();
  const { user, profile } = useUser();
  const { selectedCompany, isLoading: companyLoading } = useCompany();
  const { isStarred, toggleStar } = useStarredItems();

  // View and modal state
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'date' | 'status'>(() => {
    // Load saved preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectManagement.kanbanGroupBy');
      return (saved === 'status' ? 'status' : 'date') as 'date' | 'status';
    }
    return 'date';
  });
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

  // Category filtering state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<ProjectCategory[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Project filter state
  const [filterCompanyId, setFilterCompanyId] = useState<string | null>(null);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string | null>(null);

  // Admin-only access check
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // Redirect non-admins
  useEffect(() => {
    if (profile && !isAdmin) {
      router.push('/dashboard');
    }
  }, [profile, isAdmin, router]);

  // Save kanban groupBy preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectManagement.kanbanGroupBy', kanbanGroupBy);
    }
  }, [kanbanGroupBy]);

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
  }, [filterCompanyId, filterAssignedTo]);

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
  }, [selectedCategoryId, filterCompanyId, filterAssignedTo]);

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

  // Fetch tasks on mount
  useEffect(() => {
    if (isAdmin) {
      fetchTasks();
    }
  }, [isAdmin, fetchTasks]);

  // Fetch admin categories (always from admin endpoint)
  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);
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
      } finally {
        setIsFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []); // Fetch categories once on mount

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

  // Set page header with filter controls
  useEffect(() => {
    if (user && profile && companies.length > 0) {
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

      setPageHeader({
        title: 'Admin Project Dashboard',
        description: 'Internal Project and Task Management',
        projectFilterControls: {
          selectedCompanyId: filterCompanyId,
          selectedAssignedTo: filterAssignedTo,
          companies: companies,
          assignableUsers: assignableUsers,
          currentUser: {
            id: user.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || '',
            email: user.email || '',
            avatar: profile.avatar_url || undefined,
          },
          onCompanyChange: (companyId: string | null) => {
            setFilterCompanyId(companyId);
          },
          onAssignedToChange: (userId: string | null) => {
            setFilterAssignedTo(userId);
          },
        },
      });
    }

    return () => setPageHeader(null);
  }, [user, profile, users, companies, filterCompanyId, filterAssignedTo, setPageHeader]);

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
        startDate.setDate(startDate.getDate() + 30);
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
  }, [fetchProjects, user]);

  const handleToggleStar = useCallback(async (projectId: string) => {
    await toggleStar('project', projectId);
    // The UI will update automatically through the isStarred check in projectsWithStarred
  }, [toggleStar]);

  // Don't render for non-admins (after all hooks have been called)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Category Tabs with Search */}
      <div className={styles.tabsRow}>
        <div className={styles.tabsSection}>
          <button
            className={`${styles.categoryTab} ${selectedCategoryId === null ? styles.active : ''}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            All Projects
            <span className={styles.tabCount}>{categoryCounts.all}</span>
          </button>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryTab} ${selectedCategoryId === category.id ? styles.active : ''}`}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
              <span className={styles.tabCount}>{categoryCounts[category.id] || 0}</span>
            </button>
          ))}
          <button
            className={`${styles.categoryTab} ${selectedCategoryId === 'billing' ? styles.active : ''}`}
            onClick={() => setSelectedCategoryId('billing')}
          >
            Billing
            <span className={styles.tabCount}>{categoryCounts['billing'] || 0}</span>
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

      {/* View Controls Row */}
      <div className={styles.viewControls}>
        {/* View Tabs (Kanban/List/Calendar) - LEFT SIDE */}
        <div className={styles.viewTabs}>
          <button
            className={`${styles.viewTab} ${currentView === 'kanban' ? styles.active : ''}`}
            onClick={() => setCurrentView('kanban')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4.55539 3.7778V9.22224M7.6665 3.7778V6.88891M10.7776 3.7778V10.7778M2.22206 0.666687H13.1109C13.9701 0.666687 14.6665 1.36313 14.6665 2.22224V13.1111C14.6665 13.9702 13.9701 14.6667 13.1109 14.6667H2.22206C1.36295 14.6667 0.666504 13.9702 0.666504 13.1111V2.22224C0.666504 1.36313 1.36295 0.666687 2.22206 0.666687Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Kanban
          </button>
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
        </div>

        {/* Kanban Group By Toggle - RIGHT SIDE */}
        {currentView === 'kanban' && (
          <div className={styles.kanbanGroupToggle}>
            <button
              className={`${styles.groupToggleButton} ${kanbanGroupBy === 'date' ? styles.active : ''}`}
              onClick={() => setKanbanGroupBy('date')}
            >
              Due Date
            </button>
            <button
              className={`${styles.groupToggleButton} ${kanbanGroupBy === 'status' ? styles.active : ''}`}
              onClick={() => setKanbanGroupBy('status')}
            >
              Status
            </button>
          </div>
        )}
      </div>

      {/* View Content */}
      <div className={styles.viewContent}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading projects...</p>
          </div>
        ) : (
          <>
            {currentView === 'kanban' && (
              <ProjectKanbanView
                projects={filteredProjects}
                taskStatsByProject={taskStatsByProject}
                onProjectClick={handleProjectClick}
                onUpdateProject={handleUpdateProject}
                onAddTask={() => setShowTaskModal(true)}
                onToggleStar={handleToggleStar}
                groupBy={kanbanGroupBy}
              />
            )}
            {currentView === 'list' && (
              <ProjectsView
                projects={filteredProjects}
                tasks={tasks.map(convertToTask)}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
                onToggleStar={handleToggleStar}
              />
            )}
            {currentView === 'calendar' && (
              <ProjectCalendarView
                projects={filteredProjects}
                onProjectClick={handleProjectClick}
              />
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
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
          users={users}
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
