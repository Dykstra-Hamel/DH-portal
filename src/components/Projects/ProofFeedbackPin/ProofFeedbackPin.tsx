'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';
import { ProofFeedback } from '@/types/project';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { copyTextToClipboard, htmlToPlainText } from '@/lib/clipboard';
import styles from './ProofFeedbackPin.module.scss';

interface ProofFeedbackPinProps {
  pin: ProofFeedback;
  isActive: boolean;
  isHovered: boolean;
  sizeScale?: number;
  onClick: () => void;
  onClosePopover: () => void;
  currentUserId: string;
  isAdmin: boolean;
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  // When provided, enables drag-to-reposition for the author or an admin.
  // The container's bounding rect is used to convert pointer coordinates
  // into 0..1 percentages of the rendered page.
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onMove?: (id: string, x: number, y: number) => void;
}

const DRAG_DEAD_ZONE_PX = 4;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ProofFeedbackPin({
  pin,
  isActive,
  isHovered,
  sizeScale = 1,
  onClick,
  onClosePopover,
  currentUserId,
  isAdmin,
  onResolve,
  onDelete,
  containerRef,
  onMove,
}: ProofFeedbackPinProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const canEdit = pin.user_id === currentUserId || isAdmin;
  const canDelete = canEdit;
  const canMove = canEdit && Boolean(onMove && containerRef);

  // Local drag state. While dragging we override the pin's stored percent so
  // the position tracks the pointer in real time; on release we commit.
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    moved: false,
  });

  const authorName = pin.user_profile
    ? `${pin.user_profile.first_name} ${pin.user_profile.last_name}`
    : 'Unknown';

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyComment = useCallback(async () => {
    const plainText = htmlToPlainText(pin.comment);
    const success = await copyTextToClipboard(plainText);
    if (!success) return;

    setCopied(true);
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }, [pin.comment]);

  const computePercent = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef?.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return null;
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      return {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
      };
    },
    [containerRef]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canMove) return;
      if (e.button !== 0) return;
      // Allow popover internals (buttons/links) to handle their own events.
      const target = e.target as HTMLElement;
      if (target.closest('[data-pin-popover]')) return;
      e.stopPropagation();
      dragStateRef.current = {
        active: true,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        moved: false,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture occasionally rejects (e.g. on stale events) — drag still works
      }
    },
    [canMove]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== e.pointerId) return;

      const dx = e.clientX - state.startClientX;
      const dy = e.clientY - state.startClientY;
      if (!state.moved && Math.hypot(dx, dy) < DRAG_DEAD_ZONE_PX) return;
      state.moved = true;

      const next = computePercent(e.clientX, e.clientY);
      if (next) setDragPos(next);
    },
    [computePercent]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== e.pointerId) return;
      const moved = state.moved;
      dragStateRef.current = {
        active: false,
        pointerId: null,
        startClientX: 0,
        startClientY: 0,
        moved: false,
      };
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (moved) {
        // Stop the synthetic click from firing on a real drag.
        e.preventDefault();
        e.stopPropagation();
        const final = computePercent(e.clientX, e.clientY) ?? dragPos;
        if (final && onMove) {
          onMove(pin.id, final.x, final.y);
        }
        setDragPos(null);
      }
    },
    [computePercent, dragPos, onMove, pin.id]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== e.pointerId) return;
      dragStateRef.current = {
        active: false,
        pointerId: null,
        startClientX: 0,
        startClientY: 0,
        moved: false,
      };
      setDragPos(null);
    },
    []
  );

  const displayX = dragPos ? dragPos.x : pin.x_percent ?? 0;
  const displayY = dragPos ? dragPos.y : pin.y_percent ?? 0;
  const isDragging = dragStateRef.current.active && dragStateRef.current.moved;

  return (
    <div
      className={`${styles.pin} ${pin.is_resolved ? styles.pinResolved : ''} ${isActive ? styles.pinActive : ''} ${isHovered ? styles.pinHovered : ''}`}
      style={{
        left: `${displayX * 100}%`,
        top: `${displayY * 100}%`,
        ['--pin-size-scale' as string]: sizeScale,
        cursor: canMove ? (isDragging ? 'grabbing' : 'grab') : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(e) => {
        e.stopPropagation();
        // Suppress click selection if a real drag just completed.
        if (dragStateRef.current.moved) return;
        onClick();
      }}
    >
      <span className={styles.pinNumber}>{pin.pin_number}</span>

      {isActive && (
        <div
          ref={popoverRef}
          className={styles.popover}
          data-pin-popover="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.popoverHeader}>
            <MiniAvatar
              email=""
              avatarUrl={(pin.user_profile?.uploaded_avatar_url || pin.user_profile?.avatar_url) ?? null}
              firstName={pin.user_profile?.first_name ?? ''}
              lastName={pin.user_profile?.last_name ?? ''}
              size="small"
              showTooltip={false}
            />
            <span className={styles.authorName}>{authorName}</span>
            <span className={styles.timestamp}>{formatRelativeTime(pin.created_at)}</span>
          </div>
          <div className={styles.commentRow}>
            <div
              className={`${styles.comment} ${pin.is_resolved ? styles.commentResolved : ''}`}
              dangerouslySetInnerHTML={{ __html: pin.comment }}
            />
            <button
              type="button"
              className={`${styles.copyButton} ${copied ? styles.copyButtonActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                void handleCopyComment();
              }}
              aria-label="Copy pin text"
              title={copied ? 'Copied' : 'Copy text'}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <div className={styles.popoverActions}>
            <button
              className={`${styles.resolveButton} ${pin.is_resolved ? styles.resolveButtonActive : ''}`}
              onClick={() => {
                const nextResolved = !pin.is_resolved;
                onResolve(pin.id, nextResolved);
                if (nextResolved) {
                  onClosePopover();
                }
              }}
            >
              {pin.is_resolved ? 'Unresolve' : 'Resolve'}
            </button>
            {canDelete && (
              <button
                className={styles.deleteButton}
                onClick={() => onDelete(pin.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
