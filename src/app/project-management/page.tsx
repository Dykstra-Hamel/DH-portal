'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePageActions } from '@/contexts/PageActionsContext';
import { ProjectModal } from '@/components/TaskManagement/ProjectModal/ProjectModal';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { ProjectKanbanView } from '@/components/ProjectManagement/ProjectKanbanView/ProjectKanbanView';
import { ProjectCalendarView } from '@/components/ProjectManagement/ProjectCalendarView/ProjectCalendarView';
import { ProjectsView } from '@/components/ProjectManagement/ProjectsView/ProjectsView';
import {
  DUMMY_TASKS,
  DUMMY_PROJECTS,
  Task,
  Project,
  ProjectTemplate,
} from '@/types/taskManagement';
import styles from './projectManagement.module.scss';

type ViewType = 'kanban' | 'list' | 'calendar';

export default function ProjectManagementDashboard() {
  const { registerPageAction } = usePageActions();
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  // Local state for dummy data (will be replaced with API calls later)
  const [projects, setProjects] = useState<Project[]>(DUMMY_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(DUMMY_TASKS);

  // Register page actions (Add buttons in header)
  useEffect(() => {
    registerPageAction('add-project', () => {
      setShowProjectModal(true);
    });

    registerPageAction('add-task', () => {
      setShowTaskModal(true);
    });

    return () => {
      // Cleanup function not needed as PageActionsProvider handles cleanup
    };
  }, [registerPageAction]);

  const handleSaveProject = useCallback((projectData: Partial<Project>, template?: ProjectTemplate) => {
    if (projectData.id) {
      // Update existing project
      setProjects(prev =>
        prev.map(p => (p.id === projectData.id ? { ...p, ...projectData } as Project : p))
      );
    } else {
      // Create new project
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectData.name!,
        type: projectData.type!,
        client_id: projectData.client_id!,
        requested_by: projectData.requested_by || 'user-1', // Default to user-1 or from form
        assigned_to: projectData.assigned_to,
        status: projectData.status || 'active',
        phase: projectData.phase || 'coming-up',
        priority: projectData.priority || 'medium',
        progress: projectData.progress || 0,
        start_date: projectData.start_date!,
        deadline: projectData.deadline!,
        description: projectData.description,
        tags: projectData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setProjects(prev => [...prev, newProject]);

      // If template provided, create tasks from template
      if (template) {
        const newTasks = template.defaultTasks.map((taskTemplate, index) => {
          const task: Task = {
            id: `task-${Date.now()}-${index}`,
            title: taskTemplate.title,
            description: taskTemplate.description,
            status: taskTemplate.status,
            priority: taskTemplate.priority,
            project_id: newProject.id,
            client_id: newProject.client_id,
            estimated_hours: taskTemplate.estimated_hours,
            due_date: taskTemplate.due_date,
            tags: taskTemplate.tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return task;
        });

        setTasks(prev => [...prev, ...newTasks]);
      }
    }

    setShowProjectModal(false);
    setSelectedProject(undefined);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This will not delete associated tasks.')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  }, []);

  const handleProjectClick = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  }, []);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProjects(prev =>
      prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  }, []);

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

  return (
    <div className={styles.pageContainer}>
      {/* View Tabs */}
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

      {/* View Content */}
      <div className={styles.viewContent}>
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
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setSelectedProject(undefined);
        }}
        onSave={handleSaveProject}
        project={selectedProject}
      />

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
    </div>
  );
}
