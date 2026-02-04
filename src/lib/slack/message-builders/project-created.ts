import { ProjectNotificationData } from '../types';

// Strip HTML tags from text
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export function buildProjectCreatedMessage(
  projectData: ProjectNotificationData
): {
  text: string;
  blocks: any[];
} {
  const priorityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴',
  };

  const fallbackText = `New project request: ${projectData.projectName} (${projectData.priority} priority)`;

  // Strip HTML and truncate description to avoid text limits
  const cleanDescription = projectData.description
    ? stripHtml(projectData.description)
    : '';

  const description = cleanDescription
    ? cleanDescription.length > 200
      ? `${cleanDescription.substring(0, 200)}...`
      : cleanDescription
    : '_No description provided_';

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚀 New Project Request',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${projectData.projectName}*\n${description}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Project Type:*\n${projectData.projectType}`,
        },
        {
          type: 'mrkdwn',
          text: `*Company:*\n${projectData.companyName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Priority:*\n${priorityEmoji[projectData.priority]} ${projectData.priority.charAt(0).toUpperCase() + projectData.priority.slice(1)}`,
        },
        {
          type: 'mrkdwn',
          text: `*Due Date:*\n${new Date(projectData.dueDate).toLocaleDateString()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Requested by:*\n${projectData.requesterName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Assigned to:*\n${projectData.assignedToName || '_Unassigned_'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Status:*\n${projectData.status}`,
        },
      ],
    },
  ];

  // Add action buttons if URL provided
  if (projectData.actionUrl) {
    // URL button only
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📋 View in Admin Panel',
          },
          url: projectData.actionUrl,
          style: 'primary',
        },
      ],
    });

    // Interactive button (separate actions block) - only show if project is unassigned
    if (!projectData.assignedToName) {
      blocks.push({
        type: 'actions',
        block_id: 'project_actions',
        elements: [
          {
            type: 'button',
            action_id: 'assign_project',
            text: {
              type: 'plain_text',
              text: '👤 Assign Project',
            },
            value: projectData.projectId,
          },
        ],
      });
    }
  }

  // Add divider
  blocks.push({
    type: 'divider',
  });

  // Add context
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Project ID: ${projectData.projectId} | Created: ${new Date(projectData.timestamp).toLocaleString()}`,
      },
    ],
  });

  return {
    text: fallbackText,
    blocks,
  };
}
