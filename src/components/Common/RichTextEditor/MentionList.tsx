'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import styles from './MentionList.module.scss';

export interface MentionUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface MentionListProps {
  items: MentionUser[];
  command: (item: { id: string; label: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(function MentionList(
  { items, command },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      const displayName = [item.first_name, item.last_name].filter(Boolean).join(' ') || item.email || 'Unknown';
      command({ id: item.id, label: displayName });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className={styles.mentionList}>
        <div className={styles.noResults}>No users found</div>
      </div>
    );
  }

  return (
    <div className={styles.mentionList}>
      {items.map((item, index) => {
        const displayName = [item.first_name, item.last_name].filter(Boolean).join(' ') || 'Unknown';
        const initials = [item.first_name?.[0], item.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

        return (
          <button
            type="button"
            className={`${styles.mentionItem} ${index === selectedIndex ? styles.selected : ''}`}
            key={item.id}
            onClick={() => selectItem(index)}
          >
            {item.avatar_url ? (
              <img
                src={item.avatar_url}
                alt={displayName}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>{initials}</div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              {item.email && <span className={styles.userEmail}>{item.email}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default MentionList;
