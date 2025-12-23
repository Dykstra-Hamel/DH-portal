import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProjectTask, ProjectTaskFilters } from '@/types/project';
import { simpleSubscriptionHandler } from '@/lib/realtime/channel-helpers';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

const isDevelopment = process.env.NODE_ENV === 'development';

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
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
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

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    let isSubscribed = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const setupChannel = () => {
      const channelName = `project:${projectId}:tasks`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_tasks',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (isDevelopment) {
              console.log('Task change received:', payload);
            }

            if (payload.eventType === 'INSERT') {
              // Fetch full task data with relationships
              fetch(`/api/admin/projects/${projectId}/tasks/${payload.new.id}`)
                .then((res) => res.json())
                .then((newTask) => {
                  setTasks((prev) => {
                    // Avoid duplicates
                    if (prev.some((t) => t.id === newTask.id)) {
                      return prev;
                    }
                    return [...prev, newTask];
                  });
                })
                .catch((err) => console.error('Error fetching new task:', err));
            } else if (payload.eventType === 'UPDATE') {
              // Fetch updated task data
              fetch(`/api/admin/projects/${projectId}/tasks/${payload.new.id}`)
                .then((res) => res.json())
                .then((updatedTask) => {
                  setTasks((prev) =>
                    prev.map((task) =>
                      task.id === updatedTask.id ? updatedTask : task
                    )
                  );
                })
                .catch((err) => console.error('Error fetching updated task:', err));
            } else if (payload.eventType === 'DELETE') {
              setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
            }
          }
        )
        .subscribe((status) => {
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            reconnectAttempts = 0;
          } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
            if (reconnectAttempts === 0 && isDevelopment) {
              console.warn(`⚠️ Channel error: ${channelName}`);
            }

            // Retry logic with exponential backoff
            if (reconnectAttempts < maxReconnectAttempts && isSubscribed) {
              reconnectAttempts++;
              const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);

              reconnectTimeout = setTimeout(() => {
                if (isSubscribed) {
                  if (isDevelopment) {
                    console.log(
                      `🔄 Reconnecting ${channelName} (attempt ${reconnectAttempts}/${maxReconnectAttempts})`
                    );
                  }
                  supabase.removeChannel(channel);
                  setupChannel();
                }
              }, backoffDelay);
            }
          }
        });

      return channel;
    };

    const channel = setupChannel();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
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
