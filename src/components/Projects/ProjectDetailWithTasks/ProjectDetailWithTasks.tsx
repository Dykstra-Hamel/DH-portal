'use client';

import React, { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Project, ProjectTask, User as ProjectUser } from '@/types/project';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { adminAPI } from '@/lib/api-client';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import ProjectTaskList from '../ProjectTaskList/ProjectTaskList';
import ProjectTaskForm from '../ProjectTaskForm/ProjectTaskForm';
import ProjectTaskDetail from '../ProjectTaskDetail/ProjectTaskDetail';
import styles from './ProjectDetailWithTasks.module.scss';

interface ProjectDetailWithTasksProps {
  project: Project;
  user: User;
  onProjectUpdate?: () => void;
}

export default function ProjectDetailWithTasks({ project, user, onProjectUpdate }: ProjectDetailWithTasksProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [projectKey, setProjectKey] = useState(0);

  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    clearError,
  } = useProjectTasks(project.id);

  // Fetch tasks when switching to tasks tab
  React.useEffect(() => {
    if (activeTab === 'tasks' && tasks.length === 0) {
      fetchTasks(project.id);
      // Also fetch users for assignment
      adminAPI.getUsers().then(data => setUsers(data || []));
    }
  }, [activeTab, project.id, fetchTasks, tasks.length]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task?: ProjectTask) => {
    if (task) {
      setEditingTask(task);
    } else if (selectedTask) {
      setEditingTask(selectedTask);
    }
    setIsTaskDetailOpen(false);
    setIsTaskFormOpen(true);
  };

  const handleTaskClick = (task: ProjectTask) => {
    // Fetch full task details
    fetch(`/api/admin/projects/${project.id}/tasks/${task.id}`)
      .then(res => res.json())
      .then(fullTask => {
        setSelectedTask(fullTask);
        setIsTaskDetailOpen(true);
      })
      .catch(err => console.error('Error fetching task details:', err));
  };

  const handleTaskFormSubmit = async (formData: any) => {
    if (editingTask) {
      await updateTask(project.id, editingTask.id, formData);
    } else {
      await createTask(project.id, formData);
    }
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = useCallback(async (taskId?: string) => {
    const idToDelete = taskId || selectedTask?.id;
    if (!idToDelete) return;

    await deleteTask(project.id, idToDelete);
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  }, [deleteTask, project.id, selectedTask]);

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    await updateTask(project.id, taskId, { is_completed: isCompleted });
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedTask) return;

    const response = await fetch(
      `/api/admin/projects/${project.id}/tasks/${selectedTask.id}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    // Refresh task to get new comment
    const updatedTask = await fetch(
      `/api/admin/projects/${project.id}/tasks/${selectedTask.id}`
    ).then(res => res.json());

    setSelectedTask(updatedTask);
  };

  const handleUpdateProgress = async (progress: number) => {
    if (!selectedTask) return;

    await updateTask(project.id, selectedTask.id, {
      progress_percentage: progress.toString(),
    });

    // Update local state
    setSelectedTask({
      ...selectedTask,
      progress_percentage: progress,
    });
  };

  const handleCreateSubtask = () => {
    // Implementation would set parent_task_id in form
    handleCreateTask();
  };

  const handleProjectUpdate = () => {
    // Trigger refresh of project data if callback provided
    if (onProjectUpdate) {
      onProjectUpdate();
    }
    // Force re-render of ProjectDetail component with updated data
    setProjectKey(prev => prev + 1);
  };

  // Get only top-level tasks for parent task selector
  const parentTasks = tasks.filter(t => !t.parent_task_id);

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Project Details
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
          {tasks.length > 0 && (
            <span className={styles.taskCount}>{tasks.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'details' ? (
          <ProjectDetail
            key={projectKey}
            project={project}
            user={user}
            onProjectUpdate={handleProjectUpdate}
          />
        ) : (
          <>
            {error && (
              <div className={styles.error}>
                <span>{error}</span>
                <button onClick={clearError}>×</button>
              </div>
            )}
            <ProjectTaskList
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onCreateTask={handleCreateTask}
              onDeleteTask={(taskId) => handleDeleteTask(taskId)}
              onToggleComplete={handleToggleComplete}
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      {/* Task Form Modal */}
      <ProjectTaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskFormSubmit}
        editingTask={editingTask}
        users={users}
        projectId={project.id}
        parentTasks={parentTasks}
      />

      {/* Task Detail Sidebar */}
      <ProjectTaskDetail
        task={selectedTask}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={async (taskId, updates) => {
          await updateTask(project.id, taskId, updates);
          // Refresh the task details to show updated data
          const response = await fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`);
          const updatedTask = await response.json();
          setSelectedTask(updatedTask);
        }}
        onDelete={() => handleDeleteTask()}
        onAddComment={handleAddComment}
        onCreateSubtask={handleCreateSubtask}
        onUpdateProgress={handleUpdateProgress}
        users={users}
      />
    </div>
  );
}
