'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useUser } from '@/hooks/useUser';
import { useStarredItems } from '@/hooks/useStarredItems';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { CalendarView } from '@/components/TaskManagement/CalendarView/CalendarView';
import { ArchiveView } from '@/components/TaskManagement/ArchiveView/ArchiveView';
import { TaskListView } from '@/components/TaskManagement/TaskListView/TaskListView';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import { Task } from '@/types/taskManagement';
import { ProjectTask, Project, User } from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/project-management/projectManagement.module.scss';

type ViewType = 'list' | 'calendar' | 'archive';

export default function AdminTasksPage() {
  const { registerPageAction } = usePageActions();
  const { user } = useUser();
  const { isStarred, toggleStar, refetch: refetchStarredItems } = useStarredItems();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  // Task detail sidebar state
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

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
    is_starred: isStarred('task', projectTask.id),
  });

  // Filter tasks - always show only tasks assigned to current user
  const filteredTasks = useMemo(() => {
    const convertedTasks = tasks.map(convertToTask);
    // Always filter to current user's tasks (removed toggle)
    if (user?.id) {
      return convertedTasks.filter(task => task.assigned_to === user.id);
    }
    return convertedTasks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, user?.id, isStarred]);

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

  // Open task detail sidebar
  const openTaskDetailById = useCallback(async (taskId: string, projectId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/projects/${projectId}/tasks/${taskId}`, { headers });

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
      await Promise.all([fetchTasks(), fetchProjects(), fetchUsers()]);
      setIsLoading(false);
    };

    fetchData();
  }, [fetchTasks, fetchProjects, fetchUsers]);

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
    if (task.project_id) {
      openTaskDetailById(task.id, task.project_id);
    }
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

  const handleProjectClick = useCallback((project: Project) => {
    // Navigate to project detail page
    window.location.href = `/admin/project-management/${project.id}`;
  }, []);

  // Task detail sidebar handlers
  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
    if (!selectedTaskDetail?.project_id) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${taskId}`, {
        method: 'PATCH',
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

  const handleDeleteTaskFromDetail = useCallback(async () => {
    if (!selectedTaskDetail?.project_id || !selectedTaskDetail?.id) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${selectedTaskDetail.id}`, {
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
    if (!selectedTaskDetail?.project_id || !selectedTaskDetail?.id) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${selectedTaskDetail.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        // Refresh task to get new comment
        const updatedTask = await fetch(`/api/admin/projects/${selectedTaskDetail.project_id}/tasks/${selectedTaskDetail.id}`, {
          headers,
        }).then(res => res.json());

        setSelectedTaskDetail(updatedTask);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
                projects={projectsWithStarred}
                onTaskClick={handleTaskClick}
                onDeleteTask={handleDeleteTask}
                onToggleStar={handleToggleStar}
                onProjectClick={handleProjectClick}
                onToggleStarProject={handleToggleStarProject}
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
                projects={projectsWithStarred.filter(p => p.status === 'complete')}
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

      {/* Task Detail Sidebar */}
      <ProjectTaskDetail
        task={selectedTaskDetail}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTaskDetail(null);
        }}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTaskFromDetail}
        onAddComment={handleAddComment}
        onCreateSubtask={handleCreateSubtask}
        onUpdateProgress={handleUpdateProgress}
        users={users}
        onToggleStar={(taskId) => toggleStar('task', taskId)}
        isStarred={(taskId) => isStarred('task', taskId)}
      />
    </div>
  );
}
