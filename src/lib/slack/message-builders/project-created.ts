import { ProjectNotificationData, SlackMessageBlock } from '../types';

export function buildProjectCreatedMessage(projectData: ProjectNotificationData): {
  text: string;
  blocks: SlackMessageBlock[];
} {
  const priorityEmoji = {
    low: '🟢',
    medium: '🟡', 
    high: '🟠',
    urgent: '🔴'
  };

  const priorityColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316', 
    urgent: '#ef4444'
  };

  const fallbackText = `New project request: ${projectData.projectName} (${projectData.priority} priority)`;

  const blocks: SlackMessageBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚀 New Project Request',
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${projectData.projectName}*\n${projectData.description || '_No description provided_'}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Project Type:*\n${projectData.projectType}`
        },
        {
          type: 'mrkdwn',
          text: `*Company:*\n${projectData.companyName}`
        },
        {
          type: 'mrkdwn',
          text: `*Priority:*\n${priorityEmoji[projectData.priority]} ${projectData.priority.charAt(0).toUpperCase() + projectData.priority.slice(1)}`
        },
        {
          type: 'mrkdwn',
          text: `*Due Date:*\n${new Date(projectData.dueDate).toLocaleDateString()}`
        },
        {
          type: 'mrkdwn',
          text: `*Requested by:*\n${projectData.requesterName}\n${projectData.requesterEmail}`
        },
        {
          type: 'mrkdwn',
          text: `*Status:*\n${projectData.status}`
        }
      ]
    }
  ];

  // Add action buttons if URL provided
  if (projectData.actionUrl) {
    blocks.push({
      type: 'actions',
      block_id: 'project_actions',
      elements: [
        {
          type: 'button',
          action_id: 'view_project_in_admin',
          text: {
            type: 'plain_text',
            text: '📋 View in Admin Panel',
            emoji: true
          },
          url: projectData.actionUrl,
          style: 'primary'
        },
        {
          type: 'button',
          action_id: 'assign_project',
          text: {
            type: 'plain_text',
            text: '👤 Assign Project',
            emoji: true
          },
          value: projectData.projectId,
          style: 'default'
        }
      ]
    });
  }

  // Add divider
  blocks.push({
    type: 'divider'
  });

  // Add context
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Project ID: ${projectData.projectId} | Created: ${new Date(projectData.timestamp).toLocaleString()}`
      }
    ]
  });

  return {
    text: fallbackText,
    blocks
  };
}