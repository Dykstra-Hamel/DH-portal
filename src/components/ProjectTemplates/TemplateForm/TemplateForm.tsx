'use client';

import React, { useState, useEffect } from 'react';
import {
  projectTypeOptions,
  taskPriorityOptions,
  ProjectTemplate,
  ProjectTemplateFormData,
  ProjectTypeSubtype,
  ProjectCategory,
  User,
} from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import CategoryBadge from '@/components/ProjectManagement/CategorySettings/CategoryBadge';
import styles from './TemplateForm.module.scss';
import { X, Plus, Trash2 } from 'lucide-react';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';

interface TemplateFormProps {
  template?: ProjectTemplate;
  onClose: () => void;
  onSuccess: () => void;
  users?: User[];
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onClose,
  onSuccess,
  users: propUsers = [],
}) => {
  const isEditing = !!template;
  const createTempId = () => `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const [formData, setFormData] = useState<ProjectTemplateFormData>({
    name: template?.name || '',
    description: template?.description || '',
    project_type: template?.project_type || '',
    project_subtype: template?.project_subtype || '',
    is_active: template?.is_active !== false ? 'true' : 'false',
    template_data: template?.template_data ? JSON.stringify(template.template_data) : '',
    default_assigned_to: template?.default_assigned_to || '',
    default_scope: template?.default_scope || 'internal',
    default_due_date_offset_days: template?.default_due_date_offset_days?.toString() || '30',
    default_is_billable: template?.default_is_billable ? 'true' : 'false',
    category_ids: template?.categories?.map(c => c.category_id) || [],
    tasks: template?.tasks?.map((task) => ({
      temp_id: task.id,
      parent_temp_id: task.parent_task_id || '',
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date_offset_days: task.due_date_offset_days.toString(),
      display_order: task.display_order.toString(),
      tags: task.tags?.join(', ') || '',
      default_assigned_to: task.default_assigned_to || '',
    })) || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableSubtypes, setAvailableSubtypes] = useState<ProjectTypeSubtype[]>([]);
  const [isFetchingSubtypes, setIsFetchingSubtypes] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<ProjectCategory[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [users, setUsers] = useState<User[]>(propUsers);

  // Fetch subtypes when project_type changes
  useEffect(() => {
    const fetchSubtypes = async () => {
      // Extract type_code from selected project_type
      const selectedType = projectTypeOptions.find(opt => opt.value === formData.project_type);
      const typeCode = selectedType?.code;

      if (!typeCode) {
        setAvailableSubtypes([]);
        return;
      }

      setIsFetchingSubtypes(true);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/admin/project-types/${typeCode}/subtypes`, {
          headers,
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableSubtypes(data);
        } else {
          console.error('Failed to fetch subtypes. Status:', response.status);
          setAvailableSubtypes([]);
        }
      } catch (error) {
        console.error('Failed to fetch subtypes:', error);
        setAvailableSubtypes([]);
      } finally {
        setIsFetchingSubtypes(false);
      }
    };

    fetchSubtypes();
  }, [formData.project_type]);

  // Update users when prop changes
  useEffect(() => {
    console.log('TemplateForm received users:', propUsers); // Debug log
    if (propUsers.length > 0) {
      setUsers(propUsers);
    }
  }, [propUsers]);

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/admin/project-categories', {
          headers,
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data);
        } else {
          console.error('Failed to fetch categories. Status:', response.status);
          setAvailableCategories([]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setAvailableCategories([]);
      } finally {
        setIsFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = () => {
    setFormData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          temp_id: createTempId(),
          parent_temp_id: '',
          title: '',
          description: '',
          priority: 'medium',
          due_date_offset_days: '0',
          display_order: prev.tasks.length.toString(),
          tags: '',
          default_assigned_to: '',
        },
      ],
    }));
  };

  const handleAddSubtask = (parentTempId: string) => {
    setFormData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          temp_id: createTempId(),
          parent_temp_id: parentTempId,
          title: '',
          description: '',
          priority: 'medium',
          due_date_offset_days: '0',
          display_order: prev.tasks.length.toString(),
          tags: '',
          default_assigned_to: '',
        },
      ],
    }));
  };

  const handleRemoveTask = (taskId: string) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter(
        (task) => task.temp_id !== taskId && task.parent_temp_id !== taskId
      ),
    }));
  };

  const handleTaskChange = (
    taskId: string,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.temp_id === taskId ? { ...task, [field]: value } : task
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Prepare submission data
      const orderedTasks: ProjectTemplateFormData['tasks'] = [];
      const tasksByParent = new Map<string, ProjectTemplateFormData['tasks']>();
      formData.tasks.forEach((task) => {
        const parentId = task.parent_temp_id || '';
        const list = tasksByParent.get(parentId) || [];
        list.push(task);
        tasksByParent.set(parentId, list);
      });

      const sortByOrder = (a: ProjectTemplateFormData['tasks'][number], b: ProjectTemplateFormData['tasks'][number]) =>
        Number(a.display_order) - Number(b.display_order);

      const topLevelTasks = (tasksByParent.get('') || []).sort(sortByOrder);
      topLevelTasks.forEach((task) => {
        orderedTasks.push(task);
        const children = (tasksByParent.get(task.temp_id || '') || []).sort(sortByOrder);
        orderedTasks.push(...children);
      });

      const submitData = {
        name: formData.name,
        description: formData.description,
        project_type: formData.project_type,
        project_subtype: formData.project_subtype || null,
        is_active: formData.is_active === 'true',
        template_data: formData.template_data
          ? JSON.parse(formData.template_data)
          : null,
        default_assigned_to: formData.default_assigned_to || null,
        default_scope: formData.default_scope,
        default_due_date_offset_days: parseInt(formData.default_due_date_offset_days, 10) || 30,
        default_is_billable: formData.default_is_billable === 'true',
        category_ids: formData.category_ids || [],
        tasks: orderedTasks.map((task, index) => ({
          temp_id: task.temp_id,
          parent_temp_id: task.parent_temp_id || null,
          title: task.title,
          description: task.description || null,
          priority: task.priority,
          due_date_offset_days: parseInt(task.due_date_offset_days, 10),
          display_order: index,
          tags: task.tags
            ? task.tags.split(',').map((tag) => tag.trim())
            : null,
          default_assigned_to: task.default_assigned_to || null,
        })),
      };

      const url = isEditing
        ? `/api/admin/project-templates/${template.id}`
        : '/api/admin/project-templates';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{isEditing ? 'Edit Template' : 'Create New Template'}</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Basic Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Template Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
                placeholder="Add a template description..."
                className={styles.richTextField}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="project_type" className={styles.label}>
                  Project Type <span className={styles.required}>*</span>
                </label>
                <select
                  id="project_type"
                  name="project_type"
                  value={formData.project_type}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData((prev) => ({ ...prev, project_subtype: '' }));
                  }}
                  className={styles.select}
                  required
                >
                  <option value="">Select Type</option>
                  {projectTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.project_type && (
                <div className={styles.formGroup}>
                  <label htmlFor="project_subtype" className={styles.label}>
                    Subtype
                  </label>
                  <select
                    id="project_subtype"
                    name="project_subtype"
                    value={formData.project_subtype}
                    onChange={handleChange}
                    className={styles.select}
                    disabled={isFetchingSubtypes}
                  >
                    <option value="">
                      {isFetchingSubtypes ? 'Loading subtypes...' : 'Select Subtype'}
                    </option>
                    {availableSubtypes.map((subtype) => (
                      <option key={subtype.id} value={subtype.name}>
                        {subtype.name}
                      </option>
                    ))}
                  </select>
                  {isFetchingSubtypes && (
                    <small className={styles.hint}>Loading subtypes...</small>
                  )}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="is_active" className={styles.label}>
                Status
              </label>
              <select
                id="is_active"
                name="is_active"
                value={formData.is_active}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="categories" className={styles.label}>
                Project Categories
              </label>
              {isFetchingCategories ? (
                <p className={styles.hint}>Loading categories...</p>
              ) : (
                <div className={styles.categoryMultiSelect}>
                  {availableCategories.map((category) => {
                    const isSelected = formData.category_ids?.includes(category.id) || false;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`${styles.categoryOption} ${isSelected ? styles.selected : ''}`}
                        onClick={() => {
                          const isSelected = formData.category_ids?.includes(category.id);
                          setFormData((prev) => ({
                            ...prev,
                            category_ids: isSelected
                              ? prev.category_ids?.filter((id) => id !== category.id) || []
                              : [...(prev.category_ids || []), category.id],
                          }));
                        }}
                      >
                        <CategoryBadge category={category} />
                      </button>
                    );
                  })}
                  {availableCategories.length === 0 && (
                    <p className={styles.hint}>
                      No categories available. Create categories in settings first.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="default_assigned_to" className={styles.label}>
                  Default Project Assignee
                </label>
                <select
                  id="default_assigned_to"
                  name="default_assigned_to"
                  value={formData.default_assigned_to}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => {
                    const firstName = (user as any).first_name || user.profiles?.first_name || '';
                    const lastName = (user as any).last_name || user.profiles?.last_name || '';
                    const email = user.profiles?.email || user.email || '';
                    const name = `${firstName} ${lastName}`.trim();
                    const displayName = name ? `${name} (${email})` : email;
                    return (
                      <option key={user.id} value={user.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
                <small className={styles.hint}>
                  Default person to assign the project to when template is applied
                </small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="default_scope" className={styles.label}>
                  Default Project Scope
                </label>
                <select
                  id="default_scope"
                  name="default_scope"
                  value={formData.default_scope}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="internal">Internal (Agency-Only)</option>
                  <option value="external">External (Client-Only)</option>
                  <option value="both">Both (Mixed Work)</option>
                </select>
                <small className={styles.hint}>
                  Who can see this project when created from template
                </small>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="default_due_date_offset_days" className={styles.label}>
                Project Due Date Offset (Days)
              </label>
              <input
                type="number"
                id="default_due_date_offset_days"
                name="default_due_date_offset_days"
                value={formData.default_due_date_offset_days}
                onChange={handleChange}
                className={styles.input}
                placeholder="30"
                min="0"
              />
              <small className={styles.hint}>
                Number of days from project start date to set the due date (e.g., 30 = due 30 days after start)
              </small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Is Billable</label>
              <div className={styles.toggleRow}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={formData.default_is_billable === 'true'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_is_billable: e.target.checked ? 'true' : 'false',
                      })
                    }
                    aria-label="Is billable"
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
                <span className={styles.toggleText}>
                  {formData.default_is_billable === 'true' ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Template Tasks */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Template Tasks</h3>
              <button
                type="button"
                onClick={handleAddTask}
                className={styles.addButton}
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>

            {formData.tasks.length === 0 ? (
              <p className={styles.emptyState}>
                No tasks added yet. Click &quot;Add Task&quot; to create template tasks.
              </p>
            ) : (
              <div className={styles.tasksList}>
                {(() => {
                  const groupedTasks = new Map<string, typeof formData.tasks>();
                  formData.tasks.forEach((task) => {
                    const parentId = task.parent_temp_id || '';
                    const list = groupedTasks.get(parentId) || [];
                    list.push(task);
                    groupedTasks.set(parentId, list);
                  });
                  const sortByOrder = (a: ProjectTemplateFormData['tasks'][number], b: ProjectTemplateFormData['tasks'][number]) =>
                    Number(a.display_order) - Number(b.display_order);
                  const topLevelTasks = (groupedTasks.get('') || []).sort(sortByOrder);
                  return topLevelTasks.map((task, index) => {
                    const subTasks = (groupedTasks.get(task.temp_id || '') || []).sort(sortByOrder);
                    return (
                      <div key={task.temp_id || `task-${index}`} className={styles.taskCard}>
                        <div className={styles.taskHeader}>
                          <span className={styles.taskNumber}>Task {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.temp_id || '')}
                            className={styles.removeButton}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            Title <span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) =>
                              handleTaskChange(task.temp_id || '', 'title', e.target.value)
                            }
                            className={styles.input}
                            required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Description</label>
                          <textarea
                            value={task.description}
                            onChange={(e) =>
                              handleTaskChange(task.temp_id || '', 'description', e.target.value)
                            }
                            className={styles.textarea}
                            rows={2}
                          />
                        </div>

                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Priority</label>
                            <select
                              value={task.priority}
                              onChange={(e) =>
                                handleTaskChange(task.temp_id || '', 'priority', e.target.value)
                              }
                              className={styles.select}
                            >
                              {taskPriorityOptions.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                  {priority.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Due Date Offset (Days)
                            </label>
                            <input
                              type="number"
                              value={task.due_date_offset_days}
                              onChange={(e) =>
                                handleTaskChange(
                                  task.temp_id || '',
                                  'due_date_offset_days',
                                  e.target.value
                                )
                              }
                              className={styles.input}
                              placeholder="0"
                            />
                            <small className={styles.hint}>
                              Days from project start (negative = before, positive = after)
                            </small>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Default Assignee</label>
                          <select
                            value={task.default_assigned_to}
                            onChange={(e) =>
                              handleTaskChange(task.temp_id || '', 'default_assigned_to', e.target.value)
                            }
                            className={styles.select}
                          >
                            <option value="">Unassigned</option>
                            {users.map((user) => {
                              const firstName = (user as any).first_name || user.profiles?.first_name || '';
                              const lastName = (user as any).last_name || user.profiles?.last_name || '';
                              const email = user.profiles?.email || user.email || '';
                              const name = `${firstName} ${lastName}`.trim();
                              const displayName = name ? `${name} (${email})` : email;
                              return (
                                <option key={user.id} value={user.id}>
                                  {displayName}
                                </option>
                              );
                            })}
                          </select>
                          <small className={styles.hint}>
                            Task will be automatically assigned to this person when template is applied
                          </small>
                        </div>

                        <button
                          type="button"
                          className={styles.addSubtaskButton}
                          onClick={() => handleAddSubtask(task.temp_id || '')}
                        >
                          <Plus size={14} />
                          Add Subtask
                        </button>

                        {subTasks.length > 0 && (
                          <div className={styles.subtasksList}>
                            {subTasks.map((subtask, subIndex) => (
                              <div key={subtask.temp_id || `subtask-${index}-${subIndex}`} className={styles.subtaskCard}>
                                <div className={styles.taskHeader}>
                                  <span className={styles.taskNumber}>Subtask {index + 1}.{subIndex + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(subtask.temp_id || '')}
                                    className={styles.removeButton}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>

                                <div className={styles.formGroup}>
                                  <label className={styles.label}>
                                    Title <span className={styles.required}>*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={subtask.title}
                                    onChange={(e) =>
                                      handleTaskChange(subtask.temp_id || '', 'title', e.target.value)
                                    }
                                    className={styles.input}
                                    required
                                  />
                                </div>

                                <div className={styles.formGroup}>
                                  <label className={styles.label}>Description</label>
                                  <textarea
                                    value={subtask.description}
                                    onChange={(e) =>
                                      handleTaskChange(subtask.temp_id || '', 'description', e.target.value)
                                    }
                                    className={styles.textarea}
                                    rows={2}
                                  />
                                </div>

                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>Priority</label>
                                    <select
                                      value={subtask.priority}
                                      onChange={(e) =>
                                        handleTaskChange(subtask.temp_id || '', 'priority', e.target.value)
                                      }
                                      className={styles.select}
                                    >
                                      {taskPriorityOptions.map((priority) => (
                                        <option key={priority.value} value={priority.value}>
                                          {priority.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                      Due Date Offset (Days)
                                    </label>
                                    <input
                                      type="number"
                                      value={subtask.due_date_offset_days}
                                      onChange={(e) =>
                                        handleTaskChange(
                                          subtask.temp_id || '',
                                          'due_date_offset_days',
                                          e.target.value
                                        )
                                      }
                                      className={styles.input}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>

                                <div className={styles.formGroup}>
                                  <label className={styles.label}>Default Assignee</label>
                                  <select
                                    value={subtask.default_assigned_to}
                                    onChange={(e) =>
                                      handleTaskChange(subtask.temp_id || '', 'default_assigned_to', e.target.value)
                                    }
                                    className={styles.select}
                                  >
                                    <option value="">Unassigned</option>
                                    {users.map((user) => {
                                      const firstName = (user as any).first_name || user.profiles?.first_name || '';
                                      const lastName = (user as any).last_name || user.profiles?.last_name || '';
                                      const email = user.profiles?.email || user.email || '';
                                      const name = `${firstName} ${lastName}`.trim();
                                      const displayName = name ? `${name} (${email})` : email;
                                      return (
                                        <option key={user.id} value={user.id}>
                                          {displayName}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <small className={styles.hint}>
                                    Task will be automatically assigned to this person when template is applied
                                  </small>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
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
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Template'
                  : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateForm;
