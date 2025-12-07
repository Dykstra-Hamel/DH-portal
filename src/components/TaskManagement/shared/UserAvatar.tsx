import React from 'react';
import { User } from '@/types/taskManagement';
import styles from './UserAvatar.module.scss';

interface UserAvatarProps {
  user: User;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export function UserAvatar({ user, size = 'medium', showName = false }: UserAvatarProps) {
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (userId: string): string => {
    // Generate consistent color based on user ID
    const colors = [
      '#0080f0', // action-500
      '#00c281', // success-500
      '#fbbc55', // warning-500
      '#f1841e', // cs-500
      '#84cc16', // sales-500
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
    ];

    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`${styles.userAvatarContainer} ${showName ? styles.withName : ''}`}>
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={`${user.first_name} ${user.last_name}`}
          className={`${styles.avatar} ${styles[size]}`}
        />
      ) : (
        <div
          className={`${styles.avatar} ${styles.initials} ${styles[size]}`}
          style={{ backgroundColor: getAvatarColor(user.id) }}
        >
          {getInitials(user.first_name, user.last_name)}
        </div>
      )}
      {showName && (
        <span className={styles.userName}>
          {user.first_name} {user.last_name}
        </span>
      )}
    </div>
  );
}
