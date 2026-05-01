import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  verifyAuth,
  isAuthorizedAdmin,
  isCompanyAdmin,
} from '@/lib/auth-helpers';
import { resolveDefaultBranchForUser } from '@/lib/branch-filter';

// GET /api/users/[id]/default-branch?companyId=<uuid>
// Returns { branchId: string | null } — the user's default branch in the
// given company. First UBA row -> company primary -> null.
// Permission: caller is the user, OR a company admin/manager/owner of
// the company, OR a global admin.
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
    const companyAdmin = !globalAdmin && (await isCompanyAdmin(user.id, companyId));

    if (!isSelf && !globalAdmin && !companyAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const branchId = await resolveDefaultBranchForUser(supabase, userId, companyId);

    return NextResponse.json({ branchId });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
