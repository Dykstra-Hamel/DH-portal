import { WebClient } from '@slack/web-api';
import { getSlackUserIdByDatabaseUserId } from './user-lookup';

export interface TaskUnblockedNotificationData {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  blockedByTaskTitle: string;
  assignedTo: string | null;
}

/**
 * Sends a DM to the assigned user when their task becomes unblocked
 */
export async function sendTaskUnblockedNotification(
  taskData: TaskUnblockedNotificationData
) {
  if (!taskData.assignedTo) {
    return { success: false, error: 'No user assigned to task' };
  }

  if (!process.env.SLACK_BOT_TOKEN) {
    return { success: false, error: 'Slack not configured' };
  }

  try {
    // Get Slack user ID
    const slackUserId = await getSlackUserIdByDatabaseUserId(taskData.assignedTo);

    if (!slackUserId) {
      return { success: false, error: 'User not found in Slack' };
    }

    const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

    // Build message blocks
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '✅ Task Unblocked',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Your task *${taskData.taskTitle}* is now unblocked and ready to work on!`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Project:*\n${taskData.projectName}`
          },
          {
            type: 'mrkdwn',
            text: `*Was blocked by:*\n${taskData.blockedByTaskTitle}`
          }
        ]
      }
    ];

    // Only add button if NEXT_PUBLIC_SITE_URL is configured
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      const actionUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/project-management/${taskData.projectId}?taskId=${taskData.taskId}`;
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Task',
              emoji: true
            },
            url: actionUrl,
            action_id: 'view_task'
          }
        ]
      });
    }

    const result = await slackClient.chat.postMessage({
      channel: slackUserId, // DM to user
      text: `Your task "${taskData.taskTitle}" is now unblocked and ready to work on!`,
      blocks
    });

    if (result.ok) {
      return { success: true, timestamp: result.ts };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error sending task unblocked notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Batch send notifications for multiple unblocked tasks
 */
export async function sendTaskUnblockedNotifications(
  unblockedTasks: Array<{
    id: string;
    title: string;
    assigned_to: string | null;
    project_id: string;
  }>,
  completedTask: {
    id: string;
    title: string;
    project_id: string;
    project?: { name: string };
  }
) {
  const promises = unblockedTasks.map(task => {
    if (!task.assigned_to) return Promise.resolve();

    return sendTaskUnblockedNotification({
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.project_id,
      projectName: completedTask.project?.name || 'Unknown Project',
      blockedByTaskTitle: completedTask.title,
      assignedTo: task.assigned_to
    });
  });

  await Promise.allSettled(promises);
}
