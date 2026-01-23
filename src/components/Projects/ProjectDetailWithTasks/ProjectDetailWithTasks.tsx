'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Toast } from '@/components/Common/Toast';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { Project, ProjectComment, ProjectTask, User as ProjectUser } from '@/types/project';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useUser } from '@/hooks/useUser';
import { adminAPI } from '@/lib/api-client';
import { usePageActions } from '@/contexts/PageActionsContext';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import ProjectTaskList from '../ProjectTaskList/ProjectTaskList';
import ProjectTaskForm from '../ProjectTaskForm/ProjectTaskForm';
import ProjectTaskDetail from '../ProjectTaskDetail/ProjectTaskDetail';
import headerStyles from '@/components/Layout/GlobalLowerHeader/GlobalLowerHeader.module.scss';
import styles from './ProjectDetailWithTasks.module.scss';

interface ProjectDetailWithTasksProps {
  project: Project;
  user: User;
  onProjectUpdate?: () => void;
}

const formatHeaderDate = (value?: string | null) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function ProjectDetailWithTasks({ project, user, onProjectUpdate }: ProjectDetailWithTasksProps) {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [commentAvatarError, setCommentAvatarError] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
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
  const router = useRouter();
  const { setPageHeader } = usePageActions();
  const { getAvatarUrl, getDisplayName, getInitials } = useUser();

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

  // Fetch tasks and users on mount
  React.useEffect(() => {
    fetchTasks(project.id);
    // Also fetch users for assignment
    adminAPI.getUsers().then(data => setUsers(data || [])).catch(() => {});
  }, [project.id, fetchTasks]);

  React.useEffect(() => {
    setIsProjectComplete(project.status === 'complete');
  }, [project.status]);

  React.useEffect(() => {
    if (!isEditingProjectDescription) {
      setProjectDescriptionDraft(project.description || '');
    }
  }, [project.description, project.id, isEditingProjectDescription]);

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

    setPageHeader({
      title: headerTitle,
      description: `<span style="margin-right: 12px;">Due Date: ${formatHeaderDate(project.due_date)}</span><span>Updated: ${formatHeaderDate(project.updated_at)}</span>`,
      customActions: (
        <>
          <button
            className={headerStyles.addLeadButton}
            onClick={handleCreateTask}
            type="button"
          >
            <Plus size={18} />
            <span>Create Task</span>
          </button>
          <button
            className={`${headerStyles.addLeadButton} ${headerStyles.deleteButton}`}
            onClick={handleDeleteProject}
            type="button"
          >
            <Trash2 size={18} />
            <span>Delete Project</span>
          </button>
        </>
      ),
    });
  }, [
    project,
    handleCreateTask,
    handleDeleteProject,
    setPageHeader,
  ]);

  React.useEffect(() => {
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const handleTaskClick = (task: ProjectTask) => {
    // Fetch full task details
    fetch(`/api/admin/projects/${project.id}/tasks/${task.id}`)
      .then(res => res.json())
      .then(fullTask => {
        setSelectedTask(fullTask);
        setIsTaskDetailOpen(true);
      })
      .catch(err => console.error('Error fetching task details:', err));
  };

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
  };

  // Handler for inline task updates (title, due_date, etc.)
  const handleUpdateTaskInline = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
    await updateTask(project.id, taskId, updates);
  }, [project.id, updateTask]);

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

  const rawAvatarUrl = getAvatarUrl();
  const commentAvatarUrl =
    commentAvatarError || !rawAvatarUrl || rawAvatarUrl === 'null' || rawAvatarUrl === 'undefined'
      ? null
      : rawAvatarUrl;

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

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const comment = await response.json();
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setToastMessage('Failed to post comment.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
    if (!editingCommentText.trim()) {
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
                <span className={styles.projectShortcode}>
                  {project.shortcode || 'No Shortcode'}
                </span>
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
                Tasks <span className={styles.sectionCount}>({tasks.length})</span>
              </h2>
            </div>

            {!isTasksCollapsed && (
              <ProjectTaskList
                tasks={tasks}
                onTaskClick={handleTaskClick}
                onToggleComplete={handleToggleComplete}
                onUpdateTask={handleUpdateTaskInline}
                onDeleteTask={handleDeleteTaskFromList}
                onReorderTasks={handleReorderTasks}
                isLoading={isLoading}
                showHeader={false}
              />
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
                          <div key={comment.id} className={styles.commentItem}>
                            <div className={styles.commentMeta}>
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
                                        disabled={isUpdatingComment || !editingCommentText.trim()}
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
                              <textarea
                                className={styles.commentEditInput}
                                value={editingCommentText}
                                onChange={event => setEditingCommentText(event.target.value)}
                                rows={2}
                                autoFocus
                              />
                            ) : (
                              <div className={styles.commentText}>{comment.comment}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.commentsEmpty}>No comments yet.</div>
                  )}

                  <form onSubmit={handleSubmitComment} className={styles.commentComposer}>
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
                    <input
                      type="text"
                      placeholder="Comment"
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      className={styles.commentInput}
                    />
                    <button
                      type="submit"
                      className={styles.commentSubmit}
                      disabled={isSubmittingComment || !newComment.trim()}
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
        }}
        onDelete={() => handleDeleteTask()}
        onAddComment={handleAddComment}
        onCreateSubtask={handleCreateSubtask}
        onUpdateProgress={handleUpdateProgress}
        users={users}
      />
    </div>
  );
}
