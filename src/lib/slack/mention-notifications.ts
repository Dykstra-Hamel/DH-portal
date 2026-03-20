import { WebClient } from '@slack/web-api';
import { getSlackUserIdByDatabaseUserId } from './user-lookup';

interface MentionNotificationData {
  mentionedUserIds: string[];
  commenterName: string;
  contextType: 'project' | 'task' | 'monthly_service';
  contextName: string;
  clientName?: string | null;
  commentText: string;
  deepLinkUrl: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function buildContextLine(
  commenterName: string,
  contextType: MentionNotificationData['contextType'],
  contextName: string,
  clientName?: string | null
): string {
  const clientSuffix = clientName ? ` for *${clientName}*` : '';
  switch (contextType) {
    case 'project':
      return `*${commenterName}* tagged you in a comment on project *${contextName}*${clientSuffix}`;
    case 'task':
      return `*${commenterName}* tagged you in a comment on task *${contextName}*${clientSuffix}`;
    case 'monthly_service':
      return `*${commenterName}* tagged you in a comment on service *${contextName}*${clientSuffix}`;
  }
}

function buildEditContextLine(
  commenterName: string,
  contextType: MentionNotificationData['contextType'],
  contextName: string,
  clientName?: string | null
): string {
  const clientSuffix = clientName ? ` for *${clientName}*` : '';
  switch (contextType) {
    case 'project':
      return `*${commenterName}* edited a comment you were tagged in on project *${contextName}*${clientSuffix}`;
    case 'task':
      return `*${commenterName}* edited a comment you were tagged in on task *${contextName}*${clientSuffix}`;
    case 'monthly_service':
      return `*${commenterName}* edited a comment you were tagged in on service *${contextName}*${clientSuffix}`;
  }
}

export async function sendMentionSlackNotifications(data: MentionNotificationData): Promise<void> {
  if (data.mentionedUserIds.length === 0) return;
  if (!process.env.SLACK_BOT_TOKEN) return;

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  const contextLine = buildContextLine(
    data.commenterName,
    data.contextType,
    data.contextName,
    data.clientName
  );
  const plainText = stripHtml(data.commentText).slice(0, 500);

  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: contextLine,
      },
    },
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: plainText,
      },
    },
  ];

  if (data.deepLinkUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View',
          },
          url: data.deepLinkUrl,
          action_id: 'view_mention',
        },
      ],
    });
  }

  const promises = data.mentionedUserIds.map(async (userId) => {
    const slackUserId = await getSlackUserIdByDatabaseUserId(userId);
    if (!slackUserId) return;

    await client.chat.postMessage({
      channel: slackUserId,
      text: `${data.commenterName} tagged you in a comment on ${data.contextName}${data.clientName ? ` for ${data.clientName}` : ''}`,
      blocks,
    });
  });

  await Promise.allSettled(promises);
}

export async function sendEditedCommentSlackNotifications(data: MentionNotificationData): Promise<void> {
  if (data.mentionedUserIds.length === 0) return;
  if (!process.env.SLACK_BOT_TOKEN) return;

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  const contextLine = buildEditContextLine(
    data.commenterName,
    data.contextType,
    data.contextName,
    data.clientName
  );
  const plainText = stripHtml(data.commentText).slice(0, 500);

  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: contextLine,
      },
    },
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: plainText,
      },
    },
  ];

  if (data.deepLinkUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View',
          },
          url: data.deepLinkUrl,
          action_id: 'view_edited_mention',
        },
      ],
    });
  }

  const promises = data.mentionedUserIds.map(async (userId) => {
    const slackUserId = await getSlackUserIdByDatabaseUserId(userId);
    if (!slackUserId) return;

    await client.chat.postMessage({
      channel: slackUserId,
      text: `${data.commenterName} edited a comment you were tagged in on ${data.contextName}${data.clientName ? ` for ${data.clientName}` : ''}`,
      blocks,
    });
  });

  await Promise.allSettled(promises);
}
