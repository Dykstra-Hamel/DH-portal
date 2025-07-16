// Shared Slack notification types
export interface SlackChannel {
  id: string;
  name: string;
}

export interface SlackNotificationConfig {
  channel: string; // Channel ID or name
  threadTs?: string; // For threaded replies
  username?: string; // Custom bot username
  iconEmoji?: string; // Custom emoji
}

// Base notification data that all notifications share
export interface BaseNotificationData {
  id: string;
  timestamp: string;
  companyName: string;
  actionUrl?: string; // Link back to the app
}

// Project-specific notification data
export interface ProjectNotificationData extends BaseNotificationData {
  projectId: string;
  projectName: string;
  projectType: string;
  description: string | null;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  requesterName: string;
  requesterEmail: string;
  assignedToName?: string;
  assignedToEmail?: string;
}

// Future notification types can extend BaseNotificationData
export interface UserNotificationData extends BaseNotificationData {
  userId: string;
  userName: string;
  userEmail: string;
  action: 'created' | 'updated' | 'deleted';
}

export interface CompanyNotificationData extends BaseNotificationData {
  companyId: string;
  companyName: string;
  action: 'created' | 'updated' | 'deleted';
}

// Notification channel configurations
export interface NotificationChannels {
  PROJECT_REQUESTS: string;
}

// Slack message block building helpers
export interface SlackMessageBlock {
  type: string;
  block_id?: string;
  text?: any;
  fields?: any[];
  accessory?: any;
  elements?: any[];
}