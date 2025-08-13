import { Inngest } from 'inngest';
import { inngestConfig } from './config';

// Create the Inngest client
export const inngest = new Inngest(inngestConfig);

// Event types for type safety
export interface LeadCreatedEvent {
  name: 'lead/created';
  data: {
    leadId: string;
    companyId: string;
    customerId: string;
    leadData: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      pestType: string;
      urgency: string;
      address: string;
      homeSize?: number;
      selectedPlan?: string;
      estimatedPrice?: {
        min: number;
        max: number;
        service_type: string;
      };
    };
    attribution: {
      leadSource: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };
    createdAt: string;
  };
}

export interface LeadStatusChangedEvent {
  name: 'lead/status-changed';
  data: {
    leadId: string;
    companyId: string;
    fromStatus: string;
    toStatus: string;
    leadData: Record<string, any>;
    userId: string;
    timestamp: string;
  };
}

export interface AutomationTriggerEvent {
  name: 'automation/trigger';
  data: {
    workflowId: string;
    companyId: string;
    leadId?: string;
    customerId?: string;
    triggerType: 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'email_opened' | 'email_clicked' | 'scheduled';
    triggerData: Record<string, any>;
  };
}

export interface EmailScheduledEvent {
  name: 'email/scheduled';
  data: {
    companyId: string;
    templateId: string;
    recipientEmail: string;
    recipientName: string;
    leadId?: string;
    customerId?: string;
    variables: Record<string, any>;
    scheduledFor: string;
    workflowId?: string;
    stepId?: string;
  };
}

export interface WorkflowTestEvent {
  name: 'workflow/test';
  data: {
    workflowId: string;
    companyId: string;
    testData: {
      sampleLead: Record<string, any>;
      skipActualExecution?: boolean;
    };
    userId: string;
  };
}

export interface CallSchedulingEvent {
  name: 'automation/schedule_call';
  data: {
    executionId: string;
    workflowId: string;
    companyId: string;
    leadId: string;
    stepId: string;
    callType: 'immediate' | 'scheduled' | 'follow_up' | 'urgent';
    delayMinutes?: number;
    callVariables?: any;
    isFollowUp?: boolean;
  };
}

export interface ScheduledCallExecutionEvent {
  name: 'automation/execute_scheduled_call';
  data: {
    executionId: string;
    workflowId: string;
    companyId: string;
    leadId: string;
    stepId: string;
    callType: 'immediate' | 'scheduled' | 'follow_up' | 'urgent';
    callVariables?: any;
    isFollowUp?: boolean;
    logEntryId: string;
    scheduledFor: string;
  };
}

export interface CallCompletedEvent {
  name: 'automation/call_completed';
  data: {
    callId: string;
    companyId: string;
    leadId: string;
    executionId: string;
    workflowId: string;
    stepId: string;
    callOutcome: 'successful' | 'failed' | 'no_answer' | 'busy' | 'voicemail';
    callDuration?: number;
    callTranscript?: string;
    callAnalysis?: {
      sentiment: 'positive' | 'negative' | 'neutral';
      appointmentScheduled: boolean;
      followUpRequested: boolean;
      objections: string[];
      leadQuality: 'hot' | 'warm' | 'cold';
    };
    retellCallData?: any;
  };
}

export interface RetellCallEndedEvent {
  name: 'retell/call_ended';
  data: {
    call_id: string;
    call_status: string;
    call_duration?: number;
    transcript?: string;
    call_analysis?: any;
    [key: string]: any;
  };
}

// Union type of all events
export type InngestEvent = LeadCreatedEvent | LeadStatusChangedEvent | AutomationTriggerEvent | EmailScheduledEvent | WorkflowTestEvent | CallSchedulingEvent | ScheduledCallExecutionEvent | CallCompletedEvent | RetellCallEndedEvent;

// Helper function to send events
export const sendEvent = async (event: InngestEvent) => {
  try {
    await inngest.send(event);
  } catch (error) {
    console.error('Failed to send Inngest event:', error);
    throw error;
  }
};