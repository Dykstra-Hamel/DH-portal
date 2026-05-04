import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  getAdminFieldSalesReport,
  verifyCompanyAdminAccess,
  type TeamBreakdownRow,
} from '@/lib/field-sales/admin-reports';

const FIELD_DEPARTMENTS = ['inspector', 'technician'];

// GET /api/field-sales/admin-team-roster
//   ?companyId=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=<uuid|null>
//
// Returns ALL inspectors and technicians for the company, split into two
// arrays. Each entry is a TeamBreakdownRow with the same metrics shape used
// by the dashboard Team cards (submitted/won/winRate/wonRevenue/pipeline/
// stopsToday). Users with no activity in the date window appear with zeros.
//
// Used by the Admin scope of FieldSalesAdminDashboard to render two Team
// sections (Inspectors / Technicians) optionally filtered by branch.
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user, isGlobalAdmin } = authResult;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
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
      return NextResponse.json(
        { error: access.reason },
        { status: access.status }
      );
    }

    const branchId = searchParams.get('branchId') || null;

    // 1) Resolve inspector/technician user IDs for this company, optionally
    //    filtered to a single branch via user_branch_assignments.
    const { data: deptRows } = await admin
      .from('user_departments')
      .select('user_id, department')
      .eq('company_id', companyId)
      .in('department', FIELD_DEPARTMENTS);

    const deptByUser = new Map<string, string[]>();
    for (const r of deptRows ?? []) {
      const uid = r.user_id as string;
      const dept = r.department as string;
      if (!deptByUser.has(uid)) deptByUser.set(uid, []);
      deptByUser.get(uid)!.push(dept);
    }

    let candidateIds = Array.from(deptByUser.keys());

    if (branchId) {
      const { data: branchRows } = await admin
        .from('user_branch_assignments')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('branch_id', branchId)
        .in('user_id', candidateIds.length > 0 ? candidateIds : ['__none__']);
      const branchUserIds = new Set(
        (branchRows ?? []).map(r => r.user_id as string)
      );
      candidateIds = candidateIds.filter(id => branchUserIds.has(id));
    }

    if (candidateIds.length === 0) {
      return NextResponse.json({
        inspectors: [] as TeamBreakdownRow[],
        technicians: [] as TeamBreakdownRow[],
      });
    }

    // 2) Run the dashboard report with those user IDs, seeding the team
    //    breakdown so users with no activity still appear.
    const report = await getAdminFieldSalesReport(admin, {
      companyId,
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      userIds: candidateIds,
      branchId,
      seedFieldStaffUserIds: candidateIds,
    });

    // 3) Split by department. A user with both 'inspector' and 'technician'
    //    departments lands in both buckets — rare but supported.
    const inspectors: TeamBreakdownRow[] = [];
    const technicians: TeamBreakdownRow[] = [];
    for (const row of report.teamBreakdown) {
      const depts = deptByUser.get(row.userId) ?? [];
      if (depts.includes('inspector')) inspectors.push(row);
      if (depts.includes('technician')) technicians.push(row);
    }

    return NextResponse.json({ inspectors, technicians });
  } catch (error) {
    console.error('admin-team-roster fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
