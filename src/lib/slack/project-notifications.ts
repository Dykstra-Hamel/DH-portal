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
  console.log('sendProjectCreatedNotification called with:', {
    projectId: projectData.projectId,
    projectName: projectData.projectName,
    hasSlackClient: !!slackClient,
    slackBotToken: process.env.SLACK_BOT_TOKEN ? 'Present' : 'Missing',
    tokenLength: process.env.SLACK_BOT_TOKEN ? process.env.SLACK_BOT_TOKEN.length : 0
  });

  if (!slackClient) {
    console.warn('Slack client not initialized - SLACK_BOT_TOKEN not provided');
    return { success: false, error: 'Slack client not configured' };
  }

  // Test the client first
  try {
    console.log('Testing Slack client auth...');
    const authTest = await slackClient.auth.test();
    console.log('Auth test result:', authTest);
  } catch (authError) {
    console.error('Auth test failed:', authError);
    return { success: false, error: 'Slack authentication failed' };
  }

  try {
    const channel = config?.channel || getChannelForNotificationType('PROJECT_REQUESTS');
    console.log('Using channel:', channel);
    
    const message = buildProjectCreatedMessage(projectData);
    console.log('Built message:', { text: message.text, blockCount: message.blocks.length });

    console.log('About to call slack.chat.postMessage...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Slack API call timed out after 30 seconds')), 30000);
    });

    const slackPromise = slackClient.chat.postMessage({
      channel: channel,
      text: message.text,
      blocks: message.blocks,
      username: config?.username || 'Project Bot',
      icon_emoji: config?.iconEmoji || ':rocket:',
      thread_ts: config?.threadTs,
    });

    const result = await Promise.race([slackPromise, timeoutPromise]);
    console.log('Slack API call completed, result:', result);

    if (result.ok) {
      console.log('Slack notification sent successfully:', result.ts, 'to channel:', result.channel);
      return { success: true, timestamp: result.ts, channel: result.channel };
    } else {
      console.error('Failed to send Slack notification:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      data: error.data
    });
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