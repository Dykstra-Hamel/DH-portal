'use client';

import React, { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { X } from 'lucide-react';
import {
  Project,
  ProjectFormData,
  User,
  Company,
  statusOptions,
  priorityOptions,
  projectTypeOptions,
  printSubtypes,
  digitalSubtypes,
} from '@/types/project';
import styles from './ProjectForm.module.scss';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  editingProject?: Project | null;
  users: User[];
  companies: Company[];
  currentUser: SupabaseUser;
  currentUserProfile: User | null;
  isAdmin?: boolean;
  mode?: 'full' | 'request'; // 'full' for admin, 'request' for non-admin simplified form
  userActiveCompany?: Company | null; // Auto-selected company for non-admin users
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProject,
  users,
  companies,
  currentUser,
  currentUserProfile,
  isAdmin = false,
  mode = 'full',
  userActiveCompany = null,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: editingProject?.name || '',
    description: editingProject?.description || '',
    project_type: editingProject?.project_type || '',
    project_subtype: editingProject?.project_subtype || '',
    requested_by: editingProject?.requested_by_profile?.id || currentUser.id,
    company_id: editingProject?.company?.id || userActiveCompany?.id || '',
    assigned_to: editingProject?.assigned_to_profile?.id || '',
    status: editingProject?.status || 'coming_up',
    priority: editingProject?.priority || 'medium',
    due_date: editingProject?.due_date || '',
    start_date: editingProject?.start_date || '',
    completion_date: editingProject?.completion_date || '',
    is_billable: editingProject?.is_billable ? 'true' : 'false',
    quoted_price: editingProject?.quoted_price?.toString() || '',
    tags: editingProject?.tags?.join(', ') || '',
    notes: editingProject?.notes || '',
  });

  const [customSubtype, setCustomSubtype] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when editingProject changes
  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name || '',
        description: editingProject.description || '',
        project_type: editingProject.project_type || '',
        project_subtype: editingProject.project_subtype || '',
        requested_by: editingProject.requested_by_profile?.id || currentUser.id,
        company_id: editingProject.company?.id || userActiveCompany?.id || '',
        assigned_to: editingProject.assigned_to_profile?.id || '',
        status: editingProject.status || 'coming_up',
        priority: editingProject.priority || 'medium',
        due_date: editingProject.due_date || '',
        start_date: editingProject.start_date || '',
        completion_date: editingProject.completion_date || '',
        is_billable: editingProject.is_billable ? 'true' : 'false',
        quoted_price: editingProject.quoted_price?.toString() || '',
        tags: editingProject.tags?.join(', ') || '',
        notes: editingProject.notes || '',
      });
      // Handle custom subtype
      const isPrint = editingProject.project_type === 'print';
      const isDigital = editingProject.project_type === 'digital';
      const subtypes = isPrint ? printSubtypes : isDigital ? digitalSubtypes : [];
      const isOther = editingProject.project_subtype &&
        !subtypes.find(s => s.value === editingProject.project_subtype);
      if (isOther) {
        setCustomSubtype(editingProject.project_subtype || '');
      }
    } else {
      // Reset form for new project
      setFormData({
        name: '',
        description: '',
        project_type: '',
        project_subtype: '',
        requested_by: currentUser.id,
        company_id: userActiveCompany?.id || '',
        assigned_to: '',
        status: 'coming_up',
        priority: 'medium',
        due_date: '',
        start_date: '',
        completion_date: '',
        is_billable: 'false',
        quoted_price: '',
        tags: '',
        notes: '',
      });
      setCustomSubtype('');
    }
  }, [editingProject, currentUser.id, userActiveCompany?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      // If "other" is selected, use custom subtype
      const submitData = {
        ...formData,
        project_subtype: formData.project_subtype === 'other' ? customSubtype : formData.project_subtype,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current subtypes based on project type
  const currentSubtypes = formData.project_type === 'print' ? printSubtypes :
    formData.project_type === 'digital' ? digitalSubtypes : [];

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      project_type: '',
      project_subtype: '',
      requested_by: currentUser.id,
      company_id: userActiveCompany?.id || '',
      assigned_to: '',
      status: 'coming_up',
      priority: 'medium',
      due_date: '',
      start_date: '',
      completion_date: '',
      is_billable: 'false',
      quoted_price: '',
      tags: '',
      notes: '',
    });
    setCustomSubtype('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>
            {mode === 'request'
              ? 'Request New Project'
              : editingProject
                ? 'Edit Project'
                : 'Create New Project'}
          </h3>
          <button onClick={handleClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Project Type *</label>
              <select
                value={formData.project_type}
                onChange={e => {
                  setFormData({ ...formData, project_type: e.target.value, project_subtype: '' });
                  setCustomSubtype('');
                }}
                required
              >
                <option value="">Select Project Type</option>
                {projectTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.project_type && (
              <div className={styles.formGroup}>
                <label>Project Subtype *</label>
                <select
                  value={formData.project_subtype}
                  onChange={e => {
                    setFormData({ ...formData, project_subtype: e.target.value });
                    if (e.target.value !== 'other') {
                      setCustomSubtype('');
                    }
                  }}
                  required
                >
                  <option value="">Select Subtype</option>
                  {currentSubtypes.map(subtype => (
                    <option key={subtype.value} value={subtype.value}>
                      {subtype.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.project_subtype === 'other' && (
              <div className={styles.formGroup}>
                <label>Custom Subtype *</label>
                <input
                  type="text"
                  value={customSubtype}
                  onChange={e => setCustomSubtype(e.target.value)}
                  placeholder="Enter custom project subtype"
                  required
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Company *</label>
              {mode === 'request' && userActiveCompany ? (
                <input
                  type="text"
                  value={userActiveCompany.name}
                  readOnly
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              ) : (
                <select
                  value={formData.company_id}
                  onChange={e =>
                    setFormData({ ...formData, company_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Only show Requested By field for admins in edit mode */}
            {isAdmin && editingProject ? (
              <div className={styles.formGroup}>
                <label>Requested By *</label>
                <select
                  value={formData.requested_by}
                  onChange={e =>
                    setFormData({ ...formData, requested_by: e.target.value })
                  }
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.profiles?.first_name || ''}{' '}
                      {user.profiles?.last_name || ''} (
                      {user.profiles?.email || user.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label>Requested By *</label>
                <input
                  type="text"
                  value={
                    currentUserProfile && currentUserProfile.profiles
                      ? `${currentUserProfile.profiles.first_name || ''} ${currentUserProfile.profiles.last_name || ''}`.trim() +
                        ` (${currentUserProfile.profiles.email || currentUser.email})`
                      : `Current User (${currentUser.email})`
                  }
                  readOnly
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>
            )}

            {mode === 'full' && (
              <>
                <div className={styles.formGroup}>
                  <label>Assigned To</label>
                  <select
                    value={formData.assigned_to}
                    onChange={e =>
                      setFormData({ ...formData, assigned_to: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.profiles?.first_name || ''}{' '}
                        {user.profiles?.last_name || ''} (
                        {user.profiles?.email || user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label>Due Date *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={e =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                required
              />
            </div>

            {mode === 'full' && (
              <>
                <div className={styles.formGroup}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Completion Date</label>
                  <input
                    type="date"
                    value={formData.completion_date}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        completion_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_billable === 'true'}
                      onChange={e =>
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
                    <label>Quoted Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quoted_price}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          quoted_price: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder="business cards, website images, postcard design"
            />
          </div>

          {mode === 'full' && (
            <div className={styles.formGroup}>
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Submitting...'
                : mode === 'request'
                  ? 'Submit Request'
                  : editingProject
                    ? 'Update Project'
                    : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
