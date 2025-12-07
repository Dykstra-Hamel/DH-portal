import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  createEmailIdentity,
  getEmailIdentity,
  deleteEmailIdentity,
  associateIdentityWithTenant,
  getIdentityVerificationStatus,
} from '@/lib/aws-ses/identities';

// Helper function to await params in Next.js 15+
async function getParams(params: Promise<{ id: string }>) {
  return await params;
}

// Helper to get company settings
async function getCompanySettings(companyId: string, keys: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId)
    .in('setting_key', keys);

  if (error) {
    throw new Error(`Failed to fetch company settings: ${error.message}`);
  }

  const settings: Record<string, string> = {};
  data?.forEach(s => {
    settings[s.setting_key] = s.setting_value;
  });
  return settings;
}

// Helper to update company settings (upsert to handle new settings)
async function updateCompanySettings(companyId: string, updates: Record<string, string>) {
  const supabase = createAdminClient();

  const settingsToUpsert = Object.entries(updates).map(([key, value]) => ({
    company_id: companyId,
    setting_key: key,
    setting_value: value,
  }));

  const { error } = await supabase
    .from('company_settings')
    .upsert(settingsToUpsert, {
      onConflict: 'company_id,setting_key',
    });

  if (error) {
    throw new Error(`Failed to upsert settings: ${error.message}`);
  }
}

// Helper to transform DKIM tokens into DNS records format
function transformDkimTokensToRecords(dkimTokens: any[], domain: string): any[] {
  const records: any[] = [];

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

  // Add SPF TXT record
  records.push({
    hostname: '@',
    type: 'TXT',
    value: 'v=spf1 include:amazonses.com ~all',
  });

  return records;
}

/**
 * GET /api/admin/companies/[id]/domain
 * Get domain configuration for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);

    // Get company domain configuration from settings
    const settings = await getCompanySettings(companyId, [
      'email_domain',
      'email_domain_status',
      'email_domain_prefix',
      'aws_ses_identity_arn',
      'aws_ses_dkim_tokens',
      'email_domain_verified_at'
    ]);

    // If domain is configured, get latest info from AWS SES
    let identityInfo: any = null;
    let dkimTokens: any[] = [];

    if (settings.email_domain) {
      try {
        const result = await getEmailIdentity(settings.email_domain);

        if (result.success && result.data) {
          identityInfo = result.data;
          dkimTokens = result.dkimTokens || [];

          // Update local database with latest status
          const status = identityInfo.verifiedForSendingStatus ? 'verified' : 'pending';

          await updateCompanySettings(companyId, {
            email_domain_status: status,
            aws_ses_dkim_tokens: JSON.stringify(dkimTokens),
            aws_ses_identity_arn: identityInfo.identityArn,
            ...(identityInfo.verifiedForSendingStatus && !settings.email_domain_verified_at && {
              email_domain_verified_at: new Date().toISOString()
            })
          });
        }
      } catch (error) {
        console.error('Error fetching domain from AWS SES:', error);
        // Continue with local data if AWS SES API is unavailable
        try {
          dkimTokens = JSON.parse(settings.aws_ses_dkim_tokens || '[]');
        } catch (e) {
          dkimTokens = [];
        }
      }
    }

    // Transform DKIM tokens into records format for UI
    const records = settings.email_domain
      ? transformDkimTokensToRecords(dkimTokens, settings.email_domain)
      : [];

    return NextResponse.json({
      success: true,
      domain: {
        name: settings.email_domain || null,
        prefix: settings.email_domain_prefix || 'noreply',
        status: settings.email_domain_status || 'not_configured',
        records: records,
        dkimTokens: dkimTokens,
        verifiedAt: settings.email_domain_verified_at || null,
        identityArn: settings.aws_ses_identity_arn || null,
        liveInfo: identityInfo
      }
    });
  } catch (error) {
    console.error('Error getting domain configuration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/companies/[id]/domain
 * Create domain configuration for a company
 *
 * Body params:
 * - domain: Domain name (required)
 * - emailPrefix: Email prefix like "noreply" (default: "noreply")
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);
    const body = await request.json();
    const { domain, emailPrefix } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get existing domain configuration
    const settings = await getCompanySettings(companyId, ['email_domain', 'aws_ses_identity_arn']);

    // If domain already exists and is different, delete the old one first
    if (settings.email_domain && settings.email_domain !== domain) {
      try {
        await deleteEmailIdentity(settings.email_domain);
      } catch (error) {
        console.warn('Failed to delete old domain from AWS SES:', error);
        // Continue anyway - might have been already deleted
      }
    }

    console.log(`Creating AWS SES email identity for domain: ${domain}`);

    // Create email identity in AWS SES
    const result = await createEmailIdentity(domain);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: `Failed to create email identity: ${result.error}` },
        { status: 500 }
      );
    }

    const identityInfo = result.data;
    const dkimTokens = result.dkimTokens || [];

    // Get tenant name from database (stored during provisioning)
    const tenantSettings = await getCompanySettings(companyId, ['aws_ses_tenant_name']);
    const tenantName = tenantSettings.aws_ses_tenant_name;

    if (tenantName) {
      // Construct identity ARN (since AWS doesn't return it directly)
      const awsRegion = process.env.AWS_REGION || 'us-east-1';
      const awsAccountId = process.env.AWS_ACCOUNT_ID;

      if (!awsAccountId) {
        return NextResponse.json(
          { error: 'AWS_ACCOUNT_ID environment variable not set. Required for identity association.' },
          { status: 500 }
        );
      }

      const identityArn = `arn:aws:ses:${awsRegion}:${awsAccountId}:identity/${domain}`;

      console.log('🔗 Associating identity with tenant:', { domain, tenantName, identityArn });

      const associateResult = await associateIdentityWithTenant(
        domain,
        tenantName,
        identityArn
      );

      if (!associateResult.success) {
        // FAIL HARD - association is required for tenants to send from their identities
        return NextResponse.json(
          { error: `Identity created but failed to associate with tenant: ${associateResult.error}. This will prevent email sending from ${domain}.` },
          { status: 500 }
        );
      }

      console.log('✅ Identity successfully associated with tenant');
    } else {
      console.warn('No SES tenant found for company. Identity created but not associated with tenant.');
    }

    // Construct identity ARN for storage (same as above)
    const awsRegion = process.env.AWS_REGION || 'us-east-1';
    const awsAccountId = process.env.AWS_ACCOUNT_ID || '';
    const constructedArn = `arn:aws:ses:${awsRegion}:${awsAccountId}:identity/${domain}`;

    // Update company settings with domain configuration
    await updateCompanySettings(companyId, {
      email_domain: domain,
      email_domain_prefix: emailPrefix || 'noreply',
      aws_ses_identity_arn: constructedArn, // Use constructed ARN instead of empty string
      email_domain_status: identityInfo.verifiedForSendingStatus ? 'verified' : 'pending',
      aws_ses_dkim_tokens: JSON.stringify(dkimTokens),
      email_domain_verified_at: identityInfo.verifiedForSendingStatus ? new Date().toISOString() : ''
    });

    // Transform DKIM tokens into records format for UI
    const records = transformDkimTokensToRecords(dkimTokens, domain);

    return NextResponse.json({
      success: true,
      domain: {
        name: domain,
        prefix: emailPrefix || 'noreply',
        status: identityInfo.verifiedForSendingStatus ? 'verified' : 'pending',
        records: records,
        dkimTokens: dkimTokens,
        identityArn: constructedArn, // Return constructed ARN
        liveInfo: identityInfo
      }
    });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create domain' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/companies/[id]/domain
 * Check domain verification status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);

    // Get company domain configuration
    const settings = await getCompanySettings(companyId, ['email_domain']);

    if (!settings.email_domain) {
      return NextResponse.json(
        { error: 'Domain not configured for this company' },
        { status: 404 }
      );
    }

    // Check verification status from AWS SES
    const verificationResult = await getIdentityVerificationStatus(settings.email_domain);

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error || 'Failed to check verification status' },
        { status: 400 }
      );
    }

    const status = verificationResult.isVerified ? 'verified' : 'pending';
    const message = verificationResult.isVerified
      ? 'Domain is verified and ready to send emails'
      : 'Domain is not yet verified. Please ensure DNS records are configured correctly.';

    // Get DKIM tokens
    const identityResult = await getEmailIdentity(settings.email_domain);
    const dkimTokens = identityResult.dkimTokens || [];

    // Update local database
    await updateCompanySettings(companyId, {
      email_domain_status: status,
      aws_ses_dkim_tokens: JSON.stringify(dkimTokens),
      ...(verificationResult.isVerified && {
        email_domain_verified_at: new Date().toISOString()
      })
    });

    // Transform DKIM tokens into records format for UI
    const records = transformDkimTokensToRecords(dkimTokens, settings.email_domain);

    return NextResponse.json({
      success: true,
      message,
      domain: {
        status,
        dkimStatus: verificationResult.dkimStatus,
        records: records,
        dkimTokens,
        isVerified: verificationResult.isVerified
      }
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify domain' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/companies/[id]/domain
 * Remove domain configuration for a company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);

    // Get company domain configuration
    const settings = await getCompanySettings(companyId, ['email_domain']);

    // Delete domain from AWS SES if it exists
    if (settings.email_domain) {
      try {
        await deleteEmailIdentity(settings.email_domain);
      } catch (error) {
        console.warn('Failed to delete domain from AWS SES:', error);
        // Continue anyway - domain might have been already deleted
      }
    }

    // Clear domain configuration from company settings
    await updateCompanySettings(companyId, {
      email_domain: '',
      email_domain_prefix: 'noreply',
      aws_ses_identity_arn: '',
      email_domain_status: 'not_configured',
      aws_ses_dkim_tokens: '[]',
      email_domain_verified_at: ''
    });

    return NextResponse.json({
      success: true,
      message: 'Domain configuration removed'
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
