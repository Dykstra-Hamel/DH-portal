/**
 * Notification Types and Interfaces
 *
 * Type definitions for the user notification preference system
 */

/**
 * Supported notification types for user preferences
 */
export type NotificationType =
  | 'lead_created'                        // New lead from widget/form submission
  | 'lead_status_changed_scheduling'      // Lead status changed to scheduling
  | 'campaign_submitted'                  // Customer redeems campaign landing page
  | 'quote_submitted'                     // Customer updates or signs quote
  | 'quote_signed';                       // Quote signed by customer (existing)

/**
 * User notification preference database record
 */
export interface UserNotificationPreference {
  id: string;
  user_id: string;
  company_id: string;
  notification_type: NotificationType;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Recipient information for sending notifications
 */
export interface UserNotificationRecipient {
  email: string;
  name: string;
  userId?: string;
}

/**
 * Request/response types for notification preferences API
 */
export interface UpdateNotificationPreferenceRequest {
  notification_type: NotificationType;
  email_enabled: boolean;
  company_id: string;
}

export interface BulkUpdateNotificationPreferencesRequest {
  company_id: string;
  preferences: Array<{
    notification_type: NotificationType;
    email_enabled: boolean;
  }>;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  data?: UserNotificationPreference[];
  error?: string;
}

/**
 * Helper type for notification preference lookup
 */
export interface NotificationPreferenceLookup {
  [key: string]: {  // key format: `${userId}_${companyId}_${notificationType}`
    email_enabled: boolean;
  };
}
