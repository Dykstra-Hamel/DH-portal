'use client';

import React, { useState } from 'react';
import {
  projectTypeOptions,
  printSubtypes,
  digitalSubtypes,
  taskPriorityOptions,
  ProjectTemplate,
  ProjectTemplateFormData,
} from '@/types/project';
import styles from './TemplateForm.module.scss';
import { X, Plus, Trash2 } from 'lucide-react';

interface TemplateFormProps {
  template?: ProjectTemplate;
  onClose: () => void;
  onSuccess: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!template;

  const [formData, setFormData] = useState<ProjectTemplateFormData>({
    name: template?.name || '',
    description: template?.description || '',
    project_type: template?.project_type || '',
    project_subtype: template?.project_subtype || '',
    is_active: template?.is_active !== false ? 'true' : 'false',
    template_data: template?.template_data ? JSON.stringify(template.template_data) : '',
    tasks: template?.tasks?.map((task) => ({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date_offset_days: task.due_date_offset_days.toString(),
      display_order: task.display_order.toString(),
      tags: task.tags?.join(', ') || '',
    })) || [],
  });

  const [customSubtype, setCustomSubtype] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          title: '',
          description: '',
          priority: 'medium',
          due_date_offset_days: '0',
          display_order: prev.tasks.length.toString(),
          tags: '',
        },
      ],
    }));
  };

  const handleRemoveTask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleTaskChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Prepare submission data
      const submitData = {
        name: formData.name,
        description: formData.description,
        project_type: formData.project_type,
        project_subtype:
          formData.project_subtype === 'other'
            ? customSubtype
            : formData.project_subtype,
        is_active: formData.is_active === 'true',
        template_data: formData.template_data
          ? JSON.parse(formData.template_data)
          : null,
        tasks: formData.tasks.map((task, index) => ({
          title: task.title,
          description: task.description || null,
          priority: task.priority,
          due_date_offset_days: parseInt(task.due_date_offset_days, 10),
          display_order: index,
          tags: task.tags
            ? task.tags.split(',').map((tag) => tag.trim())
            : null,
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

  const currentSubtypes =
    formData.project_type === 'print'
      ? printSubtypes
      : formData.project_type === 'digital'
        ? digitalSubtypes
        : [];

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
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={styles.textarea}
                rows={3}
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
                    setCustomSubtype('');
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
                  >
                    <option value="">Select Subtype</option>
                    {currentSubtypes.map((subtype) => (
                      <option key={subtype.value} value={subtype.value}>
                        {subtype.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.project_subtype === 'other' && (
                <div className={styles.formGroup}>
                  <label htmlFor="customSubtype" className={styles.label}>
                    Custom Subtype
                  </label>
                  <input
                    type="text"
                    id="customSubtype"
                    value={customSubtype}
                    onChange={(e) => setCustomSubtype(e.target.value)}
                    className={styles.input}
                    placeholder="Enter custom subtype"
                  />
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
                {formData.tasks.map((task, index) => (
                  <div key={index} className={styles.taskCard}>
                    <div className={styles.taskHeader}>
                      <span className={styles.taskNumber}>Task {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(index)}
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
                          handleTaskChange(index, 'title', e.target.value)
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
                          handleTaskChange(index, 'description', e.target.value)
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
                            handleTaskChange(index, 'priority', e.target.value)
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
                              index,
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
                      <label className={styles.label}>Tags</label>
                      <input
                        type="text"
                        value={task.tags}
                        onChange={(e) =>
                          handleTaskChange(index, 'tags', e.target.value)
                        }
                        className={styles.input}
                        placeholder="Comma-separated tags"
                      />
                    </div>
                  </div>
                ))}
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
