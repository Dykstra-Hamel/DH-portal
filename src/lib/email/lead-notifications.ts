import { EmailRecipient, LeadNotificationData } from './types';
import { generateLeadCreatedEmailTemplate } from './templates/lead-created';
import { generateLeadSchedulingEmailTemplate } from './templates/lead-scheduling';
import { getCompanyFromEmail, getCompanyName, getCompanyTenantName } from './index';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';
import { getNotificationRecipients } from './notification-preferences';
import type { NotificationType } from '@/types/notifications';

export async function sendLeadCreatedNotifications(
  recipients: string[],
  leadData: LeadNotificationData & { requestedDate?: string; requestedTime?: string },
  emailConfig?: {
    subjectLine?: string;
    notificationType?: NotificationType;
  },
  companyId?: string
) {
  try {
    // Get company's from email (custom domain if verified, otherwise fallback)
    const fromEmail = companyId ? await getCompanyFromEmail(companyId) : await getCompanyFromEmail('');
    const fromName = companyId ? await getCompanyName(companyId) : 'PMPCENTRAL';
    const tenantName = companyId ? await getCompanyTenantName(companyId) : '';

    const results = [];

    // Send email to each recipient
    for (const email of recipients) {
      try {
        // Extract name from email or use generic greeting
        const recipientName = email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        // Determine notification type
        const notificationType = emailConfig?.notificationType || 'lead_created';

        // Generate subject line based on notification type
        const subject = generateSubjectLine(leadData, emailConfig?.subjectLine, notificationType);

        // Generate HTML content using appropriate template
        const html = notificationType === 'lead_status_changed_scheduling'
          ? generateLeadSchedulingEmailTemplate(recipientName, leadData)
          : generateLeadCreatedEmailTemplate(recipientName, leadData);

        // Send email using AWS SES with fallback
        const result = await sendEmailWithFallback({
          tenantName,
          from: fromEmail,
          fromName,
          to: email,
          subject,
          html,
          companyId: companyId || '',
          leadId: leadData.leadId,
          source: 'lead_created_notification',
          tags: ['lead', 'notification'],
        });

        if (!result.success) {
          console.error(`Failed to send lead notification to ${email}:`, result.error);
          results.push({ email, success: false, error: result.error });
        } else {
          results.push({ email, success: true, messageId: result.messageId });
        }
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        results.push({
          email,
          success: false,
          error:
            emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;


    return {
      success: successCount > 0,
      results,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error('Error in sendLeadCreatedNotifications:', error);
    throw error;
  }
}

// Helper function to validate email addresses
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    const trimmedEmail = email.trim();
    if (emailRegex.test(trimmedEmail)) {
      valid.push(trimmedEmail);
    } else {
      invalid.push(trimmedEmail);
    }
  }

  return { valid, invalid };
}

// Generate subject line with template variable support
function generateSubjectLine(
  leadData: LeadNotificationData,
  customTemplate?: string,
  notificationType?: NotificationType
): string {
  // Default templates based on notification type
  const defaultTemplates = {
    lead_created: 'New Service Request: {customerName} - {companyName}',
    lead_status_changed_scheduling: 'Ready to Schedule: {customerName} - {companyName}',
  };

  // Use custom template or default based on notification type
  const template = customTemplate || defaultTemplates[notificationType as keyof typeof defaultTemplates] || defaultTemplates.lead_created;

  // Replace template variables
  return template
    .replace(/\{customerName\}/g, leadData.customerName)
    .replace(/\{companyName\}/g, leadData.companyName)
    .replace(/\{pestIssue\}/g, leadData.pestType)
    .replace(/\{priority\}/g, leadData.priority.toUpperCase())
    .replace(/\{address\}/g, leadData.address);
}

/**
 * Send lead notifications with department-based filtering
 *
 * Uses the notification preferences system to:
 * - Send only to assigned user if lead is assigned
 * - Send to department members if lead is unassigned
 * - Respect user email notification preferences
 *
 * @param companyId - Company UUID
 * @param leadData - Lead notification data
 * @param options - Notification options
 * @param options.assignedUserId - If provided, only notify this user
 * @param options.department - Department to notify (sales, scheduling, support)
 * @param options.leadStatus - Lead status for routing logic
 * @param options.leadUrl - URL to view the lead in the app
 * @param options.notificationType - Type of notification to send (determines email template)
 * @returns Results of email sending
 */
export async function sendLeadNotificationsWithDepartmentFiltering(
  companyId: string,
  leadData: LeadNotificationData & { leadUrl?: string; requestedDate?: string; requestedTime?: string },
  options: {
    assignedUserId?: string;
    department?: 'sales' | 'scheduling' | 'support';
    leadStatus?: string;
    leadUrl?: string;
    notificationType?: NotificationType;
  }
) {
  try {
    // Determine which department to notify based on lead status
    let targetDepartment = options.department;

    if (!targetDepartment && options.leadStatus) {
      // Route based on lead status
      if (options.leadStatus === 'ready_to_schedule' || options.leadStatus === 'scheduling') {
        targetDepartment = 'scheduling';
      } else if (options.leadStatus === 'new' || options.leadStatus === 'contacted') {
        targetDepartment = 'sales';
      }
    }

    // Default to sales if no department specified
    targetDepartment = targetDepartment || 'sales';

    // Determine notification type - default to lead_created
    const notificationType = options.notificationType || 'lead_created';

    // Get recipients based on assignment and department
    const recipients = await getNotificationRecipients(
      companyId,
      notificationType,
      {
        assignedUserId: options.assignedUserId,
        department: targetDepartment,
      }
    );

    if (recipients.length === 0) {
      console.log('No recipients found for lead notification (all users may have disabled emails)');
      return {
        success: true,
        results: [],
        successCount: 0,
        failureCount: 0,
        message: 'No email recipients (users disabled email notifications)',
      };
    }

    // Convert recipients to email array
    const recipientEmails = recipients.map(r => r.email);

    // Send emails using existing function with notification type
    return await sendLeadCreatedNotifications(
      recipientEmails,
      leadData,
      {
        notificationType,
      },
      companyId
    );
  } catch (error) {
    console.error('Error in sendLeadNotificationsWithDepartmentFiltering:', error);
    throw error;
  }
}
