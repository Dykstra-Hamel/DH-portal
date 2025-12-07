import { EmailRecipient, ProjectNotificationData } from './types';
import { generateProjectCreatedEmailTemplate } from './templates/project-created';
import { getCompanyFromEmail, getCompanyTenantName } from './index';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';

export async function sendProjectCreatedNotification(
  recipient: EmailRecipient,
  projectData: ProjectNotificationData,
  companyId?: string
) {
  try {
    // Get company's from email (custom domain if verified, otherwise fallback)
    const fromEmail = companyId ? await getCompanyFromEmail(companyId) : await getCompanyFromEmail('');
    const fromName = projectData.companyName || 'Project Management System';
    const tenantName = companyId ? await getCompanyTenantName(companyId) : '';

    // Generate email content
    const subject = `New Project Request: ${projectData.projectName}`;
    const html = generateProjectCreatedEmailTemplate(recipient.name, projectData);

    // Send email using AWS SES
    const result = await sendEmailWithFallback({
      tenantName,
      from: fromEmail,
      fromName,
      to: recipient.email,
      subject,
      html,
      companyId: companyId || '',
      source: 'project_created_notification',
      tags: ['project', 'notification'],
    });

    if (!result.success) {
      console.error('Failed to send project created notification:', result.error);
      throw new Error(`Failed to send email: ${result.error}`);
    }

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending project created notification:', error);
    throw error;
  }
}

// Future project notification functions can be added here:
// - sendProjectAssignedNotification
// - sendProjectCompletedNotification
// - sendProjectOverdueNotification
// - etc.
