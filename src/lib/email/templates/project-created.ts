import { ProjectNotificationData } from '../types';

export function generateProjectCreatedEmailTemplate(
  recipientName: string,
  projectData: ProjectNotificationData
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const projectUrl = `${baseUrl}/admin/project-management/${projectData.projectId}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Project Assignment</title>
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
                    <h1 style="margin: 0 0 20px 0; font-size: 30px; font-weight: 700; line-height: 30px; color: #ffffff;">New Project Assignment</h1>
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
                      A new project has been assigned to you and requires your attention.
                    </p>
                  </td>
                </tr>

                <!-- Project Action Section -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <table role="presentation" class="section-table" style="width: 100%; background-color: #F0F7FF; border: 1px solid #85C2FF; border-radius: 6px;">
                      <tr>
                        <td class="section-inner" style="text-align: center; padding: 20px;">
                          <img src="${baseUrl}/images/email/service-request-icon.png" alt="Project" style="width: 26px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
                          <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; line-height: 30px; color: #000000;">${projectData.projectName}</h2>
                          <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 400; line-height: 22px; color: #000000;">
                            Please review the project details and begin work when ready.
                          </p>
                          <a href="${projectUrl}" style="display: inline-block; padding: 12px 30px; background-color: #0080F0; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 700; line-height: 18px;">Open Project</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Project Details Section -->
                <tr>
                  <td class="section-outer" style="padding: 0 30px 30px 30px;">
                    <table role="presentation" class="section-table" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 6px;">
                      <tr>
                        <td class="section-inner" style="padding: 20px;">
                          <!-- Section Header with Icon -->
                          <table role="presentation" style="width: 100%; margin-bottom: 15px; border-bottom: 1px solid #D1D5DB;">
                            <tr>
                              <td style="width: 15px; vertical-align: middle; padding: 0 10px 0 0;">
                                <img src="${baseUrl}/images/email/customer-icon.png" alt="Details" style="width: 15px; height: auto; display: block;" />
                              </td>
                              <td style="vertical-align: middle; padding: 0;">
                                <h3 style="margin: 0; font-size: 18px; font-weight: 700; line-height: 30px; color: #000000;">Project Details</h3>
                              </td>
                            </tr>
                          </table>
                          <table role="presentation" style="width: 100%;">
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Company:</strong> <span style="color: #020618;">${projectData.companyName}</span></p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Project Type:</strong> <span style="color: #020618;">${projectData.projectType}</span></p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Requested by:</strong> <span style="color: #020618;">${projectData.requesterName}</span></p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Priority:</strong> <span style="color: #020618; ${projectData.priority === 'urgent' ? 'color: #dc2626; font-weight: 700;' : projectData.priority === 'high' ? 'color: #ef4444; font-weight: 600;' : projectData.priority === 'medium' ? 'color: #f59e0b; font-weight: 600;' : 'color: #10b981; font-weight: 600;'}">${projectData.priority.charAt(0).toUpperCase() + projectData.priority.slice(1)}</span></p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0;">
                                <p style="margin: 0; font-size: 16px; font-weight: 400; line-height: 22px;"><strong style="color: #4A5565;">Due Date:</strong> <span style="color: #020618;">${new Date(projectData.dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span></p>
                              </td>
                            </tr>
                            ${projectData.description ? `
                            <tr>
                              <td style="padding: 15px 0 5px 0;">
                                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; line-height: 22px; color: #4A5565;">Description:</p>
                                <p style="margin: 0; padding: 10px; background-color: #F9FAFB; border-radius: 4px; font-size: 16px; font-weight: 400; line-height: 22px; color: #020618;">${projectData.description}</p>
                              </td>
                            </tr>
                            ` : ''}
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
