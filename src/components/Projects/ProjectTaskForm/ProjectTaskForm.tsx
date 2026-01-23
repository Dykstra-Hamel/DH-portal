'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import {
  ProjectTask,
  ProjectTaskFormData,
  User,
  taskPriorityOptions,
} from '@/types/project';
import styles from './ProjectTaskForm.module.scss';

interface ProjectTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProjectTaskFormData>) => Promise<void>;
  editingTask: ProjectTask | null;
  users: User[];
  projectId: string;
  parentTasks?: ProjectTask[]; // For creating subtasks
}

export default function ProjectTaskForm({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  users,
  projectId,
  parentTasks = [],
}: ProjectTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ProjectTaskFormData>>({
    title: '',
    description: '',
    notes: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    start_date: '',
    parent_task_id: '',
  });

  const isAdminRole = (role?: string | null) => role === 'admin' || role === 'super_admin';

  const getUserRole = (user: any) => {
    if (user?.profiles?.role) return user.profiles.role;
    if (user?.role) return user.role;
    if (Array.isArray(user?.roles)) {
      if (user.roles.includes('admin')) return 'admin';
      if (user.roles.includes('super_admin')) return 'super_admin';
    }
    return null;
  };

  const getUserDisplayName = (user: any) => {
    const profile = user?.profiles;
    const firstName = profile?.first_name || user?.first_name || '';
    const lastName = profile?.last_name || user?.last_name || '';
    const email = profile?.email || user?.email || '';
    const name = `${firstName} ${lastName}`.trim();
    return name ? (email ? `${name} (${email})` : name) : email || 'User';
  };

  const assignableUsers = useMemo(() => {
    const shouldFilterByRole = users.some(user => getUserRole(user));
    const adminUsers = shouldFilterByRole
      ? users.filter(user => {
          const role = getUserRole(user);
          return role ? isAdminRole(role) : false;
        })
      : users;

    const assignedId = formData.assigned_to || editingTask?.assigned_to || '';
    if (assignedId && !adminUsers.some(user => user.id === assignedId)) {
      const assignedUser = users.find(user => user.id === assignedId);
      if (assignedUser) {
        return [...adminUsers, assignedUser];
      }
      if (editingTask?.assigned_to_profile) {
        return [
          ...adminUsers,
          {
            id: assignedId,
            profiles: editingTask.assigned_to_profile,
            email: editingTask.assigned_to_profile.email,
          },
        ];
      }
    }

    return adminUsers;
  }, [editingTask?.assigned_to, formData.assigned_to, users]);

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        notes: editingTask.notes || '',
        priority: editingTask.priority,
        assigned_to: editingTask.assigned_to || '',
        due_date: editingTask.due_date || '',
        start_date: editingTask.start_date || '',
        parent_task_id: editingTask.parent_task_id || '',
      });
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        notes: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        start_date: '',
        parent_task_id: '',
      });
    }
    setError(null);
  }, [editingTask, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formContent}>
            {/* Basic Information */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>

              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>
                  Task Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="Enter task title"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={styles.textarea}
                  placeholder="Describe what needs to be done"
                />
              </div>

              {parentTasks.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="parent_task_id" className={styles.label}>
                    Parent Task (Optional)
                  </label>
                  <select
                    id="parent_task_id"
                    name="parent_task_id"
                    value={formData.parent_task_id}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="">None (Top-level task)</option>
                    {parentTasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                  <p className={styles.fieldHelp}>
                    Create this as a subtask under another task
                  </p>
                </div>
              )}
            </section>

            {/* Assignment & Priority */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Assignment & Priority</h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="assigned_to" className={styles.label}>
                    Assigned To
                  </label>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {getUserDisplayName(u)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="priority" className={styles.label}>
                    Priority <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    className={styles.select}
                  >
                    {taskPriorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Timeline</h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="start_date" className={styles.label}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="due_date" className={styles.label}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>
            </section>

            {/* Additional Notes */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Additional Notes</h3>

              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.label}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className={styles.textarea}
                  placeholder="Any additional information or context"
                />
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
