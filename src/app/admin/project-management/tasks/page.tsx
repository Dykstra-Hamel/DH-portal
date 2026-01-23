'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useUser } from '@/hooks/useUser';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { CalendarView } from '@/components/TaskManagement/CalendarView/CalendarView';
import { ArchiveView } from '@/components/TaskManagement/ArchiveView/ArchiveView';
import { TaskListView } from '@/components/TaskManagement/TaskListView/TaskListView';
import { Task, Project } from '@/types/taskManagement';
import { ProjectTask } from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/project-management/projectManagement.module.scss';

type ViewType = 'list' | 'calendar' | 'archive';

export default function AdminTasksPage() {
  const { registerPageAction } = usePageActions();
  const { user } = useUser();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  // State for API data
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Filter tasks based on My Tasks toggle
  const filteredTasks = useMemo(() => {
    const convertedTasks = tasks.map(convertToTask);
    if (showMyTasksOnly && user?.id) {
      return convertedTasks.filter(task => task.assigned_to === user.id);
    }
    return convertedTasks;
  }, [tasks, showMyTasksOnly, user?.id]);

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

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTasks(), fetchProjects()]);
      setIsLoading(false);
    };

    fetchData();
  }, [fetchTasks, fetchProjects]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setSelectedTask(task);
    setShowTaskModal(true);
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* View Tabs and Toggle */}
      <div className={styles.viewTabsContainer}>
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

        <div className={styles.toggleSwitch}>
          <button
            className={`${styles.toggleButton} ${showMyTasksOnly ? styles.active : ''}`}
            onClick={() => setShowMyTasksOnly(true)}
          >
            My Tasks
          </button>
          <button
            className={`${styles.toggleButton} ${!showMyTasksOnly ? styles.active : ''}`}
            onClick={() => setShowMyTasksOnly(false)}
          >
            All Tasks
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className={styles.viewContent}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading tasks...</p>
          </div>
        ) : (
          <>
            {currentView === 'list' && (
              <TaskListView
                tasks={filteredTasks}
                projects={projects}
                onTaskClick={handleTaskClick}
                onDeleteTask={handleDeleteTask}
              />
            )}
            {currentView === 'calendar' && (
              <CalendarView
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
              />
            )}
            {currentView === 'archive' && (
              <ArchiveView
                tasks={filteredTasks.filter(t => t.status === 'completed')}
                projects={projects.filter(p => p.status === 'completed')}
                onTaskClick={handleTaskClick}
              />
            )}
          </>
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
      />
    </div>
  );
}
