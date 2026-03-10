import { WebClient } from '@slack/web-api';
import { getSlackUserIdByDatabaseUserId } from './user-lookup';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export async function sendNewProofSlackNotifications(data: {
  recipientUserIds: string[];
  uploaderName: string;
  projectName: string;
  deepLinkUrl: string;
}): Promise<void> {
  if (data.recipientUserIds.length === 0) return;
  if (!process.env.SLACK_BOT_TOKEN) return;

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  const contextLine = `*${data.uploaderName}* uploaded a new proof for project *${data.projectName}*`;

  const blocks: any[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: contextLine },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Proof' },
          url: data.deepLinkUrl,
          action_id: 'view_proof',
        },
      ],
    },
  ];

  const promises = data.recipientUserIds.map(async (userId) => {
    const slackUserId = await getSlackUserIdByDatabaseUserId(userId);
    if (!slackUserId) return;
    await client.chat.postMessage({
      channel: slackUserId,
      text: `${data.uploaderName} uploaded a new proof for ${data.projectName}`,
      blocks,
    });
  });

  await Promise.allSettled(promises);
}

export async function sendProofFeedbackSlackNotifications(data: {
  recipientUserIds: string[];
  authorName: string;
  projectName: string;
  clientName?: string | null;
  comment: string;
  deepLinkUrl: string;
}): Promise<void> {
  if (data.recipientUserIds.length === 0) return;
  if (!process.env.SLACK_BOT_TOKEN) return;

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  const clientSuffix = data.clientName ? ` for *${data.clientName}*` : '';
  const contextLine = `*${data.authorName}* left feedback on a proof for project *${data.projectName}*${clientSuffix}`;
  const truncatedComment = stripHtml(data.comment).slice(0, 300);

  const blocks: any[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: contextLine },
    },
    {
      type: 'section',
      text: { type: 'plain_text', text: truncatedComment },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Proof' },
          url: data.deepLinkUrl,
          action_id: 'view_proof_feedback',
        },
      ],
    },
  ];

  const promises = data.recipientUserIds.map(async (userId) => {
    const slackUserId = await getSlackUserIdByDatabaseUserId(userId);
    if (!slackUserId) return;
    await client.chat.postMessage({
      channel: slackUserId,
      text: `${data.authorName} left feedback on a proof for ${data.projectName}${data.clientName ? ` for ${data.clientName}` : ''}`,
      blocks,
    });
  });

  await Promise.allSettled(promises);
}

export async function sendProofFeedbackResolvedSlackNotification(data: {
  recipientUserId: string;
  resolverName: string;
  projectName: string;
  feedbackComment: string;
  deepLinkUrl: string;
}): Promise<void> {
  if (!data.recipientUserId) return;
  if (!process.env.SLACK_BOT_TOKEN) return;

  const slackUserId = await getSlackUserIdByDatabaseUserId(data.recipientUserId);
  if (!slackUserId) return;

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  const contextLine = `*${data.resolverName}* resolved your proof feedback on project *${data.projectName}*`;
  const truncatedComment = stripHtml(data.feedbackComment).slice(0, 300);

  const blocks: any[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: contextLine },
    },
  ];

  if (truncatedComment) {
    blocks.push({
      type: 'section',
      text: { type: 'plain_text', text: truncatedComment },
    });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View Feedback' },
        url: data.deepLinkUrl,
        action_id: 'view_resolved_proof_feedback',
      },
    ],
  });

  await client.chat.postMessage({
    channel: slackUserId,
    text: `${data.resolverName} resolved your proof feedback on ${data.projectName}`,
    blocks,
  });
}
