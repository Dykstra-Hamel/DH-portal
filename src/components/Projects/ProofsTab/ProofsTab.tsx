'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, Download, FileText, Pencil, Trash2, Upload, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { sanitizeFileName } from '@/lib/storage-utils';
import { Project, ProjectProof, ProofFeedback, ProofGroup } from '@/types/project';
import dynamic from 'next/dynamic';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { Toast } from '@/components/Common/Toast/Toast';
import styles from './ProofsTab.module.scss';

const ProofViewer = dynamic(() => import('../ProofViewer/ProofViewer'), {
  ssr: false,
});

const isRichTextEmpty = (html: string) => {
  const textContent = html.replace(/<[^>]*>/g, '').trim();
  return textContent.length === 0;
};

interface MentionUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const PROOF_ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
];

function formatProofDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatFeedbackDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ProofsTabProps {
  project: Project;
  user: User;
  canEdit: boolean;
  mentionUsers?: MentionUser[];
  autoOpenProofId?: string | null;
  onProofModalClosed?: () => void;
}

export default function ProofsTab({ project, user, canEdit, mentionUsers, autoOpenProofId, onProofModalClosed }: ProofsTabProps) {
  const [proofGroups, setProofGroups] = useState<ProofGroup[]>([]);
  const [isProofsLoading, setIsProofsLoading] = useState(true);
  const [feedbackItems, setFeedbackItems] = useState<ProofFeedback[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingGroupId, setUploadingGroupId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [generalComment, setGeneralComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewingProof, setViewingProof] = useState<ProjectProof | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupFileInputRef = useRef<HTMLInputElement>(null);
  const pendingGroupIdRef = useRef<string | null>(null);

  const fetchProofs = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsProofsLoading(true);
    }
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs`);
      if (!res.ok) return;
      const data = await res.json();
      const groups: ProofGroup[] = data.proofGroups ?? [];
      setProofGroups(groups);
      setViewingProof((prev) => {
        if (!prev) return null;
        const allProofs = groups.flatMap((g) => [
          ...(g.currentProof ? [g.currentProof] : []),
          ...(g.archivedProofs ?? []),
        ]);
        return allProofs.find((p) => p.id === prev.id) ?? null;
      });
    } catch {
      // silent
    } finally {
      if (showLoading) {
        setIsProofsLoading(false);
      }
    }
  }, [project.id]);

  const fetchFeedback = useCallback(async (proofId: string, showLoading = true) => {
    if (showLoading) {
      setIsFeedbackLoading(true);
    }
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${proofId}/feedback`);
      if (!res.ok) return;
      const data = await res.json();
      setFeedbackItems(data.feedback ?? []);
    } catch {
      // silent
    } finally {
      if (showLoading) {
        setIsFeedbackLoading(false);
      }
    }
  }, [project.id]);

  useEffect(() => {
    void fetchProofs(true);
    const profile = user as any;
    setIsAdmin(profile?.role === 'admin' || !!profile?.is_admin);
  }, [fetchProofs, user]);

  useEffect(() => {
    if (viewingProof) {
      void fetchFeedback(viewingProof.id, true);
    } else {
      setFeedbackItems([]);
      setIsFeedbackLoading(false);
    }
  }, [fetchFeedback, viewingProof]);

  useEffect(() => {
    const supabase = createClient();

    const proofsChannel = supabase
      .channel(`proofs-${project.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_proofs', filter: `project_id=eq.${project.id}` },
        () => { void fetchProofs(false); }
      )
      .subscribe();

    const feedbackChannel = supabase
      .channel(`proof-feedback-${project.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proof_feedback', filter: `project_id=eq.${project.id}` },
        () => {
          if (viewingProof) void fetchFeedback(viewingProof.id, false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(proofsChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [fetchFeedback, fetchProofs, project.id, viewingProof]);

  useEffect(() => {
    if (proofModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [proofModalOpen]);

  // Auto-open modal when parent requests a specific proof to be shown
  useEffect(() => {
    if (!autoOpenProofId) return;
    const allProofs = proofGroups.flatMap((g) => [
      ...(g.currentProof ? [g.currentProof] : []),
      ...(g.archivedProofs ?? []),
    ]);
    const target = allProofs.find((p) => p.id === autoOpenProofId);
    if (target) {
      setViewingProof(target);
      setProofModalOpen(true);
    }
  }, [autoOpenProofId, proofGroups]);

  const uploadProof = useCallback(async (file: File, groupId?: string) => {
    if (!canEdit) return;
    setUploadError(null);
    setIsUploading(true);
    setUploadingGroupId(groupId ?? null);

    try {
      const supabase = createClient();
      const sanitizedName = sanitizeFileName(file.name);
      const storagePath = `${project.id}/proofs/${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const res = await fetch(`/api/admin/projects/${project.id}/proofs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: storagePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          ...(groupId ? { group_id: groupId } : {}),
        }),
      });

      if (!res.ok) {
        await supabase.storage.from('project-files').remove([storagePath]);
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to register proof');
      }

      await fetchProofs(false);
      setToastVisible(true);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadingGroupId(null);
    }
  }, [canEdit, project.id, fetchProofs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!PROOF_ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only images (JPEG, PNG, WebP, GIF) and PDFs are allowed for proofs.');
      return;
    }
    uploadProof(file);
  };

  const handleGroupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const groupId = pendingGroupIdRef.current;
    pendingGroupIdRef.current = null;
    e.target.value = '';
    if (!file || !groupId) return;
    if (!PROOF_ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only images (JPEG, PNG, WebP, GIF) and PDFs are allowed for proofs.');
      return;
    }
    uploadProof(file, groupId);
  };

  const handleProofAction = useCallback(async (proofId: string, action: string) => {
    setActionInProgress(`${proofId}-${action}`);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${proofId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      await fetchProofs(false);
    } catch {
      // silent
    } finally {
      setActionInProgress(null);
    }
  }, [project.id, fetchProofs]);

  const handleDeleteProof = useCallback(async (proofId: string) => {
    setActionInProgress(`${proofId}-delete`);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${proofId}`, {
        method: 'DELETE',
      });
      if (!res.ok) return;
      if (viewingProof?.id === proofId) {
        setViewingProof(null);
        setProofModalOpen(false);
      }
      await fetchProofs(false);
    } catch {
      // silent
    } finally {
      setActionInProgress(null);
    }
  }, [project.id, fetchProofs, viewingProof]);

  const handleRenameGroup = useCallback(async (groupId: string, name: string) => {
    try {
      await fetch(`/api/admin/projects/${project.id}/proof-groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await fetchProofs(false);
    } catch {
      // silent
    }
  }, [project.id, fetchProofs]);

  const handleDownloadProof = useCallback(async (proof: ProjectProof) => {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${proof.id}/url`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = proof.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  }, [project.id]);

  const handleAddFeedback = useCallback(async (x: number, y: number, page: number, comment: string) => {
    if (!viewingProof) return;

    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${viewingProof.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x_percent: x, y_percent: y, page_number: page, comment }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setFeedbackItems((prev) => [...prev, data.feedback]);
    } catch {
      // silent
    }
  }, [viewingProof, project.id]);

  const handleAddComment = useCallback(async () => {
    if (!viewingProof || isRichTextEmpty(generalComment)) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${viewingProof.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: generalComment }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setFeedbackItems((prev) => [...prev, data.feedback]);
      setGeneralComment('');
    } catch {
      // silent
    } finally {
      setIsSubmittingComment(false);
    }
  }, [viewingProof, project.id, generalComment]);

  const handleResolvePin = useCallback(async (id: string, resolved: boolean) => {
    if (!viewingProof) return;

    try {
      const res = await fetch(
        `/api/admin/projects/${project.id}/proofs/${viewingProof.id}/feedback/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_resolved: resolved }),
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setFeedbackItems((prev) => prev.map((f) => (f.id === id ? data.feedback : f)));
    } catch {
      // silent
    }
  }, [viewingProof, project.id]);

  const handleDeletePin = useCallback(async (id: string) => {
    if (!viewingProof) return;

    try {
      const res = await fetch(
        `/api/admin/projects/${project.id}/proofs/${viewingProof.id}/feedback/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) return;
      setFeedbackItems((prev) => prev.filter((f) => f.id !== id));
      if (activePinId === id) setActivePinId(null);
    } catch {
      // silent
    }
  }, [viewingProof, project.id, activePinId]);

  const handleCloseModal = useCallback(() => {
    setProofModalOpen(false);
    setViewingProof(null);
    setActivePinId(null);
    setHoveredPinId(null);
    onProofModalClosed?.();
  }, [onProofModalClosed]);

  const openProofModal = useCallback((proof: ProjectProof) => {
    setViewingProof(proof);
    setProofModalOpen(true);
  }, []);

  const allProofsCount = proofGroups.reduce((acc, g) => {
    return acc + (g.currentProof ? 1 : 0) + (g.archivedProofs?.length ?? 0);
  }, 0);

  const unresolvedCount = isFeedbackLoading
    ? 0
    : feedbackItems.filter((f) => !f.is_resolved).length;

  return (
    <div className={styles.proofsTab}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h3 className={styles.title}>Design Proofs &amp; Final Files</h3>
          <p className={styles.subtitle}>Upload design proofs for customer review.</p>
        </div>
        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={PROOF_ALLOWED_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <input
              ref={groupFileInputRef}
              type="file"
              accept={PROOF_ALLOWED_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={handleGroupFileSelect}
              disabled={isUploading}
            />
            <button
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading && !uploadingGroupId ? (
                <>
                  <span className={styles.uploadSpinner} aria-hidden="true" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Upload Proof
                </>
              )}
            </button>
          </>
        )}
      </div>

      {uploadError && (
        <div className={styles.errorBanner}>
          {uploadError}
          <button onClick={() => setUploadError(null)}>×</button>
        </div>
      )}

      {/* Proof group cards */}
      {isProofsLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading proofs...</p>
        </div>
      ) : allProofsCount === 0 && proofGroups.length === 0 ? (
        <div className={styles.emptyState}>
          {canEdit ? (
            <>
              <p>No proofs uploaded yet.</p>
              <button
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className={styles.uploadSpinner} aria-hidden="true" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Upload First Proof
                  </>
                )}
              </button>
            </>
          ) : (
            <p>No proofs have been uploaded for this project yet.</p>
          )}
        </div>
      ) : (
        <div className={styles.proofGroups}>
          {proofGroups.map((group) => (
            <ProofGroupCard
              key={group.id}
              group={group}
              projectId={project.id}
              canEdit={canEdit}
              actionInProgress={actionInProgress}
              uploadingGroupId={uploadingGroupId}
              onOpen={openProofModal}
              onProofAction={handleProofAction}
              onDownload={handleDownloadProof}
              onDelete={handleDeleteProof}
              onRenameGroup={handleRenameGroup}
              onUploadNewVersion={() => {
                pendingGroupIdRef.current = group.id;
                groupFileInputRef.current?.click();
              }}
            />
          ))}
        </div>
      )}

      <Toast
        message="Proof uploaded successfully."
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        type="success"
      />

      {/* Proof review modal */}
      {proofModalOpen && viewingProof && (
        <div className={styles.proofModal}>
          <div className={styles.proofModalBackdrop} onClick={handleCloseModal} />
          <div className={styles.proofModalContent}>
            <div className={styles.proofModalHeader}>
              <div className={styles.proofModalTitle}>
                <span className={styles.proofModalFileName}>{viewingProof.file_name}</span>
                {viewingProof.is_approved && (
                  <span className={styles.approvedBadge}>Approved</span>
                )}
                <span className={styles.proofModalVersion}>
                  {viewingProof.is_current
                    ? `v${viewingProof.version} (current)`
                    : `v${viewingProof.version} (archived)`}
                </span>
              </div>
              <button className={styles.proofModalClose} onClick={handleCloseModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.proofModalBody}>
              <div className={styles.viewerWrapper}>
                <ProofViewer
                  proof={viewingProof}
                  projectId={project.id}
                  feedbackItems={feedbackItems}
                  canAddFeedback={!viewingProof.is_approved}
                  mentionUsers={mentionUsers}
                  activePinId={activePinId}
                  hoveredPinId={hoveredPinId}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  onPinClick={setActivePinId}
                  onAddFeedback={handleAddFeedback}
                  onResolvePin={handleResolvePin}
                  onDeletePin={handleDeletePin}
                />
              </div>

              <div className={styles.feedbackPanel}>
                <div className={styles.feedbackPanelHeader}>
                  <span className={styles.feedbackPanelTitle}>
                    Feedback
                    {unresolvedCount > 0 && (
                      <span className={styles.unresolvedBadge}>{unresolvedCount}</span>
                    )}
                  </span>
                </div>

                {viewingProof.is_approved && (
                  <div className={styles.approvedNotice}>
                    This proof is marked as approved. Feedback is locked.
                  </div>
                )}

                <div className={styles.feedbackList}>
                  {isFeedbackLoading ? (
                    <div className={styles.feedbackLoadingState}>
                      <div className={styles.loadingSpinnerSmall} />
                      <span>Loading feedback...</span>
                    </div>
                  ) : feedbackItems.length === 0 ? (
                    <p className={styles.emptyFeedback}>
                      {viewingProof.is_approved
                        ? 'No feedback was left on this approved proof.'
                        : 'No feedback yet. Leave a comment below or click on the proof to pin a specific spot.'}
                    </p>
                  ) : (
                    feedbackItems.map((item) => (
                      <button
                        key={item.id}
                        className={`${styles.feedbackListItem} ${activePinId === item.id ? styles.feedbackListItemActive : ''} ${item.is_resolved ? styles.feedbackListItemResolved : ''}`}
                        onClick={() => item.x_percent !== null ? setActivePinId(activePinId === item.id ? null : item.id) : undefined}
                        onMouseEnter={() => {
                          if (item.x_percent !== null) {
                            setHoveredPinId(item.id);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPinId((prev) => (prev === item.id ? null : prev));
                        }}
                        style={{ cursor: item.x_percent !== null ? 'pointer' : 'default' }}
                      >
                        <div className={styles.feedbackItemHeader}>
                          <div className={styles.feedbackItemAuthor}>
                            <MiniAvatar
                              firstName={item.user_profile?.first_name || undefined}
                              lastName={item.user_profile?.last_name || undefined}
                              email=""
                              avatarUrl={item.user_profile?.avatar_url ?? null}
                              size="small"
                              showTooltip={false}
                              className={styles.feedbackAvatar}
                            />
                            <span className={styles.feedbackItemAuthorName}>
                              {item.user_id === user.id
                                ? 'Me'
                                : `${item.user_profile?.first_name || ''} ${item.user_profile?.last_name || ''}`.trim() || 'Unknown'}
                            </span>
                          </div>
                          <div className={styles.feedbackItemHeaderRight}>
                            <span className={`${styles.feedbackPinBadge} ${item.is_resolved ? styles.feedbackPinBadgeResolved : ''} ${item.x_percent === null ? styles.feedbackPinBadgeComment : ''}`}>
                              {item.x_percent !== null ? item.pin_number : '—'}
                            </span>
                            {item.is_resolved && <span className={styles.resolvedTag}>Resolved</span>}
                          </div>
                        </div>
                        <span
                          className={styles.feedbackItemComment}
                          dangerouslySetInnerHTML={{ __html: item.comment }}
                        />
                        <span className={styles.feedbackItemDate}>{formatFeedbackDate(item.created_at)}</span>
                      </button>
                    ))
                  )}
                </div>

                {!viewingProof.is_approved && (
                  <div className={styles.commentComposer}>
                    <RichTextEditor
                      value={generalComment}
                      onChange={setGeneralComment}
                      placeholder="Leave a comment… (@mention to tag someone)"
                      compact
                      mentionUsers={mentionUsers}
                    />
                    <button
                      className={styles.commentSubmitButton}
                      onClick={handleAddComment}
                      disabled={isRichTextEmpty(generalComment) || isSubmittingComment}
                    >
                      {isSubmittingComment ? 'Posting…' : 'Comment'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Proof Group Card ──────────────────────────────────────────────────────────

interface ProofGroupCardProps {
  group: ProofGroup;
  projectId: string;
  canEdit: boolean;
  actionInProgress: string | null;
  uploadingGroupId: string | null;
  onOpen: (proof: ProjectProof) => void;
  onProofAction: (proofId: string, action: string) => void;
  onDownload: (proof: ProjectProof) => void;
  onDelete: (proofId: string) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onUploadNewVersion: () => void;
}

function ProofGroupCard({
  group,
  projectId,
  canEdit,
  actionInProgress,
  uploadingGroupId,
  onOpen,
  onProofAction,
  onDownload,
  onDelete,
  onRenameGroup,
  onUploadNewVersion,
}: ProofGroupCardProps) {
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(group.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const proof = group.currentProof ?? null;
  const isUploadingThis = uploadingGroupId === group.id;
  const archivedCount = group.archivedProofs?.length ?? 0;
  const isImage = proof?.mime_type.startsWith('image/');
  const thumbUrl = proof ? `/api/admin/projects/${projectId}/proofs/${proof.id}/url` : null;
  const uploaderName = proof?.uploaded_by_profile
    ? `${proof.uploaded_by_profile.first_name} ${proof.uploaded_by_profile.last_name}`
    : 'Team member';

  const isDeleting = proof ? actionInProgress === `${proof.id}-delete` : false;
  const isActioning = proof ? (actionInProgress?.startsWith(proof.id) && !isDeleting) : false;

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(group.name);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = () => {
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== group.name) {
      onRenameGroup(group.id, trimmed);
    } else {
      setRenameValue(group.name);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(group.name); }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    if (proof) onOpen(proof);
  };

  useEffect(() => {
    if (!isArchivedModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsArchivedModalOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isArchivedModalOpen]);

  return (
    <div className={styles.proofGroups}>
      <div
        className={`${styles.proofCard} ${proof?.is_approved ? styles.proofCardApproved : ''}`}
        onClick={handleCardClick}
        style={{ cursor: proof ? 'pointer' : 'default' }}
      >
        {/* Thumbnail */}
        <div
          className={styles.proofCardThumb}
          data-action="true"
          onClick={(e) => { e.stopPropagation(); if (proof) onOpen(proof); }}
        >
          {proof ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl!} alt={proof.file_name} className={styles.proofCardThumbImg} />
            ) : (
              <div className={styles.proofCardThumbDoc}><FileText size={28} /></div>
            )
          ) : (
            <div className={styles.proofCardThumbDoc}><FileText size={28} /></div>
          )}
        </div>

        {/* Info */}
        <div className={styles.proofCardInfo}>
          {/* Group name row — editable */}
          <div className={styles.groupNameRow} data-action="true">
            {isRenaming ? (
              <input
                ref={renameInputRef}
                className={styles.groupNameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <>
                <span className={styles.groupNameLabel}>{group.name}</span>
                {canEdit && (
                  <button className={styles.groupNameEditButton} onClick={startRename} aria-label="Rename group">
                    <Pencil size={12} />
                  </button>
                )}
              </>
            )}
          </div>

          {proof ? (
            <>
              <div className={styles.proofCardNameRow}>
                <span className={styles.proofCardName}>{proof.file_name}</span>
                {proof.is_approved && <span className={styles.approvedBadge}>Approved</span>}
              </div>
              <span className={styles.proofCardMeta}>
                Version {proof.version} · Uploaded by {uploaderName}
              </span>
              <span className={styles.proofCardDate}>{formatProofDate(proof.created_at)}</span>
            </>
          ) : (
            <span className={styles.proofCardMeta}>No proof uploaded yet</span>
          )}

          {/* Action buttons */}
          <div className={styles.proofCardActions} data-action="true">
            {canEdit && proof && !proof.is_approved && (
              <button
                className={styles.markApprovedButton}
                onClick={(e) => { e.stopPropagation(); onProofAction(proof.id, 'mark_approved'); }}
                disabled={!!isActioning}
              >
                <CheckCircle size={14} />
                Mark as Approved
              </button>
            )}
            {canEdit && proof && proof.is_approved && (
              <button
                className={styles.unmarkApprovedButton}
                onClick={(e) => { e.stopPropagation(); onProofAction(proof.id, 'unmark_approved'); }}
                disabled={!!isActioning}
              >
                Unmark Approved
              </button>
            )}
            {canEdit && (
              <button
                className={styles.uploadVersionButton}
                onClick={(e) => { e.stopPropagation(); onUploadNewVersion(); }}
                disabled={isUploadingThis}
              >
                {isUploadingThis ? (
                  <><span className={styles.uploadSpinnerDark} aria-hidden="true" />Uploading…</>
                ) : (
                  <><Upload size={13} />Upload New Version</>
                )}
              </button>
            )}
            {proof && (
              <button
                className={styles.downloadButton}
                onClick={(e) => { e.stopPropagation(); onDownload(proof); }}
              >
                <Download size={14} />
                Download
              </button>
            )}
            {archivedCount > 0 && (
              <button
                className={styles.groupArchivedLink}
                onClick={(e) => { e.stopPropagation(); setIsArchivedModalOpen(true); }}
              >
                View previous versions ({archivedCount})
              </button>
            )}
          </div>
        </div>

        {/* Delete current proof */}
        {canEdit && proof && (
          <button
            className={styles.proofCardDelete}
            data-action="true"
            onClick={(e) => { e.stopPropagation(); onDelete(proof.id); }}
            disabled={isDeleting}
            aria-label="Delete proof"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {archivedCount > 0 && isArchivedModalOpen && (
        <div className={styles.archivedVersionsModal}>
          <div
            className={styles.archivedVersionsModalBackdrop}
            onClick={() => setIsArchivedModalOpen(false)}
          />
          <div className={styles.archivedVersionsModalContent}>
            <div className={styles.archivedVersionsModalHeader}>
              <div className={styles.archivedVersionsModalTitle}>
                <span className={styles.archivedVersionsGroupName}>{group.name}</span>
                <span className={styles.archivedVersionsCount}>
                  {archivedCount} previous version{archivedCount === 1 ? '' : 's'}
                </span>
              </div>
              <button
                className={styles.proofModalClose}
                onClick={() => setIsArchivedModalOpen(false)}
                aria-label="Close previous versions"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.archivedVersionsModalBody}>
              <div className={styles.proofList}>
                {(group.archivedProofs ?? []).map((archived) => (
                  <ProofCard
                    key={archived.id}
                    proof={archived}
                    projectId={projectId}
                    canEdit={canEdit}
                    actionInProgress={actionInProgress}
                    onOpen={() => {
                      setIsArchivedModalOpen(false);
                      onOpen(archived);
                    }}
                    onMarkApproved={() => onProofAction(archived.id, 'mark_approved')}
                    onUnmarkApproved={() => onProofAction(archived.id, 'unmark_approved')}
                    onRestoreCurrent={() => onProofAction(archived.id, 'restore_current')}
                    onDownload={() => onDownload(archived)}
                    onDelete={() => onDelete(archived.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Proof Card ────────────────────────────────────────────────────────────────

interface ProofCardProps {
  proof: ProjectProof;
  projectId: string;
  canEdit: boolean;
  actionInProgress: string | null;
  onOpen: () => void;
  onMarkApproved: () => void;
  onUnmarkApproved: () => void;
  onRestoreCurrent?: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function ProofCard({
  proof,
  projectId,
  canEdit,
  actionInProgress,
  onOpen,
  onMarkApproved,
  onUnmarkApproved,
  onRestoreCurrent,
  onDownload,
  onDelete,
}: ProofCardProps) {
  const isImage = proof.mime_type.startsWith('image/');
  const thumbUrl = `/api/admin/projects/${projectId}/proofs/${proof.id}/url`;
  const uploaderName = proof.uploaded_by_profile
    ? `${proof.uploaded_by_profile.first_name} ${proof.uploaded_by_profile.last_name}`
    : 'Team member';

  const isDeleting = actionInProgress === `${proof.id}-delete`;
  const isActioning = actionInProgress?.startsWith(proof.id) && !isDeleting;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    onOpen();
  };

  return (
    <div
      className={`${styles.proofCard} ${proof.is_approved ? styles.proofCardApproved : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Thumbnail */}
      <div className={styles.proofCardThumb} data-action="true" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={proof.file_name} className={styles.proofCardThumbImg} />
        ) : (
          <div className={styles.proofCardThumbDoc}>
            <FileText size={28} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.proofCardInfo}>
        <div className={styles.proofCardNameRow}>
          <span className={styles.proofCardName}>{proof.file_name}</span>
          {proof.is_approved && <span className={styles.approvedBadge}>Approved</span>}
        </div>
        <span className={styles.proofCardMeta}>
          Version {proof.version} · Uploaded by {uploaderName}
        </span>
        <span className={styles.proofCardDate}>{formatProofDate(proof.created_at)}</span>

        {/* Action buttons */}
        <div className={styles.proofCardActions} data-action="true">
          {canEdit && proof.is_current && !proof.is_approved && (
            <button
              className={styles.markApprovedButton}
              onClick={(e) => { e.stopPropagation(); onMarkApproved(); }}
              disabled={!!isActioning}
            >
              <CheckCircle size={14} />
              Mark as Approved
            </button>
          )}
          {canEdit && proof.is_current && proof.is_approved && (
            <button
              className={styles.unmarkApprovedButton}
              onClick={(e) => { e.stopPropagation(); onUnmarkApproved(); }}
              disabled={!!isActioning}
            >
              Unmark Approved
            </button>
          )}
          {canEdit && onRestoreCurrent && !proof.is_current && (
            <button
              className={styles.restoreButton}
              onClick={(e) => { e.stopPropagation(); onRestoreCurrent(); }}
              disabled={!!isActioning}
            >
              Make Current
            </button>
          )}
          <button
            className={styles.downloadButton}
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* Delete */}
      {canEdit && (
        <button
          className={styles.proofCardDelete}
          data-action="true"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={isDeleting}
          aria-label="Delete proof"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
