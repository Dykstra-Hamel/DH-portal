import { LeadNotificationData } from '../types';

export function generateLeadCreatedEmailTemplate(
  recipientName: string,
  leadData: LeadNotificationData
): string {
  const {
    companyName,
    customerName,
    customerEmail,
    customerPhone,
    pestType,
    selectedPlan,
    recommendedPlan,
    address,
    homeSize,
    estimatedPrice,
    priority,
    autoCallEnabled,
    submittedAt,
  } = leadData;

  const priorityColors = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#65a30d',
  };

  const priorityColor = priorityColors[priority];
  const submittedDate = new Date(submittedAt).toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Lead Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
            🎯 New Lead Alert
          </h1>
          <p style="margin: 8px 0 0 0; color: #e2e8f0; font-size: 16px;">
            ${companyName}
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
            Hi ${recipientName},
          </p>

          <div style="background-color: #f1f5f9; border-left: 4px solid ${priorityColor}; padding: 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #1e293b;">
              ${autoCallEnabled ? '🤖 AI Agent is Calling Now' : '📞 Manual Follow-up Required'}
            </h2>
            <p style="margin: 0; font-size: 14px; color: #64748b;">
              ${
                autoCallEnabled
                  ? 'Our automated AI agent is currently calling the customer. The lead will be updated automatically with call notes.'
                  : 'This is a new lead that requires manual follow-up. Please contact the customer as soon as possible.'
              }
            </p>
          </div>

          <!-- Customer Information -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              👤 Customer Information
            </h3>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Name: </span>
                <span style="color: #1e293b;">${customerName}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Email: </span>
                <a href="mailto:${customerEmail}" style="color: #007bff; text-decoration: none;">${customerEmail}</a>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Phone: </span>
                <a href="tel:${customerPhone}" style="color: #007bff; text-decoration: none;">${customerPhone}</a>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Address: </span>
                <span style="color: #1e293b; text-align: right; max-width: 300px;">${address}</span>
              </div>
            </div>
          </div>

          <!-- Service Details -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              🐛 Service Request
            </h3>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Pest Type: </span>
                <span style="color: #1e293b;">${pestType}</span>
              </div>
              
              
              ${
                selectedPlan
                  ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #64748b;">Selected Plan:</span>
                  <span style="color: #1e293b;">${selectedPlan}</span>
                </div>
              `
                  : ''
              }
              
              ${
                recommendedPlan
                  ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #64748b;">Recommended Plan:</span>
                  <span style="color: #1e293b;">${recommendedPlan}</span>
                </div>
              `
                  : ''
              }
              
              ${
                homeSize
                  ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #64748b;">Home Size:</span>
                  <span style="color: #1e293b;">${homeSize.toLocaleString()} sq ft</span>
                </div>
              `
                  : ''
              }
              
              ${
                estimatedPrice
                  ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #64748b;">Estimated Price:</span>
                  <span style="color: #1e293b;">$${estimatedPrice.min} - $${estimatedPrice.max} (${estimatedPrice.service_type})</span>
                </div>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Lead Metrics -->

          <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
              <strong>Submitted:</strong> ${submittedDate}
            </p>
          </div>

          ${
            !autoCallEnabled
              ? `
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                ⚡ <strong>Action Required:</strong> This lead needs immediate follow-up. Please contact the customer promptly to maximize conversion potential.
              </p>
            </div>
          `
              : ''
          }
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            This notification was generated automatically by your widget system.
            <br>
            ${companyName} • Lead Management System
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
