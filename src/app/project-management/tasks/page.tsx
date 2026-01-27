'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { TaskModal } from '@/components/TaskManagement/TaskModal/TaskModal';
import { CalendarView } from '@/components/TaskManagement/CalendarView/CalendarView';
import { ArchiveView } from '@/components/TaskManagement/ArchiveView/ArchiveView';
import { TaskListView } from '@/components/TaskManagement/TaskListView/TaskListView';
import {
  Task,
  RecurringFrequency,
} from '@/types/taskManagement';
import { Project } from '@/types/project';
import styles from '../projectManagement.module.scss';

type ViewType = 'list' | 'calendar' | 'archive';
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

export default function TasksPage() {
  const { registerPageAction } = usePageActions();
  const { user } = useUser();
  const { selectedCompany } = useCompany();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  // State for API data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);


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

  // Fetch tasks and projects from API
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompany?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch tasks
        const tasksResponse = await fetch(`/api/tasks?companyId=${selectedCompany.id}`);
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          // Ensure tasksData is an array before setting
          if (Array.isArray(tasksData)) {
            setTasks(tasksData);
          } else {
            console.error('Tasks API returned non-array data:', tasksData);
            setTasks([]);
          }
        } else {
          console.error('Error fetching tasks:', await tasksResponse.text());
          setTasks([]);
        }

        // Fetch projects - use regular projects endpoint with companyId parameter
        const projectsResponse = await fetch(`/api/projects?companyId=${selectedCompany.id}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          // Ensure projectsData is an array before setting
          if (Array.isArray(projectsData)) {
            setProjects(projectsData);
          } else {
            console.error('Projects API returned non-array data:', projectsData);
            setProjects([]);
          }
        } else {
          console.error('Error fetching projects:', await projectsResponse.text());
          setProjects([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setTasks([]);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCompany?.id]);

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
                projects={projects.filter(p => p.status === 'complete')}
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
