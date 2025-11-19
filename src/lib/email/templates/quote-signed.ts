import { QuoteSignedEmailData } from '../types';

export function generateQuoteSignedEmailTemplate(
  data: QuoteSignedEmailData
): string {
  const {
    quoteId,
    leadId,
    companyName,
    customerName,
    customerEmail,
    quoteTotal,
    signedAt,
    quoteUrl,
    assignedUserName,
    serviceType,
    serviceAddress,
  } = data;

  const signedDate = new Date(signedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(quoteTotal);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Signed - ${customerName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
            ✅ Quote Accepted!
          </h1>
          <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 16px;">
            ${companyName}
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
            Hi ${assignedUserName},
          </p>

          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #065f46;">
              🎉 Great news! A customer signed your quote
            </h2>
            <p style="margin: 0; font-size: 14px; color: #047857;">
              ${customerName} has accepted the quote and is ready to move forward. Please follow up to schedule the service.
            </p>
          </div>

          <!-- Quote Information -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              📋 Quote Details
            </h3>

            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Quote Amount:</span>
                <span style="color: #10b981; font-size: 18px; font-weight: 600;">${formattedTotal}</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Signed Date:</span>
                <span style="color: #1e293b;">${signedDate}</span>
              </div>

              ${
                serviceType
                  ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Service Type:</span>
                <span style="color: #1e293b;">${serviceType}</span>
              </div>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Customer Information -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              👤 Customer Information
            </h3>

            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Name:</span>
                <span style="color: #1e293b;">${customerName}</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Email:</span>
                <a href="mailto:${customerEmail}" style="color: #007bff; text-decoration: none;">${customerEmail}</a>
              </div>

              ${
                serviceAddress
                  ? `
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Service Address:</span>
                <span style="color: #1e293b; text-align: right; max-width: 300px;">${serviceAddress}</span>
              </div>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Action Required Section -->
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              📞 <strong>Next Steps:</strong> Please contact ${customerName} to schedule the service and confirm the appointment details.
            </p>
          </div>

          ${
            quoteUrl
              ? `
          <!-- View Quote Button -->
          <div style="text-align: center; margin-bottom: 16px;">
            <a href="${quoteUrl}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              View Quote
            </a>
          </div>
          `
              : ''
          }
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            This notification was generated automatically by your quote management system.
            <br>
            ${companyName} • Quote ID: ${quoteId}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
