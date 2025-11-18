import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { listDomains, type DomainInfo } from '@/lib/mailersend-domains';

/**
 * GET /api/admin/mailersend-domains?companyId=[id]
 * List all MailerSend domains with availability status
 * Optional companyId parameter helps categorize which domains are available for import
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Fetch all domains from MailerSend
    const allDomains = await listDomains();

    // Get all domain IDs already in use by companies
    const supabase = createAdminClient();
    const { data: usedDomains } = await supabase
      .from('company_settings')
      .select('setting_value, company_id')
      .eq('setting_key', 'mailersend_domain_id')
      .neq('setting_value', '');

    // Create a map of used domain IDs to company IDs
    const usedDomainMap = new Map<string, string>();
    usedDomains?.forEach(d => {
      if (d.setting_value) {
        usedDomainMap.set(d.setting_value, d.company_id);
      }
    });

    // Categorize domains based on availability
    const availableDomains: DomainInfo[] = [];
    const connectedDomains: (DomainInfo & { connectedToCurrentCompany: boolean })[] = [];
    const usedByOtherCompanies: (DomainInfo & { usedByCompanyId: string })[] = [];

    allDomains.forEach(domain => {
      const usedByCompanyId = usedDomainMap.get(domain.id);

      if (!usedByCompanyId) {
        // Domain not connected to any company - available for import
        availableDomains.push(domain);
      } else if (companyId && usedByCompanyId === companyId) {
        // Domain already connected to the requesting company
        connectedDomains.push({
          ...domain,
          connectedToCurrentCompany: true
        });
      } else {
        // Domain used by another company
        usedByOtherCompanies.push({
          ...domain,
          usedByCompanyId
        });
      }
    });

    return NextResponse.json({
      success: true,
      domains: {
        available: availableDomains,
        connected: connectedDomains,
        usedByOthers: usedByOtherCompanies,
        total: allDomains.length
      }
    });
  } catch (error) {
    console.error('Error listing MailerSend domains:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list domains' },
      { status: 500 }
    );
  }
}
