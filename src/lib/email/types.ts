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

export interface LeadNotificationData {
  leadId: string;
  companyName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pestType: string;
  selectedPlan?: string;
  recommendedPlan?: string;
  address: string;
  homeSize?: number;
  estimatedPrice?: {
    min: number;
    max: number;
    service_type: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoCallEnabled: boolean;
  submittedAt: string;
}

export interface EmailNotificationConfig {
  subjectLine?: string;
  enabled: boolean;
}

export interface QuoteEmailData {
  firstName: string;
  pestType: string;
  address: string;
  companyName?: string;
  companyLogo?: string;
  customerEmail: string;
  selectedPlan?: {
    id: string;
    plan_name: string;
    initial_price: number;
    recurring_price: number;
    billing_frequency: string;
    requires_quote?: boolean;
  };
}

export interface CallSummaryEmailData {
  callId: string;
  companyName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone: string;
  fromNumber?: string;
  callStatus: string;
  callDuration?: number;
  callDate: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  transcript?: string;
  callSummary?: string;
  pestIssue?: string;
  streetAddress?: string;
  homeSize?: string;
  yardSize?: string;
  decisionMaker?: string;
  preferredServiceTime?: string;
  contactedOtherCompanies?: boolean;
  leadId?: string;
  recordingUrl?: string;
  disconnectReason?: string;
}
