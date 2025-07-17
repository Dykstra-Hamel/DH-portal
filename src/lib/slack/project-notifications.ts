import { WebClient } from '@slack/web-api';
import { ProjectNotificationData, SlackNotificationConfig } from './types';
import { getChannelForNotificationType } from './channels';
import { buildProjectCreatedMessage } from './message-builders/project-created';

// Initialize Slack client
let slackClient: WebClient | null = null;

if (process.env.SLACK_BOT_TOKEN) {
  slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
}

export async function sendProjectCreatedNotification(
  projectData: ProjectNotificationData,
  config?: Partial<SlackNotificationConfig>
) {
  if (!slackClient) {
    console.warn('Slack client not initialized - SLACK_BOT_TOKEN not provided');
    return { success: false, error: 'Slack client not configured' };
  }

  try {
    const channel = config?.channel || getChannelForNotificationType('PROJECT_REQUESTS');
    const message = buildProjectCreatedMessage(projectData);

    // Debug: Log the message blocks
    console.log('Slack message blocks:', JSON.stringify(message.blocks, null, 2));

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channel,
        text: message.text,
        blocks: message.blocks,
        username: config?.username || 'Project Bot',
        icon_emoji: config?.iconEmoji || ':rocket:',
        thread_ts: config?.threadTs,
      }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('Slack notification sent successfully');
      return { success: true, timestamp: result.ts, channel: result.channel };
    } else {
      console.error('Failed to send Slack notification:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendProjectAssignedNotification(
  projectData: ProjectNotificationData,
  config?: Partial<SlackNotificationConfig>
) {
  // Future implementation
  console.log('Project assigned notification not yet implemented');
  return { success: false, error: 'Not implemented' };
}

export async function sendProjectCompletedNotification(
  projectData: ProjectNotificationData,
  config?: Partial<SlackNotificationConfig>
) {
  // Future implementation
  console.log('Project completed notification not yet implemented');
  return { success: false, error: 'Not implemented' };
}

export async function sendProjectOverdueNotification(
  projectData: ProjectNotificationData,
  config?: Partial<SlackNotificationConfig>
) {
  // Future implementation
  console.log('Project overdue notification not yet implemented');
  return { success: false, error: 'Not implemented' };
}