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
}

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
}: ProofFeedbackPinProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const canDelete = pin.user_id === currentUserId || isAdmin;

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

  return (
    <div
      className={`${styles.pin} ${pin.is_resolved ? styles.pinResolved : ''} ${isActive ? styles.pinActive : ''} ${isHovered ? styles.pinHovered : ''}`}
      style={{
        left: `${pin.x_percent! * 100}%`,
        top: `${pin.y_percent! * 100}%`,
        ['--pin-size-scale' as string]: sizeScale,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className={styles.pinNumber}>{pin.pin_number}</span>

      {isActive && (
        <div
          ref={popoverRef}
          className={styles.popover}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.popoverHeader}>
            <MiniAvatar
              email=""
              avatarUrl={pin.user_profile?.uploaded_avatar_url || pin.user_profile?.avatar_url ?? null}
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
