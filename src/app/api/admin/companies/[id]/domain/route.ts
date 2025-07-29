import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { 
  createDomain, 
  getDomain, 
  verifyDomain, 
  deleteDomain,
  type CreateDomainRequest,
  type DomainInfo 
} from '@/lib/resend-domains';

// Helper function to await params in Next.js 15+
async function getParams(params: Promise<{ id: string }>) {
  return await params;
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
    const supabase = createAdminClient();

    // Get company domain configuration
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('email_domain, email_domain_configured, resend_domain_id, email_domain_status, email_domain_records, email_domain_verified_at')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // If domain is configured, get latest info from Resend
    let domainInfo: DomainInfo | null = null;
    if (company.resend_domain_id) {
      try {
        domainInfo = await getDomain(company.resend_domain_id);
        
        // Update local database with latest status
        await supabase
          .from('companies')
          .update({
            email_domain_status: domainInfo.status,
            email_domain_records: domainInfo.records,
            ...(domainInfo.status === 'verified' && !company.email_domain_verified_at && {
              email_domain_verified_at: new Date().toISOString()
            })
          })
          .eq('id', companyId);
      } catch (error) {
        console.error('Error fetching domain from Resend:', error);
        // Continue with local data if Resend API is unavailable
      }
    }

    return NextResponse.json({
      success: true,
      domain: {
        name: company.email_domain,
        configured: company.email_domain_configured,
        status: company.email_domain_status,
        records: company.email_domain_records || [],
        verifiedAt: company.email_domain_verified_at,
        resendDomainId: company.resend_domain_id,
        liveInfo: domainInfo
      }
    });
  } catch (error) {
    console.error('Error getting domain configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/companies/[id]/domain
 * Create or update domain configuration for a company
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);
    const body = await request.json();
    const { domain, region, customReturnPath } = body;

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
      .select('id, email_domain, resend_domain_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // If domain already exists, delete the old one first
    if (company.resend_domain_id) {
      try {
        await deleteDomain(company.resend_domain_id);
      } catch (error) {
        console.warn('Failed to delete old domain from Resend:', error);
        // Continue anyway - might have been already deleted
      }
    }

    // Create domain in Resend
    const createDomainRequest: CreateDomainRequest = {
      name: domain,
      region: region || 'us-east-1',
      ...(customReturnPath && { custom_return_path: customReturnPath })
    };

    const domainInfo = await createDomain(createDomainRequest);

    // Update company with domain configuration
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        email_domain: domain,
        email_domain_configured: true,
        resend_domain_id: domainInfo.id,
        email_domain_status: domainInfo.status,
        email_domain_records: domainInfo.records,
        email_domain_verified_at: null // Reset verification timestamp
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error updating company domain configuration:', updateError);
      // Try to clean up the created domain
      try {
        await deleteDomain(domainInfo.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup domain after database error:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Failed to save domain configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domain: {
        name: domainInfo.name,
        configured: true,
        status: domainInfo.status,
        records: domainInfo.records,
        resendDomainId: domainInfo.id,
        liveInfo: domainInfo
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
 * PUT /api/admin/companies/[id]/domain/verify
 * Trigger domain verification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await getParams(params);
    const supabase = createAdminClient();

    // Get company domain configuration
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('resend_domain_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.resend_domain_id) {
      return NextResponse.json(
        { error: 'Domain not configured for this company' },
        { status: 404 }
      );
    }

    // Trigger verification in Resend
    const verificationResult = await verifyDomain(company.resend_domain_id);

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      );
    }

    // Get updated domain info
    const domainInfo = await getDomain(company.resend_domain_id);

    // Update local database
    await supabase
      .from('companies')
      .update({
        email_domain_status: domainInfo.status,
        email_domain_records: domainInfo.records,
        ...(domainInfo.status === 'verified' && {
          email_domain_verified_at: new Date().toISOString()
        })
      })
      .eq('id', companyId);

    return NextResponse.json({
      success: true,
      message: 'Domain verification triggered',
      domain: {
        status: domainInfo.status,
        records: domainInfo.records,
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
    const supabase = createAdminClient();

    // Get company domain configuration
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('resend_domain_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Delete domain from Resend if it exists
    if (company.resend_domain_id) {
      try {
        await deleteDomain(company.resend_domain_id);
      } catch (error) {
        console.warn('Failed to delete domain from Resend:', error);
        // Continue anyway - domain might have been already deleted
      }
    }

    // Clear domain configuration from company
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        email_domain: null,
        email_domain_configured: false,
        resend_domain_id: null,
        email_domain_status: 'not_configured',
        email_domain_records: null,
        email_domain_verified_at: null
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error clearing domain configuration:', updateError);
      return NextResponse.json(
        { error: 'Failed to clear domain configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain configuration removed'
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}