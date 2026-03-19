'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { sanitizeFileName } from '@/lib/storage-utils';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, Download, FileText, Pencil, Trash2, X } from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { Toast } from '@/components/Common/Toast';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import { ImageLightbox } from '@/components/Common/ImageLightbox/ImageLightbox';
import { Project, ProjectAttachment, ProjectCategory, ProjectComment, ProjectDepartment, ProjectTask, ProofFeedbackActivity, User as ProjectUser, priorityOptions, statusOptions } from '@/types/project';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useUser } from '@/hooks/useUser';
import { useStarredItems } from '@/hooks/useStarredItems';
import { adminAPI } from '@/lib/api-client';
import { parseDateString } from '@/lib/date-utils';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import ProjectTaskList from '../ProjectTaskList/ProjectTaskList';
import ProjectTaskForm from '../ProjectTaskForm/ProjectTaskForm';
import ProjectTaskDetail from '../ProjectTaskDetail/ProjectTaskDetail';
import ApplyTemplateModal from '../ApplyTemplateModal/ApplyTemplateModal';
import DuplicateProjectModal from '../DuplicateProjectModal/DuplicateProjectModal';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';
import dynamic from 'next/dynamic';
const ProofsTab = dynamic(() => import('../ProofsTab/ProofsTab'), { ssr: false });
const PDFLightbox = dynamic(
  () => import('@/components/Common/PDFLightbox/PDFLightbox').then((mod) => mod.PDFLightbox),
  { ssr: false }
);
import headerStyles from '@/components/Layout/GlobalLowerHeader/GlobalLowerHeader.module.scss';
import styles from './ProjectDetailWithTasks.module.scss';

interface ProjectDetailWithTasksProps {
  project: Project | null;
  projectLoading?: boolean;
  user: User;
  onProjectUpdate?: () => void;
}

const COMMENTS_INITIAL_VISIBLE_COUNT = 10;

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

type UploadProgressState = {
  active: boolean;
  completed: number;
  total: number;
};

const EMPTY_UPLOAD_PROGRESS: UploadProgressState = {
  active: false,
  completed: 0,
  total: 0,
};

export default function ProjectDetailWithTasks({ project, projectLoading = false, user, onProjectUpdate }: ProjectDetailWithTasksProps) {
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
  const [allInternalCategories, setAllInternalCategories] = useState<ProjectCategory[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [proofActivity, setProofActivity] = useState<ProofFeedbackActivity[]>([]);
  const [isInitialTasksLoaded, setIsInitialTasksLoaded] = useState(false);
  const [isInitialCommentsLoaded, setIsInitialCommentsLoaded] = useState(false);
  const [isInitialProofActivityLoaded, setIsInitialProofActivityLoaded] = useState(false);
  const [proofToOpen, setProofToOpen] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [commentAvatarError, setCommentAvatarError] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [projectCommentUploadProgress, setProjectCommentUploadProgress] =
    useState<UploadProgressState>(EMPTY_UPLOAD_PROGRESS);
  const [isDraggingOverCommentComposer, setIsDraggingOverCommentComposer] = useState(false);
  const commentComposerDragCounterRef = React.useRef(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isProjectComplete, setIsProjectComplete] = useState(
    project?.status === 'complete'
  );
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const [isTasksCollapsed, setIsTasksCollapsed] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [showAllCommentsInFeed, setShowAllCommentsInFeed] = useState(false);
  const [isEditingProjectDescription, setIsEditingProjectDescription] = useState(false);
  const [blockedTaskHoverRef, setBlockedTaskHoverRef] = useState<{
    id: string | null;
    title: string | null;
  }>({ id: null, title: null });

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [showDeleteAttachmentModal, setShowDeleteAttachmentModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState(
    project?.description || ''
  );
  const [isSavingProjectDescription, setIsSavingProjectDescription] = useState(false);
  const [highlightedProjectCommentId, setHighlightedProjectCommentId] = useState<string | null>(null);
  const [highlightedTaskCommentId, setHighlightedTaskCommentId] = useState<string | null>(null);
  const highlightTimeoutRef = React.useRef<number | null>(null);
  const commentsFeedRef = React.useRef<HTMLDivElement>(null);
  const commentsListRef = React.useRef<HTMLDivElement>(null);
  const commentsBottomAnchorRef = React.useRef<HTMLDivElement>(null);
  const hasAutoScrolledCommentsRef = React.useRef(false);
  const shouldStickCommentsToBottomRef = React.useRef(true);
  const [isApplyTemplateOpen, setIsApplyTemplateOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'attachments' | 'proofs'>('attachments');
  const [projectAttachments, setProjectAttachments] = useState<ProjectAttachment[]>(project?.attachments || []);
  const [uploadingProjectAttachment, setUploadingProjectAttachment] = useState(false);
  const [projectUploadProgress, setProjectUploadProgress] =
    useState<UploadProgressState>(EMPTY_UPLOAD_PROGRESS);
  const [isDraggingProjectFile, setIsDraggingProjectFile] = useState(false);
  const projectDragCounterRef = React.useRef(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [currentLightboxImages, setCurrentLightboxImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [pdfLightboxOpen, setPdfLightboxOpen] = useState(false);
  const [pdfLightboxUrl, setPdfLightboxUrl] = useState('');
  const [pdfLightboxName, setPdfLightboxName] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkCommentId = searchParams.get('commentId');
  const deepLinkTaskId = searchParams.get('taskId');
  const deepLinkTab = searchParams.get('tab');
  const deepLinkProofId = searchParams.get('proofId');
  const isInitialContentReady =
    isInitialTasksLoaded && isInitialCommentsLoaded && isInitialProofActivityLoaded;
  const processedCommentRef = React.useRef<string | null>(null);
  const { setPageHeader } = usePageActions();
  const { refreshNotifications } = useNotificationContext();
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
  } = useProjectTasks(project?.id || '');

  const handleUpdateRelatedTask = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
    if (!project?.id) return;
    await updateTask(project.id, taskId, updates);
  }, [project?.id, updateTask]);

  const tasksWithAssigneeProfiles = useMemo(() => {
    if (!tasks || tasks.length === 0) return tasks;
    if (!users || users.length === 0) return tasks;

    const userById = new Map<string, ProjectUser>();
    users.forEach(user => {
      const userId = user.profiles?.id || user.id;
      if (userId) {
        userById.set(userId, user);
      }
    });

    return tasks.map(task => {
      if (task.assigned_to_profile || !task.assigned_to) {
        return task;
      }

      const matchingUser = userById.get(task.assigned_to);
      if (!matchingUser?.profiles) {
        return task;
      }

      return {
        ...task,
        assigned_to_profile: {
          id: matchingUser.profiles.id,
          first_name: matchingUser.profiles.first_name,
          last_name: matchingUser.profiles.last_name,
          email: matchingUser.profiles.email,
          avatar_url: matchingUser.profiles.avatar_url,
        },
      };
    });
  }, [tasks, users]);

  const ensureProjectMember = useCallback(async (userId?: string | null) => {
    if (!project?.id || !userId) return false;
    if (project.members?.some(member => member.user_id === userId)) {
      return false;
    }

    try {
      const response = await fetch(`/api/admin/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData?.error === 'User is already a member') {
          return false;
        }
        console.error('Error adding project member:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding project member:', error);
      return false;
    }
  }, [project?.id, project?.members]);

  // Fetch tasks, users, and departments on mount
  React.useEffect(() => {
    if (!project?.id) return;

    let cancelled = false;
    setIsInitialTasksLoaded(false);

    void fetchTasks(project.id).finally(() => {
      if (!cancelled) {
        setIsInitialTasksLoaded(true);
      }
    });

    // Also fetch users for assignment (fetch in parallel)
    adminAPI.getUsers().then(data => setUsers(data || [])).catch(() => {});
    // Fetch departments (fetch in parallel)
    fetch('/api/admin/project-departments')
      .then(res => res.json())
      .then(data => setDepartments(data || []))
      .catch(() => {});
    // Fetch all internal categories for task dropdowns
    fetch('/api/admin/project-categories')
      .then(res => res.json())
      .then(data => setAllInternalCategories(data || []))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [project?.id, fetchTasks]);

  React.useEffect(() => {
    if (project) {
      setIsProjectComplete(project.status === 'complete');
    }
  }, [project?.status, project]);

  React.useEffect(() => {
    if (!selectedTask) return;
    const matchingTask = tasks.find(task => task.id === selectedTask.id);
    if (!matchingTask) return;
    setSelectedTask(prev => (prev ? { ...prev, ...matchingTask } : prev));
  }, [tasks, selectedTask?.id]);

  React.useEffect(() => {
    if (!isEditingProjectDescription && project) {
      setProjectDescriptionDraft(project.description || '');
    }
  }, [project?.description, project?.id, isEditingProjectDescription, project]);

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

  // Sync projectAttachments when project loads or changes
  useEffect(() => {
    if (project?.attachments) {
      setProjectAttachments(project.attachments);
    }
  }, [project?.attachments, project]);

  const statusLabel = useMemo(() => {
    if (!project) return '';
    return statusOptions.find(option => option.value === project.status)?.label || project.status;
  }, [project?.status, project]);

  const departmentLabel = useMemo(() => {
    if (!project?.current_department_id) return 'Unassigned';
    const department = departments.find(d => d.id === project.current_department_id);
    return department?.name || 'Unassigned';
  }, [project?.current_department_id, departments, project]);

  const availableTaskCategories = useMemo(() => {
    return allInternalCategories;
  }, [allInternalCategories]);

  const taskGroups = useMemo(() => {
    if (!tasksWithAssigneeProfiles || tasksWithAssigneeProfiles.length === 0) {
      return { groups: [], otherTasks: [] as ProjectTask[] };
    }

    const taskById = new Map<string, ProjectTask>();
    tasksWithAssigneeProfiles.forEach(task => taskById.set(task.id, task));

    // Find the root parent task for category resolution
    const findRootParent = (task: ProjectTask): ProjectTask => {
      let current = task;
      while (current.parent_task_id) {
        const parent = taskById.get(current.parent_task_id);
        if (!parent) break;
        current = parent;
      }
      return current;
    };

    const resolveCategory = (task: ProjectTask) => {
      // For subtasks, always use the root parent's category
      const rootTask = findRootParent(task);
      let current: ProjectTask | undefined = rootTask;
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
      { title: string; tasks: ProjectTask[]; taskIds: Set<string> }
    >();
    const otherTaskIds = new Set<string>();

    // First, group top-level tasks by category
    const topLevelTasks = tasksWithAssigneeProfiles.filter(task => !task.parent_task_id);

    topLevelTasks.forEach(task => {
      const category = resolveCategory(task);
      if (!category) {
        otherTaskIds.add(task.id);
        return;
      }
      const key = category.id || category.name;
      const existing = groupsMap.get(key);
      if (existing) {
        existing.taskIds.add(task.id);
      } else {
        groupsMap.set(key, { title: category.name, tasks: [], taskIds: new Set([task.id]) });
      }
    });

    // Now add all tasks (including subtasks) to their respective groups
    tasksWithAssigneeProfiles.forEach(task => {
      const rootParent = findRootParent(task);
      const category = resolveCategory(rootParent);

      if (!category) {
        // Task belongs to "Other Tasks" - add all tasks in this family
        if (otherTaskIds.has(rootParent.id)) {
          // This task is part of an "Other Tasks" family - we'll add it when building otherTasks array
        }
        return;
      }

      const key = category.id || category.name;
      const group = groupsMap.get(key);
      if (group && group.taskIds.has(rootParent.id)) {
        group.tasks.push(task);
      }
    });

    // Build otherTasks array (all tasks whose root parent is in otherTaskIds)
    const otherTasks: ProjectTask[] = tasksWithAssigneeProfiles.filter(task => {
      const rootParent = findRootParent(task);
      return otherTaskIds.has(rootParent.id);
    });

    const groups = Array.from(groupsMap.values())
      .map(({ title, tasks }) => ({ title, tasks }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return { groups, otherTasks };
  }, [tasksWithAssigneeProfiles]);

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
    if (!project) return [];
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
  }, [project?.categories, project?.is_billable, project]);

  const fetchComments = useCallback(async () => {
    if (!project?.id) return;
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
  }, [project?.id, project]);

  const fetchProofActivity = useCallback(async () => {
    if (!project?.id) return;
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/proof-activity`);
      if (!response.ok) return;
      const data = await response.json();
      setProofActivity(data.activity ?? []);
    } catch {
      // silent
    }
  }, [project?.id]);

  React.useEffect(() => {
    if (!project?.id) return;

    let cancelled = false;
    hasAutoScrolledCommentsRef.current = false;
    setIsInitialCommentsLoaded(false);
    setIsInitialProofActivityLoaded(false);

    void fetchComments().finally(() => {
      if (!cancelled) {
        setIsInitialCommentsLoaded(true);
      }
    });

    void fetchProofActivity().finally(() => {
      if (!cancelled) {
        setIsInitialProofActivityLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [project?.id, fetchComments, fetchProofActivity]);

  useEffect(() => {
    if (deepLinkTab !== 'proofs' && !deepLinkProofId) return;
    setActiveContentTab('proofs');
    if (deepLinkProofId) {
      setProofToOpen(deepLinkProofId);
    }
  }, [deepLinkTab, deepLinkProofId]);

  // Realtime subscription — re-fetch comments when another user adds/edits/deletes
  useEffect(() => {
    if (!project?.id) return;

    const supabase = createClient();
    const commentsChannel = supabase
      .channel(`project-comments:${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_comments',
          filter: `project_id=eq.${project.id}`,
        },
        () => { fetchComments(); }
      )
      .subscribe();

    const proofFeedbackChannel = supabase
      .channel(`project-proof-feedback-activity:${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proof_feedback',
          filter: `project_id=eq.${project.id}`,
        },
        () => { fetchProofActivity(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(proofFeedbackChannel);
    };
  }, [project?.id, fetchComments, fetchProofActivity]);

  const handleCreateTask = useCallback(() => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }, []);

  const handleDeleteProject = useCallback(async () => {
    if (!project) return;
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
  }, [project?.id, project?.name, router, project]);

  const handleDuplicateProject = useCallback(async (name: string, companyId: string) => {
    if (!project) return;

    const response = await fetch(`/api/admin/projects/${project.id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, companyId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = data.details
        ? `${data.error || 'Failed to duplicate project'}: ${data.details}`
        : (data.error || 'Failed to duplicate project');
      throw new Error(errorMessage);
    }

    const { projectId } = await response.json();
    router.push(`/admin/project-management/${projectId}`);
  }, [project, router]);

  const handleBackToProjects = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin/project-management');
    }
  }, [router]);

  const updateProjectFields = useCallback(async (updates: Partial<Project> & { assigned_to?: string | null; requested_by?: string | null; current_department_id?: string | null }) => {
    if (!project) return;
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
    if (!project || status === project.status) {
      setIsHeaderStatusOpen(false);
      return;
    }

    // Route completion through the confirmation modal
    if (status === 'complete') {
      setIsHeaderStatusOpen(false);
      setShowCompleteConfirmation(true);
      return;
    }

    setIsUpdatingHeaderStatus(true);
    setIsHeaderStatusOpen(false);
    try {
      await updateProjectFields({
        status,
        completion_date: null,
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
  }, [onProjectUpdate, project?.status, updateProjectFields, project]);

  const handleHeaderDepartmentChange = useCallback(async (departmentId: string | null) => {
    if (!project || departmentId === project.current_department_id) {
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
  }, [onProjectUpdate, project?.current_department_id, updateProjectFields, project]);

  const handleCompleteProject = useCallback(async () => {
    if (!project || isCompletingProject) return;

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
      onProjectUpdate?.();
      handleBackToProjects();
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
    handleBackToProjects,
    tasks,
    updateTask,
    project,
  ]);

  const handleUncompleteProject = useCallback(async () => {
    if (!project || isCompletingProject) return;

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
    project?.assigned_to_profile,
    project?.description,
    project?.due_date,
    project?.id,
    project?.is_billable,
    project?.name,
    project?.notes,
    project?.primary_file_path,
    project?.priority,
    project?.project_subtype,
    project?.project_type,
    project?.quoted_price,
    project?.start_date,
    project?.tags,
    project,
  ]);

  const handleToggleProjectComplete = useCallback(() => {
    if (isCompletingProject) return;

    // If already complete, uncomplete the project
    if (isProjectComplete) {
      handleUncompleteProject();
      return;
    }

    // Always show confirmation modal when marking complete
    setShowCompleteConfirmation(true);
  }, [isCompletingProject, isProjectComplete, handleUncompleteProject]);

  // Set skeleton header during loading
  React.useEffect(() => {
    if (projectLoading || !project) {
      setPageHeader({
        title: (
          <div style={{
            height: '24px',
            width: '280px',
            background: 'var(--gray-200, #e5e7eb)',
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        ),
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
        description: `
          <div style="display: flex; gap: 12px;">
            <div style="height: 16px; width: 180px; background: var(--gray-200, #e5e7eb); border-radius: 4px; animation: pulse 1.5s ease-in-out infinite;"></div>
            <div style="height: 16px; width: 120px; background: var(--gray-200, #e5e7eb); border-radius: 4px; animation: pulse 1.5s ease-in-out infinite;"></div>
          </div>
        `,
        customActions: (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              height: '36px',
              width: '160px',
              background: 'var(--gray-200, #e5e7eb)',
              borderRadius: 'var(--border-radius)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              height: '36px',
              width: '180px',
              background: 'var(--gray-200, #e5e7eb)',
              borderRadius: 'var(--border-radius)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              height: '36px',
              width: '36px',
              background: 'var(--gray-200, #e5e7eb)',
              borderRadius: 'var(--border-radius)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          </div>
        ),
      });
      return;
    }
  }, [projectLoading, project, handleBackToProjects, setPageHeader]);

  // Set actual header when data is loaded
  React.useEffect(() => {
    if (projectLoading || !project) return;

    // Wait for departments to load if project has a department assigned
    if (project.current_department_id && departments.length === 0) return;

    const companyName = project.company?.name;
    const projectName = project.name || 'Project Details';
    const brandingRaw = project.company?.branding;
    const branding = Array.isArray(brandingRaw) ? brandingRaw[0] : brandingRaw;
    const logoUrl = branding?.icon_logo_url;

    const isOverdue = isDueDateOverdue(project.due_date);
    const daysText = getDaysUntilDue(project.due_date);
    const dueDateColor = isOverdue ? '#ef4444' : '#111827';

    setPageHeader({
      title: projectName,
      titleLogo: logoUrl ? (
        <Image
          src={logoUrl}
          alt={companyName || ''}
          width={36}
          height={36}
          className={styles.headerCompanyLogo}
        />
      ) : undefined,
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
            className={`${headerStyles.addLeadButton} ${headerStyles.iconOnlyButton}`}
            onClick={() => setIsDuplicateModalOpen(true)}
            type="button"
            aria-label="Duplicate project"
          >
            <Copy size={18} />
          </button>
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
    projectLoading,
    handleBackToProjects,
    handleDeleteProject,
    handleDuplicateProject,
    setIsDuplicateModalOpen,
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
    if (!project?.id) return;
    fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`)
      .then(res => res.json())
      .then(fullTask => {
        setSelectedTask(fullTask);
        setIsTaskDetailOpen(true);
      })
      .catch(err => console.error('Error fetching task details:', err));
  }, [project?.id, project]);

  const handleTaskClick = (task: ProjectTask) => {
    openTaskDetailById(task.id);
  };

  const scrollCommentsToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const feedElement = commentsFeedRef.current;
    if (!feedElement) return;
    const maxTop = Math.max(0, feedElement.scrollHeight - feedElement.clientHeight);
    shouldStickCommentsToBottomRef.current = true;
    if (behavior === 'auto') {
      feedElement.scrollTop = maxTop;
      feedElement.scrollTop = Math.max(0, feedElement.scrollHeight - feedElement.clientHeight);
    } else {
      feedElement.scrollTo({ top: maxTop, behavior });
    }
  }, []);

  const handleCommentsFeedScroll = useCallback(() => {
    const listElement = commentsFeedRef.current;
    if (!listElement) return;
    const distanceFromBottom =
      listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight;
    shouldStickCommentsToBottomRef.current = distanceFromBottom <= 24;
  }, []);

  const markMentionReferenceAsRead = useCallback(
    async (referenceType: 'project_comment', referenceId: string) => {
      try {
        const response = await fetch('/api/notifications/mentions/read-by-reference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referenceType, referenceId }),
        });

        if (!response.ok) {
          console.error(
            'Error marking mention as read by reference:',
            await response.text()
          );
          return;
        }

        await refreshNotifications();
      } catch (error) {
        console.error('Error marking mention as read by reference:', error);
      }
    },
    [refreshNotifications]
  );

  React.useEffect(() => {
    const commentId = deepLinkCommentId;
    const taskId = deepLinkTaskId;
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
      void markMentionReferenceAsRead('project_comment', commentId);
    }

    processedCommentRef.current = key;
  }, [deepLinkCommentId, deepLinkTaskId, markMentionReferenceAsRead, openTaskDetailById, selectedTask]);

  React.useEffect(() => {
    if (!highlightedProjectCommentId) return;
    if (isCommentsCollapsed) return;
    const rafId = window.requestAnimationFrame(() => {
      const targetComment = document.getElementById(
        `project-comment-${highlightedProjectCommentId}`
      );
      targetComment?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [highlightedProjectCommentId, comments.length, isCommentsCollapsed, showAllCommentsInFeed]);

  React.useEffect(() => {
    hasAutoScrolledCommentsRef.current = false;
    shouldStickCommentsToBottomRef.current = true;
    setShowAllCommentsInFeed(false);
  }, [project?.id]);

  React.useEffect(() => {
    if (isCommentsCollapsed) {
      hasAutoScrolledCommentsRef.current = false;
      shouldStickCommentsToBottomRef.current = true;
    }
  }, [isCommentsCollapsed]);

  React.useLayoutEffect(() => {
    const mergedFeedCount = comments.length + proofActivity.length;
    if (!isInitialContentReady) return;
    if (isCommentsCollapsed) return;
    if (mergedFeedCount === 0) return;
    if (deepLinkCommentId) return;
    if (highlightedProjectCommentId) return;
    if (hasAutoScrolledCommentsRef.current) return;
    if (!commentsFeedRef.current) return;
    scrollCommentsToBottom('auto');
    hasAutoScrolledCommentsRef.current = true;
    shouldStickCommentsToBottomRef.current = true;
  }, [
    comments.length,
    proofActivity.length,
    isInitialContentReady,
    deepLinkCommentId,
    highlightedProjectCommentId,
    isCommentsCollapsed,
    scrollCommentsToBottom,
  ]);

  React.useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    if (!isInitialContentReady) return;
    if (isCommentsCollapsed) return;
    if (deepLinkCommentId) return;
    if (highlightedProjectCommentId) return;
    if (!hasAutoScrolledCommentsRef.current) return;

    const listElement = commentsListRef.current;
    if (!listElement) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!shouldStickCommentsToBottomRef.current) return;
      scrollCommentsToBottom('auto');
    });

    resizeObserver.observe(listElement);
    return () => resizeObserver.disconnect();
  }, [
    comments.length,
    proofActivity.length,
    isInitialContentReady,
    deepLinkCommentId,
    highlightedProjectCommentId,
    isCommentsCollapsed,
    scrollCommentsToBottom,
  ]);

  React.useEffect(() => {
    if (!isInitialContentReady) return;
    if (isCommentsCollapsed) return;
    if (deepLinkCommentId) return;
    if (highlightedProjectCommentId) return;
    if (!hasAutoScrolledCommentsRef.current) return;

    const timeoutId = window.setTimeout(() => {
      if (shouldStickCommentsToBottomRef.current) {
        scrollCommentsToBottom('auto');
      }
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [
    comments.length,
    proofActivity.length,
    isInitialContentReady,
    deepLinkCommentId,
    highlightedProjectCommentId,
    isCommentsCollapsed,
    scrollCommentsToBottom,
  ]);

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
    if (!project?.id) return;
    const {
      blocked_task_department_id: blockedTaskDepartmentId,
      blocked_task_id_for_department: blockedTaskIdForDepartment,
      ...taskPayload
    } = formData;

    const assignedTo = taskPayload.assigned_to || null;
    await ensureProjectMember(assignedTo);

    if (editingTask) {
      await updateTask(project.id, editingTask.id, taskPayload);
    } else {
      await createTask(project.id, taskPayload);
    }

    if (blockedTaskIdForDepartment) {
      try {
        await updateTask(project.id, blockedTaskIdForDepartment, {
          department_id: blockedTaskDepartmentId || null,
        });
      } catch (error) {
        console.error('Error updating blocked task department:', error);
      }
    }
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = useCallback(async (taskId?: string) => {
    if (!project?.id) return;
    const idToDelete = taskId || selectedTask?.id;
    if (!idToDelete) return;

    await deleteTask(project.id, idToDelete);
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  }, [deleteTask, project?.id, project, selectedTask]);

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    if (!project?.id) return;
    try {
      const updatedTask = await updateTask(project.id, taskId, { is_completed: isCompleted });
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask((prev) => (prev ? { ...prev, ...updatedTask } : updatedTask));
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update task';
      setErrorTitle('Cannot Complete Task');
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      clearError(); // Clear the hook's error state to prevent banner from showing
    }
  };

  // Handler for inline task updates (title, due_date, etc.)
  const handleUpdateTaskInline = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
    if (!project?.id) return;
    if (updates.assigned_to) {
      await ensureProjectMember(updates.assigned_to);
    }
    await updateTask(project.id, taskId, updates);
  }, [project?.id, updateTask, ensureProjectMember]);

  // Handler for deleting a task from the list
  const handleDeleteTaskFromList = useCallback(async (taskId: string) => {
    if (!project?.id) return;
    await deleteTask(project.id, taskId);
  }, [project?.id, deleteTask, project]);

  // Handler for reordering tasks
  const handleReorderTasks = useCallback(async (taskIds: string[]) => {
    if (!project?.id) return;
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
  }, [project?.id, updateTask, project]);

  const handleAddComment = async (comment: string, parentCommentId?: string, attachments?: File[]) => {
    if (!selectedTask || !project?.id) return null;

    // First create the comment
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

    const newComment = await response.json();

    // If there are attachments, upload them directly to storage
    if (attachments && attachments.length > 0) {
      const supabase = createClient();
      const fileMetadata = [];

      for (const file of attachments) {
        // Validate file size (50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File "${file.name}" exceeds 50MB limit`);
        }

        // Upload directly to Supabase Storage
        const timestamp = Date.now();
        const sanitizedName = sanitizeFileName(file.name);
        const filePath = `comment-attachments/${project.id}/tasks/${selectedTask.id}/${newComment.id}/${timestamp}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload "${file.name}": ${uploadError.message}`);
        }

        fileMetadata.push({
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        });
      }

      // Save metadata via API
      const attachmentResponse = await fetch(
        `/api/admin/projects/${project.id}/tasks/${selectedTask.id}/comments/${newComment.id}/attachments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: fileMetadata }),
        }
      );

      if (!attachmentResponse.ok) {
        // Clean up uploaded files if metadata save fails
        for (const metadata of fileMetadata) {
          await supabase.storage.from('brand-assets').remove([metadata.file_path]);
        }
        throw new Error('Failed to save attachment metadata');
      }
    }

    // Refresh task to get new comment
    const updatedTask = await fetch(
      `/api/admin/projects/${project.id}/tasks/${selectedTask.id}`
    ).then(res => res.json());

    setSelectedTask(updatedTask);

    return newComment;
  };

  const handleUpdateProgress = async (progress: number) => {
    if (!selectedTask || !project?.id) return;

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
    if (!project?.id) return;
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

      // If there are attachments, upload them directly to storage
      if (pendingAttachments.length > 0) {
        const supabase = createClient();
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        setProjectCommentUploadProgress({
          active: true,
          completed: 0,
          total: pendingAttachments.length,
        });

        const uploadResults = await Promise.allSettled(
          pendingAttachments.map(async (file) => {
            if (file.size > MAX_FILE_SIZE) {
              throw new Error(`File "${file.name}" exceeds 50MB limit`);
            }

            const timestamp = Date.now();
            const sanitizedName = sanitizeFileName(file.name);
            const filePath = `comment-attachments/${project.id}/${comment.id}/${timestamp}-${sanitizedName}`;

            const { error: uploadError } = await supabase.storage
              .from('brand-assets')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              throw new Error(
                `Failed to upload "${file.name}": ${uploadError.message}`
              );
            }

            setProjectCommentUploadProgress((prev) => ({
              ...prev,
              completed: Math.min(prev.total, prev.completed + 1),
            }));

            return {
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            };
          })
        );

        const fileMetadata = uploadResults
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<{
              file_path: string;
              file_name: string;
              file_size: number;
              mime_type: string;
            }> => result.status === 'fulfilled'
          )
          .map((result) => result.value);

        const firstFailedUpload = uploadResults.find(
          (result) => result.status === 'rejected'
        );

        if (firstFailedUpload) {
          if (fileMetadata.length > 0) {
            await supabase.storage
              .from('brand-assets')
              .remove(fileMetadata.map((file) => file.file_path));
          }

          const reason = (firstFailedUpload as PromiseRejectedResult).reason;
          throw reason instanceof Error
            ? reason
            : new Error('Failed to upload one or more attachments');
        }

        // Save metadata via API
        const attachmentResponse = await fetch(
          `/api/admin/projects/${project.id}/comments/${comment.id}/attachments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: fileMetadata }),
          }
        );

        if (attachmentResponse.ok) {
          const uploadedAttachments = await attachmentResponse.json();
          comment.attachments = uploadedAttachments;
        } else {
          // Clean up uploaded files if metadata save fails
          for (const metadata of fileMetadata) {
            await supabase.storage.from('brand-assets').remove([metadata.file_path]);
          }
          throw new Error('Failed to save attachment metadata');
        }
      }

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setPendingAttachments([]);
      hasAutoScrolledCommentsRef.current = true;
      shouldStickCommentsToBottomRef.current = true;
      window.requestAnimationFrame(() => {
        scrollCommentsToBottom('smooth');
      });
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error posting comment:', error);
      setToastMessage('Failed to post comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmittingComment(false);
      setProjectCommentUploadProgress(EMPTY_UPLOAD_PROGRESS);
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

  // Merged comment feed: project comments + proof feedback activity, sorted by created_at
  const mergedFeed = useMemo(() => {
    const commentItems = comments.map((c) => ({ ...c, _type: 'comment' as const }));
    const activityItems = proofActivity.map((a) => ({ ...a, _type: 'proof_feedback' as const }));
    return [...commentItems, ...activityItems].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [comments, proofActivity]);

  const hasOlderCommentsInFeed = useMemo(
    () =>
      !showAllCommentsInFeed &&
      comments.length > COMMENTS_INITIAL_VISIBLE_COUNT,
    [comments.length, showAllCommentsInFeed]
  );

  const visibleMergedFeed = useMemo(() => {
    if (showAllCommentsInFeed) return mergedFeed;
    if (comments.length <= COMMENTS_INITIAL_VISIBLE_COUNT) return mergedFeed;

    let commentsRemaining = COMMENTS_INITIAL_VISIBLE_COUNT;
    let startIndex = 0;

    for (let index = mergedFeed.length - 1; index >= 0; index -= 1) {
      if (mergedFeed[index]._type === 'comment') {
        commentsRemaining -= 1;
      }

      if (commentsRemaining === 0) {
        startIndex = index;
        break;
      }
    }

    return mergedFeed.slice(startIndex);
  }, [comments.length, mergedFeed, showAllCommentsInFeed]);

  React.useEffect(() => {
    if (!deepLinkCommentId) return;
    if (showAllCommentsInFeed) return;

    const isDeepLinkedCommentVisible = visibleMergedFeed.some(
      (item) => item._type === 'comment' && item.id === deepLinkCommentId
    );

    if (!isDeepLinkedCommentVisible) {
      setShowAllCommentsInFeed(true);
    }
  }, [deepLinkCommentId, showAllCommentsInFeed, visibleMergedFeed]);

  const handleOpenProofFromActivity = useCallback((proofId: string) => {
    setActiveContentTab('proofs');
    setProofToOpen(proofId);
  }, []);

  const handleSaveProjectDescription = async () => {
    if (!project?.id) return;
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
    if (!project) return;
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
    if (!project?.id) return;
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
  }, [editingCommentId, editingCommentText, project?.id, project]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!project?.id) return;
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
  }, [editingCommentId, project?.id, project]);

  // Project Attachments Handlers
  const canEditProject = useMemo(() => {
    if (!project) return false;
    const profile = user as any;
    return (
      profile?.is_admin ||
      project.requested_by_profile?.id === user.id ||
      project.assigned_to_profile?.id === user.id ||
      project.members?.some((m: { user_id: string }) => m.user_id === user.id)
    );
  }, [user, project]);
  const canUploadProjectAttachments = useMemo(() => Boolean(project?.id), [project?.id]);

  const uploadProjectFiles = useCallback(async (files: File[]) => {
    if (!project?.id || files.length === 0) return;

    setUploadingProjectAttachment(true);
    setProjectUploadProgress({
      active: true,
      completed: 0,
      total: files.length,
    });

    try {
      const supabase = createClient();
      const MAX_FILE_SIZE = 50 * 1024 * 1024;

      const uploadResults = await Promise.allSettled(
        files.map(async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File "${file.name}" exceeds 50MB limit`);
          }

          const sanitizedName = sanitizeFileName(file.name);
          const timestamp = Date.now();
          const storagePath = `${project.id}/${timestamp}-${sanitizedName}`;

          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            throw new Error(
              `Failed to upload "${file.name}": ${uploadError.message}`
            );
          }

          setProjectUploadProgress((prev) => ({
            ...prev,
            completed: Math.min(prev.total, prev.completed + 1),
          }));

          return {
            file_path: storagePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          };
        })
      );

      const successfulUploads = uploadResults
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{
            file_path: string;
            file_name: string;
            file_size: number;
            mime_type: string;
          }> => result.status === 'fulfilled'
        )
        .map((result) => result.value);

      const firstFailedUpload = uploadResults.find(
        (result) => result.status === 'rejected'
      );

      if (firstFailedUpload) {
        if (successfulUploads.length > 0) {
          await supabase.storage
            .from('project-files')
            .remove(successfulUploads.map((file) => file.file_path));
        }

        const reason = (firstFailedUpload as PromiseRejectedResult).reason;
        throw reason instanceof Error
          ? reason
          : new Error('Failed to upload one or more files');
      }

      const metadataResponse = await fetch(
        `/api/admin/projects/${project.id}/attachments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: successfulUploads,
          }),
        }
      );

      if (!metadataResponse.ok) {
        if (successfulUploads.length > 0) {
          await supabase.storage
            .from('project-files')
            .remove(successfulUploads.map((file) => file.file_path));
        }

        let errorMessage = 'Failed to save attachment metadata';
        try {
          const errorData = await metadataResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = metadataResponse.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const metadataPayload = await metadataResponse
        .json()
        .catch(() => null);
      const createdAttachments = Array.isArray(metadataPayload?.attachments)
        ? metadataPayload.attachments
        : metadataPayload?.attachment
        ? [metadataPayload.attachment]
        : [];

      if (createdAttachments.length > 0) {
        setProjectAttachments((prev) => [...prev, ...createdAttachments]);
      } else {
        const attachmentsResponse = await fetch(
          `/api/admin/projects/${project.id}/attachments`
        );
        if (attachmentsResponse.ok) {
          const { attachments } = await attachmentsResponse.json();
          setProjectAttachments(attachments);
        }
      }

      setToastMessage(`${files.length} file(s) uploaded successfully.`);
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error uploading attachment:', error);
      setToastMessage(
        error instanceof Error ? error.message : 'Failed to upload file(s).'
      );
      setToastType('error');
      setShowToast(true);
    } finally {
      setUploadingProjectAttachment(false);
      setProjectUploadProgress(EMPTY_UPLOAD_PROGRESS);
    }
  }, [onProjectUpdate, project?.id]);

  const handleProjectFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadProjectFiles(files);
    }
    e.target.value = '';
  }, [uploadProjectFiles]);

  const handleDownloadProjectAttachment = useCallback(async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${project?.id}/attachments/${attachmentId}/url`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // fallback: open in new tab
      window.open(`/api/admin/projects/${project?.id}/attachments/${attachmentId}/url`, '_blank');
    }
  }, [project?.id]);

  const handleDownloadCommentAttachment = useCallback(async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to download attachment');
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  }, []);

  const handleDeleteCommentAttachment = useCallback(
    async (commentId: string, attachmentId: string) => {
      if (!project?.id) return;
      try {
        const response = await fetch(
          `/api/admin/projects/${project.id}/comments/${commentId}/attachments?attachmentId=${attachmentId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error('Failed to delete attachment');
        }

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  attachments: (comment.attachments || []).filter(
                    (attachment) => attachment.id !== attachmentId
                  ),
                }
              : comment
          )
        );
        setToastMessage('Attachment deleted.');
        setToastType('success');
        setShowToast(true);
        onProjectUpdate?.();
      } catch (error) {
        console.error('Error deleting comment attachment:', error);
        setToastMessage('Failed to delete attachment.');
        setToastType('error');
        setShowToast(true);
      }
    },
    [onProjectUpdate, project?.id]
  );

  const handleDeleteProjectAttachment = useCallback((attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setShowDeleteAttachmentModal(true);
  }, []);

  const confirmDeleteAttachment = useCallback(async () => {
    if (!project?.id || !attachmentToDelete) return;

    setShowDeleteAttachmentModal(false);

    try {
      const response = await fetch(
        `/api/admin/projects/${project.id}/attachments?id=${attachmentToDelete}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      setProjectAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
      setToastMessage('Attachment deleted.');
      setToastType('success');
      setShowToast(true);
      onProjectUpdate?.();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setToastMessage('Failed to delete attachment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setAttachmentToDelete(null);
    }
  }, [project?.id, attachmentToDelete, onProjectUpdate, project]);

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

    await uploadProjectFiles(files);
  }, [uploadProjectFiles]);

  // Lightbox handlers
  const imageAttachments = useMemo(
    () => projectAttachments.filter(a => a.mime_type.startsWith('image/')),
    [projectAttachments]
  );

  const lightboxImages = useMemo(
    () => {
      if (!project?.id) return [];
      return imageAttachments.map(attachment => ({
        id: attachment.id,
        url: `/api/admin/projects/${project.id}/attachments/${attachment.id}/url`,
        name: attachment.file_name
      }));
    },
    [imageAttachments, project?.id, project]
  );

  const handleImageClick = useCallback((attachmentId: string) => {
    const index = imageAttachments.findIndex(a => a.id === attachmentId);
    if (index !== -1) {
      setCurrentLightboxImages(lightboxImages);
      setLightboxImageIndex(index);
      setLightboxOpen(true);
    }
  }, [imageAttachments, lightboxImages]);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
    setCurrentLightboxImages([]);
  }, []);

  const handleNavigateLightbox = useCallback((index: number) => {
    setLightboxImageIndex(index);
  }, []);

  const handleCommentImageClick = useCallback((commentImages: Array<{ id: string; url: string; name: string }>, imageId: string) => {
    const index = commentImages.findIndex(img => img.id === imageId);
    if (index !== -1) {
      setCurrentLightboxImages(commentImages);
      setLightboxImageIndex(index);
      setLightboxOpen(true);
    }
  }, []);

  const projectUploadPercent =
    projectUploadProgress.total > 0
      ? Math.round(
          (projectUploadProgress.completed / projectUploadProgress.total) * 100
        )
      : 0;
  const projectCommentUploadPercent =
    projectCommentUploadProgress.total > 0
      ? Math.round(
          (projectCommentUploadProgress.completed /
            projectCommentUploadProgress.total) *
            100
        )
      : 0;

  // Internal component for loading skeleton
  const ProjectDetailSkeleton = () => {
    const [skeletonSidebarExpanded, setSkeletonSidebarExpanded] = React.useState(false);

    return (
      <div className={styles.loadingSkeleton}>
        <div className={styles.loadingContent}>
          <div
            className={styles.loadingContentWrapper}
            data-sidebar-expanded={skeletonSidebarExpanded}
          >
            {/* Content Left */}
            <div className={styles.loadingContentLeft}>
              {/* Project Summary */}
              <div>
                <div className={styles.skeletonHeader}>
                  <div className={styles.skeletonCircle} />
                  <div className={styles.skeletonLine} style={{ width: '180px' }} />
                </div>
                <div className={styles.skeletonLine} style={{ width: '100%', height: '20px', marginBottom: '8px' }} />
                <div className={styles.skeletonLine} style={{ width: '85%', height: '20px' }} />
              </div>

              {/* Attachments Section */}
              <div>
                <div className={styles.skeletonHeader}>
                  <div className={styles.skeletonCircle} />
                  <div className={styles.skeletonLine} style={{ width: '120px' }} />
                </div>
              </div>

              {/* Tasks Section */}
              <div>
                <div className={styles.skeletonHeader}>
                  <div className={styles.skeletonCircle} />
                  <div className={styles.skeletonLine} style={{ width: '80px' }} />
                </div>
                {/* Task Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonTaskRow}>
                      <div className={styles.skeletonCircle} style={{ width: '20px', height: '20px' }} />
                      <div className={styles.skeletonLine} style={{ width: i === 1 ? '240px' : i === 2 ? '200px' : '180px', flex: '1' }} />
                      <div className={styles.skeletonLine} style={{ width: '80px' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div className={styles.skeletonHeader}>
                  <div className={styles.skeletonCircle} />
                  <div className={styles.skeletonLine} style={{ width: '140px' }} />
                </div>
                {/* Comment Input Placeholder */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  border: '1px solid var(--gray-200, #e5e7eb)',
                  background: 'white',
                  marginTop: '16px'
                }}>
                  <div className={styles.skeletonLine} style={{ width: '200px', height: '14px' }} />
                </div>
              </div>
            </div>

            {/* Content Right - Sidebar */}
            <div className={styles.loadingContentRight}>
              {/* Sidebar Toggle Button */}
              <button
                type="button"
                onClick={() => setSkeletonSidebarExpanded(!skeletonSidebarExpanded)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-300)',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                aria-label={skeletonSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <ChevronDown
                  size={18}
                  style={{
                    transform: skeletonSidebarExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--gray-500, #6b7280)'
                  }}
                />
              </button>

              {/* Sidebar Info Cards (when expanded) */}
              {skeletonSidebarExpanded && (
                <>
                  <div className={styles.skeletonInfoCard}>
                    <div className={styles.skeletonLine} style={{ width: '80px', marginBottom: '12px' }} />
                    <div className={styles.skeletonLine} style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                    <div className={styles.skeletonLine} style={{ width: '90%', height: '14px' }} />
                  </div>
                  <div className={styles.skeletonInfoCard}>
                    <div className={styles.skeletonLine} style={{ width: '100px', marginBottom: '12px' }} />
                    <div className={styles.skeletonLine} style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                    <div className={styles.skeletonLine} style={{ width: '85%', height: '14px' }} />
                  </div>
                  <div className={styles.skeletonInfoCard}>
                    <div className={styles.skeletonLine} style={{ width: '70px', marginBottom: '12px' }} />
                    <div className={styles.skeletonLine} style={{ width: '100%', height: '14px' }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isInitialContentLoading =
    !projectLoading &&
    Boolean(project) &&
    (!isInitialTasksLoaded || !isInitialCommentsLoaded || !isInitialProofActivityLoaded);

  // Show loading skeleton while initial page data is being fetched (after all hooks are called)
  if (projectLoading || !project || isInitialContentLoading) {
    return <ProjectDetailSkeleton />;
  }

  return (
    <div className={styles.container}>
      {/* Image Lightbox */}
      {lightboxOpen && currentLightboxImages.length > 0 && (
        <ImageLightbox
          images={currentLightboxImages}
          currentIndex={lightboxImageIndex}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigateLightbox}
        />
      )}

      {/* PDF Lightbox */}
      {pdfLightboxOpen && (
        <PDFLightbox
          url={pdfLightboxUrl}
          name={pdfLightboxName}
          onClose={() => setPdfLightboxOpen(false)}
        />
      )}

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />

      {/* Confirmation Modal */}
      {showCompleteConfirmation && (() => {
        const incompleteTaskCount = tasks.filter(t => !t.is_completed).length;
        const hasIncompleteTasks = incompleteTaskCount > 0;

        return (
          <div className={styles.confirmationModalOverlay}>
            <div className={styles.confirmationModal}>
              <h3 className={styles.confirmationModalTitle}>Mark Project Complete?</h3>
              <p className={styles.confirmationModalMessage}>
                {hasIncompleteTasks ? (
                  <>
                    Marking this project complete will auto-complete all {incompleteTaskCount} remaining task{incompleteTaskCount !== 1 ? 's' : ''}. Continue?
                  </>
                ) : (
                  'Are you sure you want to mark this project as complete?'
                )}
              </p>
              <div className={styles.confirmationModalActions}>
                <button
                  type="button"
                  className={styles.confirmationModalCancel}
                  onClick={() => setShowCompleteConfirmation(false)}
                >
                  Cancel
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
        );
      })()}

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
                <div className={styles.projectDescriptionDisplay}>
                  <button
                    type="button"
                    className={styles.projectDescriptionEditIcon}
                    onClick={() => setIsEditingProjectDescription(true)}
                    aria-label="Edit project description"
                  >
                    <Pencil size={14} />
                  </button>
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

            {/* Content Tab Bar */}
            <div className={styles.contentTabBar}>
              <button
                className={`${styles.contentTab} ${activeContentTab === 'attachments' ? styles.contentTabActive : ''}`}
                onClick={() => setActiveContentTab('attachments')}
              >
                Attachments
              </button>
              <button
                className={`${styles.contentTab} ${activeContentTab === 'proofs' ? styles.contentTabActive : ''}`}
                onClick={() => setActiveContentTab('proofs')}
              >
                Proofs
              </button>
            </div>

            {activeContentTab === 'proofs' && project && (
              <ProofsTab
                project={project}
                user={user}
                canEdit={true}
                mentionUsers={mentionUsers}
                autoOpenProofId={proofToOpen}
                onProofModalClosed={() => setProofToOpen(null)}
              />
            )}

            {/* Project Attachments Section */}
            <div
              className={styles.projectAttachments}
              style={{ display: activeContentTab === 'attachments' ? undefined : 'none' }}
              onDragEnter={handleProjectDragEnter}
              onDragLeave={handleProjectDragLeave}
              onDragOver={handleProjectDragOver}
              onDrop={handleProjectDrop}
            >
              {canUploadProjectAttachments && (
                <input
                  type="file"
                  multiple
                  onChange={handleProjectFileSelect}
                  disabled={uploadingProjectAttachment}
                  style={{ display: 'none' }}
                  id="project-file-input"
                />
              )}

              {(projectAttachments.length > 0 || canUploadProjectAttachments) && (
                <div className={styles.attachmentsGrid}>
                  {projectAttachments.map((attachment) => {
                    const isImage = attachment.mime_type.startsWith('image/');

                    return (
                      <div key={attachment.id} className={styles.attachmentItem}>
                        {isImage ? (
                          <div
                            className={styles.imageWrapper}
                            onClick={() => handleImageClick(attachment.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <img
                              src={`/api/admin/projects/${project.id}/attachments/${attachment.id}/url`}
                              alt={attachment.file_name}
                              loading="lazy"
                            />
                            <button
                              className={styles.downloadImageButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadProjectAttachment(attachment.id, attachment.file_name);
                              }}
                              aria-label="Download attachment"
                            >
                              <Download size={14} />
                            </button>
                            {canEditProject && (
                              <button
                                className={styles.deleteImageButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProjectAttachment(attachment.id);
                                }}
                                aria-label="Delete attachment"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            className={styles.documentWrapper}
                            style={{ cursor: attachment.mime_type === 'application/pdf' ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (attachment.mime_type === 'application/pdf') {
                                setPdfLightboxUrl(`/api/admin/projects/${project.id}/attachments/${attachment.id}/url`);
                                setPdfLightboxName(attachment.file_name);
                                setPdfLightboxOpen(true);
                              }
                            }}
                          >
                            <div className={styles.documentIcon}>
                              <FileText size={48} />
                            </div>
                            <button
                              className={styles.downloadImageButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadProjectAttachment(attachment.id, attachment.file_name);
                              }}
                              aria-label="Download attachment"
                            >
                              <Download size={14} />
                            </button>
                            {canEditProject && (
                              <button
                                className={styles.deleteImageButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProjectAttachment(attachment.id);
                                }}
                                aria-label="Delete attachment"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        )}
                        <span className={styles.attachmentFileName}>{attachment.file_name}</span>
                      </div>
                    );
                  })}

                  {canUploadProjectAttachments && (
                    <div
                      className={`${styles.attachmentItem} ${styles.addNewBox} ${isDraggingProjectFile ? styles.addNewBoxActive : ''}`}
                      onClick={() => document.getElementById('project-file-input')?.click()}
                    >
                      <div className={styles.addNewContent}>
                        {uploadingProjectAttachment ? (
                          <>
                            <span className={styles.addNewText}>
                              Uploading {projectUploadProgress.completed}/
                              {projectUploadProgress.total}
                            </span>
                            <div className={styles.uploadProgressBarCompact}>
                              <div
                                className={styles.uploadProgressFill}
                                style={{ width: `${projectUploadPercent}%` }}
                              />
                            </div>
                            <span className={styles.uploadProgressCompactLabel}>
                              {projectUploadPercent}%
                            </span>
                          </>
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
                    projectDueDate={project.due_date}
                    blockedTaskHoverRef={blockedTaskHoverRef}
                    onBlockedTaskHoverChange={setBlockedTaskHoverRef}
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
                        projectDueDate={project.due_date}
                        blockedTaskHoverRef={blockedTaskHoverRef}
                        onBlockedTaskHoverChange={setBlockedTaskHoverRef}
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
                  <div
                    ref={commentsFeedRef}
                    className={styles.commentsFeed}
                  >
                    {mergedFeed.length > 0 ? (
                      <div ref={commentsListRef} className={styles.commentsList}>
                        {hasOlderCommentsInFeed && (
                          <div className={styles.loadOlderCommentsRow}>
                            <button
                              type="button"
                              className={styles.loadOlderCommentsButton}
                              onClick={() => setShowAllCommentsInFeed(true)}
                            >
                              <ChevronUp size={12} />
                              <span>Load Older Comments</span>
                            </button>
                          </div>
                        )}
                        {visibleMergedFeed.map(item => {
                          // ── Proof feedback activity (system message) ──
                          if (item._type === 'proof_feedback') {
                            const activity = item as typeof item & { _type: 'proof_feedback' };
                            const authorName = activity.user_profile
                              ? `${activity.user_profile.first_name || ''} ${activity.user_profile.last_name || ''}`.trim()
                              : 'Someone';
                            const proofInfo = activity.proof;
                            const isPin = activity.x_percent !== null;
                            return (
                              <div key={`pfa-${activity.id}`} className={styles.proofActivityMessage}>
                                <MiniAvatar
                                  firstName={activity.user_profile?.first_name || undefined}
                                  lastName={activity.user_profile?.last_name || undefined}
                                  email=""
                                  avatarUrl={activity.user_profile?.avatar_url || null}
                                  size="small"
                                  showTooltip={false}
                                  className={styles.commentAvatarMini}
                                />
                                <div className={styles.proofActivityContent}>
                                  <span className={styles.proofActivityText}>
                                    <strong>{authorName}</strong>
                                    {isPin ? ' pinned feedback' : ' left feedback'}{' '}
                                    {proofInfo && (
                                      <>on <em>v{proofInfo.version} — {proofInfo.file_name}</em></>
                                    )}
                                  </span>
                                  {activity.comment && (
                                    <span
                                      className={styles.proofActivityComment}
                                      dangerouslySetInnerHTML={{ __html: activity.comment }}
                                    />
                                  )}
                                  <div className={styles.proofActivityFooter}>
                                    <span className={styles.proofActivityDate}>
                                      {formatCommentDate(activity.created_at)}
                                    </span>
                                    {proofInfo && (
                                      <button
                                        className={styles.proofActivityLink}
                                        onClick={() => handleOpenProofFromActivity(proofInfo.id)}
                                      >
                                        View Proof
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // ── Regular comment ──
                          const comment = item as typeof item & { _type: 'comment' };
                          const authorName = comment.user_profile
                            ? `${comment.user_profile.first_name || ''} ${comment.user_profile.last_name || ''}`.trim() || comment.user_profile.email
                            : 'Unknown';
                          const isCommentOwner = comment.user_id === user.id;
                          const commentAuthorLabel = isCommentOwner ? 'Me' : authorName;
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
                              className={[
                                styles.commentItem,
                                isCommentOwner ? styles.commentItemMine : styles.commentItemOther,
                                highlightedProjectCommentId === comment.id ? styles.commentHighlight : '',
                              ].filter(Boolean).join(' ')}
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
                                <span className={styles.commentAuthor}>{commentAuthorLabel}</span>
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

                                  const commentLightboxImages = imageAttachments.map((attachment: { id: string; url: string; file_name: string }) => ({
                                    id: attachment.id,
                                    url: attachment.url,
                                    name: attachment.file_name
                                  }));

                                  return (
                                    <>
                                      {imageAttachments.length > 0 && (
                                        <div className={styles.commentImageAttachments}>
                                          {imageAttachments.map((attachment: { id: string; url: string; file_name: string }) => (
                                            <div
                                              key={attachment.id}
                                              className={styles.commentImageLink}
                                              onClick={() => handleCommentImageClick(commentLightboxImages, attachment.id)}
                                              style={{ cursor: 'pointer' }}
                                            >
                                              <img
                                                src={attachment.url}
                                                alt={attachment.file_name}
                                                className={styles.commentImage}
                                              />
                                              <button
                                                type="button"
                                                className={`${styles.commentDownloadButton} ${
                                                  isCommentOwner ? styles.commentDownloadButtonWithDelete : ''
                                                }`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDownloadCommentAttachment(
                                                    attachment.url,
                                                    attachment.file_name
                                                  );
                                                }}
                                                aria-label="Download attachment"
                                              >
                                                <Download size={14} />
                                              </button>
                                              {isCommentOwner && (
                                                <button
                                                  type="button"
                                                  className={styles.commentDeleteButton}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDeleteCommentAttachment(
                                                      comment.id,
                                                      attachment.id
                                                    );
                                                  }}
                                                  aria-label="Delete attachment"
                                                >
                                                  <X size={14} />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {fileAttachments.length > 0 && (
                                        <div className={styles.commentAttachments}>
                                          {fileAttachments.map((attachment: { id: string; url: string; file_name: string; mime_type?: string | null }) => (
                                            <div key={attachment.id} className={styles.commentAttachmentCardWrapper}>
                                              <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.attachmentCard}
                                              >
                                                <div className={styles.attachmentIcon}>
                                                  {attachment.mime_type === 'application/pdf' ? (
                                                    <FileText size={16} />
                                                  ) : (
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
                                                  )}
                                                </div>
                                                <div className={styles.attachmentInfo}>
                                                  <span className={styles.attachmentName}>{attachment.file_name}</span>
                                                  {attachment.mime_type === 'application/pdf' && (
                                                    <span className={styles.attachmentBadge}>PDF</span>
                                                  )}
                                                </div>
                                              </a>
                                              <button
                                                type="button"
                                                className={`${styles.commentDownloadButton} ${
                                                  isCommentOwner ? styles.commentDownloadButtonWithDelete : ''
                                                }`}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDownloadCommentAttachment(
                                                    attachment.url,
                                                    attachment.file_name
                                                  );
                                                }}
                                                aria-label="Download attachment"
                                              >
                                                <Download size={14} />
                                              </button>
                                              {isCommentOwner && (
                                                <button
                                                  type="button"
                                                  className={styles.commentDeleteButton}
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    void handleDeleteCommentAttachment(
                                                      comment.id,
                                                      attachment.id
                                                    );
                                                  }}
                                                  aria-label="Delete attachment"
                                                >
                                                  <X size={14} />
                                                </button>
                                              )}
                                            </div>
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
                    <div ref={commentsBottomAnchorRef} className={styles.commentsBottomAnchor} aria-hidden="true" />
                  </div>

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
                      {projectCommentUploadProgress.active && (
                        <div className={styles.uploadProgressContainer}>
                          <div className={styles.uploadProgressLabel}>
                            Uploading attachments{' '}
                            {projectCommentUploadProgress.completed}/
                            {projectCommentUploadProgress.total} (
                            {projectCommentUploadPercent}%)
                          </div>
                          <div className={styles.uploadProgressBar}>
                            <div
                              className={styles.uploadProgressFill}
                              style={{
                                width: `${projectCommentUploadPercent}%`,
                              }}
                            />
                          </div>
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
                      {isSubmittingComment
                        ? projectCommentUploadProgress.active
                          ? `Uploading ${projectCommentUploadPercent}%`
                          : 'Posting...'
                        : 'Post'}
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
        projectDueDate={project.due_date}
        parentTasks={parentTasks}
        projectMembers={project.members}
        projectAssignedTo={project.assigned_to_profile?.id}
        availableCategories={availableTaskCategories}
        departments={departments}
      />

      {/* Task Detail Sidebar */}
      <ProjectTaskDetail
        task={selectedTask}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={async (taskId, updates) => {
          if (!project?.id) return;
          const hasUpdates = Object.keys(updates).length > 0;

          if (hasUpdates) {
            const assignedTo = updates.assigned_to || null;
            await ensureProjectMember(assignedTo);
            await updateTask(project.id, taskId, updates);
          }

          // Refresh the task details to show updated data
          const response = await fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`);
          const updatedTask = await response.json();
          setSelectedTask(updatedTask);
        }}
        onUpdateRelatedTask={handleUpdateRelatedTask}
        onDelete={() => handleDeleteTask()}
        onAddComment={handleAddComment}
        onCreateSubtask={handleCreateSubtask}
        onUpdateProgress={handleUpdateProgress}
        users={users}
        mentionUsers={mentionUsers}
        highlightedCommentId={highlightedTaskCommentId}
        onToggleStar={(taskId) => toggleStar('task', taskId)}
        isStarred={(taskId) => isStarred('task', taskId)}
        availableCategories={availableTaskCategories}
        projectMembers={project.members}
        projectAssignedTo={project.assigned_to_profile?.id}
        availableTasks={tasks}
        departments={departments}
        currentUserId={user.id}
      />

      {/* Duplicate Project Modal */}
      <DuplicateProjectModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onDuplicate={handleDuplicateProject}
        defaultName={`${project.name} (Copy)`}
        defaultCompanyId={project.company.id}
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

      {/* Error Modal */}
      {showErrorModal && (
        <ConfirmationModal
          isOpen={showErrorModal}
          title={errorTitle}
          message={errorMessage}
          confirmText="OK"
          cancelText=""
          onConfirm={() => setShowErrorModal(false)}
          onCancel={() => setShowErrorModal(false)}
        />
      )}

      {/* Delete Attachment Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAttachmentModal}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDeleteAttachment}
        onCancel={() => {
          setShowDeleteAttachmentModal(false);
          setAttachmentToDelete(null);
        }}
      />
    </div>
  );
}
