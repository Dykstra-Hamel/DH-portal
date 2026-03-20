import { ReactNode, useState, useEffect } from 'react';
import styles from './InfoCard.module.scss';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  headerRight?: ReactNode;
  isCollapsible?: boolean;
  startExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  forceCollapse?: boolean;
  forceExpand?: boolean;
  isCompact?: boolean;
  inSidebar?: boolean;
  isActive?: boolean;
}

export function InfoCard({
  title,
  children,
  className = '',
  icon,
  headerRight,
  isCollapsible = true,
  startExpanded = false,
  onExpand,
  onCollapse,
  forceCollapse = false,
  forceExpand = false,
  isCompact = false,
  inSidebar = false,
  isActive = false,
}: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(startExpanded);

  // Force collapse when forceCollapse prop becomes true
  useEffect(() => {
    if (forceCollapse && !forceExpand) {
      setIsExpanded(false);
    }
  }, [forceCollapse, forceExpand]);

  // Force expand when forceExpand prop becomes true
  useEffect(() => {
    if (forceExpand) {
      setIsExpanded(true);
      if (onExpand) {
        onExpand();
      }
    }
  }, [forceExpand, onExpand]);

  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    if (newExpandedState && onExpand) {
      onExpand();
    }
    if (!newExpandedState && onCollapse) {
      onCollapse();
    }
  };

  return (
    <div
      className={`${styles.infoCard} ${isExpanded ? styles.expandedCard : ''} ${isCompact ? styles.compact : ''} ${inSidebar ? styles.inSidebar : ''} ${isActive ? styles.activeCard : ''} ${className}`}
    >
      <div
        className={`${styles.header} ${isCollapsible ? styles.clickable : ''} ${!isExpanded ? styles.collapsed : styles.expanded}`}
        onClick={isCollapsible ? toggleExpanded : undefined}
      >
        <div className={styles.headerLeft}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <h3>{title}</h3>
          <p className={styles.compactTitle}>{title}</p>
        </div>
        <div className={styles.headerRight}>
          {headerRight && (
            <div
              className={styles.headerRightContent}
              onClick={e => e.stopPropagation()}
            >
              {headerRight}
            </div>
          )}
          {isCollapsible && (
            <button
              className={styles.toggleButton}
              onClick={e => {
                e.stopPropagation(); // Prevent double-trigger from header click
                toggleExpanded();
              }}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="6"
                viewBox="-0.3335 0 10 6"
                fill="none"
                className={!isExpanded ? styles.rotated : ''}
                aria-hidden="true"
              >
                <path
                  d="M8.6665 4.66666L4.6665 0.666664L0.666504 4.66666"
                  stroke="currentColor"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      {isExpanded && <div className={styles.body}>{children}</div>}
    </div>
  );
}
