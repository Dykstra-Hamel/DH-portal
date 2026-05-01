import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  verifyAuth,
  isAuthorizedAdmin,
  isCompanyAdmin,
} from '@/lib/auth-helpers';

// GET /api/users/[id]/reports?companyId=<uuid>
// Returns the direct reports of the given user within the given company.
// Permission: caller is the user, OR a company admin/manager/owner, OR
// a global admin.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: managerId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const isSelf = user.id === managerId;
    const globalAdmin = await isAuthorizedAdmin(user);
    const companyAdmin = !globalAdmin && await isCompanyAdmin(user.id, companyId);

    if (!isSelf && !globalAdmin && !companyAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Direct reports: every user_companies row in this company whose
    // manager_user_id matches.
    const { data: rows, error } = await supabase
      .from('user_companies')
      .select('user_id, role')
      .eq('company_id', companyId)
      .eq('manager_user_id', managerId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    const userIds = rows.map(r => r.user_id);

    // Profiles + departments in one query
    const { data: profiles } = await supabase
      .from('profiles')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        uploaded_avatar_url,
        user_departments!left(department, department_type, company_id)
        `
      )
      .in('id', userIds);

    // Filter departments rows down to just this company
    const profileMap = new Map<string, any>();
    (profiles || []).forEach(p => {
      const filteredDepts = Array.isArray(p.user_departments)
        ? p.user_departments.filter((d: any) => d.company_id === companyId)
        : [];
      profileMap.set(p.id, { ...p, user_departments: filteredDepts });
    });

    const reports = rows.map(r => {
      const p = profileMap.get(r.user_id) || null;
      return {
        user_id: r.user_id,
        role: r.role,
        profile: p
          ? {
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
              email: p.email,
              avatar_url: p.uploaded_avatar_url || p.avatar_url || null,
              display_name:
                `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
            }
          : null,
        departments: (p?.user_departments || []).map(
          (d: any) => d.department
        ),
      };
    });

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
