'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { DataTable } from '@/components/Common/DataTable';
import {
  getTaskColumns,
  getTaskTabs,
} from '@/components/Tasks/TasksList/TasksListConfig';
import { Task, TaskFormData } from '@/types/task';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import TaskForm from '@/components/Tasks/TaskForm/TaskForm';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import ModalActionButtons from '@/components/Common/Modal/ModalActionButtons';
import { usePageActions } from '@/contexts/PageActionsContext';
import {
  MetricsCard,
  styles as metricsStyles,
} from '@/components/Common/MetricsCard';
import { isTaskOverdue } from '@/types/task';
import { createClient } from '@/lib/supabase/client';
import {
  createTaskChannel,
  subscribeToTaskUpdates,
  TaskUpdatePayload,
} from '@/lib/realtime/task-channel';

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData | null>(null);
  const { user } = useUser();
  const { selectedCompany } = useCompany();

  // Register page actions for global header
  const { registerPageAction, unregisterPageAction } = usePageActions();

  // Get assignable users for the company (all departments for tasks)
  const { users: assignableUsers } = useAssignableUsers({
    companyId: selectedCompany?.id,
    departmentType: 'all',
  });

  // Calculate task metrics from current tasks array
  const calculateTaskMetrics = () => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(isTaskOverdue).length,
    };
  };

  const metrics = calculateTaskMetrics();

  // Fetch tasks assigned to current user
  const fetchMyTasks = async () => {
    if (!user?.id || !selectedCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        companyId: selectedCompany.id,
        assignedTo: user.id, // Filter by current user
        includeArchived: 'false',
      });

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      console.error('Error fetching my tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [user?.id, selectedCompany?.id]);

  // Real-time subscription for task updates
  useEffect(() => {
    if (!selectedCompany?.id || !user?.id) return;

    const channel = createTaskChannel(selectedCompany.id);

    subscribeToTaskUpdates(channel, async (payload: TaskUpdatePayload) => {
      const { company_id, action, record_id } = payload;

      // Verify this is for our selected company
      if (company_id !== selectedCompany.id) return;

      if (action === 'INSERT') {
        // Fetch full task data - only add if assigned to current user
        try {
          const supabase = createClient();
          const { data: fullTask } = await supabase
            .from('tasks')
            .select(`
              *,
              company:companies(
                id,
                name
              ),
              assigned_user:profiles!tasks_assigned_to_fkey(
                id,
                first_name,
                last_name,
                email
              )
            `)
            .eq('id', record_id)
            .eq('assigned_to', user.id) // Filter by current user
            .single();

          if (fullTask) {
            setTasks(prev => {
              const exists = prev.some(task => task.id === fullTask.id);
              if (!exists) {
                return [fullTask, ...prev];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error fetching new task:', error);
        }
      } else if (action === 'UPDATE') {
        // Fetch updated task data
        try {
          const supabase = createClient();
          const { data: updatedTask } = await supabase
            .from('tasks')
            .select(`
              *,
              company:companies(
                id,
                name
              ),
              assigned_user:profiles!tasks_assigned_to_fkey(
                id,
                first_name,
                last_name,
                email
              )
            `)
            .eq('id', record_id)
            .single();

          if (updatedTask) {
            // Check if it&apos;s still assigned to this user
            if (updatedTask.assigned_to === user.id) {
              setTasks(prev => {
                const exists = prev.some(task => task.id === updatedTask.id);
                if (exists) {
                  return prev.map(task =>
                    task.id === updatedTask.id ? updatedTask : task
                  );
                } else {
                  // Task was reassigned to this user
                  return [updatedTask, ...prev];
                }
              });
            } else {
              // Remove if no longer assigned to this user
              setTasks(prev => prev.filter(task => task.id !== record_id));
            }
          }
        } catch (error) {
          console.error('Error fetching updated task:', error);
        }
      } else if (action === 'DELETE') {
        setTasks(prev => prev.filter(task => task.id !== record_id));
      }
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [selectedCompany?.id, user?.id]);

  // Register the add action for the global header button
  useEffect(() => {
    registerPageAction('add', () => setShowCreateForm(true));
    return () => unregisterPageAction('add');
  }, [registerPageAction, unregisterPageAction]);

  const handleCreateTask = async (formData: TaskFormData) => {
    if (!selectedCompany?.id) return;

    setSubmitting(true);
    try {
      const taskData = {
        ...formData,
        company_id: selectedCompany.id,
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        await fetchMyTasks();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (formData: TaskFormData) => {
    if (!editingTask) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingTask(null);
        await fetchMyTasks();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId: string, actualHours?: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_hours: actualHours }),
      });

      if (response.ok) {
        // Refresh the tasks list
        fetchMyTasks();
      } else {
        throw new Error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
    }
  };

  const handleTaskAction = (action: string, task: Task) => {
    if (action === 'edit') {
      setEditingTask(task);
    } else if (action === 'view') {
      router.push(`/connections/tasks/${task.id}`);
    } else if (action === 'complete') {
      handleCompleteTask(task.id);
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingTask(null);
    setFormData(null);
  };

  if (!user || !selectedCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please select a company to view your tasks.</p>
      </div>
    );
  }

  const isFormOpen = showCreateForm || !!editingTask;

  return (
    <div style={{ width: '100%' }}>
      {/* Metrics Cards */}
      <div className={metricsStyles.metricsCardWrapper}>
        {!loading ? (
          <>
            <MetricsCard
              title="Total Tasks"
              value={metrics.total}
              showComparison={false}
            />
            <MetricsCard
              title="Pending"
              value={metrics.pending}
              showComparison={false}
            />
            <MetricsCard
              title="In Progress"
              value={metrics.inProgress}
              showComparison={false}
            />
            <MetricsCard
              title="Completed"
              value={metrics.completed}
              showComparison={false}
            />
            <MetricsCard
              title="Overdue"
              value={metrics.overdue}
              showComparison={false}
            />
          </>
        ) : (
          <>
            <MetricsCard
              title="Total Tasks"
              value="--"
              showComparison={false}
              isLoading={true}
            />
            <MetricsCard
              title="Pending"
              value="--"
              showComparison={false}
              isLoading={true}
            />
            <MetricsCard
              title="In Progress"
              value="--"
              showComparison={false}
              isLoading={true}
            />
            <MetricsCard
              title="Completed"
              value="--"
              showComparison={false}
              isLoading={true}
            />
            <MetricsCard
              title="Overdue"
              value="--"
              showComparison={false}
              isLoading={true}
            />
          </>
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={handleCancelForm}>
        <ModalTop
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          onClose={handleCancelForm}
        />
        <ModalMiddle>
          <TaskForm
            task={editingTask || undefined}
            companyId={selectedCompany.id}
            assignableUsers={assignableUsers}
            onFormDataChange={setFormData}
            loading={submitting}
          />
        </ModalMiddle>
        <ModalBottom>
          <ModalActionButtons
            onBack={handleCancelForm}
            showBackButton={true}
            isFirstStep={true}
            onPrimaryAction={async () => {
              if (formData) {
                if (editingTask) {
                  await handleEditTask(formData);
                } else {
                  await handleCreateTask(formData);
                }
              }
            }}
            primaryButtonText={editingTask ? 'Update Task' : 'Create Task'}
            primaryButtonDisabled={!formData || submitting}
            isLoading={submitting}
            loadingText="Saving..."
          />
        </ModalBottom>
      </Modal>

      <DataTable<Task>
        data={tasks}
        title="My Tasks"
        columns={getTaskColumns(false, true)}
        tabs={getTaskTabs(true)}
        loading={loading}
        emptyStateMessage="No tasks assigned to you yet."
        onItemAction={handleTaskAction}
        customColumnWidths="300px 100px 100px 150px 1fr"
      />
    </div>
  );
}
