'use client';

import { useState } from 'react';
import styles from './NotificationIcon.module.scss';

interface NotificationIconProps {
  notificationCount?: number;
}

export function NotificationIcon({ notificationCount = 0 }: NotificationIconProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleDropdown();
  };

  return (
    <div className={styles.notificationContainer}>
      <button
        className={styles.notificationButton}
        onClick={handleNotificationClick}
        aria-label="View notifications"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="22" 
          height="25" 
          viewBox="0 0 22 25" 
          fill="none"
          className={styles.bellIcon}
        >
          <path 
            d="M9.30838 22.5007C9.49863 22.8302 9.77226 23.1038 10.1018 23.2941C10.4313 23.4843 10.805 23.5844 11.1855 23.5844C11.566 23.5844 11.9398 23.4843 12.2693 23.2941C12.5988 23.1038 12.8724 22.8302 13.0627 22.5007" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M1.71515 16.1365C1.57356 16.2917 1.48012 16.4847 1.4462 16.692C1.41228 16.8993 1.43933 17.112 1.52407 17.3042C1.60882 17.4964 1.74759 17.6599 1.92352 17.7747C2.09944 17.8895 2.30494 17.9507 2.51501 17.9508H19.8561C20.0662 17.9509 20.2717 17.8899 20.4478 17.7754C20.6238 17.6608 20.7627 17.4975 20.8477 17.3054C20.9327 17.1133 20.96 16.9007 20.9263 16.6934C20.8927 16.486 20.7995 16.2929 20.6582 16.1376C19.2167 14.6517 17.6885 13.0725 17.6885 8.19643C17.6885 6.47175 17.0034 4.81771 15.7838 3.59817C14.5643 2.37864 12.9103 1.69351 11.1856 1.69351C9.46089 1.69351 7.80684 2.37864 6.58731 3.59817C5.36777 4.81771 4.68265 6.47175 4.68265 8.19643C4.68265 13.0725 3.15338 14.6517 1.71515 16.1365Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        
        {notificationCount > 0 && (
          <span className={styles.notificationBadge}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className={styles.backdrop} 
            onClick={() => setShowDropdown(false)}
          />
          <div className={styles.notificationDropdown}>
            <div className={styles.dropdownHeader}>
              <h3>Notifications</h3>
            </div>
            <div className={styles.dropdownContent}>
              {notificationCount === 0 ? (
                <div className={styles.emptyState}>
                  <p>No new notifications</p>
                </div>
              ) : (
                <div className={styles.notificationList}>
                  {/* Placeholder for future notification items */}
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationContent}>
                      <p className={styles.notificationTitle}>Sample Notification</p>
                      <p className={styles.notificationText}>This is where notifications will appear</p>
                      <span className={styles.notificationTime}>5 minutes ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.dropdownFooter}>
              <button className={styles.viewAllButton}>
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}