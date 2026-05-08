import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProjectTask, ProjectTaskFilters } from '@/types/project';
import {
  createProjectTasksChannel,
  subscribeToProjectTaskUpdates,
} from '@/lib/realtime/project-channel';

const isDevelopment = process.env.NODE_ENV === 'development';

const getTaskReference = (task: ProjectTask) => ({
  id: task.id,
  title: task.title,
  is_completed: task.is_completed,
  assigned_to: task.assigned_to,
  due_date: task.due_date,
});

const mergeTaskForList = (
  existingTask: ProjectTask,
  incomingTask: ProjectTask
): ProjectTask => {
  const mergedComments = incomingTask.comments ?? existingTask.comments;
  const derivedCommentCount =
    incomingTask.comment_count ??
    (Array.isArray(mergedComments) ? mergedComments.length : existingTask.comment_count);
  const derivedHasAttachments =
    incomingTask.has_attachments ??
    (Array.isArray(mergedComments)
      ? mergedComments.some((comment) => (comment.attachments ?? []).length > 0)
      : existingTask.has_attachments);

  return {
    ...existingTask,
    ...incomingTask,
    comments: mergedComments,
    comment_count: derivedCommentCount,
    has_attachments: derivedHasAttachments,
    hasUnreadComments:
      incomingTask.hasUnreadComments ?? existingTask.hasUnreadComments,
    hasUnreadMentions:
      incomingTask.hasUnreadMentions ?? existingTask.hasUnreadMentions,
  };
};

const applyTaskUpdate = (tasks: ProjectTask[], updatedTask: ProjectTask) => {
  const updatedRef = getTaskReference(updatedTask);

  return tasks.map((task) => {
    if (task.id === updatedTask.id) {
      return mergeTaskForList(task, updatedTask);
    }

    let changed = false;
    let nextTask = task;

    if (task.blocked_by_task?.id === updatedTask.id) {
      changed = true;
      nextTask = {
        ...nextTask,
        blocked_by_task: updatedRef,
      };
    }

    if (task.blocking_task?.id === updatedTask.id) {
      changed = true;
      nextTask = {
        ...nextTask,
        blocking_task: updatedRef,
      };
    }

    return changed ? nextTask : task;
  });
};

interface UseProjectTasksResult {
  tasks: ProjectTask[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: (projectId: string, filters?: Partial<ProjectTaskFilters>) => Promise<void>;
  createTask: (projectId: string, taskData: any) => Promise<ProjectTask>;
  updateTask: (projectId: string, taskId: string, taskData: any) => Promise<ProjectTask>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  clearError: () => void;
}

export function useProjectTasks(projectId?: string): UseProjectTasksResult {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTasks = useCallback(
    async (pid: string, filters?: Partial<ProjectTaskFilters>) => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string from filters
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
        if (filters?.milestone) params.append('milestone', filters.milestone);
        if (filters?.sprint) params.append('sprint', filters.sprint);

        const queryString = params.toString();
        const url = `/api/admin/projects/${pid}/tasks${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tasks');
        }

        const data = await response.json();
        setTasks(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
        setError(errorMessage);
        console.error('Error fetching tasks:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createTask = useCallback(
    async (pid: string, taskData: any): Promise<ProjectTask> => {
      setError(null);

      try {
        const response = await fetch(`/api/admin/projects/${pid}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create task');
        }

        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
        return newTask;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
        setError(errorMessage);
        console.error('Error creating task:', err);
        throw err;
      }
    },
    []
  );

  const updateTask = useCallback(
    async (pid: string, taskId: string, taskData: any): Promise<ProjectTask> => {
      setError(null);

      try {
        const response = await fetch(`/api/admin/projects/${pid}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update task');
        }

        const updatedTask = await response.json();
        setTasks((prev) => applyTaskUpdate(prev, updatedTask));
        return updatedTask;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
        setError(errorMessage);
        console.error('Error updating task:', err);
        throw err;
      }
    },
    []
  );

  const deleteTask = useCallback(
    async (pid: string, taskId: string): Promise<void> => {
      setError(null);

      try {
        const response = await fetch(`/api/admin/projects/${pid}/tasks/${taskId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete task');
        }

        setTasks((prev) => prev.filter((task) => task.id !== taskId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
        setError(errorMessage);
        console.error('Error deleting task:', err);
        throw err;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Realtime subscription via broadcast (project_tasks is no longer in the
  // supabase_realtime publication; the broadcast_project_task_to_projects
  // trigger sends per-project events to project:{id}:tasks).
  useEffect(() => {
    if (!projectId) return;

    const channel = createProjectTasksChannel(projectId);
    subscribeToProjectTaskUpdates(channel, async (payload) => {
      if (isDevelopment) {
        console.log('Task change received:', payload);
      }

      if (payload.action === 'INSERT' || payload.action === 'UPDATE') {
        try {
          const res = await fetch(`/api/admin/projects/${projectId}/tasks/${payload.record_id}`);
          const task = await res.json();
          setTasks((prev) => {
            if (payload.action === 'INSERT') {
              if (prev.some((t) => t.id === task.id)) return prev;
              return [...prev, task];
            }
            return applyTaskUpdate(prev, task);
          });
        } catch (err) {
          console.error('Error fetching task after broadcast:', err);
        }
      } else if (payload.action === 'DELETE') {
        setTasks((prev) => prev.filter((task) => task.id !== payload.record_id));
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase]);

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    clearError,
  };
}
