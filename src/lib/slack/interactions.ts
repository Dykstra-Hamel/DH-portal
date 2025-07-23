import { WebClient } from '@slack/web-api';

// Initialize Slack client for interactions
let slackClient: WebClient | null = null;

if (process.env.SLACK_BOT_TOKEN) {
  slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
}

export interface SlackInteractionContext {
  userId: string;
  userName: string;
  teamId: string;
  channelId?: string;
  messageTs?: string;
  responseUrl: string;
  triggerId?: string;
}

export interface ProjectAssignmentData {
  projectId: string;
  assigneeId: string;
  assigneeName: string;
}

// Handle project assignment from Slack
export async function handleProjectAssignment(
  context: SlackInteractionContext,
  projectData: ProjectAssignmentData
) {
  if (!slackClient) {
    console.error('Slack client not initialized');
    return { success: false, error: 'Slack client not configured' };
  }

  try {
    // Here you would typically:
    // 1. Update the project in your database
    // 2. Send a confirmation message back to Slack
    // 3. Notify relevant parties

    // For now, let's send a simple response
    const response = await fetch(context.responseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `Project ${projectData.projectId} has been assigned to ${projectData.assigneeName}`,
        response_type: 'ephemeral', // Only visible to the user who clicked
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send response' };
    }
  } catch (error) {
    console.error('Error handling project assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Open a modal for project assignment
export async function openProjectAssignmentModal(
  context: SlackInteractionContext,
  projectId: string
) {
  if (!context.triggerId) {
    return { success: false, error: 'Cannot open modal - missing trigger ID' };
  }

  try {
    const response = await fetch('https://slack.com/api/views.open', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger_id: context.triggerId,
        view: {
          type: 'modal',
          callback_id: 'project_assignment_modal',
          title: {
            type: 'plain_text',
            text: 'Assign Project',
          },
          submit: {
            type: 'plain_text',
            text: 'Assign',
          },
          close: {
            type: 'plain_text',
            text: 'Cancel',
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Assign Project ${projectId}*\n\nSelect a team member to assign this project to:`,
              },
            },
            {
              type: 'input',
              block_id: 'assignee_selection',
              element: {
                type: 'users_select',
                action_id: 'selected_assignee',
                placeholder: {
                  type: 'plain_text',
                  text: 'Select a user',
                },
              },
              label: {
                type: 'plain_text',
                text: 'Assignee',
              },
            },
            {
              type: 'input',
              block_id: 'assignment_note',
              element: {
                type: 'plain_text_input',
                action_id: 'note_input',
                multiline: true,
                placeholder: {
                  type: 'plain_text',
                  text: 'Add a note for the assignee (optional)',
                },
              },
              label: {
                type: 'plain_text',
                text: 'Note',
              },
              optional: true,
            },
          ],
          private_metadata: JSON.stringify({
            projectId,
            originalUser: context.userId,
          }),
        },
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return { success: true };
    } else {
      console.error('Error opening modal:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error opening assignment modal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send a follow-up message to the original channel
export async function sendFollowUpMessage(
  context: SlackInteractionContext,
  message: string
) {
  if (!slackClient || !context.channelId) {
    return {
      success: false,
      error: 'Cannot send follow-up - missing client or channel',
    };
  }

  try {
    const result = await slackClient.chat.postMessage({
      channel: context.channelId,
      text: message,
      thread_ts: context.messageTs, // Reply in thread if available
    });

    if (result.ok) {
      return { success: true, timestamp: result.ts };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error sending follow-up message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
