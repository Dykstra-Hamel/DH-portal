'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ProofFeedback, ProjectProof } from '@/types/project';
import ProofFeedbackPin from '../ProofFeedbackPin/ProofFeedbackPin';
import ProofFeedbackComposer from '../ProofFeedbackComposer/ProofFeedbackComposer';
import styles from './ProofViewer.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ProofViewerProps {
  proof: ProjectProof;
  projectId: string;
  feedbackItems: ProofFeedback[];
  canAddFeedback: boolean;
  mentionUsers?: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  }>;
  activePinId: string | null;
  hoveredPinId: string | null;
  currentUserId: string;
  isAdmin: boolean;
  onPinClick: (id: string | null) => void;
  onAddFeedback: (x: number, y: number, page: number, comment: string) => void;
  onResolvePin: (id: string, resolved: boolean) => void;
  onDeletePin: (id: string) => void;
}

export default function ProofViewer({
  proof,
  projectId,
  feedbackItems,
  canAddFeedback,
  mentionUsers,
  activePinId,
  hoveredPinId,
  currentUserId,
  isAdmin,
  onPinClick,
  onAddFeedback,
  onResolvePin,
  onDeletePin,
}: ProofViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [isProofLoading, setIsProofLoading] = useState(true);

  const mimeType = proof.mime_type || '';
  const isPdf = mimeType.startsWith('application/pdf');
  const isImage = mimeType.startsWith('image/');
  const isUnsupported = !isImage && !isPdf;

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(1);
    setPendingPin(null);
    // Unsupported types do not fire media load callbacks.
    setIsProofLoading(!isUnsupported);
  }, [proof.id, isUnsupported]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canAddFeedback) return;
      // Ignore clicks on existing pins or the composer
      if ((e.target as HTMLElement).closest('[data-pin]') || (e.target as HTMLElement).closest('[data-composer]')) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      onPinClick(null);
      setPendingPin({ x, y });
    },
    [canAddFeedback, onPinClick]
  );

  const handleComposerSubmit = useCallback(
    (comment: string) => {
      if (!pendingPin) return;
      onAddFeedback(pendingPin.x, pendingPin.y, currentPage, comment);
      setPendingPin(null);
    },
    [pendingPin, currentPage, onAddFeedback]
  );

  const handleComposerCancel = useCallback(() => {
    setPendingPin(null);
  }, []);

  const visibleFeedback = feedbackItems.filter(
    (f) => f.x_percent !== null && f.y_percent !== null && (!isPdf || f.page_number === currentPage)
  );

  const proofUrl = `/api/admin/projects/${projectId}/proofs/${proof.id}/url`;

  return (
    <div className={styles.viewer}>
      <div
        className={styles.overlay}
        onClick={handleOverlayClick}
        style={{ cursor: canAddFeedback ? 'crosshair' : 'default' }}
      >
        {isImage && (
          <img
            src={proofUrl}
            alt={proof.file_name}
            className={styles.proofImage}
            draggable={false}
            onLoad={() => setIsProofLoading(false)}
            onError={() => setIsProofLoading(false)}
          />
        )}

        {isPdf && (
          <Document
            file={proofUrl}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setIsProofLoading(false);
            }}
            onLoadError={() => setIsProofLoading(false)}
            className={styles.pdfDocument}
          >
            <Page
              pageNumber={currentPage}
              className={styles.pdfPage}
              renderTextLayer={false}
              onRenderSuccess={() => setIsProofLoading(false)}
              onRenderError={() => setIsProofLoading(false)}
            />
          </Document>
        )}

        {isUnsupported && (
          <div className={styles.unsupportedState}>Preview not available for this file type.</div>
        )}

        {isProofLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
            <span>Loading proof...</span>
          </div>
        )}

        {/* Feedback pins */}
        {visibleFeedback.map((pin) => (
          <div key={pin.id} data-pin="true">
            <ProofFeedbackPin
              pin={pin}
              isActive={activePinId === pin.id}
              isHovered={hoveredPinId === pin.id}
              onClick={() => onPinClick(activePinId === pin.id ? null : pin.id)}
              onClosePopover={() => onPinClick(null)}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onResolve={onResolvePin}
              onDelete={onDeletePin}
            />
          </div>
        ))}

        {/* Pending pin indicator */}
        {pendingPin && (
          <div
            className={styles.pendingPinMarker}
            style={{
              left: `${pendingPin.x * 100}%`,
              top: `${pendingPin.y * 100}%`,
            }}
          />
        )}

        {/* Comment composer */}
        {pendingPin && (
          <div data-composer="true">
            <ProofFeedbackComposer
              position={pendingPin}
              mentionUsers={mentionUsers}
              onSubmit={handleComposerSubmit}
              onCancel={handleComposerCancel}
            />
          </div>
        )}
      </div>

      {isPdf && numPages > 1 && (
        <div className={styles.pdfControls}>
          <button
            className={styles.pageButton}
            onClick={() => {
              setIsProofLoading(true);
              setCurrentPage((p) => Math.max(1, p - 1));
            }}
            disabled={currentPage <= 1}
          >
            ‹ Prev
          </button>
          <span className={styles.pageIndicator}>
            Page {currentPage} of {numPages}
          </span>
          <button
            className={styles.pageButton}
            onClick={() => {
              setIsProofLoading(true);
              setCurrentPage((p) => Math.min(numPages, p + 1));
            }}
            disabled={currentPage >= numPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
