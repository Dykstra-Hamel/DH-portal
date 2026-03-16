import { LeadNotificationData } from '../types';

export function generateCustomerCommentEmailTemplate(
  recipientName: string,
  leadData: LeadNotificationData
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customer Left a Comment</title>
        <style>
          @media only screen and (max-width: 768px) {
            .section-outer {
              padding: 0 14px 14px 14px !important;
            }
            .section-inner {
              padding: 18px !important;
            }
            .section-table {
              width: 100% !important;
              max-width: 100% !important;
            }
            .greeting-section {
              padding: 30px 14px 20px 14px !important;
            }
            .footer-section {
              padding: 18px !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td align="center" style="padding: 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #020618; padding: 50px 20px 30px 20px; text-align: center; border-radius: var(--border-radius);">
                    <h1 style="margin: 0 0 20px 0; font-size: 30px; font-weight: 700; line-height: 30px; color: #ffffff;">Customer Left a Comment</h1>
                    <img src="${baseUrl}/images/email/header-logo.png" alt="PMP CENTRAL" style="width: 110px; height: auto; opacity: 0.56;" />
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td class="greeting-section" style="padding: 30px 30px 20px 30px;">
                    <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px; color: #000000;">Hi ${recipientName},</p>
                  </td>
                </tr>

                <!-- Alert Message -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px; color: #000000;">
                      <strong>${leadData.customerName}</strong> has left a comment on their quote. Review it and follow up as needed.
                    </p>
                  </td>
                </tr>

                <!-- Customer Comment Section -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <table role="presentation" class="section-table" style="width: 100%; background-color: #fffbeb; border: 1px solid #f59e0b; border-left: 4px solid #f59e0b; border-radius: 6px;">
                      <tr>
                        <td class="section-inner" style="padding: 20px;">
                          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #92400e;">Customer Note</h3>
                          <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 24px; color: #1c1917; white-space: pre-wrap;">${leadData.customerComment || ''}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- View Lead Button -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="${leadData.leadUrl || '#'}" style="display: inline-block; padding: 12px 30px; background-color: #0080F0; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 700; line-height: 18px;">Open Lead Ticket</a>
                  </td>
                </tr>

                <!-- Customer Information Section -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <table role="presentation" class="section-table" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 6px;">
                      <tr>
                        <td class="section-inner" style="padding: 20px;">
                          <table role="presentation" style="width: 100%; margin-bottom: 15px; border-bottom: 1px solid #D1D5DB;">
                            <tr>
                              <td style="width: 15px; vertical-align: middle; padding: 0 10px 0 0;">
                                <img src="${baseUrl}/images/email/customer-icon.png" alt="Customer" style="width: 15px; height: auto; display: block;" />
                              </td>
                              <td style="vertical-align: middle; padding: 0;">
                                <h3 style="margin: 0; font-size: 18px; font-weight: 700; line-height: 30px; color: #000000;">Customer Information</h3>
                              </td>
                            </tr>
                          </table>
                          <table role="presentation" style="width: 100%;">
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Name:</strong> <span style="color: #020618;">${leadData.customerName}</span></p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Email:</strong> <a href="mailto:${leadData.customerEmail}" style="color: #020618; text-decoration: underline;">${leadData.customerEmail}</a></p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Phone:</strong> <a href="tel:${leadData.customerPhone}" style="color: #020618; text-decoration: underline;">${leadData.customerPhone}</a></p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Address:</strong> <span style="color: #020618;">${leadData.address}</span></p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td class="footer-section" style="padding: 30px; text-align: center;">
                    <img src="${baseUrl}/images/email/footer-logo.png" alt="PMP CENTRAL" style="width: 179px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" />
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      This notification was generated automatically by PMPCENTRAL - A Dykstra | Hamel Company
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
