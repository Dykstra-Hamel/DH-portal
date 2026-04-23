import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  getAdminFieldSalesReport,
  verifyCompanyAdminAccess,
} from '@/lib/field-sales/admin-reports';

function parseCsv(value: string | null): string[] | null {
  if (!value) return null;
  const parts = value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

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

    const report = await getAdminFieldSalesReport(admin, {
      companyId,
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      userIds: parseCsv(searchParams.get('userIds')),
      leadSource: parseCsv(searchParams.get('leadSource')),
      leadStatus: parseCsv(searchParams.get('leadStatus')),
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Admin field-sales reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
