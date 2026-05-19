'use client';

import { MiniAvatar } from '@/components/Common/MiniAvatar';
// Reuse the existing reviewingStatus/reviewingText classes that already
// power the ticket "Reviewing" pill so the visual stays in lockstep.
import styles from '@/components/Common/DataTable/DataTable.module.scss';

interface ReviewIndicatorProps {
  label?: string; // 'Viewing' for leads, 'Reviewing' for tickets
  reviewerFirstName?: string | null;
  reviewerLastName?: string | null;
  reviewerEmail?: string;
  reviewerAvatarUrl?: string | null;
}

/**
 * Compact "X is Viewing/Reviewing" pill rendered in DataTable action
 * columns when a row is locked by another user.
 */
export function ReviewIndicator({
  label = 'Viewing',
  reviewerFirstName,
  reviewerLastName,
  reviewerEmail,
  reviewerAvatarUrl,
}: ReviewIndicatorProps) {
  return (
    <div className={styles.reviewingStatus}>
      <span className={styles.reviewingText}>{label}</span>
      <MiniAvatar
        firstName={reviewerFirstName ?? undefined}
        lastName={reviewerLastName ?? undefined}
        email={reviewerEmail ?? ''}
        avatarUrl={reviewerAvatarUrl}
        size="small"
        showTooltip={true}
      />
    </div>
  );
}
