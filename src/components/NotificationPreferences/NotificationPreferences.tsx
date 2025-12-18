'use client';

import { useEffect, useState } from 'react';
import { Bell, AlertCircle, CheckCircle } from 'lucide-react';
import type { NotificationType } from '@/types/notifications';
import styles from './NotificationPreferences.module.scss';

interface NotificationPreferencesProps {
  companyId: string;
}

interface NotificationTypeInfo {
  type: NotificationType;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationPreferences({ companyId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<Record<NotificationType, boolean>>({} as Record<NotificationType, boolean>);
  const [notificationTypes, setNotificationTypes] = useState<NotificationTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch preferences when component mounts or companyId changes
  useEffect(() => {
    if (!companyId) return;

    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setMessage(null);

        const response = await fetch(
          `/api/user/notification-preferences?companyId=${companyId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load preferences');
        }

        // Transform API response into state format
        const prefsMap: Record<NotificationType, boolean> = {} as Record<NotificationType, boolean>;
        data.data.allTypes.forEach((type: NotificationTypeInfo) => {
          prefsMap[type.type] = type.enabled;
        });

        setPreferences(prefsMap);
        setNotificationTypes(data.data.allTypes);
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Failed to load preferences',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [companyId]);

  const handleToggle = async (notificationType: NotificationType, newValue: boolean) => {
    // Optimistic update
    const previousValue = preferences[notificationType];
    setPreferences((prev) => ({ ...prev, [notificationType]: newValue }));
    setMessage(null);

    try {
      setSaving(true);

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          preferences: [
            {
              notification_type: notificationType,
              email_enabled: newValue,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update preference');
      }

      setMessage({
        type: 'success',
        text: 'Preference updated successfully',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating notification preference:', error);

      // Rollback on error
      setPreferences((prev) => ({ ...prev, [notificationType]: previousValue }));

      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update preference',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.notificationPreferences}>
        <div className={styles.header}>
          <Bell size={20} className={styles.icon} />
          <h3 className={styles.title}>Email Notifications</h3>
        </div>
        <div className={styles.loading}>Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className={styles.notificationPreferences}>
      <div className={styles.header}>
        <Bell size={20} className={styles.icon} />
        <h3 className={styles.title}>Email Notifications</h3>
      </div>
      <p className={styles.description}>
        Choose which email notifications you&apos;d like to receive for this company.
      </p>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className={styles.notificationList}>
        {notificationTypes.map((typeInfo) => (
          <div key={typeInfo.type} className={styles.notificationItem}>
            <div className={styles.notificationInfo}>
              <label htmlFor={`notif-${typeInfo.type}`} className={styles.notificationLabel}>
                {typeInfo.label}
              </label>
              <p className={styles.notificationDescription}>{typeInfo.description}</p>
            </div>
            <div className={styles.toggleControl}>
              <label className={styles.toggle}>
                <input
                  id={`notif-${typeInfo.type}`}
                  type="checkbox"
                  checked={preferences[typeInfo.type] || false}
                  onChange={(e) => handleToggle(typeInfo.type, e.target.checked)}
                  disabled={saving}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
