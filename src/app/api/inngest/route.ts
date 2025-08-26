import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';

// Import all Inngest functions
import { leadCreatedHandler } from '@/lib/inngest/functions/lead-created';
import { leadStatusChangedHandler } from '@/lib/inngest/functions/lead-status-changed';
import { widgetScheduleCompletedHandler } from '@/lib/inngest/functions/widget-schedule-completed';
import { automationTriggerHandler } from '@/lib/inngest/functions/automation-trigger';
import { emailScheduledHandler } from '@/lib/inngest/functions/email-scheduled';
import { leadFollowUpSequence } from '@/lib/inngest/functions/lead-followup-sequence';
import { emailDeliveryTracking } from '@/lib/inngest/functions/email-delivery-tracking';
import { workflowTestHandler } from '@/lib/inngest/functions/workflow-test';
import { workflowExecuteHandler } from '@/lib/inngest/functions/workflow-execute';
import { callSchedulingHandler, scheduledCallExecutor } from '@/lib/inngest/functions/call-scheduling-handler';
import { callOutcomeTracker, retellCallWebhookHandler } from '@/lib/inngest/functions/call-outcome-tracker';
import { workflowCancellationHandler } from '@/lib/inngest/functions/workflow-cancel';

// Create the handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    leadCreatedHandler,
    leadStatusChangedHandler,
    widgetScheduleCompletedHandler,
    automationTriggerHandler,
    emailScheduledHandler,
    leadFollowUpSequence,
    emailDeliveryTracking,
    workflowTestHandler,
    workflowExecuteHandler,
    callSchedulingHandler,
    scheduledCallExecutor,
    callOutcomeTracker,
    retellCallWebhookHandler,
    workflowCancellationHandler,
  ],
  streaming: false, // Disable streaming for compatibility
});