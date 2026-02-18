'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { Notification, NotificationResponse } from '@/types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();
  const { selectedCompany, isLoading: companyLoading } = useCompany();
  const userId = user?.id;
  const companyId = selectedCompany?.id;

  // Request deduplication: prevent multiple concurrent fetches
  const fetchInProgressRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');

  // Fetch notifications from API with deduplication
  const fetchNotifications = useCallback(async () => {
    // Wait for CompanyContext to finish loading before making decisions
    if (companyLoading) {
      return; // Keep current state, don't clear notifications during loading
    }

    if (!user || !companyId) {
      // Clear notifications only when we're certain no company should be selected
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Deduplicate requests: check if same params are already being fetched
    const fetchParams = `${user.id}-${companyId}`;
    if (fetchInProgressRef.current && lastFetchParamsRef.current === fetchParams) {
      return; // Skip duplicate request
    }

    try {
      fetchInProgressRef.current = true;
      lastFetchParamsRef.current = fetchParams;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: '50',
        companyId: companyId,
      });
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(Math.max(0, data.unreadCount));
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch notifications'
      );
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [user, companyId, companyLoading]);

  // Set up broadcast-based real-time subscription and initial fetch
  useEffect(() => {
    // Wait for company to load before setting up subscriptions
    if (companyLoading) return;
    if (!userId || !companyId) return;

    const channelName = `company:${companyId}:notifications`;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Track subscription state to prevent duplicate subscriptions
    let isSubscribed = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const setupChannel = () => {
      if (!isSubscribed) return null;

      // Create fresh Supabase client with current auth context
      const supabase = createClient();

      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true, ack: true },
          },
        })
        .on('broadcast', { event: 'notification_update' }, (payload: any) => {
          const { action, notification, company_id } = payload.payload;

          // Only process notifications for the current user
          if (notification.user_id !== userId) {
            return;
          }

          // Verify this is for our company OR it's a mention notification (global)
          if (company_id !== companyId && notification.type !== 'mention') {
            return;
          }

          try {
            if (action === 'INSERT') {
              const newNotification = notification as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
            } else if (action === 'UPDATE') {
              const updatedNotification = notification as Notification;
              setNotifications(prev =>
                prev.map(notif =>
                  notif.id === updatedNotification.id
                    ? updatedNotification
                    : notif
                )
              );

              // We don't have access to old data in broadcast, so recalculate unread count
              setNotifications(currentNotifications => {
                const unreadCount = currentNotifications.filter(
                  n => !n.read
                ).length;
                setUnreadCount(unreadCount);
                return currentNotifications;
              });
            } else if (action === 'DELETE') {
              const deletedId = notification.id;
              const wasUnread = notification.read === false;

              setNotifications(prev =>
                prev.filter(notif => notif.id !== deletedId)
              );
              if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          } catch (error) {
            // Only log in development, suppress in production to reduce noise
            if (isDevelopment) {
              console.error(`Error processing notification ${action}:`, error);
            }
          }
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            // Successfully subscribed, reset reconnect attempts
            reconnectAttempts = 0;
          } else if (status === 'CHANNEL_ERROR') {
            // Only log error once in development, not repeatedly
            if (isDevelopment && reconnectAttempts === 0) {
              console.warn(`⚠️ Realtime notifications channel error: ${channelName}`);
            }

            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts < maxReconnectAttempts && isSubscribed) {
              reconnectAttempts++;
              const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);

              if (isDevelopment) {
                console.log(`🔄 Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
              }

              reconnectTimeout = setTimeout(() => {
                if (isSubscribed) {
                  supabase.removeChannel(channel);
                  setupChannel();
                }
              }, backoffDelay);
            }
          } else if (status === 'TIMED_OUT') {
            // Only log timeout once in development
            if (isDevelopment && reconnectAttempts === 0) {
              console.warn(`⏱️ Realtime notifications timed out: ${channelName}`);
            }
          } else if (status === 'CLOSED') {
            if (isDevelopment) {
              console.log(`🔌 Realtime notifications channel closed: ${channelName}`);
            }
          }
        });

      return channel;
    };

    const channel = setupChannel();

    // Initial fetch - call directly instead of using from dependency
    fetchNotifications();

    // Cleanup subscription
    return () => {
      isSubscribed = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, companyId, companyLoading]); // Removed fetchNotifications to prevent cascade

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Real-time subscription will handle the state update automatically
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to mark notification as read'
      );
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state immediately for better UX
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to mark all notifications as read'
      );
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Real-time subscription will handle the state update automatically
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete notification'
      );
    }
  }, []);

  // Navigate to notification reference
  const navigateToReference = useCallback(
    async (notification: Notification) => {
      if (!notification.reference_id || !notification.reference_type) {
        return;
      }

      // Mark as read when navigating
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Navigate based on reference type
      switch (notification.reference_type) {
        case 'ticket':
          router.push(
            `/tickets/new?ticketId=${notification.reference_id}`
          );
          break;
        case 'lead':
          router.push(`/tickets/leads/${notification.reference_id}`);
          break;
        case 'support_case':
          router.push('/tickets/customer-service');
          break;
        case 'project':
          router.push(`/projects?highlight=${notification.reference_id}`);
          break;
        case 'customer':
          router.push(`/customers/${notification.reference_id}`);
          break;
        case 'project_comment':
          try {
            const response = await fetch(
              `/api/admin/notifications/comment-reference?type=project_comment&commentId=${notification.reference_id}`
            );
            if (!response.ok) {
              throw new Error('Failed to resolve project comment');
            }
            const data = await response.json();
            if (data.projectId) {
              router.push(
                `/admin/project-management/${data.projectId}?commentId=${notification.reference_id}`
              );
            } else {
              router.push('/admin/project-management');
            }
          } catch (error) {
            console.error('Error resolving project comment notification:', error);
            router.push('/admin/project-management');
          }
          break;
        case 'task_comment':
          try {
            const response = await fetch(
              `/api/admin/notifications/comment-reference?type=task_comment&commentId=${notification.reference_id}`
            );
            if (!response.ok) {
              throw new Error('Failed to resolve task comment');
            }
            const data = await response.json();
            if (data.projectId && data.taskId) {
              router.push(
                `/admin/project-management/${data.projectId}?taskId=${data.taskId}&commentId=${notification.reference_id}`
              );
            } else if (data.projectId) {
              router.push(`/admin/project-management/${data.projectId}`);
            } else {
              router.push('/admin/project-management');
            }
          } catch (error) {
            console.error('Error resolving task comment notification:', error);
            router.push('/admin/project-management');
          }
          break;
        default:
          console.warn('Unknown reference type:', notification.reference_type);
      }
    },
    [router, markAsRead]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
    navigateToReference,
  };
}
