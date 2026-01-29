import { ProjectNotificationData } from '../types';

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

  // Truncate description to avoid text limits
  const description = projectData.description
    ? projectData.description.length > 200
      ? `${projectData.description.substring(0, 200)}...`
      : projectData.description
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
