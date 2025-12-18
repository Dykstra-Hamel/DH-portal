/**
 * Notification Preferences Helper Functions
 *
 * Functions for managing and checking user notification preferences
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import type {
  NotificationType,
  UserNotificationRecipient,
  UserNotificationPreference,
} from '@/types/notifications';

/**
 * Get list of users who should receive notifications for a specific event
 *
 * @param companyId - Company UUID
 * @param notificationType - Type of notification event
 * @param options - Optional filtering options
 * @param options.department - Filter by department (sales, scheduling, support)
 * @param options.assignedUserId - If provided, only return this user (ignores department filter)
 * @returns Array of recipients with email and name
 *
 * @example
 * // Get all sales team members
 * const recipients = await getNotificationRecipients(
 *   'company-uuid',
 *   'lead_created',
 *   { department: 'sales' }
 * );
 *
 * // Get only assigned user
 * const recipients = await getNotificationRecipients(
 *   'company-uuid',
 *   'lead_created',
 *   { assignedUserId: 'user-uuid' }
 * );
 */
export async function getNotificationRecipients(
  companyId: string,
  notificationType: NotificationType,
  options?: {
    department?: 'sales' | 'scheduling' | 'support';
    assignedUserId?: string;
  }
): Promise<UserNotificationRecipient[]> {
  const supabase = createAdminClient();

  try {
    // If assigned user specified, only notify that person
    if (options?.assignedUserId) {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', options.assignedUserId)
        .single();

      if (userError || !user) {
        console.error('Error fetching assigned user:', userError);
        return [];
      }

      // Check if user has email notifications enabled
      const shouldSend = await shouldSendNotification(
        options.assignedUserId,
        companyId,
        notificationType
      );

      if (!shouldSend) {
        return []; // User has disabled email notifications
      }

      return [
        {
          email: user.email,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          userId: user.id,
        },
      ];
    }

    // Build query for users in company
    const query = supabase
      .from('user_companies')
      .select(`
        user_id,
        profiles!inner(id, email, first_name, last_name)
      `)
      .eq('company_id', companyId);

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching company users:', usersError);
      return [];
    }

    if (!users || users.length === 0) {
      return [];
    }

    // If department filter specified, get users in that department
    let filteredUserIds = users.map((u) => u.user_id);

    if (options?.department) {
      const { data: deptUsers, error: deptError } = await supabase
        .from('user_departments')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('department', options.department);

      if (deptError) {
        console.error('Error fetching department users:', deptError);
      } else if (deptUsers) {
        filteredUserIds = deptUsers.map((d) => d.user_id);
      }
    }

    // Get notification preferences for these users
    const { data: preferences, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('company_id', companyId)
      .eq('notification_type', notificationType)
      .in('user_id', filteredUserIds);

    if (prefsError) {
      console.error('Error fetching notification preferences:', prefsError);
    }

    // Filter users based on department membership and email preferences
    const recipients = users
      .filter((user) => {
        // Check if user is in the filtered department (if specified)
        if (!filteredUserIds.includes(user.user_id)) {
          return false;
        }

        // Check notification preference
        const pref = preferences?.find((p) => p.user_id === user.user_id);
        // Default to enabled (opt-out model), but respect email_enabled setting
        return pref ? pref.email_enabled : true;
      })
      .map((u: any) => ({
        email: u.profiles.email,
        name: `${u.profiles.first_name || ''} ${u.profiles.last_name || ''}`.trim(),
        userId: u.user_id,
      }));

    return recipients;
  } catch (error) {
    console.error('Error in getNotificationRecipients:', error);
    return [];
  }
}

/**
 * Check if a specific user should receive a notification
 *
 * @param userId - User UUID
 * @param companyId - Company UUID
 * @param notificationType - Type of notification event
 * @returns True if user should receive notification, false otherwise
 *
 * @example
 * const should Send = await shouldSendNotification(
 *   'user-uuid',
 *   'company-uuid',
 *   'quote_submitted'
 * );
 */
export async function shouldSendNotification(
  userId: string,
  companyId: string,
  notificationType: NotificationType
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    const { data: pref, error } = await supabase
      .from('user_notification_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('notification_type', notificationType)
      .maybeSingle();

    if (error) {
      console.error('Error checking notification preference:', error);
      // Default to true on error (opt-out model)
      return true;
    }

    // Default to true if no preference exists (opt-out model)
    return pref?.email_enabled ?? true;
  } catch (error) {
    console.error('Error in shouldSendNotification:', error);
    return true; // Default to sending on error
  }
}

/**
 * Get all notification preferences for a user across all companies
 *
 * @param userId - User UUID
 * @returns Array of user's notification preferences
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<UserNotificationPreference[]> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('company_id', { ascending: true })
      .order('notification_type', { ascending: true });

    if (error) {
      console.error('Error fetching user notification preferences:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserNotificationPreferences:', error);
    return [];
  }
}

/**
 * Update or create a notification preference for a user
 *
 * @param userId - User UUID
 * @param companyId - Company UUID
 * @param notificationType - Type of notification event
 * @param emailEnabled - Whether email notifications are enabled
 * @returns The updated/created preference or null on error
 */
export async function upsertNotificationPreference(
  userId: string,
  companyId: string,
  notificationType: NotificationType,
  emailEnabled: boolean
): Promise<UserNotificationPreference | null> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .upsert(
        {
          user_id: userId,
          company_id: companyId,
          notification_type: notificationType,
          email_enabled: emailEnabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,company_id,notification_type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting notification preference:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertNotificationPreference:', error);
    return null;
  }
}

/**
 * Validate email addresses before sending notifications
 *
 * @param emails - Array of email addresses to validate
 * @returns Array of valid email addresses
 */
export function validateEmailAddresses(emails: string[]): string[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.filter((email) => emailRegex.test(email));
}
