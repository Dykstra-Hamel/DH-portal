import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';

// PATCH /api/branches/[id]
// Body: { name?, description?, is_active?, is_primary? }
export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const { name, description, is_active, is_primary } = body;

    const supabase = createAdminClient();

    // If setting as primary, clear any existing primary for this company first
    if (is_primary === true) {
      const { data: existing } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', id)
        .single();

      if (existing) {
        await supabase
          .from('branches')
          .update({ is_primary: false })
          .eq('company_id', existing.company_id)
          .eq('is_primary', true)
          .neq('id', id);
      }
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;
    if (is_primary !== undefined) updates.is_primary = is_primary;

    const { data: branch, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', id)
      .select('id, name, description, is_active, is_primary, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A branch with that name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
    }

    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/branches/[id] — soft delete (sets is_active = false)
export async function DELETE(
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

    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('branches')
      .update({ is_active: false, is_primary: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
