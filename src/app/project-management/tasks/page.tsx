'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useUser } from '@/hooks/useUser';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { KanbanView } from '@/components/TaskManagement/KanbanView/KanbanView';
import { CalendarView } from '@/components/TaskManagement/CalendarView/CalendarView';
import { ArchiveView } from '@/components/TaskManagement/ArchiveView/ArchiveView';
import { TaskListView } from '@/components/TaskManagement/TaskListView/TaskListView';
import {
  DUMMY_TASKS,
  DUMMY_PROJECTS,
  Task,
  Project,
} from '@/types/taskManagement';
import styles from '../projectManagement.module.scss';

type ViewType = 'kanban' | 'list' | 'calendar' | 'archive';

export default function TasksPage() {
  const { registerPageAction } = usePageActions();
  const { user } = useUser();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  // Local state for dummy data (will be replaced with API calls later)
  const [tasks, setTasks] = useState<Task[]>(DUMMY_TASKS);
  const [projects, setProjects] = useState<Project[]>(DUMMY_PROJECTS);

  // Filter tasks based on My Tasks toggle
  const filteredTasks = useMemo(() => {
    if (showMyTasksOnly && user?.id) {
      return tasks.filter(task => task.assigned_to === user.id);
    }
    return tasks;
  }, [tasks, showMyTasksOnly, user?.id]);

  // Register page actions (Add buttons in header)
  useEffect(() => {
    registerPageAction('add-task', () => {
      setShowTaskModal(true);
    });

    return () => {
      // Cleanup function not needed as PageActionsProvider handles cleanup
    };
  }, [registerPageAction]);

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

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks(prev =>
      prev.map(t => (t.id === updatedTask.id ? updatedTask : t))
    );
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* View Tabs and Toggle */}
      <div className={styles.viewTabsContainer}>
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
        {currentView === 'kanban' && (
          <KanbanView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onUpdateTask={handleUpdateTask}
          />
        )}
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
