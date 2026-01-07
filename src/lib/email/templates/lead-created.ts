import { LeadNotificationData } from '../types';

export function generateLeadCreatedEmailTemplate(
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
        <title>New Customer Lead</title>
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
        <!-- Email Container -->
        <table role="presentation" style="width: 100%;">
          <tr>
            <td align="center" style="padding: 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #020618; padding: 50px 20px 30px 20px; text-align: center; border-radius: 6px;">
                    <h1 style="margin: 0 0 20px 0; font-size: 30px; font-weight: 700; line-height: 30px; color: #ffffff;">New Customer Lead</h1>
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
                      <strong>This lead needs immediate follow-up.</strong> Please contact the customer promptly to maximize conversion potential.
                    </p>
                  </td>
                </tr>

                <!-- Manual Follow-Up Section -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <table role="presentation" class="section-table" style="width: 100%; background-color: #F0F7FF; border: 1px solid #85C2FF; border-radius: 6px;">
                      <tr>
                        <td class="section-inner" style="text-align: center; padding: 20px;">
                          <img src="${baseUrl}/images/email/phone-icon.png" alt="Phone" style="width: 26px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
                          <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; line-height: 30px; color: #000000;">Manual Follow-Up Required</h2>
                          <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 400; line-height: 22px; color: #000000;">
                            This is a new lead that requires manual follow-up. Please contact the customer as soon as possible.
                          </p>
                          <a href="${leadData.leadUrl || '#'}" style="display: inline-block; padding: 12px 30px; background-color: #0080F0; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 700; line-height: 18px;">Open Lead Ticket</a>
                          <p style="margin: 20px 0 0 0; font-size: 16px; font-weight: 400; line-height: 22px; color: #000000;">
                            <strong>Submitted:</strong> ${new Date(leadData.submittedAt).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Customer Information Section -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <table role="presentation" class="section-table" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 6px;">
                      <tr>
                        <td class="section-inner" style="padding: 20px;">
                          <!-- Section Header with Icon (table-based for compatibility) -->
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

                ${leadData.pestType ? `
                <!-- Service Request Section (conditional) -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <table role="presentation" class="section-table" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 6px;">
                      <tr>
                        <td class="section-inner" style="padding: 20px;">
                          <!-- Section Header with Icon (table-based for compatibility) -->
                          <table role="presentation" style="width: 100%; margin-bottom: 15px; border-bottom: 1px solid #D1D5DB;">
                            <tr>
                              <td style="width: 19px; vertical-align: middle; padding: 0 10px 0 0;">
                                <img src="${baseUrl}/images/email/service-request-icon.png" alt="Service" style="width: 19px; height: auto; display: block;" />
                              </td>
                              <td style="vertical-align: middle; padding: 0;">
                                <h3 style="margin: 0; font-size: 18px; font-weight: 700; line-height: 30px; color: #000000;">Service Request</h3>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;">
                            <strong style="color: #4A5565;">Pest Type:</strong> <span style="color: #020618;">${leadData.pestType}</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

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
