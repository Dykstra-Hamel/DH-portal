'use client';

import { useEffect, useState } from 'react';
import styles from './CountBadge.module.scss';

interface CountBadgeProps {
  count: number;
  isAnimating?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  variant?: 'default' | 'error' | 'neutral';
}

export function CountBadge({
  count,
  isAnimating = false,
  isActive = false,
  isLoading = false,
  variant = 'default'
}: CountBadgeProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update display count with animation
  useEffect(() => {
    if (count !== displayCount) {
      setIsUpdating(true);

      // Short delay to show the animation
      const timer = setTimeout(() => {
        setDisplayCount(count);
        setIsUpdating(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [count, displayCount]);

  const getClassNames = () => {
    const classNames = [styles.countBadge];

    if (isActive) classNames.push(styles.active);
    if (isAnimating || isUpdating) classNames.push(styles.animating);
    if (variant === 'error') classNames.push(styles.error);
    if (variant === 'neutral') classNames.push(styles.neutral);

    return classNames.join(' ');
  };

  return (
    <span className={getClassNames()}>
      {isLoading ? '•' : displayCount}
    </span>
  );
}