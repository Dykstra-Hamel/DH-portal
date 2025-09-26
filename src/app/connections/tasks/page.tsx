'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskFormData, isTaskOverdue } from '@/types/task';
import TasksList from '@/components/Tasks/TasksList/TasksList';
import TaskForm from '@/components/Tasks/TaskForm/TaskForm';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { useCompany } from '@/contexts/CompanyContext';
import { Modal, ModalTop, ModalMiddle } from '@/components/Common/Modal/Modal';
import { MetricsCard, styles as metricsStyles } from '@/components/Common/MetricsCard';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Use global company context
  const { selectedCompany } = useCompany();

  // Get assignable users for the company (all departments for tasks)
  const { users: assignableUsers } = useAssignableUsers({
    companyId: selectedCompany?.id,
    departmentType: 'all',
  });

  // Calculate task metrics from current tasks array
  const calculateTaskMetrics = () => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'new').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(isTaskOverdue).length
    };
  };

  const metrics = calculateTaskMetrics();

  const loadTasks = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setTasksLoading(true);
    try {
      const params = new URLSearchParams({
        companyId,
        limit: '100',
      });

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Tasks API response:', data);
        setTasks(data.tasks || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch tasks:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          details: errorData.details,
          code: errorData.code,
        });

        // Show user-friendly error message based on status
        let userMessage = 'Failed to load tasks';
        if (response.status === 401) {
          userMessage = 'Authentication required. Please log in again.';
        } else if (response.status === 403) {
          userMessage =
            "Access denied. You don't have permission to view tasks.";
        } else if (response.status === 404) {
          userMessage = 'Tasks not found.';
        } else if (errorData.details) {
          userMessage = `Error: ${errorData.details}`;
        }

        alert(userMessage);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Load tasks when selected company changes
  useEffect(() => {
    if (selectedCompany?.id) {
      loadTasks(selectedCompany.id);
    }
  }, [selectedCompany?.id, loadTasks]);

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
        if (selectedCompany?.id) {
          await loadTasks(selectedCompany.id);
        }
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
        if (selectedCompany?.id) {
          await loadTasks(selectedCompany.id);
        }
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

  const handleArchiveTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedCompany?.id) {
          await loadTasks(selectedCompany.id);
        }
      } else {
        throw new Error('Failed to archive task');
      }
    } catch (error) {
      console.error('Error archiving task:', error);
      alert('Failed to archive task. Please try again.');
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
        if (selectedCompany?.id) {
          await loadTasks(selectedCompany.id);
        }
      } else {
        throw new Error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingTask(null);
  };

  if (!selectedCompany) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: '0',
            fontSize: '1.125rem',
            color: 'var(--gray-500, #6b7280)',
          }}
        >
          No company found. Please contact your administrator.
        </p>
      </div>
    );
  }

  const isFormOpen = showCreateForm || editingTask !== null;

  return (
    <div style={{ width: '100%' }}>
      
      {selectedCompany && (
        <>
          {/* Metrics Cards */}
          <div className={metricsStyles.metricsCardWrapper}>
            {!tasksLoading ? (
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
        </>
      )}

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
            onSubmit={editingTask ? handleEditTask : handleCreateTask}
            onCancel={handleCancelForm}
            loading={submitting}
          />
        </ModalMiddle>
      </Modal>

      <div style={{ minHeight: '400px' }}>
        <TasksList
          tasks={tasks}
          loading={tasksLoading}
          onTaskUpdated={() => selectedCompany?.id && loadTasks(selectedCompany.id)}
          onEdit={setEditingTask}
          onArchive={handleArchiveTask}
          onComplete={handleCompleteTask}
        />
      </div>
    </div>
  );
}
