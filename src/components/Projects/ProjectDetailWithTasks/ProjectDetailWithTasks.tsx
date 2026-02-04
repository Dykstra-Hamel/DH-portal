'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, Check, ChevronDown, Download, FileText, Pencil, Trash2, X } from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { Toast } from '@/components/Common/Toast';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import { Project, ProjectAttachment, ProjectComment, ProjectDepartment, ProjectTask, User as ProjectUser, priorityOptions, statusOptions } from '@/types/project';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useUser } from '@/hooks/useUser';
import { useStarredItems } from '@/hooks/useStarredItems';
import { adminAPI } from '@/lib/api-client';
import { parseDateString } from '@/lib/date-utils';
import { usePageActions } from '@/contexts/PageActionsContext';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import ProjectTaskList from '../ProjectTaskList/ProjectTaskList';
import ProjectTaskForm from '../ProjectTaskForm/ProjectTaskForm';
import ProjectTaskDetail from '../ProjectTaskDetail/ProjectTaskDetail';
import ApplyTemplateModal from '../ApplyTemplateModal/ApplyTemplateModal';
import headerStyles from '@/components/Layout/GlobalLowerHeader/GlobalLowerHeader.module.scss';
import styles from './ProjectDetailWithTasks.module.scss';

interface ProjectDetailWithTasksProps {
  project: Project;
  user: User;
  onProjectUpdate?: () => void;
}

const formatHeaderDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const parsed = parseDateString(value);
  if (!parsed) return 'Not set';
  return parsed.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
};

const getDaysUntilDue = (dueDate: string | null) => {
  if (!dueDate) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = parseDateString(dueDate);
  if (!due) return '';
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return '(Overdue)';
  } else if (diffDays === 0) {
    return '(Due Today)';
  } else if (diffDays === 1) {
    return '(1 Day From Now)';
  } else {
    return `(${diffDays} Days From Now)`;
  }
};

const isDueDateOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = parseDateString(dueDate);
  if (!due) return false;
  due.setHours(0, 0, 0, 0);

  return due < today;
};

export default function ProjectDetailWithTasks({ project, user, onProjectUpdate }: ProjectDetailWithTasksProps) {
  const { isStarred, toggleStar } = useStarredItems();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isHeaderStatusOpen, setIsHeaderStatusOpen] = useState(false);
  const [isHeaderDepartmentOpen, setIsHeaderDepartmentOpen] = useState(false);
  const [isUpdatingHeaderStatus, setIsUpdatingHeaderStatus] = useState(false);
  const [isUpdatingHeaderDepartment, setIsUpdatingHeaderDepartment] = useState(false);
  const headerStatusRef = useRef<HTMLDivElement>(null);
  const headerDepartmentRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [departments, setDepartments] = useState<ProjectDepartment[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [commentAvatarError, setCommentAvatarError] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isDraggingOverCommentComposer, setIsDraggingOverCommentComposer] = useState(false);
  const commentComposerDragCounterRef = React.useRef(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isProjectComplete, setIsProjectComplete] = useState(
    project.status === 'complete'
  );
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const [isTasksCollapsed, setIsTasksCollapsed] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [isEditingProjectDescription, setIsEditingProjectDescription] = useState(false);
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState(
    project.description || ''
  );
  const [isSavingProjectDescription, setIsSavingProjectDescription] = useState(false);
  const [highlightedProjectCommentId, setHighlightedProjectCommentId] = useState<string | null>(null);
  const [highlightedTaskCommentId, setHighlightedTaskCommentId] = useState<string | null>(null);
  const highlightTimeoutRef = React.useRef<number | null>(null);
  const [isApplyTemplateOpen, setIsApplyTemplateOpen] = useState(false);
  const [projectAttachments, setProjectAttachments] = useState<ProjectAttachment[]>(project.attachments || []);
  const [uploadingProjectAttachment, setUploadingProjectAttachment] = useState(false);
  const [isDraggingProjectFile, setIsDraggingProjectFile] = useState(false);
  const projectDragCounterRef = React.useRef(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedCommentRef = React.useRef<string | null>(null);
  const { setPageHeader } = usePageActions();
  const { getAvatarUrl, getDisplayName, getInitials } = useUser();
  const getCommentHtml = React.useCallback(
    (html: string) => {
      if (typeof window === 'undefined') return html;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const mentionNodes = doc.querySelectorAll('span[data-type="mention"]');
        mentionNodes.forEach((node) => {
          const id = node.getAttribute('data-id');
          if (id && id === user.id) {
            node.setAttribute('data-mention-self', 'true');
          } else {
            node.removeAttribute('data-mention-self');
          }
        });
        return doc.body.innerHTML;
      } catch (error) {
        return html;
      }
    },
    [user.id]
  );
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    clearError,
  } = useProjectTasks(project.id);

  // Fetch tasks, users, and departments on mount
  React.useEffect(() => {
    fetchTasks(project.id);
    // Also fetch users for assignment
    adminAPI.getUsers().then(data => setUsers(data || [])).catch(() => {});
    // Fetch departments
    fetch('/api/admin/project-departments')
      .then(res => res.json())
      .then(data => setDepartments(data || []))
      .catch(() => {});
  }, [project.id, fetchTasks]);

  React.useEffect(() => {
    setIsProjectComplete(project.status === 'complete');
  }, [project.status]);

  React.useEffect(() => {
    if (!isEditingProjectDescription) {
      setProjectDescriptionDraft(project.description || '');
    }
  }, [project.description, project.id, isEditingProjectDescription]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerStatusRef.current && !headerStatusRef.current.contains(event.target as Node)) {
        setIsHeaderStatusOpen(false);
      }
      if (headerDepartmentRef.current && !headerDepartmentRef.current.contains(event.target as Node)) {
        setIsHeaderDepartmentOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusLabel = useMemo(() => {
    return statusOptions.find(option => option.value === project.status)?.label || project.status;
  }, [project.status]);

  const departmentLabel = useMemo(() => {
    if (!project.current_department_id) return 'Unassigned';
    const department = departments.find(d => d.id === project.current_department_id);
    return department?.name || 'Unassigned';
  }, [project.current_department_id, departments]);

  const availableTaskCategories = useMemo(() => {
    return (
      project.categories
        ?.map(assignment => assignment.category)
        .filter((cat): cat is NonNullable<typeof cat> => cat !== null && cat !== undefined) || []
    );
  }, [project.categories]);

  const taskGroups = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { groups: [], otherTasks: [] as ProjectTask[] };
    }

    const taskById = new Map<string, ProjectTask>();
    tasks.forEach(task => taskById.set(task.id, task));

    const resolveCategory = (task: ProjectTask) => {
      let current: ProjectTask | undefined = task;
      while (current) {
        const category = current.categories?.[0];
        if (category) return category;
        if (!current.parent_task_id) break;
        current = taskById.get(current.parent_task_id);
      }
      return null;
    };

    const groupsMap = new Map<
      string,
      { title: string; tasks: ProjectTask[] }
    >();
    const otherTasks: ProjectTask[] = [];

    tasks.forEach(task => {
      const category = resolveCategory(task);
      if (!category) {
        otherTasks.push(task);
        return;
      }
      const key = category.id || category.name;
      const existing = groupsMap.get(key);
      if (existing) {
        existing.tasks.push(task);
      } else {
        groupsMap.set(key, { title: category.name, tasks: [task] });
      }
    });

    const groups = Array.from(groupsMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    return { groups, otherTasks };
  }, [tasks]);

  const taskSections = useMemo(() => {
    const sections = taskGroups.groups.map(group => ({
      key: group.title,
      title: group.title,
      tasks: group.tasks,
    }));

    if (taskGroups.otherTasks.length > 0) {
      sections.push({
        key: 'other',
        title: 'Other Tasks',
        tasks: taskGroups.otherTasks,
      });
    }

    return sections;
  }, [taskGroups]);

  const availableStatusOptions = useMemo(() => {
    const hasPrintCategory =
      project.categories?.some(category =>
        category.category?.name === 'Print' || (category as any).name === 'Print'
      ) || false;
    const isBillable = project.is_billable || false;

    return statusOptions.filter(status => {
      if (status.value === 'new') {
        return false;
      }
      if (status.requiresCategory === 'Print' && !hasPrintCategory) {
        return false;
      }
      if (status.requiresBillable && !isBillable) {
        return false;
      }
      return true;
    });
  }, [project.categories, project.is_billable]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [project.id]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCreateTask = useCallback(() => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }, []);

  const handleDeleteProject = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      router.push('/admin/project-management');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  }, [project.id, project.name, router]);

  const handleBackToProjects = useCallback(() => {
    router.push('/admin/project-management');
  }, [router]);

  const updateProjectFields = useCallback(async (updates: Partial<Project> & { assigned_to?: string | null; requested_by?: string | null; current_department_id?: string | null }) => {
    const payload: Record<string, any> = {
      name: updates.name ?? project.name,
      description: updates.description ?? project.description,
      project_type: updates.project_type ?? project.project_type,
      project_subtype: updates.project_subtype ?? project.project_subtype,
      assigned_to: updates.assigned_to ?? project.assigned_to_profile?.id ?? null,
      status: updates.status ?? project.status,
      priority: updates.priority ?? project.priority,
      due_date: updates.due_date ?? project.due_date,
      start_date: updates.start_date ?? project.start_date,
      completion_date: updates.completion_date ?? project.completion_date,
      is_billable: updates.is_billable ?? project.is_billable,
      quoted_price: updates.quoted_price ?? project.quoted_price,
      tags: updates.tags ?? project.tags,
      notes: updates.notes ?? project.notes,
      primary_file_path: updates.primary_file_path ?? project.primary_file_path,
      scope: updates.scope ?? project.scope,
    };

    if (Object.prototype.hasOwnProperty.call(updates, 'requested_by')) {
      payload.requested_by = updates.requested_by ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'current_department_id')) {
      payload.current_department_id = updates.current_department_id ?? null;
    }

    const response = await fetch(`/api/admin/projects/${project.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }
  }, [project]);

  const handleHeaderStatusChange = useCallback(async (status: Project['status']) => {
    if (status === project.status) {
      setIsHeaderStatusOpen(false);
      return;
    }
    setIsUpdatingHeaderStatus(true);
    setIsHeaderStatusOpen(false);
    try {
      await updateProjectFields({
        status,
        completion_date: status === 'complete' ? new Date().toISOString() : null,
      });
      setToastMessage('Project status updated.');
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error updating project status:', error);
      setToastMessage('Failed to update project status.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUpdatingHeaderStatus(false);
    }
  }, [onProjectUpdate, project.status, updateProjectFields]);

  const handleHeaderDepartmentChange = useCallback(async (departmentId: string | null) => {
    if (departmentId === project.current_department_id) {
      setIsHeaderDepartmentOpen(false);
      return;
    }
    setIsUpdatingHeaderDepartment(true);
    setIsHeaderDepartmentOpen(false);
    try {
      await updateProjectFields({ current_department_id: departmentId });
      setToastMessage('Project department updated.');
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error updating project department:', error);
      setToastMessage('Failed to update project department.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUpdatingHeaderDepartment(false);
    }
  }, [onProjectUpdate, project.current_department_id, updateProjectFields]);

  const handleCompleteProject = useCallback(async () => {
    if (isCompletingProject) return;

    setIsCompletingProject(true);
    setShowCompleteConfirmation(false);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          project_type: project.project_type,
          project_subtype: project.project_subtype,
          assigned_to: project.assigned_to_profile?.id || null,
          status: 'complete',
          priority: project.priority,
          due_date: project.due_date,
          start_date: project.start_date,
          completion_date: new Date().toISOString(),
          is_billable: project.is_billable,
          quoted_price: project.quoted_price,
          tags: project.tags,
          notes: project.notes,
          primary_file_path: project.primary_file_path,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project status');
      }

      const incompleteTasks = tasks.filter(task => !task.is_completed);
      await Promise.all(
        incompleteTasks.map(task =>
          updateTask(project.id, task.id, { is_completed: true })
        )
      );

      setIsProjectComplete(true);
      setToastMessage('Project marked complete.');
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error completing project:', error);
      setToastMessage('Failed to mark project complete.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsCompletingProject(false);
    }
  }, [
    isCompletingProject,
    onProjectUpdate,
    project.assigned_to_profile,
    project.description,
    project.due_date,
    project.id,
    project.is_billable,
    project.name,
    project.notes,
    project.primary_file_path,
    project.priority,
    project.project_subtype,
    project.project_type,
    project.quoted_price,
    project.start_date,
    project.tags,
    tasks,
    updateTask,
  ]);

  const handleUncompleteProject = useCallback(async () => {
    if (isCompletingProject) return;

    setIsCompletingProject(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          project_type: project.project_type,
          project_subtype: project.project_subtype,
          assigned_to: project.assigned_to_profile?.id || null,
          status: 'in_progress',
          priority: project.priority,
          due_date: project.due_date,
          start_date: project.start_date,
          completion_date: null,
          is_billable: project.is_billable,
          quoted_price: project.quoted_price,
          tags: project.tags,
          notes: project.notes,
          primary_file_path: project.primary_file_path,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project status');
      }

      setIsProjectComplete(false);
      setToastMessage('Project marked incomplete.');
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error uncompleting project:', error);
      setToastMessage('Failed to mark project incomplete.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsCompletingProject(false);
    }
  }, [
    isCompletingProject,
    onProjectUpdate,
    project.assigned_to_profile,
    project.description,
    project.due_date,
    project.id,
    project.is_billable,
    project.name,
    project.notes,
    project.primary_file_path,
    project.priority,
    project.project_subtype,
    project.project_type,
    project.quoted_price,
    project.start_date,
    project.tags,
  ]);

  const handleToggleProjectComplete = useCallback(() => {
    if (isCompletingProject) return;

    // If already complete, uncomplete the project
    if (isProjectComplete) {
      handleUncompleteProject();
      return;
    }

    // If marking complete, check for incomplete tasks
    const incompleteTasks = tasks.filter(task => !task.is_completed);
    if (incompleteTasks.length > 0) {
      setShowCompleteConfirmation(true);
      return;
    }

    // No incomplete tasks, complete directly
    handleCompleteProject();
  }, [isCompletingProject, isProjectComplete, tasks, handleCompleteProject, handleUncompleteProject]);

  React.useEffect(() => {
    const companyName = project.company?.name;
    const projectName = project.name || 'Project Details';
    const headerTitle = companyName ? `${companyName} - ${projectName}` : projectName;

    const isOverdue = isDueDateOverdue(project.due_date);
    const daysText = getDaysUntilDue(project.due_date);
    const dueDateColor = isOverdue ? '#ef4444' : '#111827';

    setPageHeader({
      title: headerTitle,
      titleLeading: (
        <button
          type="button"
          onClick={handleBackToProjects}
          className={headerStyles.backButton}
          aria-label="Back to project management"
        >
          <ArrowLeft size={16} />
        </button>
      ),
      description: `<span style="margin-right: 12px; color: ${dueDateColor};">Due Date: ${formatHeaderDate(project.due_date)} ${daysText}</span><span class="${headerStyles.updatedText}">Updated: ${formatHeaderDate(project.updated_at)}</span>`,
      customActions: (
        <>
          <div className={headerStyles.controlGroup} ref={headerStatusRef}>
            <label className={headerStyles.controlLabel}>Status:</label>
            <button
              className={headerStyles.controlDropdown}
              onClick={() => setIsHeaderStatusOpen(!isHeaderStatusOpen)}
              type="button"
              disabled={isUpdatingHeaderStatus}
            >
              <span className={headerStyles.controlValue}>{statusLabel}</span>
              <ChevronDown
                size={16}
                className={`${headerStyles.chevron} ${isHeaderStatusOpen ? headerStyles.open : ''}`}
              />
            </button>
            {isHeaderStatusOpen && (
              <div className={headerStyles.dropdownMenu}>
                {availableStatusOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${headerStyles.dropdownOption} ${project.status === option.value ? headerStyles.selected : ''}`}
                    onClick={() => handleHeaderStatusChange(option.value as Project['status'])}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={headerStyles.controlGroup} ref={headerDepartmentRef}>
            <label className={headerStyles.controlLabel}>Department:</label>
            <button
              className={headerStyles.controlDropdown}
              onClick={() => setIsHeaderDepartmentOpen(!isHeaderDepartmentOpen)}
              type="button"
              disabled={isUpdatingHeaderDepartment}
            >
              <span className={headerStyles.controlValue}>{departmentLabel}</span>
              <ChevronDown
                size={16}
                className={`${headerStyles.chevron} ${isHeaderDepartmentOpen ? headerStyles.open : ''}`}
              />
            </button>
            {isHeaderDepartmentOpen && (
              <div className={headerStyles.dropdownMenu}>
                <button
                  className={`${headerStyles.dropdownOption} ${!project.current_department_id ? headerStyles.selected : ''}`}
                  onClick={() => handleHeaderDepartmentChange(null)}
                  type="button"
                >
                  Unassigned
                </button>
                {departments.map(department => (
                  <button
                    key={department.id}
                    className={`${headerStyles.dropdownOption} ${project.current_department_id === department.id ? headerStyles.selected : ''}`}
                    onClick={() => handleHeaderDepartmentChange(department.id)}
                    type="button"
                  >
                    {department.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {project.status === 'new' && (
            <button
              className={styles.templateButton}
              onClick={() => setIsApplyTemplateOpen(true)}
              type="button"
              aria-label="Use Template"
            >
              <FileText size={16} />
              Use Template
            </button>
          )}
          <button
            className={`${headerStyles.addLeadButton} ${headerStyles.deleteButton} ${headerStyles.iconOnlyButton}`}
            onClick={handleDeleteProject}
            type="button"
            aria-label="Delete project"
          >
            <Trash2 size={18} />
          </button>
        </>
      ),
    });
  }, [
    project,
    handleBackToProjects,
    handleDeleteProject,
    availableStatusOptions,
    handleHeaderStatusChange,
    handleHeaderDepartmentChange,
    isHeaderStatusOpen,
    isHeaderDepartmentOpen,
    isUpdatingHeaderStatus,
    isUpdatingHeaderDepartment,
    setPageHeader,
    statusLabel,
    departmentLabel,
    departments,
  ]);

  React.useEffect(() => {
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const openTaskDetailById = React.useCallback((taskId: string) => {
    fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`)
      .then(res => res.json())
      .then(fullTask => {
        setSelectedTask(fullTask);
        setIsTaskDetailOpen(true);
      })
      .catch(err => console.error('Error fetching task details:', err));
  }, [project.id]);

  const handleTaskClick = (task: ProjectTask) => {
    openTaskDetailById(task.id);
  };

  React.useEffect(() => {
    const commentId = searchParams.get('commentId');
    const taskId = searchParams.get('taskId');
    if (!commentId) return;

    const key = `${taskId || 'project'}:${commentId}`;
    if (processedCommentRef.current === key) {
      return;
    }

    if (taskId) {
      setHighlightedTaskCommentId(commentId);
      if (!selectedTask || selectedTask.id !== taskId) {
        openTaskDetailById(taskId);
      }
    } else {
      setIsCommentsCollapsed(false);
      setHighlightedProjectCommentId(commentId);
    }

    processedCommentRef.current = key;
  }, [openTaskDetailById, searchParams, selectedTask]);

  React.useEffect(() => {
    if (!highlightedProjectCommentId) return;
    const element = document.getElementById(`project-comment-${highlightedProjectCommentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedProjectCommentId, comments.length]);

  React.useEffect(() => {
    if (!highlightedProjectCommentId && !highlightedTaskCommentId) {
      return;
    }

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedProjectCommentId(null);
      setHighlightedTaskCommentId(null);
    }, 2400);

    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [highlightedProjectCommentId, highlightedTaskCommentId]);

  const handleTaskFormSubmit = async (formData: any) => {
    if (editingTask) {
      await updateTask(project.id, editingTask.id, formData);
    } else {
      await createTask(project.id, formData);
    }
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = useCallback(async (taskId?: string) => {
    const idToDelete = taskId || selectedTask?.id;
    if (!idToDelete) return;

    await deleteTask(project.id, idToDelete);
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  }, [deleteTask, project.id, selectedTask]);

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    await updateTask(project.id, taskId, { is_completed: isCompleted });
    onProjectUpdate?.();
  };

  // Handler for inline task updates (title, due_date, etc.)
  const handleUpdateTaskInline = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
    await updateTask(project.id, taskId, updates);
    onProjectUpdate?.();
  }, [project.id, updateTask, onProjectUpdate]);

  // Handler for deleting a task from the list
  const handleDeleteTaskFromList = useCallback(async (taskId: string) => {
    await deleteTask(project.id, taskId);
  }, [project.id, deleteTask]);

  // Handler for reordering tasks
  const handleReorderTasks = useCallback(async (taskIds: string[]) => {
    try {
      // Update display_order for each task
      const updates = taskIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      // Update each task's display_order
      await Promise.all(
        updates.map(({ id, display_order }) =>
          updateTask(project.id, id, { display_order })
        )
      );
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  }, [project.id, updateTask]);

  const handleAddComment = async (comment: string) => {
    if (!selectedTask) return;

    const response = await fetch(
      `/api/admin/projects/${project.id}/tasks/${selectedTask.id}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    // Refresh task to get new comment
    const updatedTask = await fetch(
      `/api/admin/projects/${project.id}/tasks/${selectedTask.id}`
    ).then(res => res.json());

    setSelectedTask(updatedTask);
    onProjectUpdate?.();
  };

  const handleUpdateProgress = async (progress: number) => {
    if (!selectedTask) return;

    await updateTask(project.id, selectedTask.id, {
      progress_percentage: progress.toString(),
    });

    // Update local state
    setSelectedTask({
      ...selectedTask,
      progress_percentage: progress,
    });
  };

  const handleCreateSubtask = () => {
    // Implementation would set parent_task_id in form
    handleCreateTask();
  };

  const handleProjectUpdate = () => {
    // Trigger refresh of project data if callback provided
    if (onProjectUpdate) {
      onProjectUpdate();
    }
  };

  // Get only top-level tasks for parent task selector
  const parentTasks = tasks.filter(t => !t.parent_task_id);


  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Check if rich text HTML has actual content (not just empty tags)
  const isRichTextEmpty = (html: string) => {
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return textContent.length === 0;
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isRichTextEmpty(newComment) && pendingAttachments.length === 0) return;

    setIsSubmittingComment(true);
    try {
      // First create the comment
      const response = await fetch(`/api/admin/projects/${project.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const comment = await response.json();

      // If there are attachments, upload them
      if (pendingAttachments.length > 0) {
        const formData = new FormData();
        pendingAttachments.forEach(file => formData.append('files', file));

        const attachmentResponse = await fetch(
          `/api/admin/projects/${project.id}/comments/${comment.id}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (attachmentResponse.ok) {
          const uploadedAttachments = await attachmentResponse.json();
          comment.attachments = uploadedAttachments;
        }
      }

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setPendingAttachments([]);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error posting comment:', error);
      setToastMessage('Failed to post comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setPendingAttachments(prev => [...prev, ...newFiles]);
      event.target.value = ''; // Reset so same file can be selected again
    }
  };

  const removeCommentAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Comment composer drag and drop handlers
  const handleCommentComposerDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commentComposerDragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOverCommentComposer(true);
    }
  }, []);

  const handleCommentComposerDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commentComposerDragCounterRef.current--;
    if (commentComposerDragCounterRef.current === 0) {
      setIsDraggingOverCommentComposer(false);
    }
  }, []);

  const handleCommentComposerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleCommentComposerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commentComposerDragCounterRef.current = 0;
    setIsDraggingOverCommentComposer(false);

    // Allowed file types for attachments
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(file => allowedTypes.includes(file.type));

      if (validFiles.length > 0) {
        setPendingAttachments(prev => [...prev, ...validFiles]);
      }

      if (validFiles.length < droppedFiles.length) {
        setToastMessage('Some files were not added (unsupported file type)');
        setToastType('error');
        setShowToast(true);
      }
    }
  }, []);

  const rawAvatarUrl = getAvatarUrl();
  const commentAvatarUrl =
    commentAvatarError || !rawAvatarUrl || rawAvatarUrl === 'null' || rawAvatarUrl === 'undefined'
      ? null
      : rawAvatarUrl;

  // Convert users to mention format for RichTextEditor
  const mentionUsers = useMemo(() => {
    const converted = users.map(u => ({
      id: u.profiles?.id || u.id,
      first_name: u.profiles?.first_name || null,
      last_name: u.profiles?.last_name || null,
      email: u.profiles?.email || u.email || null,
      avatar_url: u.profiles?.avatar_url || null,
    }));
    return converted;
  }, [users]);

  const handleSaveProjectDescription = async () => {
    if (isSavingProjectDescription) return;

    setIsSavingProjectDescription(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: project.name,
          description: projectDescriptionDraft,
          project_type: project.project_type,
          project_subtype: project.project_subtype,
          assigned_to: project.assigned_to_profile?.id || null,
          status: project.status,
          priority: project.priority,
          due_date: project.due_date,
          start_date: project.start_date,
          completion_date: project.completion_date,
          is_billable: project.is_billable,
          quoted_price: project.quoted_price,
          tags: project.tags,
          notes: project.notes,
          primary_file_path: project.primary_file_path,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project description');
      }

      setIsEditingProjectDescription(false);
      setToastMessage('Project description updated.');
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error updating project description:', error);
      setToastMessage('Failed to update project description.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSavingProjectDescription(false);
    }
  };

  const handleCancelProjectDescription = () => {
    setProjectDescriptionDraft(project.description || '');
    setIsEditingProjectDescription(false);
  };

  const handleStartEditComment = useCallback((comment: ProjectComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
  }, []);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleUpdateComment = useCallback(async () => {
    if (!editingCommentId) return;
    if (isRichTextEmpty(editingCommentText)) {
      setToastMessage('Comment cannot be empty.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsUpdatingComment(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/comments/${editingCommentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editingCommentText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const updatedComment = await response.json();
      setComments(prev =>
        prev.map(comment =>
          comment.id === updatedComment.id ? updatedComment : comment
        )
      );
      setEditingCommentId(null);
      setEditingCommentText('');
      setToastMessage('Comment updated.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating comment:', error);
      setToastMessage('Failed to update comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUpdatingComment(false);
    }
  }, [editingCommentId, editingCommentText, project.id]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!confirm('Delete this comment? This action cannot be undone.')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setComments(prev => prev.filter(comment => comment.id !== commentId));
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentText('');
      }
      setToastMessage('Comment deleted.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setToastMessage('Failed to delete comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setDeletingCommentId(null);
    }
  }, [editingCommentId, project.id]);

  // Project Attachments Handlers
  const canEditProject = useMemo(() => {
    const profile = user as any;
    return (
      profile?.is_admin ||
      project.requested_by_profile?.id === user.id ||
      project.assigned_to_profile?.id === user.id ||
      project.members?.some((m: { user_id: string }) => m.user_id === user.id)
    );
  }, [user, project]);


  const handleProjectFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingProjectAttachment(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/admin/projects/${project.id}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = 'Failed to upload attachment';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
      }

      // Fetch fresh attachments from server
      const attachmentsResponse = await fetch(`/api/admin/projects/${project.id}/attachments`);
      if (attachmentsResponse.ok) {
        const { attachments } = await attachmentsResponse.json();
        setProjectAttachments(attachments);
      }

      setToastMessage(`${files.length} file(s) uploaded successfully.`);
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error uploading attachment:', error);
      setToastMessage(error instanceof Error ? error.message : 'Failed to upload file(s).');
      setToastType('error');
      setShowToast(true);
    } finally {
      setUploadingProjectAttachment(false);
      // Reset file input
      e.target.value = '';
    }
  }, [project.id, onProjectUpdate]);

  const handleDeleteProjectAttachment = useCallback(async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const response = await fetch(
        `/api/admin/projects/${project.id}/attachments?id=${attachmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      setProjectAttachments(prev => prev.filter(a => a.id !== attachmentId));
      setToastMessage('Attachment deleted.');
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setToastMessage('Failed to delete attachment.');
      setToastType('error');
      setShowToast(true);
    }
  }, [project.id, onProjectUpdate]);

  const handleProjectDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    projectDragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingProjectFile(true);
    }
  }, []);

  const handleProjectDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    projectDragCounterRef.current--;
    if (projectDragCounterRef.current === 0) {
      setIsDraggingProjectFile(false);
    }
  }, []);

  const handleProjectDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleProjectDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    projectDragCounterRef.current = 0;
    setIsDraggingProjectFile(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    setUploadingProjectAttachment(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/admin/projects/${project.id}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = 'Failed to upload attachment';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
      }

      // Fetch fresh attachments from server
      const attachmentsResponse = await fetch(`/api/admin/projects/${project.id}/attachments`);
      if (attachmentsResponse.ok) {
        const { attachments } = await attachmentsResponse.json();
        setProjectAttachments(attachments);
      }

      setToastMessage(`${files.length} file(s) uploaded successfully.`);
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error uploading attachment:', error);
      setToastMessage(error instanceof Error ? error.message : 'Failed to upload file(s).');
      setToastType('error');
      setShowToast(true);
    } finally {
      setUploadingProjectAttachment(false);
    }
  }, [project.id, onProjectUpdate]);

  return (
    <div className={styles.container}>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />

      {/* Confirmation Modal */}
      {showCompleteConfirmation && (
        <div className={styles.confirmationModalOverlay}>
          <div className={styles.confirmationModal}>
            <h3 className={styles.confirmationModalTitle}>Mark Project Complete?</h3>
            <p className={styles.confirmationModalMessage}>
              Marking this project complete will auto-complete all {tasks.filter(t => !t.is_completed).length} remaining task{tasks.filter(t => !t.is_completed).length !== 1 ? 's' : ''}. Continue?
            </p>
            <div className={styles.confirmationModalActions}>
              <button
                type="button"
                className={styles.confirmationModalCancel}
                onClick={() => setShowCompleteConfirmation(false)}
              >
                Back to Project
              </button>
              <button
                type="button"
                className={styles.confirmationModalConfirm}
                onClick={handleCompleteProject}
                disabled={isCompletingProject}
              >
                {isCompletingProject ? 'Completing...' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        <div
          className={styles.projectContentWrapper}
          data-sidebar-expanded={isSidebarExpanded}
        >
          <div className={styles.contentLeft}>
            <div className={styles.projectSummary}>
              <div className={styles.projectHeader}>
                <div className={styles.projectHeaderLeft}>
                  <button
                    type="button"
                    className={`${styles.projectCompleteToggle} ${isProjectComplete ? styles.projectCompleteToggleDone : ''}`}
                    onClick={handleToggleProjectComplete}
                    disabled={isCompletingProject}
                    aria-label={isProjectComplete ? 'Mark project incomplete' : 'Mark project complete'}
                    title={isProjectComplete ? 'Mark project incomplete' : 'Mark project complete'}
                  >
                    {isProjectComplete && <Check size={14} />}
                  </button>
                  <h1 className={styles.projectShortcode}>
                    {project.shortcode || 'No Shortcode'}
                  </h1>
                </div>
                <div className={styles.projectHeaderRight}>
                  <StarButton
                    isStarred={isStarred('project', project.id)}
                    onToggle={() => toggleStar('project', project.id)}
                    size="large"
                  />
                </div>
              </div>
              {isEditingProjectDescription ? (
                <div className={styles.projectDescriptionEditor}>
                  <RichTextEditor
                    value={projectDescriptionDraft}
                    onChange={setProjectDescriptionDraft}
                    placeholder="Add a project description..."
                    className={styles.projectDescriptionRichEditor}
                  />
                  <div className={styles.projectDescriptionActions}>
                    <button
                      type="button"
                      className={styles.projectDescriptionSave}
                      onClick={handleSaveProjectDescription}
                      disabled={isSavingProjectDescription}
                    >
                      {isSavingProjectDescription ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className={styles.projectDescriptionCancel}
                      onClick={handleCancelProjectDescription}
                      disabled={isSavingProjectDescription}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.projectDescriptionDisplay}
                  onClick={() => setIsEditingProjectDescription(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setIsEditingProjectDescription(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className={styles.projectDescriptionEditIcon} aria-hidden="true">
                    <Pencil size={14} />
                  </span>
                  {projectDescriptionDraft ? (
                    <div
                      className={`${styles.projectDescription} ${styles.projectDescriptionContent}`}
                      dangerouslySetInnerHTML={{ __html: projectDescriptionDraft }}
                    />
                  ) : (
                    <div className={`${styles.projectDescription} ${styles.projectDescriptionPlaceholder}`}>
                      Add a project description...
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className={styles.error}>
                <span>{error}</span>
                <button onClick={clearError}>×</button>
              </div>
            )}

            {/* Project Attachments Section */}
            <div
              className={styles.projectAttachments}
              onDragEnter={handleProjectDragEnter}
              onDragLeave={handleProjectDragLeave}
              onDragOver={handleProjectDragOver}
              onDrop={handleProjectDrop}
            >
              {canEditProject && (
                <input
                  type="file"
                  multiple
                  onChange={handleProjectFileSelect}
                  disabled={uploadingProjectAttachment}
                  style={{ display: 'none' }}
                  id="project-file-input"
                />
              )}

              {(projectAttachments.length > 0 || canEditProject) && (
                <div className={styles.attachmentsGrid}>
                  {projectAttachments.map((attachment) => {
                    const isImage = attachment.mime_type.startsWith('image/');

                    return (
                      <div key={attachment.id} className={styles.attachmentItem}>
                        {isImage ? (
                          <div className={styles.imageWrapper}>
                            <img
                              src={`/api/admin/projects/${project.id}/attachments/${attachment.id}/url`}
                              alt={attachment.file_name}
                              loading="lazy"
                            />
                            {canEditProject && (
                              <button
                                className={styles.deleteImageButton}
                                onClick={() => handleDeleteProjectAttachment(attachment.id)}
                                aria-label="Delete attachment"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <a
                            href={`/api/admin/projects/${project.id}/attachments/${attachment.id}/url`}
                            download={attachment.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.documentWrapper}
                          >
                            <div className={styles.documentIcon}>
                              <FileText size={48} />
                            </div>
                            {canEditProject && (
                              <button
                                className={styles.deleteImageButton}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteProjectAttachment(attachment.id);
                                }}
                                aria-label="Delete attachment"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </a>
                        )}
                        <span className={styles.attachmentFileName}>{attachment.file_name}</span>
                      </div>
                    );
                  })}

                  {canEditProject && (
                    <div
                      className={`${styles.attachmentItem} ${styles.addNewBox} ${isDraggingProjectFile ? styles.addNewBoxActive : ''}`}
                      onClick={() => document.getElementById('project-file-input')?.click()}
                    >
                      <div className={styles.addNewContent}>
                        {uploadingProjectAttachment ? (
                          <span className={styles.addNewText}>Uploading...</span>
                        ) : (
                          <>
                            <span className={styles.addNewPlus}>+</span>
                            <span className={styles.addNewText}>Add File</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.sectionHeader}>
              <button
                type="button"
                className={styles.sectionToggle}
                onClick={() => setIsTasksCollapsed(prev => !prev)}
                aria-label={isTasksCollapsed ? 'Expand tasks' : 'Collapse tasks'}
              >
                <ChevronDown
                  size={18}
                  className={isTasksCollapsed ? styles.sectionChevronCollapsed : undefined}
                />
              </button>
              <h2 className={styles.sectionTitle}>
                Tasks
              </h2>
            </div>

            {!isTasksCollapsed && (
              <div className={styles.taskCategoryList}>
                {taskSections.length === 0 ? (
                  <ProjectTaskList
                    tasks={[]}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    onUpdateTask={handleUpdateTaskInline}
                    onDeleteTask={handleDeleteTaskFromList}
                    onReorderTasks={handleReorderTasks}
                    onToggleStar={(taskId) => toggleStar('task', taskId)}
                    isStarred={(taskId) => isStarred('task', taskId)}
                    isLoading={isLoading}
                    showHeader={false}
                    onAddTask={handleCreateTask}
                  />
                ) : (
                  taskSections.map((section, index) => (
                    <div key={section.key} className={styles.taskCategorySection}>
                      <div className={styles.taskCategoryHeader}>
                        <h3 className={styles.taskCategoryTitle}>{section.title}</h3>
                      </div>
                      <ProjectTaskList
                        tasks={section.tasks}
                        onTaskClick={handleTaskClick}
                        onToggleComplete={handleToggleComplete}
                        onUpdateTask={handleUpdateTaskInline}
                        onDeleteTask={handleDeleteTaskFromList}
                        onReorderTasks={handleReorderTasks}
                        onToggleStar={(taskId) => toggleStar('task', taskId)}
                        isStarred={(taskId) => isStarred('task', taskId)}
                        isLoading={isLoading}
                        showHeader={false}
                        onAddTask={
                          index === taskSections.length - 1 ? handleCreateTask : undefined
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            <div className={styles.commentsSection}>
              <div className={styles.sectionHeader}>
                <button
                  type="button"
                  className={styles.sectionToggle}
                  onClick={() => setIsCommentsCollapsed(prev => !prev)}
                  aria-label={isCommentsCollapsed ? 'Expand comments' : 'Collapse comments'}
                >
                  <ChevronDown
                    size={18}
                    className={isCommentsCollapsed ? styles.sectionChevronCollapsed : undefined}
                  />
                </button>
                <h3 className={styles.sectionTitle}>
                  Comments <span className={styles.sectionCount}>({comments.length})</span>
                </h3>
              </div>
              {!isCommentsCollapsed && (
                <>
                  {comments.length > 0 ? (
                    <div className={styles.commentsList}>
                      {comments.map(comment => {
                        const authorName = comment.user_profile
                          ? `${comment.user_profile.first_name || ''} ${comment.user_profile.last_name || ''}`.trim() || comment.user_profile.email
                          : 'Unknown';
                        const isCommentOwner = comment.user_id === user.id;
                        const isEditing = editingCommentId === comment.id;
                        const isEdited = Boolean(
                          comment.updated_at &&
                            new Date(comment.updated_at).getTime() !==
                              new Date(comment.created_at).getTime()
                        );
                        return (
                          <div
                            key={comment.id}
                            id={`project-comment-${comment.id}`}
                            className={`${styles.commentItem} ${
                              highlightedProjectCommentId === comment.id
                                ? styles.commentHighlight
                                : ''
                            }`}
                          >
                            <div className={styles.commentMeta}>
                              <MiniAvatar
                                firstName={comment.user_profile?.first_name || undefined}
                                lastName={comment.user_profile?.last_name || undefined}
                                email={comment.user_profile?.email || ''}
                                avatarUrl={comment.user_profile?.avatar_url || null}
                                size="small"
                                showTooltip={true}
                                className={styles.commentAvatarMini}
                              />
                              <div className={styles.commentMetaDetails}>
                                <span className={styles.commentAuthor}>{authorName}</span>
                                <span className={styles.commentDate}>
                                  {formatCommentDate(comment.created_at)}
                                  {isEdited && (
                                    <span className={styles.commentEdited}>edited</span>
                                  )}
                                </span>
                              </div>
                              {isCommentOwner && (
                                <div className={styles.commentActions}>
                                  {isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className={styles.commentActionButton}
                                        onClick={handleUpdateComment}
                                        aria-label="Save comment"
                                        disabled={isUpdatingComment || isRichTextEmpty(editingCommentText)}
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.commentActionButton}
                                        onClick={handleCancelEditComment}
                                        aria-label="Cancel edit"
                                        disabled={isUpdatingComment}
                                      >
                                        <X size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className={styles.commentActionButton}
                                        onClick={() => handleStartEditComment(comment)}
                                        aria-label="Edit comment"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className={`${styles.commentActionButton} ${styles.commentActionDanger}`}
                                        onClick={() => handleDeleteComment(comment.id)}
                                        aria-label="Delete comment"
                                        disabled={deletingCommentId === comment.id}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <RichTextEditor
                                value={editingCommentText}
                                onChange={setEditingCommentText}
                                placeholder="Edit comment..."
                                className={styles.commentEditRichEditor}
                                compact
                                mentionUsers={mentionUsers}
                              />
                            ) : (
                              <>
                                <div
                                  className={styles.commentText}
                                  dangerouslySetInnerHTML={{ __html: getCommentHtml(comment.comment) }}
                                />
                                {comment.attachments && comment.attachments.length > 0 && (() => {
                                  const imageAttachments = comment.attachments.filter(
                                    (attachment: { mime_type?: string | null }) =>
                                      attachment.mime_type?.startsWith('image/')
                                  );
                                  const fileAttachments = comment.attachments.filter(
                                    (attachment: { mime_type?: string | null }) =>
                                      !attachment.mime_type?.startsWith('image/')
                                  );

                                  return (
                                    <>
                                      {imageAttachments.length > 0 && (
                                        <div className={styles.commentImageAttachments}>
                                          {imageAttachments.map((attachment: { id: string; url: string; file_name: string }) => (
                                            <a
                                              key={attachment.id}
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={styles.commentImageLink}
                                            >
                                              <img
                                                src={attachment.url}
                                                alt={attachment.file_name}
                                                className={styles.commentImage}
                                              />
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                      {fileAttachments.length > 0 && (
                                        <div className={styles.commentAttachments}>
                                          {fileAttachments.map((attachment: { id: string; url: string; file_name: string; mime_type?: string | null }) => (
                                            <a
                                              key={attachment.id}
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={styles.attachmentCard}
                                            >
                                              <div className={styles.attachmentIcon}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                  <path
                                                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                              </div>
                                              <div className={styles.attachmentInfo}>
                                                <span className={styles.attachmentName}>{attachment.file_name}</span>
                                                {attachment.mime_type === 'application/pdf' && (
                                                  <span className={styles.attachmentBadge}>PDF</span>
                                                )}
                                              </div>
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.commentsEmpty}>No comments yet.</div>
                  )}

                  <form
                    onSubmit={handleSubmitComment}
                    className={`${styles.commentComposer} ${isDraggingOverCommentComposer ? styles.commentComposerDragActive : ''}`}
                    onDragEnter={handleCommentComposerDragEnter}
                    onDragLeave={handleCommentComposerDragLeave}
                    onDragOver={handleCommentComposerDragOver}
                    onDrop={handleCommentComposerDrop}
                  >
                    {commentAvatarUrl ? (
                      <Image
                        src={commentAvatarUrl}
                        alt={getDisplayName()}
                        width={32}
                        height={32}
                        className={styles.commentAvatarImage}
                        onError={() => setCommentAvatarError(true)}
                      />
                    ) : (
                      <div className={styles.commentAvatar}>{getInitials()}</div>
                    )}
                    <div className={styles.commentInputWrapper}>
                      <RichTextEditor
                        value={newComment}
                        onChange={setNewComment}
                        placeholder="Add a comment... Use @ to mention someone"
                        className={styles.commentRichEditor}
                        compact
                        mentionUsers={mentionUsers}
                      />
                      {pendingAttachments.length > 0 && (
                        <div className={styles.pendingAttachments}>
                          {pendingAttachments.map((file, index) => (
                            <div key={`${file.name}-${index}`} className={styles.pendingAttachment}>
                              <span className={styles.pendingAttachmentName}>{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeCommentAttachment(index)}
                                className={styles.removeAttachmentButton}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      ref={commentFileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleCommentFileSelect}
                      className={styles.hiddenFileInput}
                    />
                    <button
                      type="button"
                      className={styles.attachButton}
                      onClick={() => commentFileInputRef.current?.click()}
                      title="Attach file"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path
                          d="M15.75 8.25L9.31 14.69C8.5 15.49 7.41 15.94 6.28 15.94C5.14 15.94 4.05 15.49 3.25 14.69C2.44 13.88 1.99 12.79 1.99 11.66C1.99 10.52 2.44 9.43 3.25 8.62L9.69 2.18C10.22 1.65 10.95 1.35 11.7 1.35C12.46 1.35 13.19 1.65 13.72 2.18C14.26 2.72 14.56 3.45 14.56 4.2C14.56 4.96 14.26 5.69 13.72 6.22L7.28 12.66C7.01 12.93 6.65 13.08 6.27 13.08C5.89 13.08 5.53 12.93 5.26 12.66C4.99 12.39 4.84 12.03 4.84 11.65C4.84 11.27 4.99 10.91 5.26 10.64L11.32 4.58"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="submit"
                      className={styles.commentSubmit}
                      disabled={isSubmittingComment || (isRichTextEmpty(newComment) && pendingAttachments.length === 0)}
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
          <div className={styles.contentRight}>
            <ProjectDetail
              project={project}
              user={user}
              users={users}
              tasks={tasks}
              onProjectUpdate={handleProjectUpdate}
              isSidebarExpanded={isSidebarExpanded}
              setIsSidebarExpanded={setIsSidebarExpanded}
            />
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      <ProjectTaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskFormSubmit}
        editingTask={editingTask}
        users={users}
        projectId={project.id}
        parentTasks={parentTasks}
        projectMembers={project.members}
        projectAssignedTo={project.assigned_to_profile?.id}
        availableCategories={availableTaskCategories}
      />

      {/* Task Detail Sidebar */}
      <ProjectTaskDetail
        task={selectedTask}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={async (taskId, updates) => {
          await updateTask(project.id, taskId, updates);
          // Refresh the task details to show updated data
          const response = await fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`);
          const updatedTask = await response.json();
          setSelectedTask(updatedTask);
          onProjectUpdate?.();
        }}
        onDelete={() => handleDeleteTask()}
        onAddComment={handleAddComment}
        onCreateSubtask={handleCreateSubtask}
        onUpdateProgress={handleUpdateProgress}
        users={users}
        highlightedCommentId={highlightedTaskCommentId}
        onToggleStar={(taskId) => toggleStar('task', taskId)}
        isStarred={(taskId) => isStarred('task', taskId)}
        availableCategories={availableTaskCategories}
        projectMembers={project.members}
        projectAssignedTo={project.assigned_to_profile?.id}
        availableTasks={tasks}
      />

      {/* Apply Template Modal */}
      {isApplyTemplateOpen && (
        <ApplyTemplateModal
          isOpen={isApplyTemplateOpen}
          onClose={() => setIsApplyTemplateOpen(false)}
          projectId={project.id}
          onSuccess={() => {
            setIsApplyTemplateOpen(false);
            fetchTasks(project.id);
            onProjectUpdate?.();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
