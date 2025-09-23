'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const supabase = useMemo(() => createClient(), []);

  // Fetch notifications from API
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

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: '50',
        companyId: companyId
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
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user, companyId, companyLoading]);

  // Set up real-time subscription and initial fetch
  useEffect(() => {
    // Wait for company to load before setting up subscriptions
    if (companyLoading) return;
    if (!userId || !companyId) return;

    // Subscribe to real-time changes

    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {

          // Check event type
          const isInsert = payload.eventType === 'INSERT';
          const isUpdate = payload.eventType === 'UPDATE';
          const isDelete = payload.eventType === 'DELETE';

          if (isInsert) {
            const newNotification = payload.new as Notification;

            // Filter by company_id in the client since we removed it from the subscription filter
            if (newNotification.company_id === companyId) {
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          } else if (isUpdate) {
            const updatedNotification = payload.new as Notification;

            // Filter by company_id for updates too
            if (updatedNotification.company_id === companyId) {
              setNotifications(prev =>
                prev.map(notif =>
                  notif.id === updatedNotification.id ? updatedNotification : notif
                )
              );

              // Update unread count if read status changed
              if (payload.old?.read !== updatedNotification.read) {
                setUnreadCount(prev => updatedNotification.read ? Math.max(0, prev - 1) : prev + 1);
              }
            }
          } else if (isDelete) {
            const deletedId = payload.old?.id;
            const wasUnread = payload.old?.read === false;

            setNotifications(prev => prev.filter(notif => notif.id !== deletedId));
            if (wasUnread) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    // Initial fetch
    fetchNotifications();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, companyId, companyLoading, supabase, fetchNotifications]); // Depend on both user ID and company ID for proper filtering

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Real-time subscription will handle the state update automatically
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
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
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
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
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, []);

  // Navigate to notification reference
  const navigateToReference = useCallback((notification: Notification) => {
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
        router.push(`/connections/tickets?ticketId=${notification.reference_id}`);
        break;
      case 'lead':
        router.push(`/connections/leads/${notification.reference_id}`);
        break;
      case 'support_case':
        router.push('/connections/customer-service');
        break;
      case 'project':
        router.push(`/projects?highlight=${notification.reference_id}`);
        break;
      case 'customer':
        router.push(`/customers/${notification.reference_id}`);
        break;
      default:
        console.warn('Unknown reference type:', notification.reference_type);
    }
  }, [router, markAsRead]);

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