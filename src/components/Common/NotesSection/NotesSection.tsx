import React, { useState, useEffect, useCallback } from 'react';
import type { EntityType } from '@/types/activity';
import type { Activity } from '@/types/activity';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import styles from './NotesSection.module.scss';

interface NotesSectionProps {
  entityType: EntityType;
  entityId: string;
  companyId: string;
  userId: string;
  customerComment?: string | null;
  readOnly?: boolean;
  onNotesLoaded?: (hasNotes: boolean) => void;
}

export function NotesSection({
  entityType,
  entityId,
  companyId,
  userId,
  customerComment,
  readOnly = false,
  onNotesLoaded,
}: NotesSectionProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Activity[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setIsLoadingNotes(true);
      const url = new URL('/api/activity', window.location.origin);
      url.searchParams.set('entity_type', entityType);
      url.searchParams.set('entity_id', entityId);
      url.searchParams.set('activity_type', 'note_added');
      url.searchParams.set('limit', '100');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch notes');

      const { data } = await response.json();
      const filtered = (data || []).filter(
        (item: Activity) =>
          Boolean(item.notes?.trim()) &&
          item.metadata?.source !== 'customer_quote_comment'
      );
      setNotes(filtered);
      onNotesLoaded?.(filtered.length > 0);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getUserLabel = (activity: Activity): string => {
    const first = activity.user?.first_name?.trim() ?? '';
    const last = activity.user?.last_name?.trim() ?? '';
    const fullName = `${first} ${last}`.trim();
    return fullName || activity.user?.email || 'System';
  };

  const getUserEmail = (activity: Activity): string => {
    return activity.user?.email || 'system@dhportal.local';
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          entity_type: entityType,
          entity_id: entityId,
          activity_type: 'note_added',
          user_id: userId,
          notes: note.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      const { data: createdNote } = await response.json();
      if (createdNote) {
        setNotes(prev => [createdNote, ...prev]);
      }

      // Clear the input
      setNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.notesSection}>
      {customerComment && (
      <div className={styles.customerCommentBanner}>
          <span className={styles.customerCommentLabel}>Customer Note</span>
          <p className={styles.customerCommentText}>{customerComment}</p>
        </div>
      )}
      {isLoadingNotes ? (
        <p className={styles.noteState}>Loading notes...</p>
      ) : notes.length > 0 ? (
        <div className={styles.notesList}>
          {notes.map(activity => (
            <div key={activity.id} className={styles.noteCard}>
              <div className={styles.noteMeta}>
                <span className={styles.noteAuthorWrap}>
                  <MiniAvatar
                    firstName={activity.user?.first_name || undefined}
                    lastName={activity.user?.last_name || undefined}
                    email={getUserEmail(activity)}
                    avatarUrl={activity.user?.avatar_url || null}
                    size="small"
                    showTooltip={true}
                  />
                  <span className={styles.noteAuthor}>{getUserLabel(activity)}</span>
                </span>
                <span className={styles.noteDate}>{formatDateTime(activity.created_at)}</span>
              </div>
              <p className={styles.noteText}>{activity.notes}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noteState}>No notes yet.</p>
      )}
      {!readOnly && (
        <>
          <textarea
            className={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            disabled={isSubmitting}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleAddNote}
              disabled={!note.trim() || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
