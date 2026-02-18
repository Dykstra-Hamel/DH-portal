'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import {
  ProjectTask,
  ProjectTaskFormData,
  ProjectCategory,
  ProjectDepartment,
  User,
  taskPriorityOptions,
} from '@/types/project';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import styles from './ProjectTaskForm.module.scss';

interface ProjectTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProjectTaskFormData>) => Promise<void>;
  editingTask: ProjectTask | null;
  users: User[];
  projectId: string;
  parentTasks?: ProjectTask[]; // For creating subtasks
  projectMembers?: Array<{ user_id: string }>; // Project members
  projectAssignedTo?: string | null; // Project's assigned_to user
  availableCategories?: ProjectCategory[];
  departments?: ProjectDepartment[];
}

export default function ProjectTaskForm({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  users,
  parentTasks = [],
  availableCategories = [],
  departments = [],
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
    category_ids: [],
    department_id: '',
  });

  const [blocksTaskId, setBlocksTaskId] = useState<string>('');
  const [blockedByTaskId, setBlockedByTaskId] = useState<string>('');
  const [blockedTaskDepartmentId, setBlockedTaskDepartmentId] = useState<string>('');
  const [blockedTaskDepartmentDraft, setBlockedTaskDepartmentDraft] = useState<string>('');
  const [isBlockedTaskDepartmentModalOpen, setIsBlockedTaskDepartmentModalOpen] = useState(false);
  const [blockedTaskDepartmentTouched, setBlockedTaskDepartmentTouched] = useState(false);

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
    // Allow assignment to any admin user
    let filteredUsers = users.filter(user => isAdminRole(getUserRole(user)));

    // Always include current assignee even if not a member
    const assignedId = formData.assigned_to || editingTask?.assigned_to || '';
    if (assignedId && !filteredUsers.some(user => (user.profiles?.id || user.id) === assignedId)) {
      const assignedUser = users.find(user => (user.profiles?.id || user.id) === assignedId);
      if (assignedUser) {
        filteredUsers = [...filteredUsers, assignedUser];
      } else if (editingTask?.assigned_to_profile) {
        // If assigned user not found in users list but we have the profile, add it
        filteredUsers = [
          ...filteredUsers,
          {
            id: editingTask.assigned_to,
            profiles: editingTask.assigned_to_profile,
            email: editingTask.assigned_to_profile.email,
          } as User,
        ];
      }
    }

    return filteredUsers;
  }, [formData.assigned_to, editingTask?.assigned_to, editingTask?.assigned_to_profile, users]);

  const blockedTask = useMemo(
    () => parentTasks.find(task => task.id === blocksTaskId),
    [parentTasks, blocksTaskId]
  );

  const effectiveBlockedTaskDepartmentId = blockedTaskDepartmentTouched
    ? blockedTaskDepartmentId
    : (blockedTask?.department_id || blockedTaskDepartmentId);

  const blockedTaskDepartmentLabel = useMemo(() => {
    if (!effectiveBlockedTaskDepartmentId) return 'Stay where it is';
    const department = departments.find(dep => dep.id === effectiveBlockedTaskDepartmentId);
    return department?.name || 'Unknown Department';
  }, [departments, effectiveBlockedTaskDepartmentId]);

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
        category_ids: editingTask.categories?.map(category => category.id).slice(0, 1) || [],
        department_id: editingTask.department_id || '',
      });

      // Set dependency state
      setBlocksTaskId(editingTask.blocks_task_id || '');
      setBlockedByTaskId(editingTask.blocked_by_task_id || '');
      const blockedTask = parentTasks.find(task => task.id === editingTask.blocks_task_id);
      setBlockedTaskDepartmentId(blockedTask?.department_id || '');
      setBlockedTaskDepartmentTouched(false);
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
        category_ids: [],
        department_id: '',
      });
      setBlocksTaskId('');
      setBlockedByTaskId('');
      setBlockedTaskDepartmentId('');
      setBlockedTaskDepartmentTouched(false);
    }
    setError(null);
  }, [editingTask, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlocksTaskChange = (value: string) => {
    setBlocksTaskId(value);
    setBlockedTaskDepartmentTouched(false);

    if (!value) {
      setBlockedTaskDepartmentId('');
      setIsBlockedTaskDepartmentModalOpen(false);
      return;
    }

    const blockedTask = parentTasks.find(task => task.id === value);
    const existingDepartmentId = blockedTask?.department_id || '';
    setBlockedTaskDepartmentId(existingDepartmentId);
    setBlockedTaskDepartmentDraft(existingDepartmentId);

    if (departments.length > 0) {
      setIsBlockedTaskDepartmentModalOpen(true);
    }
  };

  const handleBlockedByTaskChange = (value: string) => {
    setBlockedByTaskId(value);
    if (!value) {
      setFormData(prev => ({ ...prev, department_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Add dependency fields to formData
      const submitData: any = {
        ...formData,
        department_id: blockedByTaskId ? (formData.department_id || null) : null,
        blocks_task_id: blocksTaskId || null,
        blocked_by_task_id: blockedByTaskId || null,
      };

      if (blockedTaskDepartmentTouched && blocksTaskId) {
        submitData.blocked_task_id_for_department = blocksTaskId;
        submitData.blocked_task_department_id = blockedTaskDepartmentId || null;
      }

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      category_ids: value ? [value] : [],
    }));
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
        <form onSubmit={handleSubmit} className={styles.form} style={{ width: '100%' }}>
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

              {availableCategories.length > 0 && (
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

            {/* Task Dependencies */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Task Dependencies</h3>

              {/* Is Blocking Dropdown */}
              <div className={styles.formGroup}>
                <label htmlFor="blocksTaskId" className={styles.label}>
                  Is Blocking
                </label>
                <select
                  id="blocksTaskId"
                  value={blocksTaskId}
                  onChange={(e) => handleBlocksTaskChange(e.target.value)}
                  className={styles.select}
                >
                  <option value="">None</option>
                  {parentTasks
                    .filter(t => t.id !== editingTask?.id && t.id !== blockedByTaskId)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
                <span className={styles.helpText}>
                  Select a task that cannot start until this task is completed
                </span>
                {blocksTaskId && (
                  <div className={styles.blockedTaskDepartmentSummary}>
                    <span className={styles.blockedTaskDepartmentText}>
                      Move project to when this task completes:{" "}
                      <strong className={styles.blockedTaskDepartmentValue}>
                        {blockedTaskDepartmentLabel}
                      </strong>
                    </span>
                    {departments.length > 0 && (
                      <button
                        type="button"
                        className={styles.blockedTaskDepartmentChange}
                        onClick={() => {
                          setBlockedTaskDepartmentDraft(effectiveBlockedTaskDepartmentId || '');
                          setIsBlockedTaskDepartmentModalOpen(true);
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Is Blocked By Dropdown */}
              <div className={styles.formGroup}>
                <label htmlFor="blockedByTaskId" className={styles.label}>
                  Is Blocked By
                </label>
                <select
                  id="blockedByTaskId"
                  value={blockedByTaskId}
                  onChange={(e) => handleBlockedByTaskChange(e.target.value)}
                  className={styles.select}
                >
                  <option value="">None</option>
                  {parentTasks
                    .filter(t => t.id !== editingTask?.id && t.id !== blocksTaskId)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
                <span className={styles.helpText}>
                  Select a task that must be completed before this task can start
                </span>
              </div>

              {blockedByTaskId && departments.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="department_id" className={styles.label}>
                    Move Project To When Unblocked
                  </label>
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id || ''}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="">Stay where it is</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <p className={styles.fieldHelp}>
                    If set, the project will move to this department when the blocking task is completed.
                  </p>
                </div>
              )}
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

        <Modal
          isOpen={isBlockedTaskDepartmentModalOpen}
          onClose={() => setIsBlockedTaskDepartmentModalOpen(false)}
          size="small"
        >
          <ModalTop
            title="Move Project When Task Completes"
            onClose={() => setIsBlockedTaskDepartmentModalOpen(false)}
          />
          <ModalMiddle>
            <p className={styles.blockedTaskModalMessage}>
              Select the department that the project should move to when this task is completed.
              {blockedTask?.title ? ` This will unblock "${blockedTask.title}".` : ''}
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="blockedTaskDepartment" className={styles.label}>
                Department
              </label>
              <select
                id="blockedTaskDepartment"
                value={blockedTaskDepartmentDraft}
                onChange={(e) => setBlockedTaskDepartmentDraft(e.target.value)}
                className={styles.select}
              >
                <option value="">Stay where it is</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </ModalMiddle>
          <ModalBottom className={styles.blockedTaskModalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setIsBlockedTaskDepartmentModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={() => {
                setBlockedTaskDepartmentId(blockedTaskDepartmentDraft);
                setBlockedTaskDepartmentTouched(true);
                setIsBlockedTaskDepartmentModalOpen(false);
              }}
            >
              Save
            </button>
          </ModalBottom>
        </Modal>
      </div>
    </div>
  );
}
