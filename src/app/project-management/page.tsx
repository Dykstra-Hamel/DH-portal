'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Task } from '@/types/taskManagement';
import { Project, User, Company, ProjectFormData, ProjectTemplate, ProjectCategory } from '@/types/project';
import { QuickProjectData } from '@/components/ProjectTemplates/QuickProjectModal/QuickProjectModal';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import styles from './projectManagement.module.scss';

type ViewType = 'kanban' | 'list' | 'calendar';
type ProjectScope = 'internal' | 'client';

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
    router.push(`/project-management/${project.id}`);
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

  const handleSaveTask = useCallback((taskData: Partial<Task>) => {
    if (taskData.id) {
      // Update existing task
      setTasks(prev =>
        prev.map(t => (t.id === taskData.id ? { ...t, ...taskData } as Task : t))
      );
    } else {
      // Create new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title!,
        description: taskData.description || '',
        status: taskData.status!,
        priority: taskData.priority!,
        project_id: taskData.project_id,
        client_id: taskData.client_id,
        assigned_to: taskData.assigned_to,
        estimated_hours: taskData.estimated_hours!,
        due_date: taskData.due_date!,
        tags: taskData.tags || [],
        recurring_frequency: taskData.recurring_frequency,
        recurring_end_date: taskData.recurring_end_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

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
      {/* Category Tabs */}
      {availableCategories.length > 0 && (
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.categoryTab} ${selectedCategoryId === null ? styles.active : ''}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            All Projects
          </button>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryTab} ${selectedCategoryId === category.id ? styles.active : ''}`}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* View Controls Row */}
      <div className={styles.viewControls}>
        {/* View Tabs (Kanban/List/Calendar) - LEFT SIDE */}
        <div className={styles.viewTabs}>
          <button
            className={`${styles.viewTab} ${currentView === 'kanban' ? styles.active : ''}`}
            onClick={() => setCurrentView('kanban')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="7" y="3" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="12" y="3" width="2" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Kanban
          </button>
          <button
            className={`${styles.viewTab} ${currentView === 'list' ? styles.active : ''}`}
            onClick={() => setCurrentView('list')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            List
          </button>
          <button
            className={`${styles.viewTab} ${currentView === 'calendar' ? styles.active : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 2V4M11 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
                projects={projects}
                onProjectClick={handleProjectClick}
                onUpdateProject={handleUpdateProject}
              />
            )}
            {currentView === 'list' && (
              <ProjectsView
                projects={projects}
                tasks={tasks}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
              />
            )}
            {currentView === 'calendar' && (
              <ProjectCalendarView
                projects={projects}
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
          isAdmin={true}
          mode="full"
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
