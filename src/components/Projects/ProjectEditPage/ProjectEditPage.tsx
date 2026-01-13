'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, Save, X } from 'lucide-react';
import {
  Project,
  ProjectFormData,
  User as ProjectUser,
  Company,
  statusOptions,
  priorityOptions,
} from '@/types/project';
import styles from './ProjectEditPage.module.scss';

interface ProjectEditPageProps {
  project: Project;
  user: User;
  users: ProjectUser[];
  companies: Company[];
}

const ProjectEditPage: React.FC<ProjectEditPageProps> = ({
  project,
  user,
  users,
  companies,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    name: project.name || '',
    description: project.description || '',
    project_type: project.project_type || '',
    project_subtype: project.project_subtype || '',
    requested_by: project.requested_by_profile?.id || user.id,
    company_id: project.company?.id || '',
    assigned_to: project.assigned_to_profile?.id || '',
    status: project.status || 'pending',
    priority: project.priority || 'medium',
    due_date: project.due_date || '',
    start_date: project.start_date || '',
    completion_date: project.completion_date || '',
    is_billable: project.is_billable ? 'true' : 'false',
    quoted_price: project.quoted_price?.toString() || '',
    tags: project.tags?.join(', ') || '',
    notes: project.notes || '',
    is_internal: project.is_internal || false,
    category_ids: project.categories?.map(c => c.category_id) || [],
  });

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
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      // Navigate back to detail page
      router.push(`/project-management/${project.id}`);
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/project-management/${project.id}`);
  };

  const handleBackToList = () => {
    router.push('/project-management');
  };

  return (
    <div className={styles.editPage}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <button onClick={handleBackToList} className={styles.breadcrumbLink}>
          Project Management
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <button
          onClick={() => router.push(`/project-management/${project.id}`)}
          className={styles.breadcrumbLink}
        >
          {project.name}
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>Edit</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <button onClick={handleCancel} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Project
        </button>
        <h1 className={styles.title}>Edit Project</h1>
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
        <div className={styles.formGrid}>
          {/* Basic Information */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Project Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={styles.input}
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
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="project_type" className={styles.label}>
                  Project Type <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="project_type"
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="e.g., Website, Mobile App, Campaign"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="company_id" className={styles.label}>
                  Company <span className={styles.required}>*</span>
                </label>
                <select
                  id="company_id"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* People */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>People</h2>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="requested_by" className={styles.label}>
                  Requested By <span className={styles.required}>*</span>
                </label>
                <select
                  id="requested_by"
                  name="requested_by"
                  value={formData.requested_by}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.profiles?.first_name} {u.profiles?.last_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

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
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.profiles?.first_name} {u.profiles?.last_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Status & Priority */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Status & Priority</h2>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>
                  Status <span className={styles.required}>*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Timeline</h2>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="due_date" className={styles.label}>
                  Due Date <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

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
                <label htmlFor="completion_date" className={styles.label}>
                  Completion Date
                </label>
                <input
                  type="date"
                  id="completion_date"
                  name="completion_date"
                  value={formData.completion_date}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>
          </section>

          {/* Budget & Hours */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Budget & Time</h2>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <input
                    type="checkbox"
                    name="is_billable"
                    checked={formData.is_billable === 'true'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_billable: e.target.checked ? 'true' : 'false',
                        quoted_price: e.target.checked ? formData.quoted_price : '',
                      })
                    }
                    style={{ marginRight: '8px' }}
                  />
                  Is Billable?
                </label>
              </div>

              {formData.is_billable === 'true' && (
                <div className={styles.formGroup}>
                  <label htmlFor="quoted_price" className={styles.label}>
                    Quoted Price
                  </label>
                  <input
                    type="number"
                    id="quoted_price"
                    name="quoted_price"
                    value={formData.quoted_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={styles.input}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Additional Info */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Additional Information</h2>

            <div className={styles.formGroup}>
              <label htmlFor="tags" className={styles.label}>
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className={styles.input}
                placeholder="Separate tags with commas"
              />
              <p className={styles.fieldHelp}>Comma-separated tags for categorization</p>
            </div>

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
                placeholder="Additional notes or comments"
              />
            </div>
          </section>
        </div>

        {/* Sticky Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={isSubmitting}
          >
            <Save size={18} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEditPage;
