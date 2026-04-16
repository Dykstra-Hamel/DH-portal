'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAvatarColor } from '@/lib/avatarColor';
import styles from './MiniAvatar.module.scss';

interface MiniAvatarProps {
  firstName?: string;
  lastName?: string;
  email: string;
  userId?: string;
  avatarUrl?: string | null;
  uploadedAvatarUrl?: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showTooltip?: boolean;
}

export function MiniAvatar({
  firstName,
  lastName,
  email,
  userId,
  avatarUrl,
  uploadedAvatarUrl,
  size = 'medium',
  className = '',
  showTooltip = true,
}: MiniAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const resolvedAvatarUrl = uploadedAvatarUrl || avatarUrl;

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
    setImageError(false);
  }, [resolvedAvatarUrl]);

  const handleImageError = () => {
    setImageError(true);
  };

  const showImage = resolvedAvatarUrl && !imageError;

  return (
    <div className={styles.tooltipContainer}>
      <div
        className={`${styles.miniAvatar} ${styles[size]} ${className}`}
        style={{ backgroundColor: getAvatarColor(userId || email) }}
      >
        {showTooltip && (
          <div className={styles.tooltip}>
            {getDisplayName()}
            <div className={styles.tooltipArrow} />
          </div>
        )}
        {showImage ? (
          <Image
            src={resolvedAvatarUrl!}
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
