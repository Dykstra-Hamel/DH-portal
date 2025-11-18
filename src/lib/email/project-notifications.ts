import { EmailRecipient, ProjectNotificationData } from './types';
import { generateProjectCreatedEmailTemplate } from './templates/project-created';
import { MAILERSEND_API_TOKEN, getCompanyFromEmail } from './index';

export async function sendProjectCreatedNotification(
  recipient: EmailRecipient,
  projectData: ProjectNotificationData,
  companyId?: string
) {
  try {
    // Get company's from email (custom domain if verified, otherwise fallback)
    const fromEmail = companyId ? await getCompanyFromEmail(companyId) : await getCompanyFromEmail('');
    const fromName = projectData.companyName || 'Project Management System';

    // Send email using MailerSend
    const mailersendPayload = {
      from: {
        email: fromEmail,
        name: fromName
      },
      to: [
        {
          email: recipient.email,
          name: recipient.name
        }
      ],
      subject: `New Project Request: ${projectData.projectName}`,
      html: generateProjectCreatedEmailTemplate(recipient.name, projectData)
    };

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_TOKEN}`,
      },
      body: JSON.stringify(mailersendPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send project created notification:', response.status, errorData);
      throw new Error(`Failed to send email: ${response.status} - ${response.statusText}`);
    }

    let data: any = {};
    try {
      const responseText = await response.text();
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      // Response wasn't JSON but that's okay if status was OK
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
