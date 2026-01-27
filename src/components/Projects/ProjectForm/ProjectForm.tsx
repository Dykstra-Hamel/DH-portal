'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { X } from 'lucide-react';
import {
  Project,
  ProjectFormData,
  User,
  Company,
  ProjectCategory,
  statusOptions,
  priorityOptions,
  projectTypeOptions,
  printSubtypes,
  digitalSubtypes,
} from '@/types/project';
import CategoryBadge from '@/components/ProjectManagement/CategorySettings/CategoryBadge';
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
    type_code: editingProject?.type_code || '',
    requested_by: editingProject?.requested_by_profile?.id || currentUser.id,
    company_id: editingProject?.company?.id || userActiveCompany?.id || '',
    assigned_to: editingProject?.assigned_to_profile?.id || '',
    status: editingProject?.status || 'in_progress',
    priority: editingProject?.priority || 'medium',
    due_date: editingProject?.due_date || '',
    start_date: editingProject?.start_date || '',
    completion_date: editingProject?.completion_date || '',
    is_billable: editingProject?.is_billable ? 'true' : 'false',
    quoted_price: editingProject?.quoted_price?.toString() || '',
    tags: editingProject?.tags?.join(', ') || '',
    notes: editingProject?.notes || '',
    scope: editingProject?.scope || 'internal', // Project scope field
    category_ids: editingProject?.categories?.map(c => c.category_id) || [],
  });

  const [customSubtype, setCustomSubtype] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ProjectCategory[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [shortcodePreview, setShortcodePreview] = useState<string>('');
  const [companyShortCodes, setCompanyShortCodes] = useState<Record<string, string>>({});
  const fetchedCompanyCodesRef = useRef<Record<string, boolean>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const assignedId = formData.assigned_to || editingProject?.assigned_to_profile?.id;
    if (assignedId && !adminUsers.some(user => user.id === assignedId)) {
      const assignedUser = users.find(user => user.id === assignedId);
      if (assignedUser) {
        return [...adminUsers, assignedUser];
      }
      if (editingProject?.assigned_to_profile) {
        return [
          ...adminUsers,
          {
            id: assignedId,
            profiles: editingProject.assigned_to_profile,
            email: editingProject.assigned_to_profile.email,
          },
        ];
      }
    }

    return adminUsers;
  }, [editingProject?.assigned_to_profile, formData.assigned_to, users]);

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [companies]);

  const PRESET_PROJECT_TAGS = [
    'seo', 'social-media', 'content', 'design', 'development',
    'ppc', 'google-ads', 'facebook-ads', 'email', 'analytics',
    'branding', 'website', 'blog', 'video', 'photography',
    'local-seo', 'gmb', 'reviews', 'reporting', 'strategy',
    'print', 'digital', 'billboard', 'business-cards',
    'door-hangers', 'vehicle-wrap',
  ];

  // Filter status options based on project categories and is_billable
  const availableStatusOptions = useMemo(() => {
    const hasPrintCategory = availableCategories.some(
      cat => formData.category_ids.includes(cat.id) && cat.name === 'Print'
    );
    const isBillable = formData.is_billable === 'true';

    return statusOptions.filter(status => {
      // Using extended statusOptions with requiresCategory and requiresBillable
      if (status.requiresCategory === 'Print' && !hasPrintCategory) {
        return false;
      }
      // Using extended statusOptions with requiresCategory and requiresBillable
      if (status.requiresBillable && !isBillable) {
        return false;
      }
      return true;
    });
  }, [availableCategories, formData.category_ids, formData.is_billable]);

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);
      try {
        const endpoint = isAdmin
          ? '/api/admin/project-categories'
          : '/api/project-categories';
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsFetchingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, isAdmin]);

  // Update form data when editingProject changes
  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name || '',
        description: editingProject.description || '',
        project_type: editingProject.project_type || '',
        project_subtype: editingProject.project_subtype || '',
        type_code: editingProject.type_code || '',
        requested_by: editingProject.requested_by_profile?.id || currentUser.id,
        company_id: editingProject.company?.id || userActiveCompany?.id || '',
        assigned_to: editingProject.assigned_to_profile?.id || '',
        status: editingProject.status || 'in_progress',
        priority: editingProject.priority || 'medium',
        due_date: editingProject.due_date || '',
        start_date: editingProject.start_date || '',
        completion_date: editingProject.completion_date || '',
        is_billable: editingProject.is_billable ? 'true' : 'false',
        quoted_price: editingProject.quoted_price?.toString() || '',
        tags: editingProject.tags?.join(', ') || '',
        notes: editingProject.notes || '',
        scope: editingProject.scope || 'internal', // Project scope field
        category_ids: editingProject.categories?.map(c => c.category_id) || [],
      });
      // Set selected tags from editing project
      setSelectedTags(editingProject.tags || []);
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
        type_code: '',
        requested_by: currentUser.id,
        company_id: userActiveCompany?.id || '',
        assigned_to: '',
        status: 'in_progress',
        priority: 'medium',
        due_date: '',
        start_date: '',
        completion_date: '',
        is_billable: 'false',
        quoted_price: '',
        tags: '',
        notes: '',
        scope: 'internal',
        category_ids: [],
      });
      setSelectedTags([]);
      setCustomSubtype('');
    }
  }, [editingProject, currentUser.id, userActiveCompany?.id]);

  // Automatically extract type_code from project_type
  useEffect(() => {
    const selectedType = projectTypeOptions.find(opt => opt.value === formData.project_type);
    if (selectedType) {
      setFormData(prev => ({ ...prev, type_code: selectedType.code || '' }));
    }
  }, [formData.project_type]);

  // Fetch company short code when company changes (for shortcode preview)
  useEffect(() => {
    const companyId = formData.company_id;
    if (!companyId || fetchedCompanyCodesRef.current[companyId]) return;

    fetchedCompanyCodesRef.current[companyId] = true;

    const fetchShortCode = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/settings`);
        if (!response.ok) {
          throw new Error('Failed to fetch company settings');
        }
        const data = await response.json();
        const shortCode = data?.settings?.short_code?.value;
        setCompanyShortCodes(prev => ({
          ...prev,
          [companyId]: typeof shortCode === 'string' ? shortCode : '',
        }));
      } catch (error) {
        console.error('Error fetching company short code:', error);
        setCompanyShortCodes(prev => ({ ...prev, [companyId]: '' }));
      }
    };

    fetchShortCode();
  }, [formData.company_id]);

  // Update shortcode preview when type_code, name, or company changes
  useEffect(() => {
    if (formData.type_code && formData.name && formData.company_id) {
      const year = new Date().getFullYear().toString().slice(-2);
      const cleanName = formData.name
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 20);
      const companyCode = companyShortCodes[formData.company_id];
      if (companyCode !== undefined) {
        const prefix = companyCode || '[COMPANY_CODE]';
        const preview = `${prefix}_${formData.type_code}${year}_${cleanName}`;
        setShortcodePreview(preview);
      } else {
        setShortcodePreview('');
      }
    } else {
      setShortcodePreview('');
    }
  }, [formData.type_code, formData.name, formData.company_id, companyShortCodes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Note: Company short_code validation is handled by the API/database
    // The database trigger will auto-generate the shortcode if type_code is provided

    try {
      setIsSubmitting(true);
      // If "other" is selected, use custom subtype
      const submitData = {
        ...formData,
        project_subtype: formData.project_subtype === 'other' ? customSubtype : formData.project_subtype,
        tags: selectedTags.join(', '), // Convert tags array to comma-separated string
        type_code: formData.type_code || undefined, // Include type_code if set
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Get current subtypes based on project type
  const currentSubtypes = formData.project_type === 'print' ? printSubtypes :
    formData.project_type === 'digital' ? digitalSubtypes : [];

  const handleToggleCategory = (categoryId: string) => {
    if (formData.category_ids.includes(categoryId)) {
      setFormData({
        ...formData,
        category_ids: formData.category_ids.filter(id => id !== categoryId),
      });
    } else {
      setFormData({
        ...formData,
        category_ids: [...formData.category_ids, categoryId],
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      project_type: '',
      project_subtype: '',
      type_code: '',
      requested_by: currentUser.id,
      company_id: userActiveCompany?.id || '',
      assigned_to: '',
      status: 'in_progress',
      priority: 'medium',
      due_date: '',
      start_date: '',
      completion_date: '',
      is_billable: 'false',
      quoted_price: '',
      tags: '',
      notes: '',
      scope: 'internal',
      category_ids: [],
    });
    setSelectedTags([]);
    setCustomSubtype('');
    setShortcodePreview('');
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
                <label>Project Subtype</label>
                <select
                  value={formData.project_subtype}
                  onChange={e => {
                    setFormData({ ...formData, project_subtype: e.target.value });
                    if (e.target.value !== 'other') {
                      setCustomSubtype('');
                    }
                  }}
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

            {/* Shortcode Preview */}
            {shortcodePreview && mode === 'full' && (
              <div className={styles.formGroup}>
                <label>Project Shortcode (auto-generated)</label>
                <div className={styles.shortcodePreview}>
                  <code>{shortcodePreview}</code>
                </div>
                {formData.company_id && companyShortCodes[formData.company_id] === '' && (
                  <small style={{ color: '#dc3545' }}>
                    ⚠ Company must have a short code set before creating projects with type codes
                  </small>
                )}
              </div>
            )}

            {/* Project Scope (Admin Only) */}
            {isAdmin && mode === 'full' && (
              <div className={styles.formGroup}>
                <label>Project Scope</label>
                <select
                  value={formData.scope || 'internal'}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      scope: e.target.value as 'internal' | 'external' | 'both',
                    })
                  }
                >
                  <option value="internal">Internal Only</option>
                  <option value="external">External Only</option>
                  <option value="both">Both Internal and External</option>
                </select>
                <small style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                  Internal: Agency-only work | External: Client-side only (hidden by toggle) | Both: Mixed work
                </small>
              </div>
            )}

            {/* Company field */}
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
                  {sortedCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Project Categories Multi-Select */}
            {mode === 'full' && availableCategories.length > 0 && (
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Project Categories</label>
                <div className={styles.categoryMultiSelect}>
                  {availableCategories.map((category) => {
                    const isSelected = formData.category_ids.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`${styles.categoryOption} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleToggleCategory(category.id)}
                      >
                        <CategoryBadge category={category} />
                      </button>
                    );
                  })}
                </div>
                {isFetchingCategories && (
                  <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '8px 0 0 0' }}>
                    Loading categories...
                  </p>
                )}
              </div>
            )}

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
                    {assignableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
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
                    {availableStatusOptions.map(status => (
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
            <label>Tags</label>
            <div className={styles.presetTagsContainer}>
              {PRESET_PROJECT_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
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
