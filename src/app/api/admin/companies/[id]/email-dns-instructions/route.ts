import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEmail } from '@/lib/aws-ses/send-email';
import { generateDmarcRecord, generateSpfRecord, DnsRecord } from '@/lib/dns-utils';

// Helper to get company settings
async function getCompanySettings(companyId: string): Promise<Record<string, string>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`Failed to fetch company settings: ${error.message}`);
  }

  const settings: Record<string, string> = {};
  data?.forEach(s => {
    settings[s.setting_key] = s.setting_value;
  });
  return settings;
}

// Helper to transform DKIM tokens into DNS records format
function transformDkimTokensToRecords(dkimTokens: any[], domain: string): DnsRecord[] {
  const records: DnsRecord[] = [];

  // Add DKIM CNAME records
  if (dkimTokens && dkimTokens.length > 0) {
    dkimTokens.forEach((token) => {
      records.push({
        hostname: token.name || `${token.token}._domainkey.${domain}`,
        type: token.type || 'CNAME',
        value: token.value || `${token.token}.dkim.amazonses.com`,
      });
    });
  }

  return records;
}

// Generate HTML email template
function generateEmailHtml(domain: string, records: DnsRecord[]): string {
  const recordsHtml = records.map(record => `
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">${record.type}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all;">${record.hostname}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all;">${record.value}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DNS Configuration Instructions</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 3px solid #3b82f6;">
      <h1 style="margin: 0; color: #1f2937; font-size: 24px;">DNS Configuration Instructions</h1>
      <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">Domain: <strong style="color: #1f2937;">${domain}</strong></p>
    </div>

    <!-- Action Required Box -->
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-top: 20px;">
      <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ Action Required</p>
      <p style="margin: 8px 0 0 0; color: #78350f;">Please add the following DNS records to your domain provider to enable email sending.</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 30px; margin-top: 20px; border-radius: 8px;">
      <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Step-by-Step Instructions</h2>

      <ol style="color: #374151; line-height: 1.8; padding-left: 20px;">
        <li style="margin-bottom: 12px;">Log in to your domain provider&apos;s DNS management console (e.g., GoDaddy, Namecheap, Cloudflare, Route53)</li>
        <li style="margin-bottom: 12px;">Navigate to the DNS records or DNS zone file section for <strong>${domain}</strong></li>
        <li style="margin-bottom: 12px;">Add each of the DNS records listed in the table below</li>
        <li style="margin-bottom: 12px;">Save your changes (DNS propagation may take up to 72 hours, but usually completes within a few hours)</li>
        <li style="margin-bottom: 12px;">Return to the admin panel and click &quot;Verify Domain&quot; to confirm the configuration</li>
      </ol>

      <h2 style="margin: 30px 0 20px 0; color: #1f2937; font-size: 20px;">DNS Records to Add</h2>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; color: #374151;">Type</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; color: #374151;">Hostname / Name</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; color: #374151;">Value / Points To</th>
            </tr>
          </thead>
          <tbody>
            ${recordsHtml}
          </tbody>
        </table>
      </div>

      <h2 style="margin: 30px 0 20px 0; color: #1f2937; font-size: 20px;">What These Records Do</h2>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">CNAME Records (DKIM)</h3>
        <p style="margin: 0; color: #6b7280; line-height: 1.6;">These records enable DomainKeys Identified Mail (DKIM) authentication, which helps prevent email spoofing and improves deliverability. You should see 3 CNAME records with &quot;_domainkey&quot; in the hostname.</p>
      </div>

      <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">⚠️ TXT Record (SPF) - IMPORTANT</h3>
        <p style="margin: 0 0 10px 0; color: #78350f; line-height: 1.6; font-weight: 600;">You can only have ONE SPF record per domain.</p>
        <p style="margin: 0; color: #78350f; line-height: 1.6;"><strong>If you already have an SPF record:</strong> Do NOT create a new one. Instead, add <code style="background-color: #ffffff; padding: 2px 6px; border-radius: 3px;">include:amazonses.com</code> to your existing SPF record, before the final mechanism (usually <code style="background-color: #ffffff; padding: 2px 6px; border-radius: 3px;">~all</code> or <code style="background-color: #ffffff; padding: 2px 6px; border-radius: 3px;">-all</code>).</p>
        <p style="margin: 10px 0 0 0; color: #78350f; line-height: 1.6;"><strong>If you don&apos;t have an SPF record yet:</strong> Create a new TXT record with the value shown in the table above.</p>
      </div>

      <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b;">
        <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">⚠️ TXT Record (DMARC) - IMPORTANT</h3>
        <p style="margin: 0 0 10px 0; color: #78350f; line-height: 1.6; font-weight: 600;">You can only have ONE DMARC record per domain.</p>
        <p style="margin: 0; color: #78350f; line-height: 1.6;"><strong>If you already have a DMARC record:</strong> Do NOT create a new one. Your existing DMARC record should work fine with AWS SES. No changes needed unless you want to adjust your DMARC policy.</p>
        <p style="margin: 10px 0 0 0; color: #78350f; line-height: 1.6;"><strong>If you don&apos;t have a DMARC record yet:</strong> Create a new TXT record with the value shown in the table above.</p>
      </div>

      <h2 style="margin: 30px 0 20px 0; color: #1f2937; font-size: 20px;">Important Notes</h2>

      <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Some DNS providers may automatically append your domain name to the hostname. If this happens, remove the domain portion from the hostname field.</li>
        <li style="margin-bottom: 8px;">For the &quot;@&quot; hostname in the SPF record, some providers require you to use &quot;@&quot; while others require the root domain name or leave it blank.</li>
        <li style="margin-bottom: 8px;">Make sure to copy the values exactly as shown, including all dots and hyphens.</li>
        <li style="margin-bottom: 8px;">DNS changes can take anywhere from a few minutes to 72 hours to propagate globally.</li>
        <li style="margin-bottom: 8px;">You can check DNS propagation status using online tools like whatsmydns.net or dnschecker.org</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="background-color: #ffffff; padding: 20px; margin-top: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">If you need assistance, please contact your administrator or technical support team.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Generate plain text version
function generateEmailText(domain: string, records: DnsRecord[]): string {
  const recordsText = records.map((record, index) => `
${index + 1}. ${record.type} Record
   Hostname: ${record.hostname}
   Value: ${record.value}
`).join('\n');

  return `
DNS CONFIGURATION INSTRUCTIONS
Domain: ${domain}

⚠️ ACTION REQUIRED
Please add the following DNS records to your domain provider to enable email sending.

STEP-BY-STEP INSTRUCTIONS:

1. Log in to your domain provider's DNS management console (e.g., GoDaddy, Namecheap, Cloudflare, Route53)
2. Navigate to the DNS records or DNS zone file section for ${domain}
3. Add each of the DNS records listed below
4. Save your changes (DNS propagation may take up to 72 hours, but usually completes within a few hours)
5. Return to the admin panel and click "Verify Domain" to confirm the configuration

DNS RECORDS TO ADD:
${recordsText}

WHAT THESE RECORDS DO:

CNAME Records (DKIM):
These records enable DomainKeys Identified Mail (DKIM) authentication, which helps prevent email spoofing and improves deliverability. You should see 3 CNAME records with "_domainkey" in the hostname.

⚠️ TXT Record (SPF) - IMPORTANT:
You can only have ONE SPF record per domain.

** If you already have an SPF record: **
Do NOT create a new one. Instead, add "include:amazonses.com" to your existing SPF record, before the final mechanism (usually "~all" or "-all").

Example: If your current SPF is "v=spf1 include:_spf.google.com ~all"
Update it to: "v=spf1 include:_spf.google.com include:amazonses.com ~all"

** If you don't have an SPF record yet: **
Create a new TXT record with the value shown in the table above.

⚠️ TXT Record (DMARC) - IMPORTANT:
You can only have ONE DMARC record per domain.

** If you already have a DMARC record: **
Do NOT create a new one. Your existing DMARC record should work fine with AWS SES. No changes needed unless you want to adjust your DMARC policy.

** If you don't have a DMARC record yet: **
Create a new TXT record with the value shown in the table above.

IMPORTANT NOTES:

- Some DNS providers may automatically append your domain name to the hostname. If this happens, remove the domain portion from the hostname field.
- For the "@" hostname in the SPF record, some providers require you to use "@" while others require the root domain name or leave it blank.
- Make sure to copy the values exactly as shown, including all dots and hyphens.
- DNS changes can take anywhere from a few minutes to 72 hours to propagate globally.
- You can check DNS propagation status using online tools like whatsmydns.net or dnschecker.org

If you need assistance, please contact your administrator or technical support team.
  `.trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();
    const { recipientEmail, domain } = body;

    // Validate input
    if (!recipientEmail || !recipientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { success: false, error: 'Valid recipient email is required' },
        { status: 400 }
      );
    }

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Get company settings to retrieve DKIM tokens
    const settings = await getCompanySettings(companyId);

    // Check if domain is configured
    if (!settings.email_domain) {
      return NextResponse.json(
        { success: false, error: 'Email domain not configured for this company' },
        { status: 400 }
      );
    }

    // Parse DKIM tokens
    let dkimTokens: any[] = [];
    if (settings.aws_ses_dkim_tokens) {
      try {
        dkimTokens = JSON.parse(settings.aws_ses_dkim_tokens);
      } catch (error) {
        console.error('Failed to parse DKIM tokens:', error);
      }
    }

    // Transform DKIM tokens to DNS records
    const dkimRecords = transformDkimTokensToRecords(dkimTokens, domain);

    // Generate SPF and DMARC records
    const spfRecord = generateSpfRecord();
    const dmarcRecord = generateDmarcRecord(domain);

    // Combine all DNS records
    const allRecords = [...dkimRecords, spfRecord, dmarcRecord];

    // Generate email content
    const htmlContent = generateEmailHtml(domain, allRecords);
    const textContent = generateEmailText(domain, allRecords);

    // Send email using fallback SES tenant
    const fallbackTenant = process.env.FALLBACK_SES_TENANT_NAME || 'PMP-Central';

    const result = await sendEmail({
      tenantName: fallbackTenant,
      from: 'noreply@pmpcentral.io',
      fromName: 'DH Portal',
      to: recipientEmail,
      subject: `DNS Configuration Instructions for ${domain}`,
      html: htmlContent,
      text: textContent,
      companyId: companyId,
      source: 'dns_instructions',
      tags: ['dns-setup', 'admin-email']
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return NextResponse.json({
      success: true,
      message: `DNS instructions sent to ${recipientEmail}`,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending DNS instructions email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      },
      { status: 500 }
    );
  }
}
