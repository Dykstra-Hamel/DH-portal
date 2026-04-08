'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { CommentReaction } from '@/types/project';
import styles from './CommentReactions.module.scss';

const EMOJI_OPTIONS: { key: string; emoji: string }[] = [
  { key: 'thumbs_up', emoji: '👍' },
  { key: 'smile', emoji: '😊' },
  { key: 'laugh', emoji: '😂' },
  { key: 'eyes', emoji: '👀' },
  { key: 'check', emoji: '✅' },
];

interface CommentReactionsProps {
  reactions: CommentReaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
  userMap?: Record<string, string>; // userId -> display name
}

function buildTooltipText(
  reactionList: CommentReaction[],
  currentUserId: string,
  userMap: Record<string, string>
): string {
  const MAX_NAMES = 5;
  const names = reactionList.map(r =>
    r.user_id === currentUserId ? 'You' : (userMap[r.user_id] || 'Someone')
  );
  // Put "You" first
  const sorted = names.includes('You')
    ? ['You', ...names.filter(n => n !== 'You')]
    : names;
  if (sorted.length <= MAX_NAMES) return sorted.join(', ');
  return `${sorted.slice(0, MAX_NAMES).join(', ')} and ${sorted.length - MAX_NAMES} more`;
}

export default function CommentReactions({ reactions, currentUserId, onToggle, userMap = {} }: CommentReactionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [pickerOpen]);

  // Group reactions by emoji key
  const grouped = EMOJI_OPTIONS.reduce<Record<string, CommentReaction[]>>((acc, { key }) => {
    const matching = reactions.filter(r => r.emoji === key);
    if (matching.length > 0) acc[key] = matching;
    return acc;
  }, {});

  const handlePickerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPickerOpen(prev => !prev);
  };

  const handleEmojiClick = (key: string) => {
    onToggle(key);
    setPickerOpen(false);
  };

  return (
    <div className={styles.reactions}>
      {EMOJI_OPTIONS.filter(({ key }) => grouped[key]).map(({ key, emoji }) => {
        const reactionList = grouped[key];
        const isActive = reactionList.some(r => r.user_id === currentUserId);
        const tooltipText = buildTooltipText(reactionList, currentUserId, userMap);
        return (
          <div key={key} className={styles.pillWrapper}>
            <button
              type="button"
              className={`${styles.reactionPill} ${isActive ? styles.reactionPillActive : ''}`}
              onClick={() => onToggle(key)}
              aria-label={`${emoji} reaction — ${tooltipText}`}
            >
              <span>{emoji}</span>
              <span className={styles.reactionCount}>{reactionList.length}</span>
            </button>
            <span className={styles.tooltip}>{tooltipText}</span>
          </div>
        );
      })}

      <div className={styles.addReactionWrapper} ref={pickerRef}>
        <button
          type="button"
          className={styles.addReactionBtn}
          onClick={handlePickerToggle}
          title="Add reaction"
          aria-label="Add reaction"
        >
          <Smile size={14} />
        </button>
        {pickerOpen && (
          <div className={styles.picker}>
            {EMOJI_OPTIONS.map(({ key, emoji }) => (
              <button
                key={key}
                type="button"
                className={styles.pickerEmoji}
                onClick={() => handleEmojiClick(key)}
                title={key.replace('_', ' ')}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
