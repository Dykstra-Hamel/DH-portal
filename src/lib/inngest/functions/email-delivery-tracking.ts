import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { abTestEngine } from '@/lib/ab-testing/ab-test-engine';
import type { SesEvent } from '@/types/ses-events';

/**
 * Email Webhook Handler for AWS SES Events
 *
 * This function handles email tracking events from AWS SES delivered via SNS.
 * Events include: delivered, opened, clicked, bounced, complained
 *
 * Triggered by: SNS webhook endpoint (/api/webhooks/ses-events)
 */
export const emailWebhookHandler = inngest.createFunction(
  {
    id: 'email-webhook-handler',
    name: 'Email Webhook Handler',
    retries: 2,
  },
  { event: 'email/webhook-received' },
  async ({ event, step }) => {
    const { sesEvent }: { sesEvent: SesEvent } = event.data;

    console.log('Processing SES email webhook:', sesEvent.eventType);

    // Extract message ID from SES event
    const messageId = sesEvent.mail.messageId;

    // Step 1: Find the email log entry by SES message ID
    const emailLog = await step.run('find-email-log', async () => {
      const supabase = createAdminClient();

      // Check email_automation_log table (for automation workflow emails)
      const { data: log, error } = await supabase
        .from('email_automation_log')
        .select('*')
        .eq('email_provider_id', messageId)
        .single();

      if (error) {
        console.warn(`Email automation log not found for SES message ID: ${messageId}`);
        return null;
      }

      return log;
    });

    if (!emailLog) {
      console.log('Email automation log not found, event likely for non-automation email');
      return { success: true, message: 'Email log not found in automation table' };
    }

    // Step 2: Update email log based on SES event type
    await step.run('update-email-log-webhook', async () => {
      const supabase = createAdminClient();

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      const timestamp = new Date().toISOString();

      switch (sesEvent.eventType) {
        case 'Delivery':
          updateData.send_status = 'delivered';
          updateData.delivered_at = sesEvent.delivery?.timestamp || timestamp;
          break;
        case 'Open':
          updateData.send_status = 'opened';
          updateData.opened_at = timestamp;
          break;
        case 'Click':
          updateData.send_status = 'clicked';
          updateData.clicked_at = timestamp;
          break;
        case 'Bounce':
          updateData.send_status = 'failed';
          updateData.failed_at = sesEvent.bounce?.timestamp || timestamp;
          updateData.error_message = sesEvent.bounce?.bounceType
            ? `Bounce: ${sesEvent.bounce.bounceType}`
            : 'Email bounced';
          break;
        case 'Complaint':
          updateData.send_status = 'failed';
          updateData.failed_at = sesEvent.complaint?.timestamp || timestamp;
          updateData.error_message = 'Recipient complained';
          break;
      }

      // Merge SES event data into tracking_data
      const existingTrackingData = emailLog.tracking_data || {};
      updateData.tracking_data = {
        ...existingTrackingData,
        sesEvents: [
          ...(existingTrackingData.sesEvents || []),
          {
            eventType: sesEvent.eventType,
            timestamp,
            data: sesEvent,
          },
        ],
      };

      const { error } = await supabase
        .from('email_automation_log')
        .update(updateData)
        .eq('id', emailLog.id);

      if (error) {
        throw new Error(`Failed to update email automation log: ${error.message}`);
      }
    });

    // Step 3: Record A/B test metrics if applicable
    await step.run('record-ab-test-metrics', async () => {
      switch (sesEvent.eventType) {
        case 'Delivery':
          if (sesEvent.delivery?.timestamp) {
            await abTestEngine.recordEmailMetrics(
              emailLog.id,
              'delivered',
              new Date(sesEvent.delivery.timestamp)
            );
          }
          break;
        case 'Open':
          await abTestEngine.recordEmailMetrics(emailLog.id, 'opened', new Date());
          break;
        case 'Click':
          await abTestEngine.recordEmailMetrics(emailLog.id, 'clicked', new Date());
          break;
      }
    });

    // Step 4: Trigger engagement-based automations if applicable
    if (['Open', 'Click'].includes(sesEvent.eventType)) {
      await step.run('trigger-webhook-automation', async () => {
        const eventType = sesEvent.eventType === 'Click' ? 'email_clicked' : 'email_opened';

        const supabase = createAdminClient();
        const { data: workflows } = await supabase
          .from('automation_workflows')
          .select('*')
          .eq('company_id', emailLog.company_id)
          .eq('trigger_type', eventType)
          .eq('is_active', true);

        if (workflows && workflows.length > 0) {
          for (const workflow of workflows) {
            await inngest.send({
              name: 'automation/trigger',
              data: {
                workflowId: workflow.id,
                companyId: emailLog.company_id,
                triggerType: eventType,
                triggerData: {
                  emailLogId: emailLog.id,
                  recipientEmail: emailLog.recipient_email,
                  templateId: emailLog.template_id,
                  sesEvent,
                  engagementTime: new Date().toISOString(),
                },
              },
            });
          }
        }
      });
    }

    return {
      success: true,
      eventType: sesEvent.eventType,
      emailLogId: emailLog.id,
      messageId,
    };
  }
);
