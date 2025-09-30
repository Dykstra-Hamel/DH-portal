import { ReactNode, useState } from 'react';
import styles from './InfoCard.module.scss';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  isCollapsible?: boolean;
  startExpanded?: boolean;
}

export function InfoCard({
  title,
  children,
  className = '',
  icon,
  isCollapsible = true,
  startExpanded = false
}: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(startExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${styles.infoCard} ${className}`}>
      <div
        className={`${styles.header} ${isCollapsible ? styles.clickable : ''} ${!isExpanded ? styles.collapsed : styles.expanded}`}
        onClick={isCollapsible ? toggleExpanded : undefined}
      >
        <div className={styles.headerLeft}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <h3>{title}</h3>
        </div>
        {isCollapsible && (
          <button
            className={styles.toggleButton}
            onClick={(e) => {
              e.stopPropagation(); // Prevent double-trigger from header click
              toggleExpanded();
            }}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="21"
              viewBox="0 0 20 21"
              fill="none"
              className={!isExpanded ? styles.rotated : ''}
            >
              <path
                d="M6 12.2539L10 7.80946L14 12.2539"
                stroke="#99A1AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      {isExpanded && (
        <div className={styles.body}>
          {children}
        </div>
      )}
    </div>
  );
}