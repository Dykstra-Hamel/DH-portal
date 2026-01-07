/**
 * Unsubscribe Footer Generator
 *
 * Generates a standard, email-safe unsubscribe footer for all outgoing emails.
 * Uses inline styles and table-based layout for maximum email client compatibility.
 */

export interface UnsubscribeFooterOptions {
  unsubscribeUrl: string;
  companyName?: string;
}

/**
 * Generates HTML for the unsubscribe footer
 *
 * @param options - Footer configuration options
 * @returns HTML string with inline styles for email compatibility
 */
export function generateUnsubscribeFooter(
  options: UnsubscribeFooterOptions
): string {
  const { unsubscribeUrl, companyName = 'us' } = options;

  return `
<!-- Unsubscribe Footer -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 18px;">
  <tr>
    <td style="padding-bottom: 20px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 0 0 10px 0;">
            <p style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #666666;">
You’re receiving this email because you opted in or have done business with ${companyName}. You may unsubscribe at any time.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0 0 0;">
            <a href="${unsubscribeUrl}" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #0066cc; text-decoration: underline;">
              Unsubscribe from these emails
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- End Unsubscribe Footer -->
`;
}

/**
 * Generates plain text version of the unsubscribe footer
 *
 * @param options - Footer configuration options
 * @returns Plain text footer string
 */
export function generatePlainTextUnsubscribeFooter(
  options: UnsubscribeFooterOptions
): string {
  const { unsubscribeUrl, companyName = 'us' } = options;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are receiving this email from ${companyName}.
If you no longer wish to receive marketing emails from us, you can unsubscribe:

${unsubscribeUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
