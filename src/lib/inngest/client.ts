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

export interface WidgetScheduleCompletedEvent {
  name: 'widget/schedule-completed';
  data: {
    leadId: string;
    companyId: string;
    customerId: string;
    leadData: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      pestType: string;
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

export interface AutomationTriggerEvent {
  name: 'automation/trigger';
  data: {
    workflowId: string;
    companyId: string;
    leadId?: string;
    customerId?: string;
    triggerType: 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'email_opened' | 'email_clicked' | 'scheduled' | 'partial_lead_created' | 'inbound_call_transfer';
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

export interface WorkflowCancellationEvent {
  name: 'workflow/cancel';
  data: {
    executionId: string;
    workflowId: string;
    companyId: string;
    cancelledBy: string;
    cancellationReason: string;
    timestamp: string;
  };
}

export interface PartialLeadCreatedEvent {
  name: 'partial-lead/created';
  data: {
    partialLeadId: string;
    companyId: string;
    sessionId: string;
    stepCompleted: 'address' | 'confirm-address' | 'how-we-do-it' | 'quote-contact' | 'plan-comparison' | 'contact';
    formData: {
      pestType?: string;
      address?: string;
      addressDetails?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
      };
      contactInfo?: {
        name?: string;
        phone?: string;
        email?: string;
      };
      selectedPlan?: string;
      estimatedPrice?: {
        min: number;
        max: number;
        service_type: string;
      };
    };
    serviceAreaData?: {
      served: boolean;
      areas: any[];
      primaryArea?: any;
    } | null;
    attribution: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_term?: string;
      utm_content?: string;
      gclid?: string;
      referrer_url?: string;
      referrer_domain?: string;
      traffic_source: string;
      page_url: string;
    };
    createdAt: string;
  };
}

export interface InboundCallTransferEvent {
  name: 'inbound-call/transfer';
  data: {
    callId: string;
    companyId: string;
    leadId?: string;
    customerId?: string;
    callRecord: {
      id: string;
      call_id: string;
      phone_number: string;
      from_number?: string;
      call_status: string;
      disconnect_reason: string;
      duration_seconds?: number;
      start_timestamp?: string;
      end_timestamp?: string;
      transcript?: string;
      sentiment?: string;
    };
    leadData?: {
      id: string;
      lead_status: string;
      lead_source: string;
      comments?: string;
      pest_type?: string;
    };
    customerData?: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
    };
    transferContext: {
      isFollowUp: boolean;
      callDuration: number;
      transferReason: string;
      agentId?: string;
    };
    createdAt: string;
  };
}

export interface BulkLeadUploadScheduledEvent {
  name: 'bulk-lead-upload/scheduled';
  data: {
    uploadId: string;
    companyId: string;
    createdBy: string;
    fileName: string;
    scheduledFor: string;
    totalRows: number;
    parsedData: any[];
  };
}

export interface BulkLeadUploadCancelledEvent {
  name: 'bulk-lead-upload/cancelled';
  data: {
    uploadId: string;
    companyId: string;
    cancelledBy: string;
    timestamp: string;
  };
}

// Union type of all events
export type InngestEvent = LeadCreatedEvent | LeadStatusChangedEvent | WidgetScheduleCompletedEvent | AutomationTriggerEvent | EmailScheduledEvent | WorkflowTestEvent | CallSchedulingEvent | ScheduledCallExecutionEvent | CallCompletedEvent | RetellCallEndedEvent | WorkflowCancellationEvent | PartialLeadCreatedEvent | InboundCallTransferEvent | BulkLeadUploadScheduledEvent | BulkLeadUploadCancelledEvent;

// Helper function to send events
export const sendEvent = async (event: InngestEvent) => {
  try {
    await inngest.send(event);
  } catch (error) {
    console.error('Failed to send Inngest event:', error);
    throw error;
  }
};