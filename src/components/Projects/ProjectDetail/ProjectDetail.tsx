'use client';

import React, { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { User } from '@supabase/supabase-js';
import {
  Calendar,
  User as UserIcon,
  Building,
  Clock,
  DollarSign,
  LayoutGrid,
  Users,
  Flag,
  Tag,
  FileText,
  Hash,
  AlertCircle,
  Activity as ActivityIcon,
  CheckSquare,
} from 'lucide-react';
import { DetailsCardsSidebar } from '@/components/Common/DetailsCardsSidebar/DetailsCardsSidebar';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { Toast } from '@/components/Common/Toast';
import {
  Project,
  ProjectActivity,
  ProjectTask,
  User as ProjectUser,
  statusOptions,
  priorityOptions,
  projectTypeOptions,
  printSubtypes,
  digitalSubtypes,
} from '@/types/project';
import styles from './ProjectDetail.module.scss';

const PRESET_PROJECT_TAGS = [
  'seo', 'social-media', 'content', 'design', 'development',
  'ppc', 'google-ads', 'facebook-ads', 'email', 'analytics',
  'branding', 'website', 'blog', 'video', 'photography',
  'local-seo', 'gmb', 'reviews', 'reporting', 'strategy',
  'print', 'digital', 'billboard', 'business-cards',
  'door-hangers', 'vehicle-wrap',
];

const getSubtypesForType = (projectType: string | null | undefined) => {
  if (projectType === 'print') return printSubtypes;
  if (projectType === 'digital') return digitalSubtypes;
  return [];
};

interface ProjectDetailProps {
  project: Project;
  user: User;
  users: ProjectUser[];
  tasks: ProjectTask[];
  onProjectUpdate?: () => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: Dispatch<SetStateAction<boolean>>;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  user: _user,
  users,
  tasks,
  onProjectUpdate,
  isSidebarExpanded,
  setIsSidebarExpanded,
}) => {
  const [editFormData, setEditFormData] = useState(() => ({
    name: project.name || '',
    description: project.description || '',
    notes: project.notes || '',
    status: project.status || 'in_progress',
    priority: project.priority || 'medium',
    assigned_to: project.assigned_to_profile?.id || '',
    due_date: project.due_date || '',
    start_date: project.start_date || '',
    completion_date: project.completion_date || '',
    tags: project.tags || [],
    project_type: project.project_type || '',
    project_subtype: project.project_subtype || '',
    is_billable: project.is_billable || false,
    quoted_price: project.quoted_price?.toString() || '',
  }));
  const [customSubtype, setCustomSubtype] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [pendingExpandCard, setPendingExpandCard] = useState<string | null>(
    null
  );
  const hasUserEditedRef = React.useRef(false);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = React.useRef<string>('');

  const formatScope = (scope?: string | null) => {
    switch (scope) {
      case 'internal':
        return 'Internal Only';
      case 'external':
        return 'External Only';
      case 'both':
        return 'Internal + External';
      default:
        return 'Not set';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return formatDateTime(dateString);
  };

  const getProjectActivityMessage = (activity: ProjectActivity): string => {
    const statusLabel = (status: string) => statusOptions.find(s => s.value === status)?.label || status;
    const priorityLabel = (priority: string) => priorityOptions.find(p => p.value === priority)?.label || priority;

    switch (activity.action_type) {
      case 'created':
        return 'created this project';
      case 'status_changed':
        return `changed status from ${statusLabel(activity.old_value || '')} to ${statusLabel(activity.new_value || '')}`;
      case 'priority_changed':
        return `changed priority from ${priorityLabel(activity.old_value || '')} to ${priorityLabel(activity.new_value || '')}`;
      case 'assigned':
      case 'unassigned':
        if (activity.action_type === 'unassigned') {
          return 'unassigned this project';
        }
        return 'assigned this project';
      case 'name_changed':
        return `changed name from "${activity.old_value}" to "${activity.new_value}"`;
      case 'description_changed':
        return 'updated the description';
      case 'notes_changed':
        return 'updated the notes';
      case 'due_date_changed':
        if (!activity.old_value && activity.new_value) {
          return `set due date to ${new Date(activity.new_value).toLocaleDateString()}`;
        } else if (activity.old_value && !activity.new_value) {
          return 'removed the due date';
        }
        return activity.old_value && activity.new_value
          ? `changed due date from ${new Date(activity.old_value).toLocaleDateString()} to ${new Date(activity.new_value).toLocaleDateString()}`
          : 'changed due date';
      case 'start_date_changed':
        if (!activity.old_value && activity.new_value) {
          return `set start date to ${new Date(activity.new_value).toLocaleDateString()}`;
        } else if (activity.old_value && !activity.new_value) {
          return 'removed the start date';
        }
        return activity.old_value && activity.new_value
          ? `changed start date from ${new Date(activity.old_value).toLocaleDateString()} to ${new Date(activity.new_value).toLocaleDateString()}`
          : 'changed start date';
      case 'completion_date_changed':
        if (!activity.old_value && activity.new_value) {
          return `set completion date to ${new Date(activity.new_value).toLocaleDateString()}`;
        } else if (activity.old_value && !activity.new_value) {
          return 'removed the completion date';
        }
        return activity.old_value && activity.new_value
          ? `changed completion date from ${new Date(activity.old_value).toLocaleDateString()} to ${new Date(activity.new_value).toLocaleDateString()}`
          : 'changed completion date';
      case 'budget_changed':
        return `changed budget from $${activity.old_value} to $${activity.new_value}`;
      case 'estimated_hours_changed':
        return `changed estimated hours from ${activity.old_value} to ${activity.new_value}`;
      case 'actual_hours_changed':
        return `changed actual hours from ${activity.old_value} to ${activity.new_value}`;
      case 'tags_changed':
        return 'updated the tags';
      case 'project_type_changed':
        return `changed project type from ${activity.old_value} to ${activity.new_value}`;
      case 'project_subtype_changed':
        return `changed project subtype from ${activity.old_value} to ${activity.new_value}`;
      default:
        return String(activity.action_type).replace(/_/g, ' ');
    }
  };

  const resetFormData = React.useCallback((source: Project) => {
    const subtypes = getSubtypesForType(source.project_type);
    const supportsSubtypeSelect = subtypes.length > 0;
    const rawSubtype = source.project_subtype || '';
    const hasCustomSubtype =
      supportsSubtypeSelect &&
      rawSubtype &&
      !subtypes.find(option => option.value === rawSubtype);

    const newFormData = {
      name: source.name || '',
      description: source.description || '',
      notes: source.notes || '',
      status: source.status || 'in_progress',
      priority: source.priority || 'medium',
      assigned_to: source.assigned_to_profile?.id || '',
      due_date: source.due_date || '',
      start_date: source.start_date || '',
      completion_date: source.completion_date || '',
      tags: source.tags || [],
      project_type: source.project_type || '',
      project_subtype: supportsSubtypeSelect
        ? hasCustomSubtype
          ? 'other'
          : rawSubtype
        : rawSubtype,
      is_billable: source.is_billable || false,
      quoted_price: source.quoted_price?.toString() || '',
    };

    // Store the initial state to compare against later
    lastSavedDataRef.current = JSON.stringify({ formData: newFormData, customSubtype: hasCustomSubtype ? rawSubtype : '' });
    hasUserEditedRef.current = false;

    setEditFormData(newFormData);
    setCustomSubtype(hasCustomSubtype ? rawSubtype : '');
  }, []);

  React.useEffect(() => {
    resetFormData(project);
  }, [project, resetFormData]);

  const currentSubtypes = useMemo(
    () => getSubtypesForType(editFormData.project_type),
    [editFormData.project_type]
  );

  const handleSaveEdit = React.useCallback(async () => {
    const subtypes = getSubtypesForType(editFormData.project_type);
    const supportsSubtypeSelect = subtypes.length > 0;
    const resolvedSubtype = supportsSubtypeSelect
      ? editFormData.project_subtype === 'other'
        ? customSubtype.trim()
        : editFormData.project_subtype
      : editFormData.project_subtype;

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
          notes: editFormData.notes,
          status: editFormData.status,
          priority: editFormData.priority,
          assigned_to: editFormData.assigned_to || null,
          due_date: editFormData.due_date,
          start_date: editFormData.start_date || null,
          completion_date: editFormData.completion_date || null,
          tags: editFormData.tags,
          project_type: editFormData.project_type,
          project_subtype: resolvedSubtype || null,
          is_billable: editFormData.is_billable,
          quoted_price: editFormData.quoted_price ? parseFloat(editFormData.quoted_price) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      // Call callback to refresh project data
      if (onProjectUpdate) {
        onProjectUpdate();
      }
      setToastMessage('Project updated.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating project:', error);
      setToastMessage('Failed to update project.');
      setToastType('error');
      setShowToast(true);
    }
  }, [customSubtype, editFormData, onProjectUpdate, project.id]);

  React.useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Check if data has actually changed from last saved state
    const currentData = JSON.stringify({ formData: editFormData, customSubtype });
    if (currentData === lastSavedDataRef.current) {
      return;
    }

    // Only autosave after user has made edits
    if (!hasUserEditedRef.current) {
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSaveEdit();
      lastSavedDataRef.current = currentData;
    }, 700);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [customSubtype, editFormData, handleSaveEdit]);

  const handleToggleTag = (tag: string) => {
    hasUserEditedRef.current = true;
    const tags = editFormData.tags || [];
    if (tags.includes(tag)) {
      setEditFormData({ ...editFormData, tags: tags.filter(t => t !== tag) });
    } else {
      setEditFormData({ ...editFormData, tags: [...tags, tag] });
    }
  };

  // Helper to mark form as edited when user changes a field
  const handleFieldChange = <K extends keyof typeof editFormData>(
    field: K,
    value: typeof editFormData[K]
  ) => {
    hasUserEditedRef.current = true;
    setEditFormData({ ...editFormData, [field]: value });
  };

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

    const assignedId = editFormData.assigned_to || project.assigned_to_profile?.id;
    if (assignedId && !adminUsers.some(user => user.id === assignedId)) {
      const assignedUser = users.find(user => user.id === assignedId);
      if (assignedUser) {
        return [...adminUsers, assignedUser];
      }
      if (project.assigned_to_profile) {
        return [
          ...adminUsers,
          {
            id: assignedId,
            profiles: project.assigned_to_profile,
            email: project.assigned_to_profile.email,
          },
        ];
      }
    }

    return adminUsers;
  }, [editFormData.assigned_to, project.assigned_to_profile?.id, users]);

  const assignedTaskSummaries = useMemo(() => {
    const profilesById = new Map<string, ProjectUser['profiles']>();
    users.forEach(projectUser => {
      profilesById.set(projectUser.id, projectUser.profiles);
    });

    const counts = new Map<
      string,
      { id: string; name: string; email?: string; count: number }
    >();

    tasks.forEach(task => {
      if (!task.assigned_to) return;

      const profile =
        task.assigned_to_profile || profilesById.get(task.assigned_to);
      const nameParts = [profile?.first_name, profile?.last_name].filter(
        Boolean
      );
      const name =
        nameParts.length > 0
          ? nameParts.join(' ')
          : profile?.email || 'Unknown User';
      const email = profile?.email;

      const existing = counts.get(task.assigned_to);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(task.assigned_to, {
          id: task.assigned_to,
          name,
          email,
          count: 1,
        });
      }
    });

    return Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [tasks, users]);

  const handleCardExpand = (cardId: string) => {
    if (!isSidebarExpanded) {
      setPendingExpandCard(cardId);
      setIsSidebarExpanded(true);
    }
  };

  React.useEffect(() => {
    if (isSidebarExpanded && pendingExpandCard) {
      const timer = setTimeout(() => {
        setPendingExpandCard(null);
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isSidebarExpanded, pendingExpandCard]);

  const shouldForceExpand = (cardId: string) =>
    pendingExpandCard === cardId;

  return (
    <>
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />
      <DetailsCardsSidebar
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
      >
      <InfoCard
        title="Overview"
        icon={<LayoutGrid size={20} />}
        startExpanded={false}
        onExpand={() => handleCardExpand('overview')}
        forceCollapse={!isSidebarExpanded}
        forceExpand={shouldForceExpand('overview')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={styles.cardContent}>
          <div className={styles.infoItem}>
            <FileText size={16} />
            <div>
              <div className={styles.infoLabel}>Project Name</div>
              <input
                type="text"
                className={styles.editInput}
                value={editFormData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.infoItem}>
            <Building size={16} />
            <div>
              <div className={styles.infoLabel}>Company</div>
              <div className={styles.infoValue}>
                {project.company?.name || 'Not set'}
              </div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Hash size={16} />
            <div>
              <div className={styles.infoLabel}>Shortcode</div>
              <div className={styles.infoValue}>{project.shortcode || 'Not set'}</div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <FileText size={16} />
            <div>
              <div className={styles.infoLabel}>Project Type</div>
              <select
                className={styles.editSelect}
                value={editFormData.project_type}
                onChange={(e) => {
                  hasUserEditedRef.current = true;
                  setEditFormData({
                    ...editFormData,
                    project_type: e.target.value,
                    project_subtype: '',
                  });
                  setCustomSubtype('');
                }}
              >
                <option value="">Select Project Type</option>
                {projectTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.infoItem}>
            <FileText size={16} />
            <div>
              <div className={styles.infoLabel}>Project Subtype</div>
              {currentSubtypes.length > 0 ? (
                <>
                  <select
                    className={styles.editSelect}
                    value={editFormData.project_subtype}
                    onChange={(e) => {
                      hasUserEditedRef.current = true;
                      setEditFormData({
                        ...editFormData,
                        project_subtype: e.target.value,
                      });
                      if (e.target.value !== 'other') {
                        setCustomSubtype('');
                      }
                    }}
                  >
                    <option value="">Select Subtype</option>
                    {currentSubtypes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {editFormData.project_subtype === 'other' && (
                    <input
                      type="text"
                      className={styles.editInput}
                      value={customSubtype}
                      onChange={(e) => {
                        hasUserEditedRef.current = true;
                        setCustomSubtype(e.target.value);
                      }}
                      placeholder="Enter custom subtype"
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className={styles.editInput}
                  value={editFormData.project_subtype}
                  onChange={(e) => {
                    hasUserEditedRef.current = true;
                    setEditFormData({
                      ...editFormData,
                      project_subtype: e.target.value,
                    });
                  }}
                  placeholder="Enter subtype"
                />
              )}
            </div>
          </div>

          <div className={styles.infoItem}>
            <Flag size={16} />
            <div>
              <div className={styles.infoLabel}>Project Scope</div>
              <div className={styles.infoValue}>{formatScope(project.scope)}</div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Tag size={16} />
            <div>
              <div className={styles.infoLabel}>Project Categories</div>
              {project.categories && project.categories.length > 0 ? (
                <div className={styles.categoryList}>
                  {project.categories.map((assignment) => (
                    <span key={assignment.id} className={styles.categoryBadge}>
                      {assignment.category?.name || 'Uncategorized'}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={styles.infoValue}>None</div>
              )}
            </div>
          </div>

          <div className={styles.infoItem}>
            <CheckSquare size={16} />
            <div>
              <div className={styles.infoLabel}>Status</div>
              <select
                className={styles.editSelect}
                value={editFormData.status}
                onChange={(e) => handleFieldChange('status', e.target.value as typeof editFormData.status)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.infoItem}>
            <AlertCircle size={16} />
            <div>
              <div className={styles.infoLabel}>Priority</div>
              <select
                className={styles.editSelect}
                value={editFormData.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value as typeof editFormData.priority)}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.infoItem}>
            <DollarSign size={16} />
            <div>
              <div className={styles.infoLabel}>Is Billable</div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={editFormData.is_billable}
                  onChange={(e) => {
                    hasUserEditedRef.current = true;
                    setEditFormData({
                      ...editFormData,
                      is_billable: e.target.checked,
                      quoted_price: e.target.checked ? editFormData.quoted_price : '',
                    });
                  }}
                />
                <span>Yes</span>
              </label>
            </div>
          </div>

          {editFormData.is_billable && (
            <div className={styles.infoItem}>
              <DollarSign size={16} />
              <div>
                <div className={styles.infoLabel}>Quoted Price</div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.editInput}
                  value={editFormData.quoted_price}
                  onChange={(e) => handleFieldChange('quoted_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div className={styles.infoItem}>
            <Tag size={16} />
            <div>
              <div className={styles.infoLabel}>Tags</div>
              <div className={styles.tagCloud}>
                {PRESET_PROJECT_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.tagButton} ${
                      (editFormData.tags || []).includes(tag) ? styles.tagSelected : ''
                    }`}
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.textBlock}>
            <div className={styles.infoLabel}>Notes</div>
            <textarea
              className={styles.editTextarea}
              value={editFormData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={4}
              placeholder="Add notes..."
            />
          </div>
        </div>
      </InfoCard>

      <InfoCard
        title="Timeline"
        icon={<Calendar size={20} />}
        startExpanded={false}
        onExpand={() => handleCardExpand('timeline')}
        forceCollapse={!isSidebarExpanded}
        forceExpand={shouldForceExpand('timeline')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={styles.cardContent}>
          <div className={styles.infoItem}>
            <Calendar size={16} />
            <div>
              <div className={styles.infoLabel}>Due Date</div>
              <input
                type="date"
                className={styles.editInput}
                value={editFormData.due_date || ''}
                onChange={(e) => handleFieldChange('due_date', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.infoItem}>
            <Calendar size={16} />
            <div>
              <div className={styles.infoLabel}>Start Date</div>
              <input
                type="date"
                className={styles.editInput}
                value={editFormData.start_date || ''}
                onChange={(e) => handleFieldChange('start_date', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.infoItem}>
            <Calendar size={16} />
            <div>
              <div className={styles.infoLabel}>Completion Date</div>
              <input
                type="date"
                className={styles.editInput}
                value={editFormData.completion_date || ''}
                onChange={(e) => handleFieldChange('completion_date', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.infoItem}>
            <Clock size={16} />
            <div>
              <div className={styles.infoLabel}>Created</div>
              <div className={styles.infoValue}>{formatDate(project.created_at)}</div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Clock size={16} />
            <div>
              <div className={styles.infoLabel}>Last Updated</div>
              <div className={styles.infoValue}>{formatDate(project.updated_at)}</div>
            </div>
          </div>
        </div>
      </InfoCard>

      <InfoCard
        title="People"
        icon={<Users size={20} />}
        startExpanded={false}
        onExpand={() => handleCardExpand('people')}
        forceCollapse={!isSidebarExpanded}
        forceExpand={shouldForceExpand('people')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={styles.cardContent}>
          <div className={styles.infoItem}>
            <UserIcon size={16} />
            <div>
              <div className={styles.infoLabel}>Requested By</div>
              {project.requested_by_profile ? (
                <>
                  <div className={styles.infoValue}>
                    {project.requested_by_profile.first_name}{' '}
                    {project.requested_by_profile.last_name}
                  </div>
                  <div className={styles.infoEmail}>
                    {project.requested_by_profile.email}
                  </div>
                </>
              ) : (
                <div className={styles.infoValue}>Not set</div>
              )}
            </div>
          </div>

          <div className={styles.infoItem}>
            <UserIcon size={16} />
            <div>
              <div className={styles.infoLabel}>Assigned To</div>
              <select
                className={styles.editSelect}
                value={editFormData.assigned_to || ''}
                onChange={(e) => handleFieldChange('assigned_to', e.target.value)}
              >
                <option value="">Unassigned</option>
                {assignableUsers.map((projectUser) => (
                  <option key={projectUser.id} value={projectUser.id}>
                    {getUserDisplayName(projectUser)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Users size={16} />
            <div>
              <div className={styles.infoLabel}>Assigned Tasks</div>
              {assignedTaskSummaries.length > 0 ? (
                <div className={styles.assignedTasksList}>
                  {assignedTaskSummaries.map(summary => (
                    <div key={summary.id} className={styles.assignedTaskItem}>
                      <div>
                        <div className={styles.infoValue}>{summary.name}</div>
                        {summary.email && summary.email !== summary.name && (
                          <div className={styles.infoEmail}>{summary.email}</div>
                        )}
                      </div>
                      <div className={styles.assignedTaskCount}>{summary.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.infoValue}>None</div>
              )}
            </div>
          </div>
        </div>
      </InfoCard>

      <InfoCard
        title="Activity"
        icon={<ActivityIcon size={20} />}
        startExpanded={false}
        onExpand={() => handleCardExpand('activity')}
        forceCollapse={!isSidebarExpanded}
        forceExpand={shouldForceExpand('activity')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={styles.cardContent}>
          {project.activity && project.activity.length > 0 ? (
            <div className={styles.activityFeed}>
              {project.activity.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityAvatar}>
                    {activity.user_profile?.first_name?.[0]}
                    {activity.user_profile?.last_name?.[0]}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>
                      <span className={styles.activityUser}>
                        {activity.user_profile?.first_name}{' '}
                        {activity.user_profile?.last_name}
                      </span>{' '}
                      <span className={styles.activityAction}>
                        {getProjectActivityMessage(activity)}
                      </span>
                    </div>
                    <div className={styles.activityTime}>
                      {getRelativeTime(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>No activity yet.</div>
          )}
        </div>
      </InfoCard>

    </DetailsCardsSidebar>
  </>
  );
};

export default ProjectDetail;
