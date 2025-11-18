'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User as UserIcon,
  Building,
  Clock,
  DollarSign,
  Tag,
  FileText,
  AlertCircle,
  MessageSquare,
  Activity as ActivityIcon,
  CheckSquare,
  X,
} from 'lucide-react';
import { Project, ProjectComment, ProjectActivity, statusOptions, priorityOptions } from '@/types/project';
import styles from './ProjectDetail.module.scss';

const PRESET_PROJECT_TAGS = [
  'seo', 'social-media', 'content', 'design', 'development',
  'ppc', 'google-ads', 'facebook-ads', 'email', 'analytics',
  'branding', 'website', 'blog', 'video', 'photography',
  'local-seo', 'gmb', 'reviews', 'reporting', 'strategy',
  'print', 'digital', 'billboard', 'business-cards',
  'door-hangers', 'vehicle-wrap',
];

interface ProjectDetailProps {
  project: Project;
  user: User;
  onProjectUpdate?: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, user, onProjectUpdate }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    notes: project.notes || '',
    status: project.status || 'coming_up',
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
  });

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || '#6b7280';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatHours = (hours: number | null) => {
    if (!hours) return 'Not set';
    return `${hours} hours`;
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
        return `changed due date from ${new Date(activity.old_value).toLocaleDateString()} to ${new Date(activity.new_value).toLocaleDateString()}`;
      case 'start_date_changed':
        if (!activity.old_value && activity.new_value) {
          return `set start date to ${new Date(activity.new_value).toLocaleDateString()}`;
        } else if (activity.old_value && !activity.new_value) {
          return 'removed the start date';
        }
        return `changed start date from ${new Date(activity.old_value).toLocaleDateString()} to ${new Date(activity.new_value).toLocaleDateString()}`;
      case 'completion_date_changed':
        if (!activity.old_value && activity.new_value) {
          return `set completion date to ${new Date(activity.new_value).toLocaleDateString()}`;
        } else if (activity.old_value && !activity.new_value) {
          return 'removed the completion date';
        }
        return `changed completion date from ${new Date(activity.old_value).toLocaleDateString()} to ${new Date(activity.new_value).toLocaleDateString()}`;
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
        return activity.action_type.replace(/_/g, ' ');
    }
  };

  // Fetch comments and users on mount
  React.useEffect(() => {
    fetchComments();
    fetchUsers();
  }, [project.id]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEdit = () => {
    // Initialize form data when entering edit mode
    setEditFormData({
      name: project.name,
      description: project.description || '',
      notes: project.notes || '',
      status: project.status,
      priority: project.priority,
      assigned_to: project.assigned_to_profile?.id || '',
      due_date: project.due_date || '',
      start_date: project.start_date || '',
      completion_date: project.completion_date || '',
      tags: project.tags || [],
      project_type: project.project_type,
      project_subtype: project.project_subtype || '',
      is_billable: project.is_billable || false,
      quoted_price: project.quoted_price?.toString() || '',
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
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
          project_subtype: editFormData.project_subtype || null,
          is_billable: editFormData.is_billable,
          quoted_price: editFormData.quoted_price ? parseFloat(editFormData.quoted_price) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      setIsEditMode(false);

      // Call callback to refresh project data
      if (onProjectUpdate) {
        onProjectUpdate();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Navigate back to list
      router.push('/project-management');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    router.push('/project-management');
  };

  const handleToggleTag = (tag: string) => {
    const tags = editFormData.tags || [];
    if (tags.includes(tag)) {
      setEditFormData({ ...editFormData, tags: tags.filter(t => t !== tag) });
    } else {
      setEditFormData({ ...editFormData, tags: [...tags, tag] });
    }
  };

  return (
    <div className={styles.projectDetail}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <button onClick={handleBack} className={styles.breadcrumbLink}>
          Project Management
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{project.name}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Projects
          </button>
          {isEditMode ? (
            <input
              type="text"
              className={styles.editNameInput}
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />
          ) : (
            <h1 className={styles.projectName}>{project.name}</h1>
          )}
          <div className={styles.badges}>
            {isEditMode ? (
              <>
                <select
                  className={styles.editSelectBadge}
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  style={{ backgroundColor: getStatusColor(editFormData.status), color: 'white' }}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className={styles.editSelectBadge}
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })}
                  style={{ backgroundColor: getPriorityColor(editFormData.priority), color: 'white' }}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(project.status) }}
                >
                  {statusOptions.find(s => s.value === project.status)?.label}
                </span>
                <span
                  className={styles.priorityBadge}
                  style={{ backgroundColor: getPriorityColor(project.priority) }}
                >
                  {priorityOptions.find(p => p.value === project.priority)?.label}
                </span>
              </>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          {isEditMode ? (
            <>
              <button onClick={handleSaveEdit} className={styles.saveButton}>
                <CheckSquare size={18} />
                Save
              </button>
              <button onClick={handleCancelEdit} className={styles.cancelEditButton}>
                <X size={18} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEdit} className={styles.editButton}>
                <Edit size={18} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className={styles.deleteButton}
                disabled={isDeleting}
              >
                <Trash2 size={18} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.content}>
        {/* Left Column */}
        <div className={styles.mainColumn}>
          {/* Description */}
          {(project.description || isEditMode) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <FileText size={20} />
                Description
              </h2>
              {isEditMode ? (
                <textarea
                  className={styles.editTextarea}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                  placeholder="Add a description..."
                />
              ) : (
                <p className={styles.description}>{project.description}</p>
              )}
            </div>
          )}

          {/* Notes */}
          {(project.notes || isEditMode) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <AlertCircle size={20} />
                Notes
              </h2>
              {isEditMode ? (
                <textarea
                  className={styles.editTextarea}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={4}
                  placeholder="Add notes..."
                />
              ) : (
                <p className={styles.notes}>{project.notes}</p>
              )}
            </div>
          )}

          {/* Tags */}
          {((project.tags && project.tags.length > 0) || isEditMode) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Tag size={20} />
                Tags
              </h2>
              {isEditMode ? (
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
              ) : (
                <div className={styles.tags}>
                  {project.tags?.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MessageSquare size={20} />
              Comments ({comments.length})
            </h2>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className={styles.commentForm}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className={styles.commentInput}
                rows={3}
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className={styles.commentSubmitButton}
              >
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            {/* Comments List */}
            {comments.length > 0 && (
              <div className={styles.comments}>
                {comments.map(comment => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAuthor}>
                        {comment.user_profile?.first_name} {comment.user_profile?.last_name}
                      </div>
                      <div className={styles.commentDate}>
                        {formatDateTime(comment.created_at)}
                      </div>
                    </div>
                    <div className={styles.commentText}>{comment.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          {project.activity && project.activity.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <ActivityIcon size={20} />
                Activity
              </h2>
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
                          {activity.user_profile?.first_name} {activity.user_profile?.last_name}
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
            </div>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className={styles.sideColumn}>
          {/* Project Info */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Project Information</h3>

            <div className={styles.infoItem}>
              <Building size={16} />
              <div>
                <div className={styles.infoLabel}>Company</div>
                <div className={styles.infoValue}>{project.company.name}</div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <FileText size={16} />
              <div>
                <div className={styles.infoLabel}>Project Type</div>
                <div className={styles.infoValue}>{project.project_type}</div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <UserIcon size={16} />
              <div>
                <div className={styles.infoLabel}>Requested By</div>
                <div className={styles.infoValue}>
                  {project.requested_by_profile.first_name}{' '}
                  {project.requested_by_profile.last_name}
                </div>
                <div className={styles.infoEmail}>
                  {project.requested_by_profile.email}
                </div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <UserIcon size={16} />
              <div>
                <div className={styles.infoLabel}>Assigned To</div>
                {isEditMode ? (
                  <select
                    className={styles.editSelect}
                    value={editFormData.assigned_to || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.profiles?.first_name} {user.profiles?.last_name}
                      </option>
                    ))}
                  </select>
                ) : project.assigned_to_profile ? (
                  <>
                    <div className={styles.infoValue}>
                      {project.assigned_to_profile.first_name}{' '}
                      {project.assigned_to_profile.last_name}
                    </div>
                    <div className={styles.infoEmail}>
                      {project.assigned_to_profile.email}
                    </div>
                  </>
                ) : (
                  <div className={styles.infoValue}>Unassigned</div>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Timeline</h3>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Due Date</div>
                {isEditMode ? (
                  <input
                    type="date"
                    className={styles.editInput}
                    value={editFormData.due_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                  />
                ) : (
                  <div className={styles.infoValue}>{formatDate(project.due_date)}</div>
                )}
              </div>
            </div>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Start Date</div>
                {isEditMode ? (
                  <input
                    type="date"
                    className={styles.editInput}
                    value={editFormData.start_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                  />
                ) : (
                  <div className={styles.infoValue}>{formatDate(project.start_date)}</div>
                )}
              </div>
            </div>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Completion Date</div>
                {isEditMode ? (
                  <input
                    type="date"
                    className={styles.editInput}
                    value={editFormData.completion_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, completion_date: e.target.value })}
                  />
                ) : (
                  <div className={styles.infoValue}>{formatDate(project.completion_date)}</div>
                )}
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Billing</h3>

            <div className={styles.infoItem}>
              <DollarSign size={16} />
              <div>
                <div className={styles.infoLabel}>Is Billable</div>
                {isEditMode ? (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editFormData.is_billable}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        is_billable: e.target.checked,
                        quoted_price: e.target.checked ? editFormData.quoted_price : '',
                      })}
                    />
                    <span>Yes</span>
                  </label>
                ) : (
                  <div className={styles.infoValue}>
                    {project.is_billable ? 'Yes' : 'No'}
                  </div>
                )}
              </div>
            </div>

            {(project.is_billable || (isEditMode && editFormData.is_billable)) && (
              <div className={styles.infoItem}>
                <DollarSign size={16} />
                <div>
                  <div className={styles.infoLabel}>Quoted Price</div>
                  {isEditMode ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={styles.editInput}
                      value={editFormData.quoted_price}
                      onChange={(e) => setEditFormData({ ...editFormData, quoted_price: e.target.value })}
                      placeholder="0.00"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {formatCurrency(project.quoted_price)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Metadata</h3>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Created</div>
                <div className={styles.infoValue}>{formatDate(project.created_at)}</div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Last Updated</div>
                <div className={styles.infoValue}>{formatDate(project.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
