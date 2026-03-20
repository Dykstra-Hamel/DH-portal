import React from 'react';
import Image from 'next/image';
import { User } from '@/types/taskManagement';
import { getAvatarColor } from '@/lib/avatarColor';
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

  const getSizePixels = (size: 'small' | 'medium' | 'large'): number => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 40;
      case 'large':
        return 64;
      default:
        return 40;
    }
  };

  return (
    <div className={`${styles.userAvatarContainer} ${showName ? styles.withName : ''}`}>
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={`${user.first_name} ${user.last_name}`}
          width={getSizePixels(size)}
          height={getSizePixels(size)}
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
