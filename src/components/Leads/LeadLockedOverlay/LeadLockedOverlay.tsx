'use client';

import { Lock } from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import styles from './LeadLockedOverlay.module.scss';

interface LeadLockedOverlayProps {
  reviewerFirstName?: string | null;
  reviewerLastName?: string | null;
  reviewerEmail?: string;
  reviewerAvatarUrl?: string | null;
  onTryAgain: () => void;
  retrying?: boolean;
}

function fullNameOrEmail(
  first?: string | null,
  last?: string | null,
  email?: string
): string {
  const trimmed = `${first ?? ''} ${last ?? ''}`.trim();
  if (trimmed) return trimmed;
  return email ?? 'another user';
}

/**
 * Full-screen blocking overlay shown on the lead detail page when another
 * user holds the review lock. Mirrors the ticket "Reviewing" model but
 * stricter — the entire page is non-interactable until the lock clears.
 */
export function LeadLockedOverlay({
  reviewerFirstName,
  reviewerLastName,
  reviewerEmail,
  reviewerAvatarUrl,
  onTryAgain,
  retrying = false,
}: LeadLockedOverlayProps) {
  const name = fullNameOrEmail(
    reviewerFirstName,
    reviewerLastName,
    reviewerEmail
  );

  return (
    <div
      className={styles.scrim}
      role="dialog"
      aria-modal="true"
      aria-label="Lead locked by another user"
    >
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Lock size={20} />
        </div>
        <div className={styles.avatarRow}>
          <MiniAvatar
            firstName={reviewerFirstName ?? undefined}
            lastName={reviewerLastName ?? undefined}
            email={reviewerEmail ?? ''}
            avatarUrl={reviewerAvatarUrl}
            size="medium"
            showTooltip={false}
          />
          <div className={styles.viewerName}>{name}</div>
        </div>
        <h3 className={styles.title}>This lead is currently being viewed</h3>
        <p className={styles.body}>
          {name} is on this lead right now. You won&apos;t be able to make
          changes until they leave the page.
        </p>
        <button
          type="button"
          className={styles.tryAgainBtn}
          onClick={onTryAgain}
          disabled={retrying}
        >
          {retrying ? 'Checking…' : 'Try Again'}
        </button>
      </div>
    </div>
  );
}
