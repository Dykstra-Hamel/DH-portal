import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import {
  Task,
  TaskPriority,
  DUMMY_USERS,
  DUMMY_CLIENTS,
  DUMMY_PROJECTS,
} from '@/types/taskManagement';
import { ProjectTask, Project } from '@/types/project';
import ProjectSelect from '@/components/Common/ProjectSelect/ProjectSelect';
import styles from './TaskModal.module.scss';

// Task data format for the API (matches project_tasks table)
interface TaskFormData {
  id?: string;
  title: string;
  description: string;
  notes: string;
  is_completed: boolean;
  priority: TaskPriority;
  project_id: string;
  assigned_to: string;
  due_date: string;
  start_date: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task | ProjectTask | TaskFormData>) => void;
  onDelete?: (taskId: string) => void;
  task?: Task | ProjectTask;
  projects?: Project[]; // Full project objects with all metadata
  users?: Array<{
    id: string;
    first_name?: string;
    last_name?: string;
    profiles?: { first_name: string; last_name: string };
  }>; // Optional users list from API
  currentUserId?: string; // Current user's ID to default assignment
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  projects,
  users,
  currentUserId,
}: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    is_completed: false,
    priority: 'medium' as TaskPriority,
    project_id: '',
    assigned_to: currentUserId || '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    start_date: '',
    category_ids: [] as string[],
  });

  // Determine if task is a ProjectTask (has is_completed) or legacy Task (has status)
  const isProjectTask = (
    t: Task | ProjectTask | undefined
  ): t is ProjectTask => {
    return t !== undefined && 'is_completed' in t;
  };

  // Convert legacy status to is_completed
  const statusToIsCompleted = (status?: string): boolean => {
    return status === 'completed';
  };

  useEffect(() => {
    if (task) {
      // Handle both ProjectTask and legacy Task formats
      const isCompleted = isProjectTask(task)
        ? task.is_completed
        : statusToIsCompleted((task as Task).status);

      setFormData({
        title: task.title,
        description: task.description || '',
        notes: isProjectTask(task) ? task.notes || '' : '',
        is_completed: isCompleted,
        priority: task.priority as TaskPriority,
        project_id: task.project_id || '',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        start_date:
          isProjectTask(task) && task.start_date
            ? task.start_date.split('T')[0]
            : '',
        category_ids: [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        notes: '',
        is_completed: false,
        priority: 'medium',
        project_id: '',
        assigned_to: currentUserId || '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        start_date: '',
        category_ids: [],
      });
    }
  }, [task, isOpen, currentUserId]);

  // Get categories from selected project
  const selectedProject = projects?.find(p => p.id === formData.project_id);
  const availableCategories = selectedProject?.categories
    ?.filter(cat => !cat.category?.is_hidden)
    .map(cat => cat.category)
    .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined && cat !== null) || [];

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      category_ids: value ? [value] : [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build task data for the API (matches project_tasks table)
    const taskData: Partial<TaskFormData> & { category_ids?: string[] } = {
      title: formData.title,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
      is_completed: formData.is_completed,
      priority: formData.priority,
      project_id: formData.project_id || undefined,
      assigned_to: formData.assigned_to || undefined,
      due_date: formData.due_date
        ? new Date(formData.due_date).toISOString()
        : undefined,
      start_date: formData.start_date
        ? new Date(formData.start_date).toISOString()
        : undefined,
      category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
    };

    if (task) {
      taskData.id = task.id;
    }

    onSave(taskData);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDelete = () => {
    if (
      task &&
      onDelete &&
      window.confirm('Are you sure you want to delete this task?')
    ) {
      onDelete(task.id);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.wideModal}>
      <form onSubmit={handleSubmit}>
        <ModalTop
          title={task ? 'Edit Task' : 'Create New Task'}
          onClose={onClose}
        />

        <ModalMiddle className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Task Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              className={styles.input}
              value={formData.title}
              onChange={e =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Create social media campaign graphics"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add more details about this task..."
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>
                Priority <span className={styles.required}>*</span>
              </label>
              <select
                id="priority"
                className={styles.select}
                value={formData.priority}
                onChange={e =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as TaskPriority,
                  })
                }
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="project_id" className={styles.label}>
              Project (Optional)
            </label>
            <ProjectSelect
              projects={projects || []}
              value={formData.project_id}
              onChange={projectId =>
                setFormData({ ...formData, project_id: projectId, category_ids: [] })
              }
              placeholder="No Project"
            />
          </div>

          {formData.project_id && availableCategories.length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="category_id" className={styles.label}>
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_ids?.[0] || ''}
                onChange={handleCategoryChange}
                className={styles.select}
              >
                <option value="">None</option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="assigned_to" className={styles.label}>
              Assign To (Optional)
            </label>
            <select
              id="assigned_to"
              className={styles.select}
              value={formData.assigned_to}
              onChange={e =>
                setFormData({ ...formData, assigned_to: e.target.value })
              }
            >
              <option value="">Unassigned</option>
              {(users || DUMMY_USERS).map(user => {
                const profile = (
                  user as {
                    profiles?: { first_name?: string; last_name?: string };
                  }
                ).profiles;
                const firstName = user.first_name || profile?.first_name || '';
                const lastName = user.last_name || profile?.last_name || '';
                const email = (user as { email?: string }).email || '';
                const name = `${firstName} ${lastName}`.trim();
                const displayName =
                  name && email
                    ? `${name} (${email})`
                    : name || email || 'User';
                return (
                  <option key={user.id} value={user.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="start_date" className={styles.label}>
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                className={styles.input}
                value={formData.start_date}
                onChange={e =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="due_date" className={styles.label}>
                Due Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                id="due_date"
                className={styles.input}
                value={formData.due_date}
                onChange={e =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                required
              />
            </div>
          </div>
        </ModalMiddle>

        <ModalBottom className={styles.modalBottom}>
          <div className={styles.leftButtons}>
            {task && onDelete && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
              >
                Delete Task
              </button>
            )}
          </div>
          <div className={styles.rightButtons}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton}>
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </ModalBottom>
      </form>
    </Modal>
  );
}
