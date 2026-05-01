import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  verifyAuth,
  isAuthorizedAdmin,
  isCompanyAdmin,
  getUserCompanyRole,
} from '@/lib/auth-helpers';

// GET /api/users/[id]/manager?companyId=<uuid>
// Returns the user's current manager (within the given company), if any.
// Permission: caller is the user, OR a company admin/manager/owner of the
// company, OR a global admin.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const isSelf = user.id === userId;
    const globalAdmin = await isAuthorizedAdmin(user);
    const companyAdmin = !globalAdmin && await isCompanyAdmin(user.id, companyId);

    if (!isSelf && !globalAdmin && !companyAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();

    const { data: row } = await supabase
      .from('user_companies')
      .select('manager_user_id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    const managerUserId: string | null = row?.manager_user_id ?? null;

    if (!managerUserId) {
      return NextResponse.json({ managerUserId: null, manager: null });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, uploaded_avatar_url')
      .eq('id', managerUserId)
      .maybeSingle();

    const manager = profile
      ? {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          avatar_url: profile.uploaded_avatar_url || profile.avatar_url || null,
        }
      : null;

    return NextResponse.json({ managerUserId, manager });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/users/[id]/manager
// Body: { companyId, managerUserId: string | null }
// Permission: company admin/owner OR global admin. Managers can NOT
// reassign reports (only admins/owners change org structure).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { companyId, managerUserId } = body as {
      companyId: string;
      managerUserId: string | null;
    };

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const globalAdmin = await isAuthorizedAdmin(user);
    if (!globalAdmin) {
      const callerRole = await getUserCompanyRole(user.id, companyId);
      if (callerRole !== 'admin' && callerRole !== 'owner') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (managerUserId && managerUserId === userId) {
      return NextResponse.json(
        { error: 'A user cannot be their own manager' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // The user-company row must exist before we can set its manager.
    const { data: userCompanyRow, error: fetchErr } = await supabase
      .from('user_companies')
      .select('id, role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchErr || !userCompanyRow) {
      return NextResponse.json(
        { error: 'User is not a member of this company' },
        { status: 404 }
      );
    }

    // Validate the proposed manager is also in this company.
    if (managerUserId) {
      const { data: managerRow } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', managerUserId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!managerRow) {
        return NextResponse.json(
          { error: 'Manager is not a member of this company' },
          { status: 400 }
        );
      }
    }

    const { error: updateErr } = await supabase
      .from('user_companies')
      .update({ manager_user_id: managerUserId })
      .eq('id', userCompanyRow.id);

    if (updateErr) {
      return NextResponse.json(
        { error: 'Failed to update manager assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, managerUserId });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
