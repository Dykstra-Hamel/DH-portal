import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  getAdminFieldSalesLeadsForMetric,
  verifyCompanyAdminAccess,
  type AdminMetricKey,
} from '@/lib/field-sales/admin-reports';

function parseCsv(value: string | null): string[] | null {
  if (!value) return null;
  const parts = value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function parseMetric(value: string | null): AdminMetricKey | null {
  if (
    value === 'submitted' ||
    value === 'won' ||
    value === 'won_revenue' ||
    value === 'pipeline' ||
    value === 'tech_discussed' ||
    value === 'leads_from_techs'
  ) {
    return value;
  }
  return null;
}

// GET /api/field-sales/admin-reports/leads
// Returns the list of leads contributing to a single dashboard KPI, scoped
// by the same filter set the main admin-reports endpoint uses. Drives the
// "click a KPI card" drill-down modal on the field-sales dashboard.
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user, isGlobalAdmin } = authResult;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const metric = parseMetric(searchParams.get('metric'));
    if (!metric) {
      return NextResponse.json(
        { error: 'Invalid or missing metric' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const access = await verifyCompanyAdminAccess(
      admin,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: access.status });
    }

    const leads = await getAdminFieldSalesLeadsForMetric(
      admin,
      {
        companyId,
        from: searchParams.get('from'),
        to: searchParams.get('to'),
        userIds: parseCsv(searchParams.get('userIds')),
        leadSource: parseCsv(searchParams.get('leadSource')),
        leadStatus: parseCsv(searchParams.get('leadStatus')),
        branchId: searchParams.get('branchId') || null,
        managerId: searchParams.get('managerId') || null,
      },
      metric
    );

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Admin field-sales metric leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
