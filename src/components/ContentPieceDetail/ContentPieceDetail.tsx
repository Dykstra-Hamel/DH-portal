'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';
import { ProjectTask } from '@/types/project';
import { useStarredItems } from '@/hooks/useStarredItems';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import headerStyles from '@/components/Layout/GlobalLowerHeader/GlobalLowerHeader.module.scss';
import styles from './ContentPieceDetail.module.scss';

function getDraftCount(contentType: string): number {
  if (['pest_id', 'location', 'cluster', 'pillar'].includes(contentType)) return 1;
  if (contentType === 'evergreen') return 2;
  return 3;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: 'Blog',
  evergreen: 'Evergreen',
  location: 'Location',
  pillar: 'Pillar',
  cluster: 'Cluster',
  pest_id: 'Pest ID',
  other: 'Other',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  blog: '#3b82f6',
  evergreen: '#10b981',
  location: '#f59e0b',
  pillar: '#8b5cf6',
  cluster: '#ec4899',
  pest_id: '#ef4444',
  other: '#6b7280',
};

interface ContentPiece {
  id: string;
  monthly_service_id: string | null;
  task_id: string | null;
  content_type: string | null;
  title: string | null;
  publish_date: string | null;
  link: string | null;
  notes: string | null;
  topic: string | null;
  ai_topics:    { items: string[]; prompt: string; generated_at: string } | null;
  ai_headlines: { items: string[]; prompt: string; generated_at: string } | null;
  ai_draft:     { items: Array<{ approach: string; content: string }>; selected_index?: number; prompt: string; generated_at: string } | null;
  content?: string | null;
  is_completed: boolean;
  service_month: string | null;
  created_at: string;
  updated_at: string;
  service_id: string | null;
  service_name: string | null;
  company_id: string | null;
  company_name: string | null;
  task_title: string | null;
  task_is_completed: boolean | null;
  task_due_date: string | null;
  task_assigned_to: string | null;
  task_assignee_name: string | null;
  social_media_task_id: string | null;
  social_media_task_title: string | null;
  social_media_task_is_completed: boolean | null;
  social_media_task_due_date: string | null;
  social_media_task_assigned_to: string | null;
  social_media_task_assignee_name: string | null;
}

interface AISuggestResponse {
  topics: string[];
}

interface ContentPieceDetailProps {
  contentPiece: ContentPiece;
  user: User;
  onPieceUpdate: (updated: ContentPiece) => void;
}

export function ContentPieceDetail({ contentPiece, user, onPieceUpdate }: ContentPieceDetailProps) {
  const supabase = createClient();
  const router = useRouter();
  const { setPageHeader } = usePageActions();
  const { registerGuard, unregisterGuard } = useNavigationGuard();

  // Edit form state
  const [editContentType, setEditContentType] = useState(contentPiece.content_type || '');
  const [editTitle, setEditTitle] = useState(contentPiece.title || '');
  const [editTopic, setEditTopic] = useState(contentPiece.topic || '');
  const [editPublishDate, setEditPublishDate] = useState(contentPiece.publish_date || '');
  const [editLink, setEditLink] = useState(contentPiece.link || '');
  const [editNotes, setEditNotes] = useState(contentPiece.notes || '');
  const [editContent, setEditContent] = useState<string>(contentPiece.content || '');
  const [isContentDirty, setIsContentDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApprovingTopic, setIsApprovingTopic] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isContentSaving, setIsContentSaving] = useState(false);
  const [contentSaveMessage, setContentSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Task detail panel state
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const { isStarred, toggleStar } = useStarredItems();

  // AI topic assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestResponse | null>(() => {
    if (contentPiece.ai_topics?.items?.length) {
      return { topics: contentPiece.ai_topics.items };
    }
    return null;
  });
  const [aiError, setAiError] = useState<string | null>(null);

  // AI headline generator state
  const [headlinePrompt, setHeadlinePrompt] = useState('');
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [headlineSuggestions, setHeadlineSuggestions] = useState<string[] | null>(() => {
    return contentPiece.ai_headlines?.items?.length ? contentPiece.ai_headlines.items : null;
  });
  const [headlineError, setHeadlineError] = useState<string | null>(null);

  // AI draft generator state
  const [draftPrompt, setDraftPrompt] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftSuggestions, setDraftSuggestions] = useState<Array<{ approach: string; content: string }> | null>(() => {
    return contentPiece.ai_draft?.items?.length ? contentPiece.ai_draft.items : null;
  });
  const [draftError, setDraftError] = useState<string | null>(null);
  const [expandedDraft, setExpandedDraft] = useState<number | null>(null);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number | null>(() => {
    return contentPiece.ai_draft?.selected_index ?? null;
  });
  const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
  const [pendingDraftIndex, setPendingDraftIndex] = useState<number | null>(null);
  const [navWarningOpen, setNavWarningOpen] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  const historyGuardPushed = useRef(false);

  const mentionUsers = useMemo(() => {
    return users.map(u => {
      const profile = (u as any).profiles;
      return {
        id: profile?.id || u.id,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        email: profile?.email || (u as any).email || null,
        avatar_url: profile?.avatar_url || null,
      };
    });
  }, [users]);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-pieces/${contentPiece.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          content_type: editContentType || null,
          title: editTitle || null,
          topic: editTopic || null,
          publish_date: editPublishDate || null,
          link: editLink || null,
          notes: editNotes || null,
          content: editContent || null,
        }),
      });

      if (!response.ok) {
        setSaveMessage({ type: 'error', text: 'Failed to save changes.' });
        return;
      }

      const data = await response.json();
      onPieceUpdate({
        ...contentPiece,
        ...data.contentPiece,
        ...(contentPiece.task_id && editTitle ? { task_title: editTitle } : {}),
      });
      setIsContentDirty(false);
      setSaveMessage({ type: 'success', text: 'Changes saved.' });

      if (contentPiece.task_id && editTitle && editTitle !== contentPiece.task_title) {
        await fetch(`/api/admin/tasks/${contentPiece.task_id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ title: editTitle }),
        });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTask = async () => {
    if (!contentPiece.task_id) return;
    const headers = await getAuthHeaders();

    const [taskRes, usersRes, depsRes] = await Promise.all([
      fetch(`/api/admin/tasks/${contentPiece.task_id}`, { headers }),
      fetch('/api/admin/users?include_system=true', { headers }),
      fetch('/api/admin/monthly-services/departments', { headers }),
    ]);

    if (taskRes.ok) {
      const taskData = await taskRes.json();
      setSelectedTask(taskData.task ?? taskData);
    }
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setUsers(usersData);
    }
    if (depsRes.ok) {
      const depsData = await depsRes.json();
      setDepartments(depsData.departments || []);
    }

    setIsTaskDetailOpen(true);
  };

  const handleOpenSocialMediaTask = async () => {
    if (!contentPiece.social_media_task_id) return;
    const headers = await getAuthHeaders();

    const [taskRes, usersRes, depsRes] = await Promise.all([
      fetch(`/api/admin/tasks/${contentPiece.social_media_task_id}`, { headers }),
      fetch('/api/admin/users?include_system=true', { headers }),
      fetch('/api/admin/monthly-services/departments', { headers }),
    ]);

    if (taskRes.ok) {
      const taskData = await taskRes.json();
      setSelectedTask(taskData.task ?? taskData);
    }
    if (usersRes.ok) setUsers(await usersRes.json());
    if (depsRes.ok) {
      const depsData = await depsRes.json();
      setDepartments(depsData.departments || []);
    }

    setIsTaskDetailOpen(true);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<ProjectTask>) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) return;
    const data = await res.json();
    const updated = data.task ?? data;
    setSelectedTask(updated);

    if ('is_completed' in updates) {
      if (taskId === contentPiece.task_id) {
        onPieceUpdate({ ...contentPiece, task_is_completed: updated.is_completed });
      } else if (taskId === contentPiece.social_media_task_id) {
        onPieceUpdate({ ...contentPiece, social_media_task_is_completed: updated.is_completed });
      }
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedTask) return null;
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/tasks/${selectedTask.id}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.comment ?? data;
  };

  const handleUpdateProgress = async (progress: number) => {
    if (!selectedTask) return;
    await handleUpdateTask(selectedTask.id, { progress_percentage: progress });
  };

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setAiError(null);
    setAiSuggestions(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-pieces/${contentPiece.id}/ai-suggest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        setAiError('Failed to generate suggestions. Please try again.');
        return;
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions);
    } catch {
      setAiError('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveTopic = async (topic: string) => {
    setIsApprovingTopic(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-pieces/${contentPiece.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ topic }),
      });
      if (!response.ok) return;
      setEditTopic(topic);
      onPieceUpdate({ ...contentPiece, topic });
    } finally {
      setIsApprovingTopic(false);
    }
  };

  const handleGenerateHeadlines = async () => {
    setIsGeneratingHeadlines(true);
    setHeadlineError(null);
    setHeadlineSuggestions(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-pieces/${contentPiece.id}/ai-headlines`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: headlinePrompt }),
      });
      if (!response.ok) {
        setHeadlineError('Failed to generate headlines. Please try again.');
        return;
      }
      const data = await response.json();
      setHeadlineSuggestions(data.suggestions.headlines);
    } catch {
      setHeadlineError('Failed to generate headlines. Please try again.');
    } finally {
      setIsGeneratingHeadlines(false);
    }
  };

  const handleUseHeadline = async (headline: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-pieces/${contentPiece.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title: headline }),
      });
      if (!response.ok) return;
      setEditTitle(headline);
      onPieceUpdate({ ...contentPiece, title: headline });
    } catch {
      // silently fail — title still updates in UI
    }
  };

  const handleGenerateDrafts = async () => {
    setIsGeneratingDraft(true);
    setDraftError(null);
    setDraftSuggestions(null);
    setExpandedDraft(null);
    setSelectedDraftIndex(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-pieces/${contentPiece.id}/ai-draft`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: draftPrompt }),
      });
      if (!response.ok) {
        setDraftError('Failed to generate drafts. Please try again.');
        return;
      }
      const data = await response.json();
      setDraftSuggestions(data.suggestions.drafts);
    } catch {
      setDraftError('Failed to generate drafts. Please try again.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const applyDraft = async (index: number) => {
    if (!draftSuggestions) return;
    setSelectedDraftIndex(index);
    const raw = draftSuggestions[index].content;
    const html = raw.trimStart().startsWith('<')
      ? raw
      : raw
          .split(/\n\n+/)
          .map((para: string) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('');
    setEditContent(html);
    setIsContentDirty(false);
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/content-pieces/${contentPiece.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        ai_draft: {
          items: draftSuggestions,
          selected_index: index,
          prompt: draftPrompt,
          generated_at: new Date().toISOString(),
        },
        content: html,
      }),
    });
  };

  const handleSaveContent = async () => {
    setIsContentSaving(true);
    setContentSaveMessage(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-pieces/${contentPiece.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ content: editContent || null }),
      });
      if (!response.ok) {
        setContentSaveMessage({ type: 'error', text: 'Failed to save content.' });
        return;
      }
      setIsContentDirty(false);
      setContentSaveMessage({ type: 'success', text: 'Content saved.' });
    } catch {
      setContentSaveMessage({ type: 'error', text: 'Failed to save content.' });
    } finally {
      setIsContentSaving(false);
    }
  };

  const handleUseDraft = (index: number) => {
    if (!draftSuggestions) return;
    const hasExistingContent = editContent.replace(/<[^>]+>/g, '').trim().length > 0;
    if (hasExistingContent) {
      setPendingDraftIndex(index);
      setOverwriteModalOpen(true);
    } else {
      applyDraft(index);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isContentDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isContentDirty]);

  useEffect(() => {
    if (isContentDirty && !historyGuardPushed.current) {
      history.pushState(null, '', window.location.href);
      historyGuardPushed.current = true;
    }

    if (!isContentDirty) {
      historyGuardPushed.current = false;
      return;
    }

    const handlePopState = () => {
      history.pushState(null, '', window.location.href);
      setNavWarningOpen(true);
      setPendingNavPath(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isContentDirty]);

  const handleNavigate = useCallback((path: string) => {
    if (isContentDirty) {
      setPendingNavPath(path);
      setNavWarningOpen(true);
    } else {
      router.push(path);
    }
  }, [isContentDirty, router]);

  useEffect(() => {
    if (isContentDirty) {
      registerGuard(() => true);
    } else {
      unregisterGuard();
    }
    return () => unregisterGuard();
  }, [isContentDirty, registerGuard, unregisterGuard]);

  const typeColor = editContentType
    ? CONTENT_TYPE_COLORS[editContentType] ?? '#6b7280'
    : '#6b7280';

  const typeLabel = editContentType
    ? CONTENT_TYPE_LABELS[editContentType] ?? editContentType
    : 'Unknown';

  const formattedUpdatedAt = new Date(contentPiece.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    setPageHeader({
      titleLeading: (
        <button
          type="button"
          onClick={() => handleNavigate('/admin/content-calendar')}
          className={headerStyles.backButton}
          aria-label="Back to Content Calendar"
        >
          <ArrowLeft size={16} />
        </button>
      ),
      title: contentPiece.title || 'Untitled Content Piece',
      description: [
        `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;color:white;background:${typeColor};margin-right:8px;">${typeLabel}</span>`,
        contentPiece.company_name || '',
        contentPiece.service_name ? ` &mdash; ${contentPiece.service_name}` : '',
      ].join(''),
    });
  }, [contentPiece, typeLabel, typeColor, router, setPageHeader, handleNavigate]);

  useEffect(() => {
    return () => setPageHeader(null);
  }, [setPageHeader]);

  return (
    <div className={styles.container}>
      <div className={styles.twoColLayout}>
        <div className={styles.leftCol}>
        {/* Edit Form */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Edit Details</h2>
          <div className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Content Type</label>
                <select
                  className={styles.select}
                  value={editContentType}
                  onChange={e => setEditContentType(e.target.value)}
                >
                  <option value="">Select type...</option>
                  <option value="blog">Blog</option>
                  <option value="evergreen">Evergreen</option>
                  <option value="location">Location</option>
                  <option value="pillar">Pillar</option>
                  <option value="cluster">Cluster</option>
                  <option value="pest_id">Pest ID</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Publish Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={editPublishDate}
                  onChange={e => setEditPublishDate(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Topic</label>
              <input
                type="text"
                className={styles.input}
                value={editTopic}
                onChange={e => setEditTopic(e.target.value)}
                placeholder="What is this content about?"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Title</label>
              <input
                type="text"
                className={styles.input}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Content title..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Link</label>
              <input
                type="url"
                className={styles.input}
                value={editLink}
                onChange={e => setEditLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notes</label>
              <textarea
                className={styles.textarea}
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Add notes, research, or context for this content piece..."
                rows={5}
              />
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveMessage && (
                <span className={saveMessage.type === 'success' ? styles.saveSuccess : styles.saveError}>
                  {saveMessage.text}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Linked Tasks */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Linked Tasks</h2>
          {!contentPiece.task_id && !contentPiece.social_media_task_id && (
            <p className={styles.noTask}>No linked tasks for this content piece.</p>
          )}
          {contentPiece.task_id && (
            <div
              className={styles.taskCard}
              onClick={handleOpenTask}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleOpenTask()}
            >
              <div className={styles.taskTitle}>{contentPiece.task_title || 'Untitled Task'}</div>
              <div className={styles.taskMeta}>
                <span className={contentPiece.task_is_completed ? styles.taskComplete : styles.taskPending}>
                  {contentPiece.task_is_completed ? 'Completed' : 'In Progress'}
                </span>
                {contentPiece.task_due_date && (
                  <span className={styles.taskMetaItem}>
                    Due: {new Date(contentPiece.task_due_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                )}
                {contentPiece.task_assignee_name && (
                  <span className={styles.taskMetaItem}>Assigned to: {contentPiece.task_assignee_name}</span>
                )}
              </div>
            </div>
          )}
          {contentPiece.social_media_task_id && (
            <div
              className={styles.taskCard}
              onClick={handleOpenSocialMediaTask}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleOpenSocialMediaTask()}
            >
              <div className={styles.taskTitle}>{contentPiece.social_media_task_title || 'Untitled Task'}</div>
              <div className={styles.taskMeta}>
                <span className={contentPiece.social_media_task_is_completed ? styles.taskComplete : styles.taskPending}>
                  {contentPiece.social_media_task_is_completed ? 'Completed' : 'In Progress'}
                </span>
                {contentPiece.social_media_task_due_date && (
                  <span className={styles.taskMetaItem}>
                    Due: {new Date(contentPiece.social_media_task_due_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                )}
                {contentPiece.social_media_task_assignee_name && (
                  <span className={styles.taskMetaItem}>Assigned to: {contentPiece.social_media_task_assignee_name}</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Content Body */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Content</h2>
          <RichTextEditor
            value={editContent}
            onChange={(html) => { setEditContent(html); setIsContentDirty(true); }}
            placeholder="Write or paste your content here, or generate a draft with AI..."
          />
          <div className={styles.formActions}>
            <button
              className={styles.saveBtn}
              onClick={handleSaveContent}
              disabled={isContentSaving}
            >
              {isContentSaving ? 'Saving...' : 'Save Content'}
            </button>
            {contentSaveMessage && (
              <span className={contentSaveMessage.type === 'success' ? styles.saveSuccess : styles.saveError}>
                {contentSaveMessage.text}
              </span>
            )}
            {isContentDirty && !contentSaveMessage && (
              <span className={styles.saveError}>Unsaved changes</span>
            )}
          </div>
        </section>

        {/* Last Modified */}
        <div className={styles.updatedAt}>
          Updated: {formattedUpdatedAt}
        </div>
        </div>{/* end leftCol */}

        <div className={styles.rightCol}>
        {/* AI Content Assistant */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>AI Content Assistant</h2>
          <p className={styles.aiDescription}>
            Generate 5 research-oriented content angles based on your company&apos;s pest pressure data, service areas, and content history. Approve one to use as the topic for this piece.
          </p>
          <div className={styles.aiPromptRow}>
            <textarea
              className={styles.aiPrompt}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Optional: add specific focus (e.g. 'spring mosquito season')..."
              rows={3}
            />
            <button
              className={styles.generateBtn}
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : aiSuggestions ? 'Regenerate' : 'Generate Topic Ideas'}
            </button>
          </div>

          {aiError && <p className={styles.aiError}>{aiError}</p>}

          {aiSuggestions && (
            <div className={styles.topicOptions}>
              {(aiSuggestions.topics || []).map((topic, i) => {
                const isApproved = contentPiece.topic === topic;
                return (
                  <div
                    key={i}
                    className={`${styles.topicOption} ${isApproved ? styles.topicOptionApproved : ''}`}
                  >
                    <span className={styles.topicOptionText}>{topic}</span>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleApproveTopic(topic)}
                      disabled={isApprovingTopic || isApproved}
                    >
                      {isApproved ? '✓ Approved' : 'Approve'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* AI Title Generator */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>AI Title Generator</h2>
          {!editTopic ? (
            <p className={styles.aiDescription}>
              Approve a topic above to unlock headline generation.
            </p>
          ) : (
            <>
              <p className={styles.aiDescription}>
                Generate 5 headline variations for: <strong>{editTopic}</strong>
              </p>
              <div className={styles.aiPromptRow}>
                <textarea
                  className={styles.aiPrompt}
                  value={headlinePrompt}
                  onChange={e => setHeadlinePrompt(e.target.value)}
                  placeholder="Optional: additional guidance (e.g. 'target homeowners', 'emphasize urgency')..."
                  rows={2}
                />
                <button
                  className={styles.generateBtn}
                  onClick={handleGenerateHeadlines}
                  disabled={isGeneratingHeadlines}
                >
                  {isGeneratingHeadlines ? 'Generating...' : headlineSuggestions ? 'Regenerate' : 'Generate Headlines'}
                </button>
              </div>
              {headlineError && <p className={styles.aiError}>{headlineError}</p>}
              {headlineSuggestions && (
                <div className={styles.topicOptions}>
                  {headlineSuggestions.map((headline, i) => {
                    const isSelected = editTitle === headline;
                    return (
                      <div
                        key={i}
                        className={`${styles.topicOption} ${isSelected ? styles.topicOptionApproved : ''}`}
                      >
                        <span className={styles.topicOptionText}>{headline}</span>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleUseHeadline(headline)}
                          disabled={isSelected}
                        >
                          {isSelected ? '✓ Selected' : 'Use as Title'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* AI Content Draft Generator */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>AI Content Draft Generator</h2>
          {!editTopic || !editTitle ? (
            <p className={styles.aiDescription}>
              Set both a topic and a title above to unlock draft generation.
            </p>
          ) : (
            <>
              <p className={styles.aiDescription}>
                Generate {getDraftCount(editContentType)} distinct {getDraftCount(editContentType) === 1 ? 'draft' : 'drafts'} for: <strong>{editTitle}</strong>
              </p>
              <div className={styles.aiPromptRow}>
                <textarea
                  className={styles.aiPrompt}
                  value={draftPrompt}
                  onChange={e => setDraftPrompt(e.target.value)}
                  placeholder="Optional: additional guidance (e.g. 'target commercial clients', 'mention our guarantee')..."
                  rows={2}
                />
                <button
                  className={styles.generateBtn}
                  onClick={handleGenerateDrafts}
                  disabled={isGeneratingDraft}
                >
                  {isGeneratingDraft ? 'Generating...' : draftSuggestions ? 'Regenerate Drafts' : 'Generate Drafts'}
                </button>
              </div>
              {draftError && <p className={styles.aiError}>{draftError}</p>}
              {draftSuggestions && (
                <div>
                  {draftSuggestions.map((draft, i) => {
                    const isSelected = selectedDraftIndex === i;
                    const isExpanded = expandedDraft === i;
                    const preview = draft.content.length > 200
                      ? draft.content.slice(0, draft.content.lastIndexOf(' ', 200)) + '...'
                      : draft.content;
                    return (
                      <div
                        key={i}
                        className={`${styles.draftCard} ${isSelected ? styles.draftCardSelected : ''}`}
                      >
                        <div className={styles.draftApproach}>{draft.approach}</div>
                        {isExpanded ? (
                          <div className={styles.draftFull}>{draft.content}</div>
                        ) : (
                          <div className={styles.draftPreview}>{preview}</div>
                        )}
                        <div className={styles.draftActions}>
                          <button
                            className={styles.expandBtn}
                            onClick={() => setExpandedDraft(isExpanded ? null : i)}
                          >
                            {isExpanded ? 'Show less' : 'Read full draft'}
                          </button>
                          <button
                            className={styles.selectDraftBtn}
                            onClick={() => handleUseDraft(i)}
                            disabled={isSelected}
                          >
                            {isSelected ? '✓ Selected' : 'Use this Draft'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
        </div>{/* end rightCol */}
      </div>{/* end twoColLayout */}

      {isTaskDetailOpen && selectedTask && (
        <ProjectTaskDetail
          task={selectedTask}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onDelete={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onAddComment={handleAddComment}
          onCreateSubtask={() => {}}
          onUpdateProgress={handleUpdateProgress}
          users={users}
          currentUserId={user.id}
          onToggleStar={taskId => toggleStar('task', taskId)}
          isStarred={taskId => isStarred('task', taskId)}
          monthlyServiceDepartments={departments}
          mentionUsers={mentionUsers}
        />
      )}

      <ConfirmationModal
        isOpen={overwriteModalOpen}
        title="Overwrite existing content?"
        message="You already have content written. Using this draft will replace it. This cannot be undone."
        confirmText="Yes, use this draft"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          setOverwriteModalOpen(false);
          if (pendingDraftIndex !== null) applyDraft(pendingDraftIndex);
          setPendingDraftIndex(null);
        }}
        onCancel={() => {
          setOverwriteModalOpen(false);
          setPendingDraftIndex(null);
        }}
      />

      <ConfirmationModal
        isOpen={navWarningOpen}
        title="You have unsaved content"
        message="Your content edits haven&apos;t been saved. If you leave now, those changes will be lost."
        confirmText="Leave without saving"
        cancelText="Stay and save"
        confirmVariant="danger"
        onConfirm={() => {
          setNavWarningOpen(false);
          if (pendingNavPath) {
            router.push(pendingNavPath);
            setPendingNavPath(null);
          } else {
            historyGuardPushed.current = false;
            history.go(-2);
          }
        }}
        onCancel={() => {
          setNavWarningOpen(false);
          setPendingNavPath(null);
        }}
      />
    </div>
  );
}
