import React, { useState, useEffect } from 'react';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import { Task, TaskStatus, TaskPriority, DUMMY_USERS, DUMMY_CLIENTS, DUMMY_PROJECTS } from '@/types/taskManagement';
import styles from './TaskModal.module.scss';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  task?: Task;
}

// Preset tags for pest control marketing
const PRESET_TAGS = [
  'seo',
  'social-media',
  'content',
  'design',
  'development',
  'ppc',
  'google-ads',
  'facebook-ads',
  'email',
  'analytics',
  'branding',
  'website',
  'blog',
  'video',
  'photography',
  'local-seo',
  'gmb',
  'reviews',
  'reporting',
  'strategy',
];

export function TaskModal({ isOpen, onClose, onSave, onDelete, task }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    project_id: '',
    client_id: '',
    assigned_to: '',
    estimated_hours: 2,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: [] as string[],
    recurring_frequency: 'none' as import('@/types/taskManagement').RecurringFrequency,
    recurring_end_date: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        project_id: task.project_id || '',
        client_id: task.client_id || '',
        assigned_to: task.assigned_to || '',
        estimated_hours: task.estimated_hours,
        due_date: task.due_date.split('T')[0],
        tags: task.tags,
        recurring_frequency: task.recurring_frequency || 'none',
        recurring_end_date: task.recurring_end_date ? task.recurring_end_date.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        project_id: '',
        client_id: '',
        assigned_to: '',
        estimated_hours: 2,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: [],
        recurring_frequency: 'none',
        recurring_end_date: '',
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: Partial<Task> = {
      ...formData,
      due_date: new Date(formData.due_date).toISOString(),
      project_id: formData.project_id || undefined,
      client_id: formData.client_id || undefined,
      assigned_to: formData.assigned_to || undefined,
      recurring_frequency: formData.recurring_frequency === 'none' ? undefined : formData.recurring_frequency,
      recurring_end_date: formData.recurring_end_date ? new Date(formData.recurring_end_date).toISOString() : undefined,
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
    if (task && onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      // Remove tag
      setFormData({
        ...formData,
        tags: formData.tags.filter(t => t !== tag),
      });
    } else {
      // Add tag
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details about this task..."
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="status" className={styles.label}>
                Status <span className={styles.required}>*</span>
              </label>
              <select
                id="status"
                className={styles.select}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                required
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>
                Priority <span className={styles.required}>*</span>
              </label>
              <select
                id="priority"
                className={styles.select}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="project_id" className={styles.label}>
                Project (Optional)
              </label>
              <select
                id="project_id"
                className={styles.select}
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">No Project</option>
                {DUMMY_PROJECTS.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="client_id" className={styles.label}>
                Client (Optional)
              </label>
              <select
                id="client_id"
                className={styles.select}
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">No Client</option>
                {DUMMY_CLIENTS.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="assigned_to" className={styles.label}>
                Assign To (Optional)
              </label>
              <select
                id="assigned_to"
                className={styles.select}
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {DUMMY_USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="estimated_hours" className={styles.label}>
                Estimated Hours <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="estimated_hours"
                className={styles.input}
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                min="0.5"
                step="0.5"
                required
              />
            </div>
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
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="recurring_frequency" className={styles.label}>
                Recurring Frequency
              </label>
              <select
                id="recurring_frequency"
                className={styles.select}
                value={formData.recurring_frequency}
                onChange={(e) => setFormData({ ...formData, recurring_frequency: e.target.value as import('@/types/taskManagement').RecurringFrequency })}
              >
                <option value="none">Does Not Repeat</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="bimonthly">Bi-Monthly (Every 2 Months)</option>
                <option value="quarterly">Quarterly (Every 3 Months)</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {formData.recurring_frequency !== 'none' && (
              <div className={styles.formGroup}>
                <label htmlFor="recurring_end_date" className={styles.label}>
                  Repeat Until (Optional)
                </label>
                <input
                  type="date"
                  id="recurring_end_date"
                  className={styles.input}
                  value={formData.recurring_end_date}
                  onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                  min={formData.due_date}
                />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tags
            </label>
            <div className={styles.presetTagsContainer}>
              {PRESET_TAGS.map((tag) => {
                const isSelected = formData.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.presetTag} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </ModalMiddle>

        <ModalBottom className={styles.modalBottom}>
          <div className={styles.leftButtons}>
            {task && onDelete && (
              <button type="button" className={styles.deleteButton} onClick={handleDelete}>
                Delete Task
              </button>
            )}
          </div>
          <div className={styles.rightButtons}>
            <button type="button" className={styles.secondaryButton} onClick={handleCancel}>
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
