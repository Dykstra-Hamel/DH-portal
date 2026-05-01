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

function parseCompare(value: string | null): 'users' | 'branches' | null {
  if (value === 'users' || value === 'branches') return value;
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

    const userIds = parseCsv(searchParams.get('userIds'));
    const compare = parseCompare(searchParams.get('compare'));
    const entityIds = parseCsv(searchParams.get('entityIds'));
    const branchId = searchParams.get('branchId');

    // Manager-scope guard: a manager-role caller (not admin/owner/global)
    // can only request reports for their direct reports. They cannot fudge
    // the URL with someone else's user_id.
    if (
      !isGlobalAdmin &&
      access.ok &&
      access.role === 'manager'
    ) {
      const { data: reports } = await admin
        .from('user_companies')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('manager_user_id', user.id);
      const allowed = new Set((reports ?? []).map(r => r.user_id as string));

      const requestedUsers: string[] = [];
      if (userIds) requestedUsers.push(...userIds);
      if (compare === 'users' && entityIds) requestedUsers.push(...entityIds);

      for (const uid of requestedUsers) {
        if (!allowed.has(uid)) {
          return NextResponse.json(
            { error: 'User is not one of your direct reports' },
            { status: 403 }
          );
        }
      }

      // Managers compare branches? Disallowed by design.
      if (compare === 'branches') {
        return NextResponse.json(
          { error: 'Branch comparison is admin-only' },
          { status: 403 }
        );
      }
    }

    const report = await getAdminFieldSalesReport(admin, {
      companyId,
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      userIds,
      leadSource: parseCsv(searchParams.get('leadSource')),
      leadStatus: parseCsv(searchParams.get('leadStatus')),
      branchId: branchId || null,
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
