import { LeadNotificationData } from '../types';

export interface LeadSchedulingNotificationData extends LeadNotificationData {
  requestedDate?: string;
  requestedTime?: string;
}

export function generateLeadSchedulingEmailTemplate(
  recipientName: string,
  leadData: LeadSchedulingNotificationData
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
    submittedAt,
    leadUrl,
    requestedDate,
    requestedTime,
  } = leadData;

  const priorityColors = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#65a30d',
  };

  const priorityColor = priorityColors[priority];
  const submittedDate = new Date(submittedAt).toLocaleString();

  // Format requested date if available
  const formattedRequestedDate = requestedDate
    ? new Date(requestedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Format requested time
  const timePreferenceEmoji = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    anytime: '⏰',
  };

  const timePreferenceLabel = {
    morning: 'Morning (8am - 12pm)',
    afternoon: 'Afternoon (12pm - 5pm)',
    evening: 'Evening (5pm - 8pm)',
    anytime: 'Anytime',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lead Ready for Scheduling</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
            📅 Lead Ready to Schedule
          </h1>
          <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 16px;">
            ${companyName}
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
            Hi ${recipientName},
          </p>

          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #065f46;">
              🎯 Scheduling Required
            </h2>
            <p style="margin: 0; font-size: 14px; color: #047857;">
              This lead is ready to be scheduled for service. Please reach out to the customer to confirm their appointment.
            </p>
          </div>

          ${
            requestedDate || requestedTime
              ? `
          <!-- Scheduling Preferences -->
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #78350f; border-bottom: 1px solid #fde68a; padding-bottom: 8px;">
              📆 Customer&apos;s Scheduling Preferences
            </h3>

            <div style="display: grid; gap: 12px;">
              ${
                formattedRequestedDate
                  ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #92400e;">Requested Date: </span>
                  <span style="color: #78350f; font-weight: 600;">${formattedRequestedDate}</span>
                </div>
              `
                  : ''
              }

              ${
                requestedTime
                  ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #92400e;">Time Preference: </span>
                  <span style="color: #78350f; font-weight: 600;">
                    ${timePreferenceEmoji[requestedTime as keyof typeof timePreferenceEmoji] || '⏰'}
                    ${timePreferenceLabel[requestedTime as keyof typeof timePreferenceLabel] || requestedTime}
                  </span>
                </div>
              `
                  : ''
              }
            </div>
          </div>
          `
              : ''
          }

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
                <a href="mailto:${customerEmail}" style="color: #10b981; text-decoration: none;">${customerEmail}</a>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Phone: </span>
                <a href="tel:${customerPhone}" style="color: #10b981; text-decoration: none;">${customerPhone}</a>
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
              🐛 Service Details
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

          ${
            leadUrl
              ? `
          <!-- Call to Action -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${leadUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
              View Lead & Schedule →
            </a>
          </div>
          `
              : ''
          }

          <!-- Lead Metrics -->
          <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
              <strong>Lead Updated:</strong> ${submittedDate}
            </p>
          </div>

          <div style="background-color: #dcfce7; border: 1px solid #10b981; border-radius: 6px; padding: 16px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #065f46;">
              ⚡ <strong>Action Required:</strong> Contact this customer to schedule their service appointment. Prompt scheduling helps ensure high customer satisfaction.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            This notification was generated automatically when the lead status changed to &quot;scheduling&quot;.
            <br>
            ${companyName} • Lead Management System
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
