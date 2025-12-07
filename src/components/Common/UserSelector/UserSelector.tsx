'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import styles from './UserSelector.module.scss';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  display_name: string;
}

interface UserSelectorProps {
  users: User[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function UserSelector({
  users,
  selectedUserId,
  onSelect,
  placeholder = 'Select user...',
  disabled = false,
  loading = false,
  className = ''
}: UserSelectorProps) {

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find(user => user.id === selectedUserId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (userId: string) => {
    onSelect(userId);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.userSelector} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
        onClick={handleToggle}
        disabled={disabled || loading}
      >
        <div className={styles.triggerContent}>
          {selectedUser ? (
            <div className={styles.selectedUser}>
              <MiniAvatar
                firstName={selectedUser.first_name}
                lastName={selectedUser.last_name}
                email={selectedUser.email}
                avatarUrl={selectedUser.avatar_url}
                size="small"
              />
              <span className={styles.userName}>{selectedUser.display_name}</span>
            </div>
          ) : (
            <span className={styles.placeholder}>
              {loading ? 'Loading users...' : placeholder}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={styles.chevron} />
      </button>

      {isOpen && !disabled && !loading && (
        <div className={styles.dropdown}>
          {users.length === 0 ? (
            <div className={styles.emptyState}>No users available</div>
          ) : (
            <div className={styles.userList}>
              <button
                type="button"
                className={`${styles.userOption} ${!selectedUserId ? styles.selected : ''}`}
                onClick={() => handleSelect('')}
              >
                <span className={styles.placeholderOption}>{placeholder}</span>
              </button>
              {users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className={`${styles.userOption} ${user.id === selectedUserId ? styles.selected : ''}`}
                  onClick={() => handleSelect(user.id)}
                >
                  <MiniAvatar
                    firstName={user.first_name}
                    lastName={user.last_name}
                    email={user.email}
                    avatarUrl={user.avatar_url}
                    size="small"
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.displayName}>{user.display_name}</span>
                    <span className={styles.email}>{user.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}