import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/branches?companyId=<uuid>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, name, description, is_active, is_primary, created_at, updated_at')
      .eq('company_id', companyId)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }

    return NextResponse.json({ branches });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/branches
// Body: { companyId, name, description? }
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isAuthorizedAdmin(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { companyId, name, description } = body;

    if (!companyId || !name?.trim()) {
      return NextResponse.json({ error: 'companyId and name are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: branch, error } = await supabase
      .from('branches')
      .insert({ company_id: companyId, name: name.trim(), description: description ?? null })
      .select('id, name, description, is_active, is_primary, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A branch with that name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
    }

    return NextResponse.json({ branch }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
