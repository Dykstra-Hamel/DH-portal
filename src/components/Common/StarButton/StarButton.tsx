import React from 'react';
import styles from './StarButton.module.scss';

export interface StarButtonProps {
  isStarred: boolean;
  onToggle: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function StarButton({
  isStarred,
  onToggle,
  size = 'medium',
  className,
}: StarButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click events
    onToggle();
  };

  return (
    <button
      className={`${styles.starButton} ${styles[size]} ${className || ''}`}
      onClick={handleClick}
      type="button"
      aria-label={isStarred ? 'Unstar item' : 'Star item'}
      title={isStarred ? 'Remove from Currently Working On' : 'Add to Currently Working On'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={styles.starIcon}
      >
        {isStarred ? (
          // Filled star
          <path
            fill="currentColor"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        ) : (
          // Outlined star
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        )}
      </svg>
    </button>
  );
}
