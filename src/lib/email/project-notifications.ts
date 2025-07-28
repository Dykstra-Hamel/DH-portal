import { Resend } from 'resend';
import { EmailRecipient, ProjectNotificationData } from './types';
import { generateProjectCreatedEmailTemplate } from './templates/project-created';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendProjectCreatedNotification(
  recipient: EmailRecipient,
  projectData: ProjectNotificationData
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com',
      to: [recipient.email],
      subject: `New Project Request: ${projectData.projectName}`,
      html: generateProjectCreatedEmailTemplate(recipient.name, projectData),
    });

    if (error) {
      console.error('Failed to send project created notification:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
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
