import React, { useState } from 'react';
import type { EntityType } from '@/types/activity';
import styles from './NotesSection.module.scss';

interface NotesSectionProps {
  entityType: EntityType;
  entityId: string;
  companyId: string;
  userId: string;
}

export function NotesSection({
  entityType,
  entityId,
  companyId,
  userId,
}: NotesSectionProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Clear the input
      setNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div className={styles.notesSection}>
      <textarea
        className={styles.textarea}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a note..."
        rows={3}
        disabled={isSubmitting}
      />
      <div className={styles.actions}>
        <div className={styles.hint}>Press Cmd+Enter to submit</div>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddNote}
          disabled={!note.trim() || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Note'}
        </button>
      </div>
    </div>
  );
}
