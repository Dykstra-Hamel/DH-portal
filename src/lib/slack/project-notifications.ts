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

  // Skip auth test in production to avoid hanging - just try to send message directly
  console.log('Skipping auth test, proceeding directly to message send...');

  try {
    const channel = config?.channel || getChannelForNotificationType('PROJECT_REQUESTS');
    console.log('Using channel:', channel);
    
    const message = buildProjectCreatedMessage(projectData);
    console.log('Built message:', { text: message.text, blockCount: message.blocks.length });

    console.log('About to call slack.chat.postMessage...');
    
    // Add timeout to prevent hanging (shorter timeout for serverless)
    const messageTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Message send timed out after 5 seconds')), 5000);
    });
    
    // Try simple text message first to debug
    const messagePromise = slackClient.chat.postMessage({
      channel: channel,
      text: `🚀 New Project Request: ${projectData.projectName}\n\nCompany: ${projectData.companyName}\nPriority: ${projectData.priority}\nDue Date: ${projectData.dueDate}\nRequested by: ${projectData.requesterName}\n\nDescription: ${projectData.description || 'No description provided'}`
    });
    
    const result = await Promise.race([messagePromise, messageTimeout]) as any;
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
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      data: (error as any)?.data
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