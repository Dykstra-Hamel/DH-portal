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

function parseCompare(
  value: string | null
): 'users' | 'branches' | 'managers' | null {
  if (value === 'users' || value === 'branches' || value === 'managers') {
    return value;
  }
  return null;
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

    // Managers and admins/owners share the same data access. The dashboard
    // chooses different *defaults* per role (manager defaults to their own
    // team via managerId; admin defaults to all-company), but neither role
    // is restricted from inspecting any branch, user, or team.

    const userIds = parseCsv(searchParams.get('userIds'));
    const compare = parseCompare(searchParams.get('compare'));
    const entityIds = parseCsv(searchParams.get('entityIds'));
    const branchId = searchParams.get('branchId');
    const managerId = searchParams.get('managerId');

    const report = await getAdminFieldSalesReport(admin, {
      companyId,
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      userIds,
      leadSource: parseCsv(searchParams.get('leadSource')),
      leadStatus: parseCsv(searchParams.get('leadStatus')),
      branchId: branchId || null,
      managerId: managerId || null,
      compare,
      entityIds,
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
