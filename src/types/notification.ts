export interface Notification {
  id: string;
  user_id: string;
  company_id: string;
  type: 'assignment' | 'department_lead' | 'department_ticket' | 'department_project';
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: 'ticket' | 'lead' | 'project' | 'customer';
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  navigateToReference: (notification: Notification) => void;
}