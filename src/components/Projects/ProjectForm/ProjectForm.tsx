'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { X, Plus } from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import {
  Project,
  ProjectFormData,
  ProjectTaskDraft,
  User,
  Company,
  ProjectCategory,
  ProjectDepartment,
  ProjectTypeSubtype,
  statusOptions,
  priorityOptions,
  projectTypeOptions,
} from '@/types/project';
import CategoryBadge from '@/components/ProjectManagement/CategorySettings/CategoryBadge';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { SearchableSelect } from '@/components/Common/SearchableSelect/SearchableSelect';
import { ProjectTaskBuilder } from './ProjectTaskBuilder';
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

const normalizeTaskOrder = (tasks: ProjectTaskDraft[]): ProjectTaskDraft[] => {
  const topLevelTasks = tasks
    .filter((task) => !task.parent_temp_id)
    .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));

  const childrenByParent = new Map<string, ProjectTaskDraft[]>();
  tasks
    .filter((task) => !!task.parent_temp_id)
    .forEach((task) => {
      const parentId = task.parent_temp_id || '';
      const list = childrenByParent.get(parentId) || [];
      list.push(task);
      childrenByParent.set(parentId, list);
    });

  const orderedTasks: ProjectTaskDraft[] = [];
  topLevelTasks.forEach((task, index) => {
    orderedTasks.push({
      ...task,
      display_order: index.toString(),
    });

    const children = (childrenByParent.get(task.temp_id || '') || []).sort(
      (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
    );
    children.forEach((child, childIndex) => {
      orderedTasks.push({
        ...child,
        display_order: childIndex.toString(),
      });
    });
  });

  return orderedTasks;
};

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
    status: editingProject?.status || 'new',
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
    current_department_id: editingProject?.current_department_id || '',
  });

  const [availableCategories, setAvailableCategories] = useState<ProjectCategory[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState<ProjectDepartment[]>([]);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState(false);
  const [availableSubtypes, setAvailableSubtypes] = useState<ProjectTypeSubtype[]>([]);
  const [isFetchingSubtypes, setIsFetchingSubtypes] = useState(false);
  const [shortcodePreview, setShortcodePreview] = useState<string>('');
  const [companyShortCodes, setCompanyShortCodes] = useState<Record<string, string>>({});
  const fetchedCompanyCodesRef = useRef<Record<string, boolean>>({});
  const [showRequestedBySelect, setShowRequestedBySelect] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [projectTasks, setProjectTasks] = useState<ProjectTaskDraft[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>(
    editingProject?.members?.map(m => m.user_id) || []
  );

  const shouldUseTwoStep = mode === 'full' && !editingProject;

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

  const handleAddMember = (userId: string) => {
    if (!userId) return;
    setMemberIds(prev => [...prev, userId]);
    setShowAddMember(false);
  };

  const handleRemoveMember = (userId: string) => {
    setMemberIds(prev => prev.filter(id => id !== userId));
  };

  const availableUsersNotMembers = users.filter(
    user => !memberIds.includes(user.id)
  );

  const selectedMembers = users.filter(user =>
    memberIds.includes(user.id)
  );

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

  const requestedByUser = useMemo(() => {
    const requestedId = formData.requested_by;
    if (!requestedId) return null;
    return users.find(user => (user.profiles?.id || user.id) === requestedId) || null;
  }, [formData.requested_by, users]);

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [companies]);

  const companyOptions = useMemo(
    () =>
      sortedCompanies.map((company) => ({
        value: company.id,
        label: company.name,
      })),
    [sortedCompanies]
  );

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

  // Fetch available departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsFetchingDepartments(true);
      try {
        const endpoint = '/api/admin/project-departments';
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setAvailableDepartments(data);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setIsFetchingDepartments(false);
      }
    };

    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  // Fetch available subtypes when type_code changes
  useEffect(() => {
    const fetchSubtypes = async () => {
      if (!formData.type_code) {
        setAvailableSubtypes([]);
        return;
      }

      setIsFetchingSubtypes(true);
      try {
        const response = await fetch(`/api/admin/project-types/${formData.type_code}/subtypes`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSubtypes([...data].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          setAvailableSubtypes([]);
        }
      } catch (error) {
        console.error('Failed to fetch subtypes:', error);
        setAvailableSubtypes([]);
      } finally {
        setIsFetchingSubtypes(false);
      }
    };

    if (isOpen && formData.type_code) {
      fetchSubtypes();
    }
  }, [isOpen, formData.type_code]);

  // Update form data when editingProject changes
  useEffect(() => {
    if (editingProject) {
      setCurrentStep(1);
      setProjectTasks([]);
      setFormData({
        name: editingProject.name || '',
        description: editingProject.description || '',
        project_type: editingProject.project_type || '',
        project_subtype: editingProject.project_subtype || '',
        type_code: editingProject.type_code || '',
        requested_by: editingProject.requested_by_profile?.id || currentUser.id,
        company_id: editingProject.company?.id || userActiveCompany?.id || '',
        assigned_to: editingProject.assigned_to_profile?.id || '',
        status: editingProject.status || 'new',
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
        current_department_id: editingProject.current_department_id || '',
      });
    } else {
      setCurrentStep(1);
      setProjectTasks([]);
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
        status: 'new',
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
        current_department_id: '',
      });
      setShowRequestedBySelect(false);
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
        .trim();
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

  const handleGoToTasksStep = () => {
    if (!formData.name || !formData.project_type || !formData.company_id || !formData.due_date) {
      alert('Please complete all required fields before continuing.');
      return;
    }

    if (mode === 'full' && !formData.current_department_id) {
      alert('Please select an initial department for this project.');
      return;
    }

    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (shouldUseTwoStep && currentStep === 1) {
      handleGoToTasksStep();
      return;
    }

    // Validate department is selected for full mode
    if (mode === 'full' && !formData.current_department_id) {
      alert('Please select an initial department for this project.');
      return;
    }

    // Note: Company short_code validation is handled by the API/database
    // The database trigger will auto-generate the shortcode if type_code is provided

    try {
      setIsSubmitting(true);
      const orderedTasks = normalizeTaskOrder(projectTasks);
      const submitData = {
        ...formData,
        type_code: formData.type_code || undefined, // Include type_code if set
        tasks: shouldUseTwoStep ? orderedTasks : undefined,
        member_ids: memberIds.length > 0 ? memberIds : undefined,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setCurrentStep(1);
    setProjectTasks([]);
    setMemberIds([]);
    setShowAddMember(false);
    setFormData({
      name: '',
      description: '',
      project_type: '',
      project_subtype: '',
      type_code: '',
      requested_by: currentUser.id,
      company_id: userActiveCompany?.id || '',
      assigned_to: '',
      status: 'new',
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
      current_department_id: '',
    });
    setShowRequestedBySelect(false);
    setShortcodePreview('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <h3>
              {mode === 'request'
                ? 'Request New Project'
                : editingProject
                  ? 'Edit Project'
                  : 'Create New Project'}
            </h3>
            {shouldUseTwoStep && (
              <p className={styles.stepText}>
                Step {currentStep} of 2: {currentStep === 1 ? 'Project Details' : 'Project Tasks'}
              </p>
            )}
          </div>
          <button onClick={handleClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {(!shouldUseTwoStep || currentStep === 1) && (
            <>
              <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                maxLength={100}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Project Type *</label>
              <select
                value={formData.project_type}
                onChange={e => {
                  setFormData({ ...formData, project_type: e.target.value, project_subtype: '' });
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

            {formData.type_code && (
              <div className={styles.formGroup}>
                <label>Project Subtype</label>
                <select
                  value={formData.project_subtype}
                  onChange={e => {
                    const selectedSubtype = availableSubtypes.find(s => s.name === e.target.value);
                    setFormData({ ...formData, project_subtype: e.target.value, project_subtype_id: selectedSubtype?.id || '' });
                  }}
                  disabled={isFetchingSubtypes}
                >
                  <option value="">
                    {isFetchingSubtypes ? 'Loading subtypes...' : availableSubtypes.length === 0 ? 'No subtypes available' : 'Select Subtype'}
                  </option>
                  {availableSubtypes.map(subtype => (
                    <option key={subtype.id} value={subtype.name} data-id={subtype.id}>
                      {subtype.name}
                    </option>
                  ))}
                </select>
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
                <SearchableSelect
                  id="project-company-id"
                  value={formData.company_id}
                  options={companyOptions}
                  onChange={(companyId) =>
                    setFormData({ ...formData, company_id: companyId })
                  }
                  placeholder="Select Company"
                  searchPlaceholder="Search companies..."
                  noResultsText="No companies found"
                  ariaLabel="Company"
                />
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

            {/* Department Selector */}
            {mode === 'full' && availableDepartments.length > 0 && (
              <div className={styles.formGroup}>
                <label>
                  Initial Department <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={formData.current_department_id || ''}
                  onChange={e =>
                    setFormData({ ...formData, current_department_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a department</option>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.icon ? `${department.icon} ` : ''}{department.name}
                    </option>
                  ))}
                </select>
                {isFetchingDepartments && (
                  <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '8px 0 0 0' }}>
                    Loading departments...
                  </p>
                )}
              </div>
            )}

            {/* Requested By */}
            {isAdmin && mode === 'full' ? (
              <div className={styles.formGroup}>
                <div className={styles.inlineLabelRow}>
                  <label>Requested By *</label>
                  <button
                    type="button"
                    className={styles.changeLink}
                    onClick={() => setShowRequestedBySelect(prev => !prev)}
                  >
                    {showRequestedBySelect ? 'Done' : 'Change'}
                  </button>
                </div>
                {showRequestedBySelect ? (
                  <select
                    value={formData.requested_by}
                    onChange={e =>
                      setFormData({ ...formData, requested_by: e.target.value })
                    }
                    required
                  >
                    <option value="">Select User</option>
                    {assignableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={styles.readOnlyValue}>
                    {requestedByUser ? getUserDisplayName(requestedByUser) : 'Not set'}
                  </div>
                )}
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
                  <label>Project Members</label>
                  {selectedMembers.length > 0 ? (
                    <div className={styles.membersList}>
                      {selectedMembers.map(user => {
                        const profile = user?.profiles;
                        const firstName = profile?.first_name || (user as any).first_name || '';
                        const lastName = profile?.last_name || (user as any).last_name || '';
                        const email = profile?.email || user?.email || '';
                        const name = `${firstName} ${lastName}`.trim();
                        const avatarUrl = profile?.avatar_url || (user as any).avatar_url || null;
                        const displayName = name || email || 'Unknown User';

                        return (
                          <div key={user.id} className={styles.memberItem}>
                            <div className={styles.memberInfo}>
                              <MiniAvatar
                                firstName={firstName || undefined}
                                lastName={lastName || undefined}
                                email={email}
                                avatarUrl={avatarUrl}
                                size="small"
                                showTooltip={true}
                              />
                              <div className={styles.memberDetails}>
                                <div className={styles.memberName}>{displayName}</div>
                                {name && email && (
                                  <div className={styles.memberEmail}>{email}</div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className={styles.removeMemberBtn}
                              onClick={() => handleRemoveMember(user.id)}
                              title="Remove member"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={styles.hint}>No members added yet</p>
                  )}

                  {showAddMember ? (
                    <div className={styles.addMemberSection}>
                      <select
                        className={styles.memberSelect}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMember(e.target.value);
                          }
                        }}
                        value=""
                      >
                        <option value="">Select user...</option>
                        {availableUsersNotMembers.map(user => (
                          <option key={user.id} value={user.id}>
                            {getUserDisplayName(user)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.cancelMemberBtn}
                        onClick={() => setShowAddMember(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.addMemberBtn}
                      onClick={() => setShowAddMember(true)}
                    >
                      <Plus size={16} /> Add Member
                    </button>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
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
                  <label>Is Billable</label>
                  <div className={styles.toggleRow}>
                    <label className={styles.toggle}>
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
                        aria-label="Is billable"
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                    <span className={styles.toggleText}>
                      {formData.is_billable === 'true' ? 'Yes' : 'No'}
                    </span>
                  </div>
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
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) =>
                    setFormData({ ...formData, description: value })
                  }
                  placeholder="Add a project description..."
                  className={styles.richTextField}
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
            </>
          )}

          {shouldUseTwoStep && currentStep === 2 && (
            <ProjectTaskBuilder
              tasks={projectTasks}
              onChange={setProjectTasks}
              users={assignableUsers}
              availableCategories={availableCategories}
              projectCategoryIds={formData.category_ids}
              isFetchingCategories={isFetchingCategories}
              departments={availableDepartments}
              title="Project Tasks"
              onAddProjectCategory={(categoryId) => {
                if (!formData.category_ids.includes(categoryId)) {
                  setFormData(prev => ({
                    ...prev,
                    category_ids: [...prev.category_ids, categoryId],
                  }));
                }
              }}
            />
          )}

          <div className={styles.modalActions} key={`project-form-actions-step-${currentStep}`}>
            {shouldUseTwoStep && currentStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleGoToTasksStep}
                >
                  Next
                </button>
              </>
            ) : shouldUseTwoStep && currentStep === 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Create Project'}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
