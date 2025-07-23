import { ProjectNotificationData } from '../types';

export function generateProjectCreatedEmailTemplate(
  recipientName: string,
  projectData: ProjectNotificationData
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Project Request</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background-color: #f8fafc;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .project-details {
          background-color: white;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        .detail-row {
          display: flex;
          margin-bottom: 10px;
        }
        .detail-label {
          font-weight: 600;
          min-width: 120px;
          color: #475569;
        }
        .detail-value {
          color: #1e293b;
        }
        .priority-high { color: #ef4444; font-weight: 600; }
        .priority-urgent { color: #dc2626; font-weight: 700; }
        .priority-medium { color: #f59e0b; font-weight: 600; }
        .priority-low { color: #10b981; font-weight: 600; }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚀 New Project Request</h1>
      </div>
      
      <div class="content">
        <p>Hi ${recipientName},</p>
        
        <p>A new project has been requested and needs your attention:</p>
        
        <div class="project-details">
          <h3 style="margin-top: 0; color: #1e293b;">${projectData.projectName}</h3>
          
          <div class="detail-row">
            <span class="detail-label">Project Type:</span>
            <span class="detail-value">${projectData.projectType}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${projectData.companyName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Requested by:</span>
            <span class="detail-value">${projectData.requesterName} (${projectData.requesterEmail})</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Priority:</span>
            <span class="detail-value priority-${projectData.priority}">${projectData.priority.charAt(0).toUpperCase() + projectData.priority.slice(1)}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Due Date:</span>
            <span class="detail-value">${new Date(projectData.dueDate).toLocaleDateString()}</span>
          </div>
          
          ${
            projectData.description
              ? `
          <div style="margin-top: 15px;">
            <span class="detail-label">Description:</span>
            <div style="margin-top: 5px; padding: 10px; background-color: #f1f5f9; border-radius: 4px;">
              ${projectData.description}
            </div>
          </div>
          `
              : ''
          }
        </div>
        
        <p>Please review and assign this project when you have a chance.</p>
        
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" class="button">
          View in Admin Panel
        </a>
      </div>
      
      <div class="footer">
        <p>This is an automated notification from your project management system.</p>
      </div>
    </body>
    </html>
  `;
}
