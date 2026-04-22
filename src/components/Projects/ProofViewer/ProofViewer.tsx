'use client';

import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const WHEEL_ZOOM_SENSITIVITY = 0.0016;

interface ProofViewerProps {
  proof: ProjectProof;
  projectId: string;
  feedbackItems: ProofFeedback[];
  hideFeedbackPins?: boolean;
  canAddFeedback: boolean;
  mentionUsers?: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
    uploaded_avatar_url?: string | null;
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

interface ProofMediaProps {
  isImage: boolean;
  isPdf: boolean;
  isUnsupported: boolean;
  proofUrl: string;
  fileName: string;
  currentPage: number;
  onImageLoad: () => void;
  onMediaError: () => void;
  onPdfLoadSuccess: (details: { numPages: number }) => void;
  onPdfRenderSuccess: () => void;
}

const ProofMedia = memo(function ProofMedia({
  isImage,
  isPdf,
  isUnsupported,
  proofUrl,
  fileName,
  currentPage,
  onImageLoad,
  onMediaError,
  onPdfLoadSuccess,
  onPdfRenderSuccess,
}: ProofMediaProps) {
  if (isImage) {
    return (
      <img
        src={proofUrl}
        alt={fileName}
        className={styles.proofImage}
        draggable={false}
        onLoad={onImageLoad}
        onError={onMediaError}
      />
    );
  }

  if (isPdf) {
    return (
      <Document
        file={proofUrl}
        onLoadSuccess={onPdfLoadSuccess}
        onLoadError={onMediaError}
        className={styles.pdfDocument}
        loading={null}
      >
        <Page
          pageNumber={currentPage}
          className={styles.pdfPage}
          renderTextLayer={false}
          onRenderSuccess={onPdfRenderSuccess}
          onRenderError={onMediaError}
        />
      </Document>
    );
  }

  if (isUnsupported) {
    return (
      <div className={styles.unsupportedState}>Preview not available for this file type.</div>
    );
  }

  return null;
});

export default function ProofViewer({
  proof,
  projectId,
  feedbackItems,
  hideFeedbackPins = false,
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
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [isPanning, setIsPanning] = useState(false);
  const [pendingPin, setPendingPin] = useState<{
    x: number;
    y: number;
    composerLeft: number;
    composerTop: number;
  } | null>(null);
  const [isProofLoading, setIsProofLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const proofContentRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<number>(DEFAULT_ZOOM);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
    allowPinOnRelease: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    moved: false,
    allowPinOnRelease: false,
  });

  const mimeType = proof.mime_type || '';
  const isPdf = mimeType.startsWith('application/pdf');
  const isImage = mimeType.startsWith('image/');
  const isUnsupported = !isImage && !isPdf;

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(1);
    setZoom(DEFAULT_ZOOM);
    zoomRef.current = DEFAULT_ZOOM;
    setIsPanning(false);
    setPendingPin(null);
    panRef.current = { x: 0, y: 0 };
    if (stageRef.current) {
      stageRef.current.style.setProperty('--pan-x', '0px');
      stageRef.current.style.setProperty('--pan-y', '0px');
      stageRef.current.style.setProperty('--zoom', '1');
    }
    pointerDragRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
      moved: false,
      allowPinOnRelease: false,
    };
    // Unsupported types do not fire media load callbacks.
    setIsProofLoading(!isUnsupported);
  }, [proof.id, isUnsupported]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const clampZoom = useCallback((value: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    return Math.round(clamped * 100) / 100;
  }, []);

  const getPanBounds = useCallback((nextZoom: number) => {
    const stageEl = stageRef.current;
    const overlayEl = overlayRef.current;
    if (!stageEl || !overlayEl) return null;

    // Use the full overlay viewport dimensions (not just the stage layout dimensions,
    // which are smaller by the overlay's padding on each side). The stage's offsetLeft
    // and offsetTop give its position within the overlay (equal to the padding value).
    const overlayWidth = overlayEl.clientWidth;
    const overlayHeight = overlayEl.clientHeight;
    const stageLeft = stageEl.offsetLeft;
    const stageTop = stageEl.offsetTop;

    const contentEl = proofContentRef.current;
    let contentLeft = 0;
    let contentTop = 0;
    let contentWidth = stageEl.clientWidth;
    let contentHeight = stageEl.clientHeight;

    if (contentEl && contentEl.offsetWidth > 0 && contentEl.offsetHeight > 0) {
      // contentEl.offsetLeft/Top are relative to the stage (its offsetParent)
      contentLeft = contentEl.offsetLeft;
      contentTop = contentEl.offsetTop;
      contentWidth = contentEl.offsetWidth;
      contentHeight = contentEl.offsetHeight;
    }

    // Content position in overlay space after transform:
    //   contentEdge = stageLeft + panX + contentLeft * zoom
    // Solve for panX at each edge to get the full pan range.
    const maxX = -(stageLeft + contentLeft * nextZoom);
    const minX = overlayWidth - stageLeft - (contentLeft + contentWidth) * nextZoom;
    const maxY = -(stageTop + contentTop * nextZoom);
    const minY = overlayHeight - stageTop - (contentTop + contentHeight) * nextZoom;

    return { minX, maxX, minY, maxY };
  }, []);

  const clampPan = useCallback((x: number, y: number, nextZoom: number) => {
    const bounds = getPanBounds(nextZoom);
    if (!bounds) return { x, y };

    const { minX, maxX, minY, maxY } = bounds;

    const clampedX = minX > maxX
      ? (minX + maxX) / 2
      : Math.min(maxX, Math.max(minX, x));
    const clampedY = minY > maxY
      ? (minY + maxY) / 2
      : Math.min(maxY, Math.max(minY, y));

    return { x: clampedX, y: clampedY };
  }, [getPanBounds]);

  const applyPan = useCallback((x: number, y: number, nextZoom: number) => {
    const clamped = clampPan(x, y, nextZoom);
    panRef.current = clamped;
    if (stageRef.current) {
      stageRef.current.style.setProperty('--pan-x', `${clamped.x}px`);
      stageRef.current.style.setProperty('--pan-y', `${clamped.y}px`);
    }
  }, [clampPan]);

  const zoomAroundClientPoint = useCallback((nextZoomRaw: number, clientX: number, clientY: number) => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const currentZoom = zoomRef.current;
    const nextZoom = clampZoom(nextZoomRaw);
    if (Math.abs(nextZoom - currentZoom) < 0.0001) return;

    const rect = stageEl.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const worldX = (localX - panRef.current.x) / currentZoom;
    const worldY = (localY - panRef.current.y) / currentZoom;
    const targetPanX = localX - worldX * nextZoom;
    const targetPanY = localY - worldY * nextZoom;

    zoomRef.current = nextZoom;
    stageEl.style.setProperty('--zoom', String(nextZoom));
    setZoom(nextZoom);
    applyPan(targetPanX, targetPanY, nextZoom);
  }, [applyPan, clampZoom]);

  const zoomAroundStageCenter = useCallback((nextZoomRaw: number) => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    zoomAroundClientPoint(nextZoomRaw, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [zoomAroundClientPoint]);

  const applyZoomDelta = useCallback((delta: number) => {
    const targetZoom = clampZoom(zoomRef.current + delta);
    zoomAroundStageCenter(targetZoom);
  }, [clampZoom, zoomAroundStageCenter]);

  const handleOverlayWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (isUnsupported) return;
      const normalizedDeltaY = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(normalizedDeltaY) < 0.5) return;
      e.preventDefault();
      const currentZoom = zoomRef.current;
      const zoomFactor = Math.exp(-normalizedDeltaY * WHEEL_ZOOM_SENSITIVITY);
      const targetZoom = clampZoom(currentZoom * zoomFactor);
      if (Math.abs(targetZoom - currentZoom) < 0.0001) return;
      zoomAroundClientPoint(targetZoom, e.clientX, e.clientY);
    },
    [clampZoom, isUnsupported, zoomAroundClientPoint]
  );

  const reClampPan = useCallback(() => {
    applyPan(panRef.current.x, panRef.current.y, zoomRef.current);
  }, [applyPan]);

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      reClampPan();
    });
    observer.observe(stageEl);
    if (proofContentRef.current) {
      observer.observe(proofContentRef.current);
    }

    return () => observer.disconnect();
  }, [reClampPan, proof.id, currentPage]);

  const setPendingPinAtClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const stageRect = stageRef.current?.getBoundingClientRect();
      if (!stageRect || stageRect.width <= 0 || stageRect.height <= 0) return;
      const x = (clientX - stageRect.left) / stageRect.width;
      const y = (clientY - stageRect.top) / stageRect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;

      // Compute composer position in overlay space (so it renders outside the scaled stage)
      const overlayRect = overlayRef.current?.getBoundingClientRect();
      const COMPOSER_WIDTH = 280;
      const COMPOSER_HEIGHT = 190;
      const OFFSET = 12;
      const overlayWidth = overlayRect?.width ?? 600;
      const overlayHeight = overlayRect?.height ?? 400;
      const overlayLeft = overlayRect?.left ?? 0;
      const overlayTop = overlayRect?.top ?? 0;
      const composerLeft = Math.max(8, Math.min(
        (clientX - overlayLeft) + OFFSET,
        overlayWidth - COMPOSER_WIDTH - 8
      ));
      const composerTop = Math.max(8, Math.min(
        (clientY - overlayTop) + OFFSET,
        overlayHeight - COMPOSER_HEIGHT - 8
      ));

      onPinClick(null);
      setPendingPin({
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
        composerLeft,
        composerTop,
      });
    },
    [onPinClick]
  );

  const handleStagePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      const isInteractiveTarget = Boolean(
        target.closest('[data-pin]') ||
        target.closest('[data-composer]') ||
        target.closest('button, a, input, textarea, [contenteditable="true"], [role="button"]')
      );

      if (isInteractiveTarget) return;

      pointerDragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
        moved: false,
        allowPinOnRelease: canAddFeedback,
      };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture can fail on some browsers; dragging still works without it.
      }
    },
    [canAddFeedback]
  );

  const resetPointerDrag = useCallback(() => {
    pointerDragRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
      moved: false,
      allowPinOnRelease: false,
    };
    setIsPanning(false);
  }, []);

  const handleStagePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;

    // Guard against any lost pointer-up edge cases: never pan unless left button is still held.
    if ((e.buttons & 1) !== 1) {
      resetPointerDrag();
      return;
    }

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      drag.moved = true;
      // Reset drag origin on threshold crossing to avoid a sudden jump.
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.startPanX = panRef.current.x;
      drag.startPanY = panRef.current.y;
      setIsPanning(true);
      return;
    }

    if (drag.moved) {
      const moveDx = e.clientX - drag.startX;
      const moveDy = e.clientY - drag.startY;
      applyPan(drag.startPanX + moveDx, drag.startPanY + moveDy, zoomRef.current);
    }
  }, [applyPan, resetPointerDrag]);

  const handleStagePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = pointerDragRef.current;
      if (!drag.active || drag.pointerId !== e.pointerId) return;

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore capture release failures.
        }
      }

      const wasDrag = drag.moved;
      const allowPinOnRelease = drag.allowPinOnRelease;
      resetPointerDrag();

      if (!wasDrag && allowPinOnRelease) {
        setPendingPinAtClientPoint(e.clientX, e.clientY);
      }
    },
    [resetPointerDrag, setPendingPinAtClientPoint]
  );

  const handleStagePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    resetPointerDrag();
  }, [resetPointerDrag]);

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

  const handleImageLoad = useCallback(() => {
    setIsProofLoading(false);
    reClampPan();
  }, [reClampPan]);

  const handleMediaError = useCallback(() => {
    setIsProofLoading(false);
  }, []);

  const handlePdfLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  const handlePdfRenderSuccess = useCallback(() => {
    setIsProofLoading(false);
    reClampPan();
  }, [reClampPan]);

  const visibleFeedback = useMemo(() => {
    return feedbackItems.filter(
      (f) => f.x_percent !== null && f.y_percent !== null && (!isPdf || f.page_number === currentPage)
    );
  }, [feedbackItems, isPdf, currentPage]);

  const proofUrl = `/api/admin/projects/${projectId}/proofs/${proof.id}/url`;
  const isAtMinZoom = zoom <= MIN_ZOOM + 0.001;
  const isAtMaxZoom = zoom >= MAX_ZOOM - 0.001;
  const isAtDefaultZoom = Math.abs(zoom - DEFAULT_ZOOM) < 0.001;

  return (
    <div className={styles.viewer}>
      <div
        ref={overlayRef}
        className={styles.overlay}
        onWheel={handleOverlayWheel}
      >
        <div
          ref={stageRef}
          className={styles.stage}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={handleStagePointerCancel}
          style={{
            transform: 'translate(var(--pan-x, 0px), var(--pan-y, 0px)) scale(var(--zoom, 1))',
            transformOrigin: '0 0',
            cursor: isPanning ? 'grabbing' : canAddFeedback ? 'crosshair' : 'grab',
            willChange: 'transform',
          }}
        >
          <div ref={proofContentRef} className={styles.proofContent}>
            <ProofMedia
              isImage={isImage}
              isPdf={isPdf}
              isUnsupported={isUnsupported}
              proofUrl={proofUrl}
              fileName={proof.file_name}
              currentPage={currentPage}
              onImageLoad={handleImageLoad}
              onMediaError={handleMediaError}
              onPdfLoadSuccess={handlePdfLoadSuccess}
              onPdfRenderSuccess={handlePdfRenderSuccess}
            />
          </div>

          {/* Feedback pins */}
          {!hideFeedbackPins && visibleFeedback.map((pin) => (
            <div key={pin.id} data-pin="true">
              <ProofFeedbackPin
                pin={pin}
                isActive={activePinId === pin.id}
                isHovered={hoveredPinId === pin.id}
                sizeScale={1 / zoom}
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
                transform: `translate(-50%, -50%) scale(${1 / zoom})`,
              }}
            />
          )}

        </div>

        {/* Comment composer — rendered outside the scaled stage so it's never blurry */}
        {pendingPin && (
          <div
            data-composer="true"
            style={{
              position: 'absolute',
              left: `${pendingPin.composerLeft}px`,
              top: `${pendingPin.composerTop}px`,
              zIndex: 50,
            }}
          >
            <ProofFeedbackComposer
              mentionUsers={mentionUsers}
              onSubmit={handleComposerSubmit}
              onCancel={handleComposerCancel}
            />
          </div>
        )}

        {isProofLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
            <span>Loading proof...</span>
          </div>
        )}
      </div>

      {!isUnsupported && (
        <div className={styles.viewerControls}>
          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => applyZoomDelta(-ZOOM_STEP)}
              disabled={isAtMinZoom}
              aria-label="Zoom out"
            >
              -
            </button>
            <span className={styles.zoomIndicator}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => applyZoomDelta(ZOOM_STEP)}
              disabled={isAtMaxZoom}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => zoomAroundStageCenter(DEFAULT_ZOOM)}
              disabled={isAtDefaultZoom}
            >
              Reset
            </button>
            <span className={styles.zoomHint}>Scroll to zoom</span>
          </div>

          {isPdf && numPages > 1 && (
            <div className={styles.pdfControls}>
              <button
                type="button"
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
                type="button"
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
      )}
    </div>
  );
}
