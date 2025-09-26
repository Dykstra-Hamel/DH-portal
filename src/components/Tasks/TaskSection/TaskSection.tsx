'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, TaskRelatedEntityType } from '@/types/task';
import TasksList from '../TasksList/TasksList';
import TaskForm from '../TaskForm/TaskForm';
import { Plus, X } from 'lucide-react';
import styles from './TaskSection.module.scss';

interface TaskSectionProps {
  relatedEntityType: TaskRelatedEntityType;
  relatedEntityId: string;
  relatedEntityName?: string;
  companyId: string;
  currentUserId?: string;
  userProfile?: { role?: string; id?: string };
  assignableUsers?: Array<{ id: string; first_name: string; last_name: string; email: string }>;
  className?: string;
}

export default function TaskSection({
  relatedEntityType,
  relatedEntityId,
  relatedEntityName,
  companyId,
  currentUserId,
  userProfile,
  assignableUsers = [],
  className,
}: TaskSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load tasks related to this entity
  useEffect(() => {
    if (relatedEntityType && relatedEntityId && companyId) {
      loadTasks();
    }
  }, [relatedEntityType, relatedEntityId, companyId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId,
        ...(relatedEntityType && { relatedEntityType }),
        relatedEntityId,
        limit: '50',
      });

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (formData: TaskFormData) => {
    setSubmitting(true);
    try {
      const taskData = {
        ...formData,
        company_id: companyId,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        await loadTasks();
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
        await loadTasks();
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
        await loadTasks();
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
        await loadTasks();
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

  const taskTabs = [
    {
      key: 'all',
      label: 'All',
      filter: (tasks: Task[]) => tasks.filter(task => !task.archived),
      getCount: (tasks: Task[]) => tasks.filter(task => !task.archived).length,
    },
    {
      key: 'open',
      label: 'Open',
      filter: (tasks: Task[]) => tasks.filter(task => !task.archived && !['completed', 'cancelled'].includes(task.status)),
      getCount: (tasks: Task[]) => tasks.filter(task => !task.archived && !['completed', 'cancelled'].includes(task.status)).length,
    },
    {
      key: 'completed',
      label: 'Completed',
      filter: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'completed'),
      getCount: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'completed').length,
    },
  ];

  const isFormOpen = showCreateForm || editingTask !== null;

  return (
    <div className={`${styles.taskSection} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Tasks {relatedEntityName && `for ${relatedEntityName}`}
        </h3>
        {!isFormOpen && (
          <button
            onClick={() => setShowCreateForm(true)}
            className={styles.createButton}
            disabled={loading}
          >
            <Plus size={16} />
            Create Task
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h4 className={styles.formTitle}>
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h4>
            <button
              onClick={handleCancelForm}
              className={styles.closeButton}
              disabled={submitting}
            >
              <X size={16} />
            </button>
          </div>
          <TaskForm
            task={editingTask || undefined}
            companyId={companyId}
            assignableUsers={assignableUsers}
            onSubmit={editingTask ? handleEditTask : handleCreateTask}
            onCancel={handleCancelForm}
            loading={submitting}
            relatedEntity={{
              type: relatedEntityType,
              id: relatedEntityId,
              name: relatedEntityName,
            }}
          />
        </div>
      )}

      <div className={styles.tasksList}>
        <TasksList
          tasks={tasks}
          loading={loading}
          onTaskUpdated={loadTasks}
          onEdit={setEditingTask}
          onArchive={handleArchiveTask}
          onComplete={handleCompleteTask}
          showCompanyColumn={false}
          userProfile={userProfile}
          customTabs={taskTabs}
        />
      </div>
    </div>
  );
}