import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { MAILERSEND_API_TOKEN } from '@/lib/email';
import { abTestEngine } from '@/lib/ab-testing/ab-test-engine';

export const emailDeliveryTracking = inngest.createFunction(
  {
    id: 'email-delivery-tracking',
    name: 'Email Delivery Tracking',
    retries: 1,
  },
  { event: 'email/delivery-tracking' },
  async ({ event, step }) => {
    const { emailLogId, companyId, providerId, scheduledFor } = event.data;
    
    console.log(`Tracking email delivery: ${emailLogId}, provider ID: ${providerId}`);

    // Wait until scheduled time if needed
    const scheduledTime = new Date(scheduledFor);
    const now = new Date();
    
    if (scheduledTime > now) {
      await step.sleepUntil('wait-for-tracking-time', scheduledTime);
    }

    // Step 1: Get current email log entry
    const currentEmailLog = await step.run('get-current-email-log', async () => {
      const supabase = createAdminClient();
      
      const { data: emailLog, error } = await supabase
        .from('email_automation_log')
        .select('*')
        .eq('id', emailLogId)
        .single();

      if (error || !emailLog) {
        throw new Error(`Email log ${emailLogId} not found`);
      }

      return emailLog;
    });

    // If email already has delivery/open/click data, no need to track further
    if (currentEmailLog.send_status === 'clicked' || currentEmailLog.send_status === 'opened') {
      console.log(`Email ${emailLogId} already has engagement data, skipping tracking`);
      return { success: true, message: 'Already tracked' };
    }

    // Step 2: Query MailerSend for delivery status
    const deliveryStatus = await step.run('check-delivery-status', async () => {
      try {
        if (!MAILERSEND_API_TOKEN || !providerId) {
          return { success: false, error: 'Missing API token or provider ID' };
        }

        // MailerSend activity API endpoint
        const response = await fetch(`https://api.mailersend.com/v1/activity/${providerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MAILERSEND_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Message not found yet, might still be processing
            return { success: true, status: 'processing' };
          }
          
          const errorText = await response.text();
          throw new Error(`MailerSend API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // MailerSend returns activity data
        const activities = data.data || [];
        
        let latestStatus = 'sent';
        let deliveredAt = null;
        let openedAt = null;
        let clickedAt = null;
        
        for (const activity of activities) {
          switch (activity.type) {
            case 'delivered':
              latestStatus = 'delivered';
              deliveredAt = activity.timestamp;
              break;
            case 'opened':
              latestStatus = 'opened';
              openedAt = activity.timestamp;
              break;
            case 'clicked':
              latestStatus = 'clicked';
              clickedAt = activity.timestamp;
              break;
            case 'bounced':
            case 'complained':
            case 'unsubscribed':
              latestStatus = 'failed';
              break;
          }
        }
        
        return {
          success: true,
          status: latestStatus,
          deliveredAt,
          openedAt,
          clickedAt,
          activities,
        };
      } catch (error) {
        console.error('Error checking delivery status:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Step 3: Update email log with delivery status
    if (deliveryStatus.success && 'status' in deliveryStatus && deliveryStatus.status !== 'processing') {
      await step.run('update-email-log-status', async () => {
        const supabase = createAdminClient();
        
        const updateData: any = {
          send_status: deliveryStatus.status,
          updated_at: new Date().toISOString(),
        };

        if ('deliveredAt' in deliveryStatus && deliveryStatus.deliveredAt) {
          updateData.delivered_at = new Date(deliveryStatus.deliveredAt).toISOString();
        }

        if ('openedAt' in deliveryStatus && deliveryStatus.openedAt) {
          updateData.opened_at = new Date(deliveryStatus.openedAt).toISOString();
        }

        if ('clickedAt' in deliveryStatus && deliveryStatus.clickedAt) {
          updateData.clicked_at = new Date(deliveryStatus.clickedAt).toISOString();
        }

        if ('activities' in deliveryStatus && deliveryStatus.activities) {
          updateData.tracking_data = {
            activities: deliveryStatus.activities,
            lastChecked: new Date().toISOString(),
          };
        }

        const { error } = await supabase
          .from('email_automation_log')
          .update(updateData)
          .eq('id', emailLogId);

        if (error) {
          throw new Error(`Failed to update email log: ${error.message}`);
        }
      });

      // Record A/B test metrics if applicable
      if ('openedAt' in deliveryStatus && deliveryStatus.openedAt) {
        await abTestEngine.recordEmailMetrics(emailLogId, 'opened', new Date(deliveryStatus.openedAt));
      }
      if ('clickedAt' in deliveryStatus && deliveryStatus.clickedAt) {
        await abTestEngine.recordEmailMetrics(emailLogId, 'clicked', new Date(deliveryStatus.clickedAt));
      }
      if ('deliveredAt' in deliveryStatus && deliveryStatus.deliveredAt) {
        await abTestEngine.recordEmailMetrics(emailLogId, 'delivered', new Date(deliveryStatus.deliveredAt));
      }
    }

    // Step 4: Schedule follow-up tracking if needed
    if (deliveryStatus.success && 'status' in deliveryStatus && deliveryStatus.status === 'delivered' && !('openedAt' in deliveryStatus && deliveryStatus.openedAt)) {
      await step.run('schedule-followup-tracking', async () => {
        // Check again in 24 hours for opens/clicks
        const nextCheck = new Date();
        nextCheck.setHours(nextCheck.getHours() + 24);

        await inngest.send({
          name: 'email/delivery-tracking',
          data: {
            emailLogId,
            companyId,
            providerId,
            scheduledFor: nextCheck.toISOString(),
          },
        });
      });
    }

    // Step 5: Trigger engagement-based automations if applicable
    if (deliveryStatus.success && ('openedAt' in deliveryStatus && deliveryStatus.openedAt) || ('clickedAt' in deliveryStatus && deliveryStatus.clickedAt)) {
      await step.run('trigger-engagement-automation', async () => {
        const eventType = ('clickedAt' in deliveryStatus && deliveryStatus.clickedAt) ? 'email_clicked' : 'email_opened';
        
        // Find workflows triggered by email engagement
        const supabase = createAdminClient();
        const { data: workflows } = await supabase
          .from('automation_workflows')
          .select('*')
          .eq('company_id', companyId)
          .eq('trigger_type', eventType)
          .eq('is_active', true);

        if (workflows && workflows.length > 0) {
          // Trigger engagement-based workflows
          for (const workflow of workflows) {
            await inngest.send({
              name: 'automation/trigger',
              data: {
                workflowId: workflow.id,
                companyId,
                leadId: currentEmailLog.recipient_email, // Use email as reference if no lead ID
                triggerType: eventType,
                triggerData: {
                  emailLogId,
                  recipientEmail: currentEmailLog.recipient_email,
                  templateId: currentEmailLog.template_id,
                  engagementType: eventType,
                  engagementTime: deliveryStatus.clickedAt || deliveryStatus.openedAt,
                },
              },
            });
          }
        }
      });
    }

    return {
      success: true,
      emailLogId,
      deliveryStatus: 'status' in deliveryStatus ? deliveryStatus.status : undefined,
      tracked: deliveryStatus.success,
      error: 'error' in deliveryStatus ? deliveryStatus.error : undefined,
    };
  }
);

// Separate function to handle webhook updates from MailerSend
export const emailWebhookHandler = inngest.createFunction(
  {
    id: 'email-webhook-handler',
    name: 'Email Webhook Handler',
    retries: 2,
  },
  { event: 'email/webhook-received' },
  async ({ event, step }) => {
    const { webhookData } = event.data;
    
    console.log('Processing email webhook:', webhookData.type);

    // Step 1: Find the email log entry by provider ID
    const emailLog = await step.run('find-email-log', async () => {
      const supabase = createAdminClient();
      
      const { data: log, error } = await supabase
        .from('email_automation_log')
        .select('*')
        .eq('email_provider_id', webhookData.message_id)
        .single();

      if (error) {
        console.warn(`Email log not found for provider ID: ${webhookData.message_id}`);
        return null;
      }

      return log;
    });

    if (!emailLog) {
      console.log('Email log not found, webhook likely for non-automation email');
      return { success: true, message: 'Email log not found' };
    }

    // Step 2: Update email log based on webhook type
    await step.run('update-email-log-webhook', async () => {
      const supabase = createAdminClient();
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      const timestamp = new Date(webhookData.timestamp).toISOString();

      switch (webhookData.type) {
        case 'activity.delivered':
          updateData.send_status = 'delivered';
          updateData.delivered_at = timestamp;
          break;
        case 'activity.opened':
          updateData.send_status = 'opened';
          updateData.opened_at = timestamp;
          break;
        case 'activity.clicked':
          updateData.send_status = 'clicked';
          updateData.clicked_at = timestamp;
          break;
        case 'activity.bounced':
        case 'activity.complained':
        case 'activity.unsubscribed':
          updateData.send_status = 'failed';
          updateData.failed_at = timestamp;
          updateData.error_message = webhookData.reason || 'Email bounced or complained';
          break;
      }

      // Merge webhook data into tracking_data
      const existingTrackingData = emailLog.tracking_data || {};
      updateData.tracking_data = {
        ...existingTrackingData,
        webhooks: [
          ...(existingTrackingData.webhooks || []),
          {
            type: webhookData.type,
            timestamp,
            data: webhookData,
          },
        ],
      };

      const { error } = await supabase
        .from('email_automation_log')
        .update(updateData)
        .eq('id', emailLog.id);

      if (error) {
        throw new Error(`Failed to update email log: ${error.message}`);
      }
    });

    // Step 3: Trigger engagement automations if applicable
    if (['activity.opened', 'activity.clicked'].includes(webhookData.type)) {
      await step.run('trigger-webhook-automation', async () => {
        const eventType = webhookData.type === 'activity.clicked' ? 'email_clicked' : 'email_opened';
        
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
                  webhookData,
                  engagementTime: webhookData.timestamp,
                },
              },
            });
          }
        }
      });
    }

    return {
      success: true,
      webhookType: webhookData.type,
      emailLogId: emailLog.id,
      messageId: webhookData.message_id,
    };
  }
);