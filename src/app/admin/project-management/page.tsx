'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useCompany } from '@/contexts/CompanyContext';
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
import styles from '../../project-management/projectManagement.module.scss';

type ViewType = 'kanban' | 'list' | 'calendar';

export default function AdminProjectManagementDashboard() {
  const router = useRouter();
  const { registerPageAction, setPageHeader } = usePageActions();
  const { user, profile } = useUser();
  const { selectedCompany, isLoading: companyLoading } = useCompany();

  // View and modal state
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTemplateSelectorModal, setShowTemplateSelectorModal] = useState(false);
  const [showQuickProjectModal, setShowQuickProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | undefined>();

  // State for API data
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
  const [filterAssignedTo, setFilterAssignedTo] = useState<string | null | undefined>(undefined);
  const [hasInitializedAssignedTo, setHasInitializedAssignedTo] = useState(false);

  // Admin-only access check
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

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

      // Add category filter if selected
      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId);
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

  // Register page actions
  useEffect(() => {
    registerPageAction('add-project', () => {
      setShowProjectModal(true);
    });

    registerPageAction('create-from-template', () => {
      setShowTemplateSelectorModal(true);
    });

    return () => {
      // Cleanup handled by PageActionsProvider
    };
  }, [registerPageAction]);

  // Set page header
  useEffect(() => {
    if (user && profile) {
      setPageHeader({
        title: 'Admin Projects',
        description: 'Manage internal and shared projects.',
      });
    }

    return () => setPageHeader(null);
  }, [user, profile, setPageHeader]);

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

  // Initialize assignedTo filter to current user
  useEffect(() => {
    if (user && !hasInitializedAssignedTo) {
      setFilterAssignedTo(user.id);
      setHasInitializedAssignedTo(true);
    }
  }, [user, hasInitializedAssignedTo]);

  const handleProjectClick = (project: Project) => {
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

  // Don't render for non-admins (after all hooks have been called)
  if (!isAdmin) {
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
        {isLoading ? (
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
                onEditProject={handleProjectClick}
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
