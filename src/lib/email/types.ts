// Shared email types
export interface EmailRecipient {
  email: string;
  name: string;
}

export interface ProjectNotificationData {
  projectId: string;
  projectName: string;
  projectType: string;
  description: string | null;
  dueDate: string;
  priority: string;
  requesterName: string;
  requesterEmail: string;
  companyName: string;
}