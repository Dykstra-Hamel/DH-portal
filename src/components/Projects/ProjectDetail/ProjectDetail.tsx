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
  FileText,
  Hash,
  AlertCircle,
  Activity as ActivityIcon,
  CheckSquare,
  Plus,
  X,
} from 'lucide-react';
import { DetailsCardsSidebar } from '@/components/Common/DetailsCardsSidebar/DetailsCardsSidebar';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { Toast } from '@/components/Common/Toast';
import {
  Project,
  ProjectActivity,
  ProjectTask,
  ProjectTypeSubtype,
  User as ProjectUser,
  statusOptions,
  priorityOptions,
  projectTypeOptions,
} from '@/types/project';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { createClient } from '@/lib/supabase/client';
import styles from './ProjectDetail.module.scss';

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
    requested_by: project.requested_by_profile?.id || '',
    due_date: project.due_date || '',
    start_date: project.start_date || '',
    completion_date: project.completion_date || '',
    project_type: project.project_type || '',
    project_subtype: project.project_subtype || '',
    is_billable: project.is_billable || false,
    quoted_price: project.quoted_price?.toString() || '',
    scope: project.scope || '',
    category_ids: project.categories?.map(c => c.category_id) || [],
    company_id: project.company?.id || '',
  }));
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [pendingExpandCard, setPendingExpandCard] = useState<string | null>(
    null
  );
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isChangingRequestedBy, setIsChangingRequestedBy] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [availableSubtypes, setAvailableSubtypes] = useState<ProjectTypeSubtype[]>([]);
  const [isFetchingSubtypes, setIsFetchingSubtypes] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const hasUserEditedRef = React.useRef(false);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = React.useRef<string>('');

  // Filter status options based on project categories and is_billable
  const availableStatusOptions = useMemo(() => {
    const hasPrintCategory = availableCategories.some(
      cat => editFormData.category_ids.includes(cat.id) && cat.name === 'Print'
    );
    const isBillable = editFormData.is_billable || project.is_billable || false;

    return statusOptions.filter(status => {
      if (status.value === 'new') {
        return false;
      }
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
  }, [availableCategories, editFormData.category_ids, editFormData.is_billable, project.is_billable]);

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
    const newFormData = {
      name: source.name || '',
      description: source.description || '',
      notes: source.notes || '',
      status: source.status || 'in_progress',
      priority: source.priority || 'medium',
      assigned_to: source.assigned_to_profile?.id || '',
      requested_by: source.requested_by_profile?.id || '',
      due_date: source.due_date || '',
      start_date: source.start_date || '',
      completion_date: source.completion_date || '',
      project_type: source.project_type || '',
      project_subtype: source.project_subtype || '',
      is_billable: source.is_billable || false,
      quoted_price: source.quoted_price?.toString() || '',
      scope: source.scope || '',
      category_ids: source.categories?.map(c => c.category_id) || [],
      company_id: source.company?.id || '',
    };

    // Store the initial state to compare against later
    lastSavedDataRef.current = JSON.stringify(newFormData);
    hasUserEditedRef.current = false;

    setEditFormData(newFormData);
  }, []);

  React.useEffect(() => {
    resetFormData(project);
  }, [project, resetFormData]);

  // Fetch available categories
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/project-categories');
        if (response.ok) {
          const categories = await response.json();
          setAvailableCategories(categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch available companies
  React.useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const headers = {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        };

        const response = await fetch('/api/admin/companies', { headers });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch available subtypes when project type changes
  React.useEffect(() => {
    const fetchSubtypes = async () => {
      // Get the type_code from the selected project_type
      const selectedType = projectTypeOptions.find(opt => opt.value === editFormData.project_type);
      const typeCode = selectedType?.code;

      if (!typeCode) {
        setAvailableSubtypes([]);
        return;
      }

      setIsFetchingSubtypes(true);
      try {
        const response = await fetch(`/api/admin/project-types/${typeCode}/subtypes`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSubtypes(data);
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

    fetchSubtypes();
  }, [editFormData.project_type]);

  const handleSaveEdit = React.useCallback(async () => {

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
          requested_by: editFormData.requested_by || null,
          due_date: editFormData.due_date,
          start_date: editFormData.start_date || null,
          completion_date: editFormData.completion_date || null,
          project_type: editFormData.project_type,
          project_subtype: editFormData.project_subtype || null,
          is_billable: editFormData.is_billable,
          quoted_price: editFormData.quoted_price ? parseFloat(editFormData.quoted_price) : null,
          scope: editFormData.scope || null,
          category_ids: editFormData.category_ids,
          company_id: editFormData.company_id,
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
  }, [editFormData, onProjectUpdate, project.id]);

  React.useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Check if data has actually changed from last saved state
    const currentData = JSON.stringify(editFormData);
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
  }, [editFormData, handleSaveEdit]);

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
  }, [editFormData.assigned_to, project.assigned_to_profile, users]);

  const requestedByProfile = useMemo(() => {
    const requestedId = editFormData.requested_by;
    if (!requestedId) return project.requested_by_profile || null;
    const match = users.find(user => (user.profiles?.id || user.id) === requestedId);
    return match?.profiles || project.requested_by_profile || null;
  }, [editFormData.requested_by, project.requested_by_profile, users]);

  const assignedTaskSummaries = useMemo(() => {
    const profilesById = new Map<string, ProjectUser['profiles']>();
    users.forEach(projectUser => {
      profilesById.set(projectUser.id, projectUser.profiles);
    });

    const counts = new Map<
      string,
      {
        id: string;
        name: string;
        email?: string;
        count: number;
        avatarUrl?: string | null;
        firstName?: string;
        lastName?: string;
      }
    >();

    tasks.forEach(task => {
      if (!task.assigned_to) return;

      const profile =
        task.assigned_to_profile || profilesById.get(task.assigned_to);
      const firstName = profile?.first_name || '';
      const lastName = profile?.last_name || '';
      const nameParts = [firstName, lastName].filter(Boolean);
      const name = nameParts.length > 0 ? nameParts.join(' ') : profile?.email || 'Unknown User';
      const email = profile?.email;
      const avatarUrl = profile?.avatar_url ?? null;

      const existing = counts.get(task.assigned_to);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(task.assigned_to, {
          id: task.assigned_to,
          name,
          email,
          avatarUrl,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
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

  const memberTaskCounts = useMemo(() => {
    const counts = new Map<string, number>();

    tasks.forEach(task => {
      if (task.assigned_to) {
        counts.set(task.assigned_to, (counts.get(task.assigned_to) || 0) + 1);
      }
    });

    return counts;
  }, [tasks]);

  const availableUsersNotMembers = useMemo(() => {
    const memberIds = new Set(project.members?.map(m => m.user_id) || []);
    const companyUserIds = new Set(
      users
        .filter(u => u.profiles?.id)
        .map(u => u.profiles!.id)
    );

    return users.filter(u => {
      const userId = u.profiles?.id || u.id;
      return companyUserIds.has(userId) && !memberIds.has(userId);
    });
  }, [project.members, users]);

  const sortedCompanies = useMemo(() => {
    // Make sure current company is in the list
    const companiesList = [...companies];

    // If project has a company and it's not in the list, add it
    if (project.company && !companiesList.some(c => c.id === project.company!.id)) {
      companiesList.push({
        id: project.company.id,
        name: project.company.name,
      });
    }

    return companiesList.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [companies, project.company]);

  const handleAddMember = async (userId: string) => {
    if (!userId) return;

    setIsAddingMember(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }

      setToastMessage('Member added successfully');
      setToastType('success');
      setShowToast(true);
      setShowAddMember(false);

      if (onProjectUpdate) {
        onProjectUpdate();
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to add member');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${project.id}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      setToastMessage('Member removed successfully');
      setToastType('success');
      setShowToast(true);

      if (onProjectUpdate) {
        onProjectUpdate();
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to remove member');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCardExpand = (cardId: string) => {
    setExpandedCardId(cardId);
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

  const shouldForceCollapse = (cardId: string) =>
    !isSidebarExpanded || (!!expandedCardId && expandedCardId !== cardId);

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
        forceCollapse={shouldForceCollapse('overview')}
        forceExpand={shouldForceExpand('overview')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={`${styles.cardContent} ${styles.cardContentFlushLeft}`}>
          <div className={styles.infoItem}>
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
            <div>
              <div className={styles.infoLabel}>Company</div>
              <select
                className={styles.editSelect}
                value={editFormData.company_id}
                onChange={(e) => handleFieldChange('company_id', e.target.value)}
              >
                <option value="">Select Company</option>
                {sortedCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.infoItem}>
            <div>
              <div className={styles.infoLabel}>Shortcode</div>
              <div className={styles.infoValue}>{project.shortcode || 'Not set'}</div>
            </div>
          </div>

          <div className={styles.infoItem}>
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
            <div>
              <div className={styles.infoLabel}>Project Subtype</div>
              <select
                className={styles.editSelect}
                value={editFormData.project_subtype}
                onChange={(e) => {
                  hasUserEditedRef.current = true;
                  setEditFormData({
                    ...editFormData,
                    project_subtype: e.target.value,
                  });
                }}
                disabled={isFetchingSubtypes}
              >
                <option value="">
                  {isFetchingSubtypes ? 'Loading subtypes...' : availableSubtypes.length === 0 ? 'No subtypes available' : 'Select Subtype'}
                </option>
                {availableSubtypes.map(subtype => (
                  <option key={subtype.id} value={subtype.name}>
                    {subtype.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.infoItem}>
            <div>
              <div className={styles.infoLabel}>Project Scope</div>
              <select
                className={styles.editSelect}
                value={editFormData.scope}
                onChange={(e) => handleFieldChange('scope', e.target.value)}
              >
                <option value="">Not set</option>
                <option value="internal">Internal Only</option>
                <option value="external">External Only</option>
                <option value="both">Internal + External</option>
              </select>
            </div>
          </div>

          <div className={styles.infoItem}>
            <LayoutGrid size={16} />
            <div>
              <div className={styles.infoLabel}>Project Categories</div>
              <div className={styles.categoryCheckboxes}>
                {availableCategories.length > 0 ? (
                  availableCategories.map((category) => (
                    <label key={category.id} className={styles.categoryCheckbox}>
                      <input
                        type="checkbox"
                        checked={editFormData.category_ids.includes(category.id)}
                        onChange={(e) => {
                          hasUserEditedRef.current = true;
                          const newCategoryIds = e.target.checked
                            ? [...editFormData.category_ids, category.id]
                            : editFormData.category_ids.filter((id) => id !== category.id);
                          setEditFormData({ ...editFormData, category_ids: newCategoryIds });
                        }}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))
                ) : (
                  <div className={styles.infoValue}>No categories available</div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <CheckSquare size={16} />
            <div>
              <div className={styles.infoLabel}>Status</div>
              <div className={styles.infoValue}>
                {statusOptions.find(option => option.value === editFormData.status)?.label || editFormData.status}
              </div>
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
              <div className={styles.toggleRow}>
                <label className={styles.toggle}>
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
                    aria-label="Is billable"
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
                <span className={styles.toggleText}>
                  {editFormData.is_billable ? 'Yes' : 'No'}
                </span>
              </div>
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
        </div>
      </InfoCard>

      <InfoCard
        title="Notes"
        icon={<FileText size={20} />}
        startExpanded={false}
        onExpand={() => handleCardExpand('notes')}
        forceCollapse={shouldForceCollapse('notes')}
        forceExpand={shouldForceExpand('notes')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={`${styles.cardContent} ${styles.cardContentFlushLeft}`}>
          <div className={styles.textBlock}>
            <RichTextEditor
              value={editFormData.notes}
              onChange={(value) => handleFieldChange('notes', value)}
              placeholder="Add notes..."
              className={styles.notesEditor}
              compact
            />
          </div>
        </div>
      </InfoCard>

      <InfoCard
        title="Timeline"
        icon={<Calendar size={20} />}
        startExpanded={false}
        onExpand={() => handleCardExpand('timeline')}
        forceCollapse={shouldForceCollapse('timeline')}
        forceExpand={shouldForceExpand('timeline')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={`${styles.cardContent} ${styles.cardContentFlushLeft}`}>
          <div className={styles.infoItem}>
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
            <div>
              <div className={styles.infoLabel}>Created</div>
              <div className={styles.infoValue}>{formatDate(project.created_at)}</div>
            </div>
          </div>

          <div className={styles.infoItem}>
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
        forceCollapse={shouldForceCollapse('people')}
        forceExpand={shouldForceExpand('people')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={`${styles.cardContent} ${styles.cardContentFlushLeft}`}>
          <div className={styles.infoItem}>
            <div>
              <div className={styles.infoHeaderRow}>
                <div className={styles.infoLabel}>Requested By</div>
                <button
                  type="button"
                  className={styles.changeLink}
                  onClick={() => setIsChangingRequestedBy(prev => !prev)}
                >
                  {isChangingRequestedBy ? 'Done' : 'Change'}
                </button>
              </div>
              {isChangingRequestedBy ? (
                <select
                  className={styles.editSelect}
                  value={editFormData.requested_by || ''}
                  onChange={(e) => {
                    handleFieldChange('requested_by', e.target.value);
                    setIsChangingRequestedBy(false);
                  }}
                >
                  <option value="">Select User</option>
                  {assignableUsers.map((projectUser) => (
                    <option key={projectUser.id} value={projectUser.id}>
                      {getUserDisplayName(projectUser)}
                    </option>
                  ))}
                </select>
              ) : requestedByProfile ? (
                <div className={styles.infoPerson}>
                  <MiniAvatar
                    firstName={requestedByProfile.first_name || undefined}
                    lastName={requestedByProfile.last_name || undefined}
                    email={requestedByProfile.email}
                    avatarUrl={requestedByProfile.avatar_url || null}
                    size="small"
                    showTooltip={true}
                  />
                  <div>
                    <div className={styles.infoValue}>
                      {requestedByProfile.first_name} {requestedByProfile.last_name}
                    </div>
                    <div className={styles.infoEmail}>
                      {requestedByProfile.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.infoValue}>Not set</div>
              )}
            </div>
          </div>

          <div className={styles.infoItem}>
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
            <div>
              <div className={styles.infoLabel}>Project Members</div>
              {project.members && project.members.length > 0 ? (
                <div className={styles.membersList}>
                  {project.members.map(member => {
                    const taskCount = memberTaskCounts.get(member.user_id) || 0;
                    return (
                      <div key={member.id} className={styles.memberChip}>
                        <div className={styles.memberInfo}>
                          <MiniAvatar
                            firstName={member.user_profile?.first_name || undefined}
                            lastName={member.user_profile?.last_name || undefined}
                            email={member.user_profile?.email || ''}
                            avatarUrl={member.user_profile?.avatar_url || null}
                            size="small"
                            showTooltip={true}
                          />
                          <div className={styles.memberDetails}>
                            <div className={styles.memberName}>
                              {member.user_profile?.first_name} {member.user_profile?.last_name}
                            </div>
                            {member.user_profile?.email && (
                              <div className={styles.memberEmail}>
                                {member.user_profile.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.memberActions}>
                          {taskCount > 0 && (
                            <div className={styles.memberTaskCount}>{taskCount}</div>
                          )}
                          {member.added_via === 'manual' && (
                            <button
                              className={styles.removeMemberButton}
                              onClick={() => handleRemoveMember(member.user_id)}
                              title="Remove member"
                              type="button"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.infoValue}>No members yet</div>
              )}

              {showAddMember ? (
                <div className={styles.addMemberDropdown}>
                  <select
                    className={styles.editSelect}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMember(e.target.value);
                      }
                    }}
                    value=""
                    disabled={isAddingMember}
                  >
                    <option value="">Select user...</option>
                    {availableUsersNotMembers.map((projectUser) => (
                      <option key={projectUser.id} value={projectUser.profiles?.id || projectUser.id}>
                        {getUserDisplayName(projectUser)}
                      </option>
                    ))}
                  </select>
                  <button
                    className={styles.cancelAddMemberButton}
                    onClick={() => setShowAddMember(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className={styles.addMemberButton}
                  onClick={() => setShowAddMember(true)}
                  type="button"
                >
                  <Plus size={14} /> Add Member
                </button>
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
        forceCollapse={shouldForceCollapse('activity')}
        forceExpand={shouldForceExpand('activity')}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={`${styles.cardContent} ${styles.cardContentFlushLeft}`}>
          {project.activity && project.activity.length > 0 ? (
            <div className={styles.activityFeed}>
              {project.activity.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <MiniAvatar
                    firstName={activity.user_profile?.first_name || undefined}
                    lastName={activity.user_profile?.last_name || undefined}
                    email={activity.user_profile?.email || ''}
                    avatarUrl={activity.user_profile?.avatar_url || null}
                    size="small"
                    showTooltip={true}
                    className={styles.activityAvatar}
                  />
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
