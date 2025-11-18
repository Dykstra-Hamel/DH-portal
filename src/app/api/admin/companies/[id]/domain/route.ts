import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  createDomain,
  getDomain,
  getDomainRecords,
  verifyDomain,
  deleteDomain,
  type DomainInfo
} from '@/lib/mailersend-domains';

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

// Helper to update company settings
async function updateCompanySettings(companyId: string, updates: Record<string, string>) {
  const supabase = createAdminClient();

  for (const [key, value] of Object.entries(updates)) {
    const { error } = await supabase
      .from('company_settings')
      .update({ setting_value: value })
      .eq('company_id', companyId)
      .eq('setting_key', key);

    if (error) {
      throw new Error(`Failed to update setting ${key}: ${error.message}`);
    }
  }
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
      'email_domain_records',
      'mailersend_domain_id',
      'email_domain_verified_at'
    ]);

    // If domain is configured, get latest info from MailerSend
    let domainInfo: DomainInfo | null = null;
    let dnsRecords: any[] = [];

    if (settings.mailersend_domain_id) {
      try {
        domainInfo = await getDomain(settings.mailersend_domain_id);
        dnsRecords = await getDomainRecords(settings.mailersend_domain_id);

        // Update local database with latest status
        const status = domainInfo.is_verified ? 'verified' :
                      domainInfo.is_dns_active ? 'pending' : 'not_configured';

        await updateCompanySettings(companyId, {
          email_domain_status: status,
          email_domain_records: JSON.stringify(dnsRecords),
          ...(domainInfo.is_verified && !settings.email_domain_verified_at && {
            email_domain_verified_at: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Error fetching domain from MailerSend:', error);
        // Continue with local data if MailerSend API is unavailable
        try {
          dnsRecords = JSON.parse(settings.email_domain_records || '[]');
        } catch (e) {
          dnsRecords = [];
        }
      }
    }

    return NextResponse.json({
      success: true,
      domain: {
        name: settings.email_domain || null,
        prefix: settings.email_domain_prefix || 'noreply',
        status: settings.email_domain_status || 'not_configured',
        records: dnsRecords,
        verifiedAt: settings.email_domain_verified_at || null,
        mailersendDomainId: settings.mailersend_domain_id || null,
        liveInfo: domainInfo
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
 * Create or import domain configuration for a company
 *
 * Body params:
 * - domain: Domain name (required if not importing)
 * - emailPrefix: Email prefix like "noreply" (default: "noreply")
 * - domainId: MailerSend domain ID to import (optional - if provided, imports existing domain)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);
    const body = await request.json();
    const { domain, emailPrefix, domainId } = body;

    const supabase = createAdminClient();

    // Check if company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get existing domain ID
    const settings = await getCompanySettings(companyId, ['mailersend_domain_id']);

    // If domain already exists, delete the old one first (unless we're importing it)
    if (settings.mailersend_domain_id && settings.mailersend_domain_id !== domainId) {
      try {
        await deleteDomain(settings.mailersend_domain_id);
      } catch (error) {
        console.warn('Failed to delete old domain from MailerSend:', error);
        // Continue anyway - might have been already deleted
      }
    }

    let domainInfo: DomainInfo;
    let dnsRecords: any[];

    // Import existing domain or create new one
    if (domainId) {
      // IMPORT EXISTING DOMAIN
      console.log(`Importing existing MailerSend domain: ${domainId}`);

      // Check if domain is already in use by another company
      const { data: existingUse } = await supabase
        .from('company_settings')
        .select('company_id')
        .eq('setting_key', 'mailersend_domain_id')
        .eq('setting_value', domainId)
        .neq('company_id', companyId)
        .single();

      if (existingUse) {
        return NextResponse.json(
          { error: 'This domain is already connected to another company' },
          { status: 409 }
        );
      }

      // Fetch domain info from MailerSend
      try {
        domainInfo = await getDomain(domainId);
        dnsRecords = await getDomainRecords(domainId);
      } catch (error) {
        console.error('Failed to fetch domain from MailerSend:', error);
        return NextResponse.json(
          { error: 'Failed to fetch domain from MailerSend. Please verify the domain ID is correct.' },
          { status: 400 }
        );
      }
    } else {
      // CREATE NEW DOMAIN
      if (!domain) {
        return NextResponse.json(
          { error: 'Domain name is required when not importing' },
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

      console.log(`Creating new MailerSend domain: ${domain}`);

      // Create domain in MailerSend
      domainInfo = await createDomain(domain);
      dnsRecords = await getDomainRecords(domainInfo.id);
    }

    // Update company settings with domain configuration
    await updateCompanySettings(companyId, {
      email_domain: domainInfo.name,
      email_domain_prefix: emailPrefix || 'noreply',
      mailersend_domain_id: domainInfo.id,
      email_domain_status: domainInfo.is_verified ? 'verified' : 'pending',
      email_domain_records: JSON.stringify(dnsRecords),
      email_domain_verified_at: domainInfo.is_verified ? new Date().toISOString() : ''
    });

    return NextResponse.json({
      success: true,
      domain: {
        name: domainInfo.name,
        prefix: emailPrefix || 'noreply',
        status: domainInfo.is_verified ? 'verified' : 'pending',
        records: dnsRecords,
        mailersendDomainId: domainInfo.id,
        liveInfo: domainInfo
      },
      imported: !!domainId
    });
  } catch (error) {
    console.error('Error creating/importing domain:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create/import domain' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/companies/[id]/domain
 * Trigger domain verification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);

    // Get company domain configuration
    const settings = await getCompanySettings(companyId, ['mailersend_domain_id']);

    if (!settings.mailersend_domain_id) {
      return NextResponse.json(
        { error: 'Domain not configured for this company' },
        { status: 404 }
      );
    }

    // Trigger verification in MailerSend (get latest status)
    const verificationResult = await verifyDomain(settings.mailersend_domain_id);

    if (!verificationResult.success || !verificationResult.domain) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      );
    }

    const domainInfo = verificationResult.domain;
    const dnsRecords = await getDomainRecords(settings.mailersend_domain_id);
    const status = domainInfo.is_verified ? 'verified' :
                  domainInfo.is_dns_active ? 'pending' : 'failed';

    // Update local database
    await updateCompanySettings(companyId, {
      email_domain_status: status,
      email_domain_records: JSON.stringify(dnsRecords),
      ...(domainInfo.is_verified && {
        email_domain_verified_at: new Date().toISOString()
      })
    });

    return NextResponse.json({
      success: true,
      message: verificationResult.message,
      domain: {
        status,
        records: dnsRecords,
        liveInfo: domainInfo
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
    const settings = await getCompanySettings(companyId, ['mailersend_domain_id']);

    // Delete domain from MailerSend if it exists
    if (settings.mailersend_domain_id) {
      try {
        await deleteDomain(settings.mailersend_domain_id);
      } catch (error) {
        console.warn('Failed to delete domain from MailerSend:', error);
        // Continue anyway - domain might have been already deleted
      }
    }

    // Clear domain configuration from company settings
    await updateCompanySettings(companyId, {
      email_domain: '',
      email_domain_prefix: 'noreply',
      mailersend_domain_id: '',
      email_domain_status: 'not_configured',
      email_domain_records: '[]',
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
