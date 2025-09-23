'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './MiniAvatar.module.scss';

interface MiniAvatarProps {
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function MiniAvatar({
  firstName,
  lastName,
  email,
  avatarUrl,
  size = 'medium',
  className = ''
}: MiniAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (): string => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const showImage = avatarUrl && !imageError;


  return (
    <div className={`${styles.miniAvatar} ${styles[size]} ${className}`}>
      {showImage ? (
        <Image
          src={avatarUrl}
          alt={`${firstName || ''} ${lastName || ''}`.trim() || email}
          className={styles.avatarImage}
          onError={handleImageError}
          width={size === 'small' ? 24 : size === 'medium' ? 32 : 40}
          height={size === 'small' ? 24 : size === 'medium' ? 32 : 40}
          unoptimized={true}
        />
      ) : (
        <span className={styles.avatarInitials}>
          {getInitials()}
        </span>
      )}
    </div>
  );
}