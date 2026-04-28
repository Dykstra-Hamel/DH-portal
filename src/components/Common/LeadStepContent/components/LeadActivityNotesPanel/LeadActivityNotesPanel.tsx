'use client';

import { useEffect, useState } from 'react';
import { ActivityFeed } from '@/components/Common/ActivityFeed/ActivityFeed';
import { NotesSection } from '@/components/Common/NotesSection/NotesSection';
import { useUser } from '@/hooks/useUser';
import { Lead } from '@/types/lead';
import styles from './LeadActivityNotesPanel.module.scss';

interface LeadActivityNotesPanelProps {
  lead: Lead;
  customerComment?: string | null;
}

export function LeadActivityNotesPanel({
  lead,
  customerComment,
}: LeadActivityNotesPanelProps) {
  const { user } = useUser();
  const [, setHasActivityNotes] = useState(false);

  useEffect(() => {
    const checkForNotes = async () => {
      try {
        const url = new URL('/api/activity', window.location.origin);
        url.searchParams.set('entity_type', 'lead');
        url.searchParams.set('entity_id', lead.id);
        url.searchParams.set('activity_type', 'note_added');
        url.searchParams.set('limit', '100');
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const { data } = await res.json();
        const hasNotes = (data || []).some(
          (item: { notes?: string; metadata?: Record<string, any> | null }) =>
            Boolean(item.notes?.trim()) &&
            item.metadata?.source !== 'customer_quote_comment'
        );
        setHasActivityNotes(hasNotes);
      } catch {
        // silently ignore
      }
    };
    checkForNotes();
  }, [lead.id]);

  return (
    <div className={styles.panel}>
      <div className={styles.column}>
        <h3 className={styles.sectionHeading}>Activity</h3>
        <ActivityFeed
          entityType="lead"
          entityId={lead.id}
          companyId={lead.company_id}
        />
      </div>

      <div className={styles.column}>
        <h3 className={styles.sectionHeading}>Notes</h3>
        <NotesSection
          entityType="lead"
          entityId={lead.id}
          companyId={lead.company_id}
          userId={user?.id || ''}
          customerComment={customerComment}
          onNotesLoaded={setHasActivityNotes}
        />
      </div>
    </div>
  );
}
