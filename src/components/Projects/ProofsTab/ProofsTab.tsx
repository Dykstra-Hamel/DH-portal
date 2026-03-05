'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, Download, FileText, Trash2, Upload, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { sanitizeFileName } from '@/lib/storage-utils';
import { Project, ProjectProof, ProofFeedback } from '@/types/project';
import dynamic from 'next/dynamic';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
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
  const [currentProof, setCurrentProof] = useState<ProjectProof | null>(null);
  const [archivedProofs, setArchivedProofs] = useState<ProjectProof[]>([]);
  const [isProofsLoading, setIsProofsLoading] = useState(true);
  const [feedbackItems, setFeedbackItems] = useState<ProofFeedback[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [generalComment, setGeneralComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewingProof, setViewingProof] = useState<ProjectProof | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProofs = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsProofsLoading(true);
    }
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrentProof(data.currentProof);
      setArchivedProofs(data.archivedProofs ?? []);
      setViewingProof((prev) => {
        if (!prev) return null;
        const allProofs = [data.currentProof, ...(data.archivedProofs ?? [])].filter(Boolean);
        return allProofs.find((p: ProjectProof) => p.id === prev.id) ?? null;
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
    const proofToFetch = viewingProof ?? currentProof;
    if (proofToFetch) {
      void fetchFeedback(proofToFetch.id, true);
    } else {
      setFeedbackItems([]);
      setIsFeedbackLoading(false);
    }
  }, [fetchFeedback, viewingProof, currentProof]);

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
          const proofToFetch = viewingProof ?? currentProof;
          if (proofToFetch) void fetchFeedback(proofToFetch.id, false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(proofsChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [fetchFeedback, fetchProofs, project.id, viewingProof, currentProof]);

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
    const allProofs = currentProof ? [currentProof, ...archivedProofs] : archivedProofs;
    const target = allProofs.find((p) => p.id === autoOpenProofId);
    if (target) {
      setViewingProof(target.is_current ? null : target);
      setProofModalOpen(true);
    }
  }, [autoOpenProofId, currentProof, archivedProofs]);

  const uploadProof = useCallback(async (file: File) => {
    if (!canEdit) return;
    setUploadError(null);
    setIsUploading(true);

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
        }),
      });

      if (!res.ok) {
        await supabase.storage.from('project-files').remove([storagePath]);
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to register proof');
      }

      await fetchProofs(false);
      setViewingProof(null);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setIsUploading(false);
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
    const proofToUse = viewingProof ?? currentProof;
    if (!proofToUse) return;

    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${proofToUse.id}/feedback`, {
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
  }, [viewingProof, currentProof, project.id]);

  const handleAddComment = useCallback(async () => {
    const proofToUse = viewingProof ?? currentProof;
    if (!proofToUse || isRichTextEmpty(generalComment)) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/proofs/${proofToUse.id}/feedback`, {
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
  }, [viewingProof, currentProof, project.id, generalComment]);

  const handleResolvePin = useCallback(async (id: string, resolved: boolean) => {
    const proofToUse = viewingProof ?? currentProof;
    if (!proofToUse) return;

    try {
      const res = await fetch(
        `/api/admin/projects/${project.id}/proofs/${proofToUse.id}/feedback/${id}`,
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
  }, [viewingProof, currentProof, project.id]);

  const handleDeletePin = useCallback(async (id: string) => {
    const proofToUse = viewingProof ?? currentProof;
    if (!proofToUse) return;

    try {
      const res = await fetch(
        `/api/admin/projects/${project.id}/proofs/${proofToUse.id}/feedback/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) return;
      setFeedbackItems((prev) => prev.filter((f) => f.id !== id));
      if (activePinId === id) setActivePinId(null);
    } catch {
      // silent
    }
  }, [viewingProof, currentProof, project.id, activePinId]);

  const handleCloseModal = useCallback(() => {
    setProofModalOpen(false);
    setViewingProof(null);
    setActivePinId(null);
    setHoveredPinId(null);
    onProofModalClosed?.();
  }, [onProofModalClosed]);

  const openProofModal = useCallback((proof: ProjectProof) => {
    setViewingProof(proof.is_current ? null : proof);
    setProofModalOpen(true);
  }, []);

  const displayedProof = viewingProof ?? currentProof;
  const unresolvedCount = isFeedbackLoading
    ? 0
    : feedbackItems.filter((f) => !f.is_resolved).length;

  const allProofs = currentProof
    ? [currentProof, ...archivedProofs]
    : archivedProofs;

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

      {/* Proof cards */}
      {isProofsLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading proofs...</p>
        </div>
      ) : allProofs.length === 0 ? (
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
        <div className={styles.proofList}>
          {/* Current proof first */}
          {currentProof && (
            <ProofCard
              proof={currentProof}
              projectId={project.id}
              canEdit={canEdit}
              actionInProgress={actionInProgress}
              onOpen={() => openProofModal(currentProof)}
              onMarkFinal={() => handleProofAction(currentProof.id, 'mark_final')}
              onUnmarkFinal={() => handleProofAction(currentProof.id, 'unmark_final')}
              onDownload={() => handleDownloadProof(currentProof)}
              onDelete={() => handleDeleteProof(currentProof.id)}
            />
          )}

          {/* Archived proofs */}
          {archivedProofs.length > 0 && (
            <div className={styles.archivedSection}>
              <button
                className={styles.archivedLink}
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? 'Hide' : 'View'} Archived Proofs ({archivedProofs.length})
              </button>
              {showArchived && (
                <div className={styles.proofList} style={{ marginTop: 8 }}>
                  {archivedProofs.map((proof) => (
                    <ProofCard
                      key={proof.id}
                      proof={proof}
                      projectId={project.id}
                      canEdit={canEdit}
                      actionInProgress={actionInProgress}
                      onOpen={() => openProofModal(proof)}
                      onMarkFinal={() => handleProofAction(proof.id, 'mark_final')}
                      onUnmarkFinal={() => handleProofAction(proof.id, 'unmark_final')}
                      onRestoreCurrent={() => handleProofAction(proof.id, 'restore_current')}
                      onDownload={() => handleDownloadProof(proof)}
                      onDelete={() => handleDeleteProof(proof.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Proof review modal */}
      {proofModalOpen && displayedProof && (
        <div className={styles.proofModal}>
          <div className={styles.proofModalBackdrop} onClick={handleCloseModal} />
          <div className={styles.proofModalContent}>
            <div className={styles.proofModalHeader}>
              <div className={styles.proofModalTitle}>
                <span className={styles.proofModalFileName}>{displayedProof.file_name}</span>
                {displayedProof.is_final && (
                  <span className={styles.finalBadge}>Final Version</span>
                )}
                <span className={styles.proofModalVersion}>
                  {displayedProof.is_current
                    ? `v${displayedProof.version} (current)`
                    : `v${displayedProof.version} (archived)`}
                </span>
              </div>
              <button className={styles.proofModalClose} onClick={handleCloseModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.proofModalBody}>
              <div className={styles.viewerWrapper}>
                <ProofViewer
                  proof={displayedProof}
                  projectId={project.id}
                  feedbackItems={feedbackItems}
                  canAddFeedback={!displayedProof.is_final}
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

                {displayedProof.is_final && (
                  <div className={styles.finalNotice}>
                    This proof is marked as final. Feedback is locked.
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
                      {displayedProof.is_final
                        ? 'No feedback was left on this proof.'
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

                {!displayedProof.is_final && (
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

// ─── Proof Card ────────────────────────────────────────────────────────────────

interface ProofCardProps {
  proof: ProjectProof;
  projectId: string;
  canEdit: boolean;
  actionInProgress: string | null;
  onOpen: () => void;
  onMarkFinal: () => void;
  onUnmarkFinal: () => void;
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
  onMarkFinal,
  onUnmarkFinal,
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
      className={`${styles.proofCard} ${proof.is_final ? styles.proofCardFinal : ''}`}
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
          {proof.is_final && <span className={styles.finalBadge}>Final Version</span>}
        </div>
        <span className={styles.proofCardMeta}>
          Version {proof.version} · Uploaded by {uploaderName}
        </span>
        <span className={styles.proofCardDate}>{formatProofDate(proof.created_at)}</span>

        {/* Action buttons */}
        <div className={styles.proofCardActions} data-action="true">
          {canEdit && !proof.is_final && (
            <button
              className={styles.markFinalButton}
              onClick={(e) => { e.stopPropagation(); onMarkFinal(); }}
              disabled={!!isActioning}
            >
              <CheckCircle size={14} />
              Mark as Final
            </button>
          )}
          {canEdit && proof.is_final && (
            <button
              className={styles.unmarkFinalButton}
              onClick={(e) => { e.stopPropagation(); onUnmarkFinal(); }}
              disabled={!!isActioning}
            >
              Unmark Final
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
