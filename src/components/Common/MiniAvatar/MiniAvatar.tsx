'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './MiniAvatar.module.scss';

interface MiniAvatarProps {
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showTooltip?: boolean;
}

export function MiniAvatar({
  firstName,
  lastName,
  email,
  avatarUrl,
  size = 'medium',
  className = '',
  showTooltip = true,
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

  const getDisplayName = (): string => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return email;
  };

  useEffect(() => {
    // Reset error state when avatarUrl changes
    setImageError(false);
  }, [avatarUrl]);

  const handleImageError = (error: any) => {
    console.log('MiniAvatar image error:', {
      avatarUrl,
      error,
      firstName,
      lastName,
      email,
    });
    setImageError(true);
  };

  const showImage = avatarUrl && !imageError;

  return (
    <div className={styles.tooltipContainer}>
      <div className={`${styles.miniAvatar} ${styles[size]} ${className}`}>
        {showTooltip && (
          <div className={styles.tooltip}>
            {getDisplayName()}
            <div className={styles.tooltipArrow} />
          </div>
        )}
        {showImage ? (
          <Image
            src={avatarUrl}
            alt={`${firstName || ''} ${lastName || ''}`.trim() || email}
            className={styles.avatarImage}
            onError={handleImageError}
            width={size === 'small' ? 24 : size === 'medium' ? 32 : 40}
            height={size === 'small' ? 24 : size === 'medium' ? 32 : 40}
            loading="lazy"
          />
        ) : (
          <span className={styles.avatarInitials}>{getInitials()}</span>
        )}
      </div>
    </div>
  );
}
