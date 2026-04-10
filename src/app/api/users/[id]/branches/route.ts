import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/users/[id]/branches?companyId=<uuid>
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

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('user_branch_assignments')
      .select('branch_id, branch:branches(id, name)')
      .eq('user_id', userId)
      .eq('company_id', companyId);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch branch assignments' }, { status: 500 });
    }

    return NextResponse.json({ assignments: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/users/[id]/branches
// Body: { companyId, branchIds: string[] }
// Replaces all branch assignments for this user+company.
// Empty branchIds = removes all restrictions (user sees all branches).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isAuthorizedAdmin(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { companyId, branchIds } = body as { companyId: string; branchIds: string[] };

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Delete existing assignments for this user+company
    await supabase
      .from('user_branch_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);

    // Insert new assignments (if any)
    if (branchIds?.length) {
      const rows = branchIds.map(branchId => ({
        user_id: userId,
        branch_id: branchId,
        company_id: companyId,
      }));

      const { error: insertError } = await supabase
        .from('user_branch_assignments')
        .insert(rows);

      if (insertError) {
        return NextResponse.json({ error: 'Failed to save branch assignments' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
