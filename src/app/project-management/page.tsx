'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import ProjectForm from '@/components/Projects/ProjectForm/ProjectForm';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { ProjectKanbanView } from '@/components/ProjectManagement/ProjectKanbanView/ProjectKanbanView';
import { ProjectCalendarView } from '@/components/ProjectManagement/ProjectCalendarView/ProjectCalendarView';
import { ProjectsView } from '@/components/ProjectManagement/ProjectsView/ProjectsView';
import { TemplateSelectorModal } from '@/components/ProjectTemplates/TemplateSelectorModal/TemplateSelectorModal';
import { QuickProjectModal } from '@/components/ProjectTemplates/QuickProjectModal/QuickProjectModal';
import { RecurringFrequency, Task } from '@/types/taskManagement';
import { Project, User, Company, ProjectFormData, ProjectTemplate, ProjectCategory } from '@/types/project';
import { QuickProjectData } from '@/components/ProjectTemplates/QuickProjectModal/QuickProjectModal';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Search } from 'lucide-react';
import styles from './projectManagement.module.scss';

type ViewType = 'kanban' | 'list' | 'calendar';
type ProjectScope = 'internal' | 'client';
type TaskModalSaveData = Parameters<React.ComponentProps<typeof TaskModal>['onSave']>[0];

const normalizeTaskPriority = (
  priority: string | undefined,
  fallback: Task['priority']
) => {
  if (!priority) return fallback;
  if (priority === 'critical') return 'urgent';
  return priority as Task['priority'];
};

const recurringFrequencyValues: RecurringFrequency[] = [
  'none',
  'weekly',
  'monthly',
  'bimonthly',
  'quarterly',
  'yearly',
];

const normalizeRecurringFrequency = (
  value: string | null | undefined,
  fallback?: RecurringFrequency
): RecurringFrequency | undefined => {
  if (!value) return fallback;
  if (recurringFrequencyValues.includes(value as RecurringFrequency)) {
    return value as RecurringFrequency;
  }
  return fallback;
};

const getTaskStatus = (taskData: TaskModalSaveData, fallback: Task['status']) => {
  const legacyStatus = (taskData as Partial<Task>).status;
  if (legacyStatus) return legacyStatus;
  const isCompleted = (taskData as { is_completed?: boolean }).is_completed;
  if (typeof isCompleted === 'boolean') {
    return isCompleted ? 'completed' : 'todo';
  }
  return fallback;
};

const buildTaskFromModal = (taskData: TaskModalSaveData, fallback?: Task): Task => {
  const tags = (taskData as { tags?: string[] }).tags;
  const estimatedHours = (taskData as { estimated_hours?: number }).estimated_hours;
  const clientId = (taskData as { client_id?: string }).client_id;
  const fallbackTask = fallback;
  const fallbackStatus = fallbackTask?.status ?? 'todo';

  return {
    id: taskData.id ?? fallbackTask?.id ?? `task-${Date.now()}`,
    title: taskData.title ?? fallbackTask?.title ?? 'Untitled task',
    description: taskData.description ?? fallbackTask?.description ?? '',
    status: getTaskStatus(taskData, fallbackStatus),
    priority: normalizeTaskPriority(
      (taskData as { priority?: string }).priority,
      fallbackTask?.priority ?? 'medium'
    ),
    project_id: taskData.project_id ?? fallbackTask?.project_id,
    client_id: clientId ?? fallbackTask?.client_id,
    assigned_to: taskData.assigned_to ?? fallbackTask?.assigned_to,
    estimated_hours: estimatedHours ?? fallbackTask?.estimated_hours ?? 0,
    due_date: taskData.due_date ?? fallbackTask?.due_date ?? new Date().toISOString(),
    completed_date: fallbackTask?.completed_date,
    tags: Array.isArray(tags) ? tags : fallbackTask?.tags ?? [],
    recurring_frequency: normalizeRecurringFrequency(
      taskData.recurring_frequency,
      fallbackTask?.recurring_frequency
    ),
    recurring_end_date: taskData.recurring_end_date ?? fallbackTask?.recurring_end_date,
    created_at: fallbackTask?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export default function ProjectManagementDashboard() {
  const router = useRouter();
  const { registerPageAction, setPageHeader } = usePageActions();
  const { user, profile } = useUser();
  const { selectedCompany, isLoading: companyLoading } = useCompany();
  const { hasAccess, loading: featureLoading } = useFeatureAccess('project_management');

  // Determine if user is admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTemplateSelectorModal, setShowTemplateSelectorModal] = useState(false);
  const [showQuickProjectModal, setShowQuickProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | undefined>();

  // State for API data - using database Project type
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category filtering state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<ProjectCategory[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Project filter state
  const [filterCompanyId, setFilterCompanyId] = useState<string | null>(null);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string | null | undefined>(undefined); // undefined = not initialized yet
  const [hasInitializedAssignedTo, setHasInitializedAssignedTo] = useState(false);

  // Helper function to get authentication headers
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
    };
  };

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();

      // Build URL
      let url = '/api/admin/projects';
      const params = new URLSearchParams();

      // Hardcoded scope filter for regular page: show external and both scoped projects
      params.append('scopeFilter', 'external,both');

      // Add company filter if selected (for non-admins, use their company)
      if (selectedCompany?.id) {
        params.append('companyId', selectedCompany.id);
      }

      // Add category filter if selected
      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId);
      }

      // Add assigned to filter if selected
      if (filterAssignedTo) {
        params.append('assignedTo', filterAssignedTo);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const projects: Project[] = await response.json();
        setProjects(projects);
      } else {
        console.error('Failed to fetch projects:', response.status, await response.text());
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany, selectedCategoryId, filterAssignedTo]);

  // Fetch users from API
  const fetchUsers = useCallback(async (companyId?: string | null) => {
    try {
      const headers = await getAuthHeaders();
      let url;

      // Use company-specific endpoint if companyId is provided
      if (companyId) {
        url = `/api/companies/${companyId}/users`;
      } else {
        // Fall back to admin users endpoint for all users
        url = '/api/admin/users';
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        // The company endpoint returns { users: [...] }, admin endpoint returns [...]
        const usersList = data.users || data;
        setUsers(usersList);
        return usersList;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    return [];
  }, []);

  // Fetch companies from API
  const fetchCompanies = useCallback(async () => {
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
  }, []);


  // Register page actions (Add buttons in header)
  useEffect(() => {
    registerPageAction('add-project', () => {
      setShowProjectModal(true);
    });

    registerPageAction('add-task', () => {
      setShowTaskModal(true);
    });

    registerPageAction('create-from-template', () => {
      setShowTemplateSelectorModal(true);
    });

    registerPageAction('add-task-from-template', () => {
      // TODO: Implement task template selector modal
      setShowTaskModal(true);
    });

    return () => {
      // Cleanup function not needed as PageActionsProvider handles cleanup
    };
  }, [registerPageAction]);

  // Initialize filterAssignedTo to current user when user becomes available (only once)
  useEffect(() => {
    if (user?.id && !hasInitializedAssignedTo) {
      setFilterAssignedTo(user.id);
      setHasInitializedAssignedTo(true);
    }
  }, [user, hasInitializedAssignedTo]);

  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [fetchUsers, fetchCompanies]);

  // Refetch users when company filter changes
  useEffect(() => {
    const refreshUsers = async () => {
      const newUsers = await fetchUsers(filterCompanyId || undefined);

      // If "All Companies" is selected (filterCompanyId is null), show all users
      if (!filterCompanyId) {
        setFilterAssignedTo(null);
      } else {
        // Check if current filterAssignedTo user is still in the new users list
        if (filterAssignedTo && newUsers.length > 0) {
          const userExists = newUsers.some((u: User) => u.id === filterAssignedTo);
          if (!userExists) {
            setFilterAssignedTo(null);
          }
        }
      }
    };

    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCompanyId]);

  // Fetch projects when company context is ready and filters change
  useEffect(() => {
    if (!companyLoading && (selectedCompany || isAdmin)) {
      fetchProjects();
    }
  }, [companyLoading, selectedCompany, selectedCategoryId, filterCompanyId, filterAssignedTo, fetchProjects, isAdmin]);

  // Fetch company categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);
      try {
        // Only fetch company categories
        if (!selectedCompany?.id) {
          setAvailableCategories([]);
          setIsFetchingCategories(false);
          return;
        }

        const endpoint = '/api/project-categories'; // Company categories only
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
    setSelectedCategoryId(null);
  }, [selectedCompany]); // Only depend on selectedCompany

  // Calculate category counts for tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };

    availableCategories.forEach((category) => {
      counts[category.id] = projects.filter((project) =>
        project.categories?.some((cat) => cat.category_id === category.id)
      ).length;
    });

    return counts;
  }, [projects, availableCategories]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;

    const query = searchQuery.toLowerCase();
    return projects.filter((project) =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.shortcode?.toLowerCase().includes(query) ||
      project.company?.name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Set page header with project filter controls
  useEffect(() => {
    if (user && profile && companies.length > 0) {
      const assignableUsers = users.map(u => {
        // Handle both API formats: company endpoint (direct fields) and admin endpoint (nested profiles)
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
        title: 'Projects Dashboard',
        description: 'Manage your projects across all phases.',
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

    return () => {
      setPageHeader(null);
    };
  }, [user, profile, users, companies, filterCompanyId, filterAssignedTo, setPageHeader]);

  const handleSubmitProject = useCallback(async (data: ProjectFormData) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        console.error('Request Data:', data);
        throw new Error(errorData.error || 'Failed to create project');
      }

      // Refresh projects list
      await fetchProjects();
      setShowProjectModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error; // ProjectForm will handle the error display
    }
  }, [fetchProjects]);

  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
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

        // Refresh projects list
        await fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  }, [fetchProjects]);

  const handleProjectClick = useCallback((project: Project) => {
    // Navigate to project detail page
    router.push(`/admin/project-management/${project.id}`);
  }, [router]);

  const handleUpdateProject = useCallback(async (updatedProject: Project) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: updatedProject.name,
          description: updatedProject.description,
          project_type: updatedProject.project_type,
          status: updatedProject.status,
          priority: updatedProject.priority,
          due_date: updatedProject.due_date,
          start_date: updatedProject.start_date,
          tags: updatedProject.tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      // Refresh projects list
      await fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  }, [fetchProjects]);

  const handleSaveTask = useCallback((taskData: TaskModalSaveData) => {
    if (taskData.id) {
      // Update existing task
      setTasks(prev =>
        prev.map(t => (t.id === taskData.id ? buildTaskFromModal(taskData, t) : t))
      );
    } else {
      // Create new task
      const newTask = buildTaskFromModal(taskData);
      setTasks(prev => [...prev, newTask]);
    }

    setShowTaskModal(false);
    setSelectedTask(undefined);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setShowTaskModal(false);
    setSelectedTask(undefined);
  }, []);

  const handleSelectTemplate = useCallback((template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelectorModal(false);
    setShowQuickProjectModal(true);
  }, []);

  const handleQuickProjectSubmit = useCallback(async (projectData: QuickProjectData) => {
    try {
      const headers = await getAuthHeaders();

      // Calculate default due_date if not provided (30 days from start_date)
      let dueDate = projectData.due_date;
      if (!dueDate && projectData.start_date) {
        const startDate = new Date(projectData.start_date);
        startDate.setDate(startDate.getDate() + 30);
        dueDate = startDate.toISOString().split('T')[0];
      }

      // Transform QuickProjectData to match API expectations
      const apiData = {
        name: projectData.project_name, // API expects 'name' not 'project_name'
        company_id: projectData.company_id,
        requested_by: user?.id, // Add required requested_by field
        start_date: projectData.start_date,
        due_date: dueDate, // Ensure due_date is always provided
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

      // Refresh projects list
      await fetchProjects();
      setShowQuickProjectModal(false);
      setSelectedTemplate(undefined);
    } catch (error) {
      console.error('Error creating project from template:', error);
      throw error; // QuickProjectModal will handle the error display
    }
  }, [fetchProjects, user]);

  // Redirect if user doesn't have access (after all hooks are called)
  useEffect(() => {
    if (!featureLoading && !hasAccess) {
      router.push('/dashboard');
    }
  }, [hasAccess, featureLoading, router]);

  // Show loading state while checking feature access
  if (featureLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render anything if user doesn't have access (will redirect)
  if (!hasAccess) {
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
      </div>

      {/* View Content */}
      <div className={styles.viewContent}>
        {/* Show message if non-admin without company */}
        {!isAdmin && !selectedCompany && !companyLoading ? (
          <div className={styles.noCompanyMessage}>
            <p>Please select a company to view projects.</p>
          </div>
        ) : (isLoading || companyLoading) ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading projects...</p>
          </div>
        ) : (
          <>
            {currentView === 'kanban' && (
              <ProjectKanbanView
                projects={filteredProjects}
                onProjectClick={handleProjectClick}
                onUpdateProject={handleUpdateProject}
                onAddTask={() => setShowTaskModal(true)}
              />
            )}
            {currentView === 'list' && (
              <ProjectsView
                projects={filteredProjects}
                tasks={tasks}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
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

      {/* Modals */}
      {user && (
        <ProjectForm
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(undefined);
          }}
          onSubmit={handleSubmitProject}
          users={users}
          companies={companies}
          currentUser={user}
          currentUserProfile={profile}
          isAdmin={isAdmin}
          mode={isAdmin ? 'full' : 'request'}
        />
      )}

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

      <TemplateSelectorModal
        isOpen={showTemplateSelectorModal}
        onClose={() => setShowTemplateSelectorModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {selectedTemplate && (
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
