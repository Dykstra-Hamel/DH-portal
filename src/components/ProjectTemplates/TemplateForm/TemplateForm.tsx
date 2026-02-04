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
import { X, Plus, Trash2, ChevronDown, GripVertical } from 'lucide-react';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';

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
    notes: template?.notes || '',
    project_type: template?.project_type || '',
    project_subtype: template?.project_subtype || '',
    is_active: template?.is_active !== false ? 'true' : 'false',
    template_data: template?.template_data ? JSON.stringify(template.template_data) : '',
    default_assigned_to: template?.default_assigned_to || '',
    default_scope: template?.default_scope || 'internal',
    default_due_date_offset_days: template?.default_due_date_offset_days?.toString() || '30',
    default_is_billable: template?.default_is_billable ? 'true' : 'false',
    initial_department_id: template?.initial_department_id || '',
    category_ids: template?.categories?.map(c => c.category_id) || [],
    default_member_ids: template?.default_members?.map(m => m.user_id) || [],
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
      blocks_task_id: task.blocks_task_id || null,
      blocked_by_task_id: task.blocked_by_task_id || null,
      category_ids: task.categories?.map(c => c.category_id) || [],
    })) || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableSubtypes, setAvailableSubtypes] = useState<ProjectTypeSubtype[]>([]);
  const [isFetchingSubtypes, setIsFetchingSubtypes] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<ProjectCategory[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [users, setUsers] = useState<User[]>(propUsers);
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);
  const [collapsedTaskCards, setCollapsedTaskCards] = useState<Record<string, boolean>>({});
  const [collapsedSubtasks, setCollapsedSubtasks] = useState<Record<string, boolean>>({});
  const [collapsedSubtaskCards, setCollapsedSubtaskCards] = useState<Record<string, boolean>>({});
  const [hasInitializedTaskCollapse, setHasInitializedTaskCollapse] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; icon: string | null }>>([]);
  const [draggingTaskIndex, setDraggingTaskIndex] = useState<number | null>(null);
  const [dragOverTaskIndex, setDragOverTaskIndex] = useState<number | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setHasInitializedTaskCollapse(false);
    setCollapsedTaskCards({});
    setCollapsedSubtasks({});
    setCollapsedSubtaskCards({});
  }, [template?.id]);

  useEffect(() => {
    if (hasInitializedTaskCollapse) return;
    if (formData.tasks.length === 0) return;

    const nextCollapsed: Record<string, boolean> = {};
    const nextSubtaskCollapsed: Record<string, boolean> = {};
    const nextSubtasksCollapsed: Record<string, boolean> = {};

    formData.tasks.forEach((task) => {
      if (task.parent_temp_id) {
        if (task.temp_id) {
          nextSubtaskCollapsed[task.temp_id] = true;
        }
      } else if (task.temp_id) {
        nextCollapsed[task.temp_id] = true;
        nextSubtasksCollapsed[task.temp_id] = true;
      }
    });

    setCollapsedTaskCards(nextCollapsed);
    setCollapsedSubtaskCards(nextSubtaskCollapsed);
    setCollapsedSubtasks(nextSubtasksCollapsed);
    setHasInitializedTaskCollapse(true);
  }, [formData.tasks, hasInitializedTaskCollapse]);

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

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/admin/project-departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

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

  // Clean up task categories when project categories change
  useEffect(() => {
    const projectCategoryIds = formData.category_ids || [];

    // Remove task categories that are no longer in project categories
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        const validCategoryIds = (task.category_ids || []).filter((catId) =>
          projectCategoryIds.includes(catId)
        );
        return {
          ...task,
          category_ids: validCategoryIds,
        };
      }),
    }));
  }, [formData.category_ids]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = () => {
    const newTaskId = createTempId();
    const topLevelTasks = formData.tasks.filter((task) => !task.parent_temp_id);
    const nextCollapsed: Record<string, boolean> = {};
    const nextSubtasksCollapsed: Record<string, boolean> = {};

    topLevelTasks.forEach((task) => {
      if (task.temp_id) {
        nextCollapsed[task.temp_id] = true;
        nextSubtasksCollapsed[task.temp_id] = true;
      }
    });

    nextCollapsed[newTaskId] = false;
    nextSubtasksCollapsed[newTaskId] = true;

    setCollapsedTaskCards(nextCollapsed);
    setCollapsedSubtasks(nextSubtasksCollapsed);
    setHasInitializedTaskCollapse(true);
    setIsTasksExpanded(true);

    setFormData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          temp_id: newTaskId,
          parent_temp_id: '',
          title: '',
          description: '',
          priority: 'medium',
          due_date_offset_days: '0',
          display_order: topLevelTasks.length.toString(),
          tags: '',
          default_assigned_to: '',
          category_ids: [],
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
          category_ids: [],
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

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTaskCards(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const toggleSubtasksCollapse = (taskId: string) => {
    setCollapsedSubtasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const toggleSubtaskCollapse = (subtaskId: string) => {
    setCollapsedSubtaskCards(prev => ({
      ...prev,
      [subtaskId]: !prev[subtaskId],
    }));
  };

  const handleAddMember = (userId: string) => {
    if (!userId) return;
    setFormData(prev => ({
      ...prev,
      default_member_ids: [...(prev.default_member_ids || []), userId],
    }));
    setShowAddMember(false);
  };

  const handleRemoveMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      default_member_ids: (prev.default_member_ids || []).filter(id => id !== userId),
    }));
  };

  const getUserDisplayName = (user: User) => {
    const firstName = (user as any).first_name || user.profiles?.first_name || '';
    const lastName = (user as any).last_name || user.profiles?.last_name || '';
    const email = user.profiles?.email || user.email || '';
    const name = `${firstName} ${lastName}`.trim();
    return name ? `${name} (${email})` : email || 'User';
  };

  const availableUsersNotMembers = users.filter(
    user => !(formData.default_member_ids || []).includes(user.id)
  );

  const selectedMembers = users.filter(user =>
    (formData.default_member_ids || []).includes(user.id)
  );

  const handleTaskChange = (
    taskId: string,
    field: string,
    value: string | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.temp_id === taskId ? { ...task, [field]: value } : task
      ),
    }));
  };

  const handleTaskDragStart = (e: React.DragEvent, index: number) => {
    setDraggingTaskIndex(index);
    setDraggingTaskId((e.currentTarget as HTMLElement).dataset.taskId || null);
    e.dataTransfer.effectAllowed = 'move';
    const taskId = (e.currentTarget as HTMLElement).dataset.taskId || '';
    e.dataTransfer.setData('text/plain', taskId || index.toString());
  };

  const handleTaskDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTaskIndex(index);
  };

  const handleTaskDragLeave = () => {
    setDragOverTaskIndex(null);
  };

  const handleTaskDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverTaskIndex(null);

    // Get top-level tasks only
    const sortByOrder = (a: ProjectTemplateFormData['tasks'][number], b: ProjectTemplateFormData['tasks'][number]) =>
      Number(a.display_order) - Number(b.display_order);
    const topLevelTasks = formData.tasks
      .filter(task => !task.parent_temp_id)
      .sort(sortByOrder);

    const draggedId = draggingTaskId || e.dataTransfer.getData('text/plain');
    let resolvedDragIndex = draggingTaskIndex;
    if (resolvedDragIndex === null && draggedId) {
      resolvedDragIndex = topLevelTasks.findIndex(task => task.temp_id === draggedId);
    }

    // Get all tasks grouped by parent
    const tasksByParent = new Map<string, typeof formData.tasks>();
    formData.tasks.forEach((task) => {
      const parentId = task.parent_temp_id || '';
      const list = tasksByParent.get(parentId) || [];
      list.push(task);
      tasksByParent.set(parentId, list);
    });

    // Reorder top-level tasks
    const reorderedTopLevel = [...topLevelTasks];
    if (resolvedDragIndex === null || resolvedDragIndex === -1 || resolvedDragIndex === dropIndex) {
      setDraggingTaskIndex(null);
      setDraggingTaskId(null);
      return;
    }
    const [draggedTask] = reorderedTopLevel.splice(resolvedDragIndex, 1);
    reorderedTopLevel.splice(dropIndex, 0, draggedTask);

    // Rebuild complete task list with children
    const newTasks: typeof formData.tasks = [];
    reorderedTopLevel.forEach((task, idx) => {
      task.display_order = idx.toString();
      newTasks.push(task);

      // Add children if they exist
      const children = (tasksByParent.get(task.temp_id || '') || []).sort(sortByOrder);
      children.forEach((child, childIdx) => {
        child.display_order = childIdx.toString();
        newTasks.push(child);
      });
    });

    setFormData(prev => ({ ...prev, tasks: newTasks }));
    setDraggingTaskIndex(null);
    setDraggingTaskId(null);
  };

  const handleTaskDragEnd = () => {
    setDraggingTaskIndex(null);
    setDragOverTaskIndex(null);
    setDraggingTaskId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.initial_department_id) {
        setError('Initial Department is required');
        setIsSubmitting(false);
        return;
      }

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
        notes: formData.notes || null,
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
        initial_department_id: formData.initial_department_id,
        category_ids: formData.category_ids || [],
        default_member_ids: formData.default_member_ids || [],
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
          blocks_task_id: task.blocks_task_id || null,
          blocked_by_task_id: task.blocked_by_task_id || null,
          category_ids: task.category_ids || [],
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

            <div className={styles.formGroup}>
              <label htmlFor="notes" className={styles.label}>
                Default Notes
                <span className={styles.hint} style={{ marginLeft: '0.5rem', fontWeight: 'normal' }}>
                  Notes to be copied to projects created from this template
                </span>
              </label>
              <RichTextEditor
                value={formData.notes}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, notes: value }))
                }
                placeholder="Add default notes for projects..."
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

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Default Project Members
                <span className={styles.hint} style={{ marginLeft: '0.5rem', fontWeight: 'normal' }}>
                  Members to add when creating projects from this template
                </span>
              </label>
              {selectedMembers.length > 0 ? (
                <div className={styles.membersList}>
                  {selectedMembers.map(user => {
                    const firstName = (user as any).first_name || user.profiles?.first_name || '';
                    const lastName = (user as any).last_name || user.profiles?.last_name || '';
                    const email = user.profiles?.email || user.email || '';
                    const name = `${firstName} ${lastName}`.trim();
                    const avatarUrl = user.profiles?.avatar_url || (user as any).avatar_url || null;
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
                <p className={styles.hint}>No default members added yet</p>
              )}

              {showAddMember ? (
                <div className={styles.addMemberSection}>
                  <select
                    className={styles.select}
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
                    className={styles.cancelBtn}
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => setShowAddMember(true)}
                >
                  <Plus size={16} /> Add Member
                </button>
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

              <div className={styles.formGroup}>
                <label htmlFor="initial_department_id" className={styles.label}>
                  Initial Department <span className={styles.required}>*</span>
                </label>
                <select
                  id="initial_department_id"
                  name="initial_department_id"
                  value={formData.initial_department_id}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.icon && `${dept.icon} `}{dept.name}
                    </option>
                  ))}
                </select>
                <small className={styles.hint}>
                  Default department to assign when applying this template
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
              <div className={styles.sectionActions}>
                <button
                  type="button"
                  onClick={() => setIsTasksExpanded(prev => !prev)}
                  className={styles.collapseButton}
                >
                  <ChevronDown
                    size={16}
                    className={!isTasksExpanded ? styles.collapseIconCollapsed : ''}
                  />
                  {isTasksExpanded ? 'Collapse' : 'Expand'}
                </button>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className={styles.addButton}
                >
                  <Plus size={16} />
                  Add Task
                </button>
              </div>
            </div>

            {!isTasksExpanded ? null : formData.tasks.length === 0 ? (
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
                    const isCollapsed = collapsedTaskCards[task.temp_id || ''] ?? false;
                    const areSubtasksCollapsed = collapsedSubtasks[task.temp_id || ''] ?? false;
                    const isDragging = draggingTaskIndex === index;
                    const isDragOver = dragOverTaskIndex === index && draggingTaskIndex !== index;
                    return (
                      <div
                        key={task.temp_id || `task-${index}`}
                        className={`${styles.taskCard} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                        onDragOver={(e) => handleTaskDragOver(e, index)}
                        onDragLeave={handleTaskDragLeave}
                        onDrop={(e) => handleTaskDrop(e, index)}
                        onDragEnd={handleTaskDragEnd}
                      >
                        <div className={styles.taskHeader}>
                          <div className={styles.taskHeaderLeft}>
                            <button
                              type="button"
                              className={styles.dragHandle}
                              draggable
                              data-task-id={task.temp_id || ''}
                              onDragStart={(e) => handleTaskDragStart(e, index)}
                              onDragEnd={handleTaskDragEnd}
                              aria-label="Reorder task"
                            >
                              <GripVertical size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleTaskCollapse(task.temp_id || '')}
                              className={styles.taskCollapseButton}
                              aria-label={isCollapsed ? 'Expand task' : 'Collapse task'}
                            >
                              <ChevronDown
                                size={16}
                                className={isCollapsed ? styles.collapseIconCollapsed : ''}
                              />
                            </button>
                            <span className={styles.taskNumber}>
                              {task.title?.trim() || 'Untitled Task'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.temp_id || '')}
                            className={styles.removeButton}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {!isCollapsed && (
                          <div className={styles.taskBody}>
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

                            <div className={styles.formGroup}>
                              <label className={styles.label}>Task Categories</label>
                              {isFetchingCategories ? (
                                <p className={styles.hint}>Loading categories...</p>
                              ) : (
                                <div className={styles.categoryMultiSelect}>
                                  {(() => {
                                    // Filter task categories to only show those selected for the project
                                    const projectCategoryIds = formData.category_ids || [];
                                    const filteredCategories = availableCategories.filter(cat =>
                                      projectCategoryIds.includes(cat.id)
                                    );

                                    if (projectCategoryIds.length === 0) {
                                      return (
                                        <p className={styles.hint}>
                                          Please select project categories first to assign them to tasks.
                                        </p>
                                      );
                                    }

                                    if (filteredCategories.length === 0) {
                                      return (
                                        <p className={styles.hint}>
                                          No categories available from selected project categories.
                                        </p>
                                      );
                                    }

                                    return filteredCategories.map((category) => {
                                      const isSelected = task.category_ids?.includes(category.id) || false;
                                      return (
                                        <button
                                          key={category.id}
                                          type="button"
                                          className={`${styles.categoryOption} ${isSelected ? styles.selected : ''}`}
                                          onClick={() => {
                                            const currentCategories = task.category_ids || [];
                                            const newCategories = isSelected
                                              ? currentCategories.filter((id) => id !== category.id)
                                              : [...currentCategories, category.id];
                                            setFormData((prev) => ({
                                              ...prev,
                                              tasks: prev.tasks.map((t) =>
                                                t.temp_id === task.temp_id
                                                  ? { ...t, category_ids: newCategories }
                                                  : t
                                              ),
                                            }));
                                          }}
                                        >
                                          <CategoryBadge category={category} />
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>

                            <div className={styles.formRow}>
                              <div className={styles.formGroup}>
                                <label className={styles.label}>This Task Blocks</label>
                                <select
                                  value={task.blocks_task_id || ''}
                                  onChange={(e) =>
                                    handleTaskChange(task.temp_id || '', 'blocks_task_id', e.target.value || null)
                                  }
                                  className={styles.select}
                                >
                                  <option value="">None</option>
                                  {formData.tasks
                                    .filter((t) => t.temp_id !== task.temp_id && !t.parent_temp_id)
                                    .map((t) => (
                                      <option key={t.temp_id} value={t.temp_id}>
                                        {t.title || 'Untitled Task'}
                                      </option>
                                    ))}
                                </select>
                                <small className={styles.hint}>
                                  Select a task that cannot start until this task is complete
                                </small>
                              </div>

                              <div className={styles.formGroup}>
                                <label className={styles.label}>This Task Is Blocked By</label>
                                <select
                                  value={task.blocked_by_task_id || ''}
                                  onChange={(e) =>
                                    handleTaskChange(task.temp_id || '', 'blocked_by_task_id', e.target.value || null)
                                  }
                                  className={styles.select}
                                >
                                  <option value="">None</option>
                                  {formData.tasks
                                    .filter((t) => t.temp_id !== task.temp_id && !t.parent_temp_id)
                                    .map((t) => (
                                      <option key={t.temp_id} value={t.temp_id}>
                                        {t.title || 'Untitled Task'}
                                      </option>
                                    ))}
                                </select>
                                <small className={styles.hint}>
                                  Select a task that must be complete before this task can start
                                </small>
                              </div>
                            </div>

                            <div className={styles.subtaskActions}>
                              <button
                                type="button"
                                className={styles.addSubtaskButton}
                                onClick={() => handleAddSubtask(task.temp_id || '')}
                              >
                                <Plus size={14} />
                                Add Subtask
                              </button>
                              {subTasks.length > 0 && (
                                <button
                                  type="button"
                                  className={styles.collapseButton}
                                  onClick={() => toggleSubtasksCollapse(task.temp_id || '')}
                                >
                                  <ChevronDown
                                    size={14}
                                    className={areSubtasksCollapsed ? styles.collapseIconCollapsed : ''}
                                  />
                                  {areSubtasksCollapsed ? 'Show Subtasks' : 'Hide Subtasks'}
                                </button>
                              )}
                            </div>

                            {subTasks.length > 0 && !areSubtasksCollapsed && (
                              <div className={styles.subtasksList}>
                                {subTasks.map((subtask, subIndex) => {
                                  const isSubtaskCollapsed = collapsedSubtaskCards[subtask.temp_id || ''] ?? false;
                                  return (
                                    <div key={subtask.temp_id || `subtask-${index}-${subIndex}`} className={styles.subtaskCard}>
                                      <div className={styles.taskHeader}>
                                        <div className={styles.taskHeaderLeft}>
                                        <button
                                          type="button"
                                          onClick={() => toggleSubtaskCollapse(subtask.temp_id || '')}
                                          className={styles.taskCollapseButton}
                                          aria-label={isSubtaskCollapsed ? 'Expand subtask' : 'Collapse subtask'}
                                          >
                                          <ChevronDown
                                            size={16}
                                            className={isSubtaskCollapsed ? styles.collapseIconCollapsed : ''}
                                          />
                                        </button>
                                        <span className={styles.taskNumber}>
                                          {subtask.title?.trim() || 'Untitled Subtask'}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTask(subtask.temp_id || '')}
                                        className={styles.removeButton}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>

                                      {!isSubtaskCollapsed && (
                                        <div className={styles.taskBody}>
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

                                          <div className={styles.formGroup}>
                                            <label className={styles.label}>Task Categories</label>
                                            {isFetchingCategories ? (
                                              <p className={styles.hint}>Loading categories...</p>
                                            ) : (
                                              <div className={styles.categoryMultiSelect}>
                                                {(() => {
                                                  // Filter task categories to only show those selected for the project
                                                  const projectCategoryIds = formData.category_ids || [];
                                                  const filteredCategories = availableCategories.filter(cat =>
                                                    projectCategoryIds.includes(cat.id)
                                                  );

                                                  if (projectCategoryIds.length === 0) {
                                                    return (
                                                      <p className={styles.hint}>
                                                        Please select project categories first to assign them to tasks.
                                                      </p>
                                                    );
                                                  }

                                                  if (filteredCategories.length === 0) {
                                                    return (
                                                      <p className={styles.hint}>
                                                        No categories available from selected project categories.
                                                      </p>
                                                    );
                                                  }

                                                  return filteredCategories.map((category) => {
                                                    const isSelected = subtask.category_ids?.includes(category.id) || false;
                                                    return (
                                                      <button
                                                        key={category.id}
                                                        type="button"
                                                        className={`${styles.categoryOption} ${isSelected ? styles.selected : ''}`}
                                                        onClick={() => {
                                                          const currentCategories = subtask.category_ids || [];
                                                          const newCategories = isSelected
                                                            ? currentCategories.filter((id) => id !== category.id)
                                                            : [...currentCategories, category.id];
                                                          setFormData((prev) => ({
                                                            ...prev,
                                                            tasks: prev.tasks.map((t) =>
                                                              t.temp_id === subtask.temp_id
                                                                ? { ...t, category_ids: newCategories }
                                                                : t
                                                            ),
                                                          }));
                                                        }}
                                                      >
                                                        <CategoryBadge category={category} />
                                                      </button>
                                                    );
                                                  });
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
            {isTasksExpanded && (
              <div className={styles.taskListFooter}>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className={styles.addButton}
                >
                  <Plus size={16} />
                  Add Task
                </button>
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
