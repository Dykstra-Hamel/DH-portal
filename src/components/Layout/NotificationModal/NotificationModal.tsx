'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, CheckCheck, Eye } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';
import styles from './NotificationModal.module.scss';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    navigateToReference,
    refreshNotifications,
  } = useNotifications();

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });

  // Format time ago helper
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

    return date.toLocaleDateString();
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    navigateToReference(notification);
    onClose();
  };

  const handleMarkAsRead = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(notification.id);
  };

  const handleDelete = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Notifications</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close notifications modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalFilters}>
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`${styles.filterTab} ${filter === 'unread' ? styles.active : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              className={styles.markAllReadButton}
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>Error loading notifications</p>
              <button onClick={refreshNotifications} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <h3 className={styles.notificationTitle}>{notification.title}</h3>
                      <div className={styles.notificationActions}>
                        {!notification.read && (
                          <button
                            className={styles.actionButton}
                            onClick={(e) => handleMarkAsRead(notification, e)}
                            title="Mark as read"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          className={styles.actionButton}
                          onClick={(e) => handleDelete(notification, e)}
                          title="Delete notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    <div className={styles.notificationMeta}>
                      <span className={styles.notificationTime}>
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      <span className={styles.notificationFullDate}>
                        {formatFullDate(notification.created_at)}
                      </span>
                      {notification.reference_type && (
                        <span className={styles.notificationReference}>
                          {notification.reference_type.charAt(0).toUpperCase() +
                           notification.reference_type.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className={styles.unreadIndicator}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}