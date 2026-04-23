import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyCompanyAdminAccess } from '@/lib/field-sales/admin-reports';

async function loadReport(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await admin
    .from('saved_field_sales_reports')
    .select('id, company_id, created_by')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user, isGlobalAdmin } = authResult;

    const admin = createAdminClient();
    const report = await loadReport(admin, id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const access = await verifyCompanyAdminAccess(
      admin,
      user.id,
      report.company_id,
      isGlobalAdmin
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: access.status });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') updates.name = body.name.slice(0, 200);
    if (typeof body.prompt === 'string') updates.prompt = body.prompt.slice(0, 5000);
    if (body.filters !== undefined) updates.filters = body.filters;
    if (body.lastResult !== undefined) updates.last_result = body.lastResult;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await admin
      .from('saved_field_sales_reports')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Saved report update error:', error);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Saved report PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user, isGlobalAdmin } = authResult;

    const admin = createAdminClient();
    const report = await loadReport(admin, id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const access = await verifyCompanyAdminAccess(
      admin,
      user.id,
      report.company_id,
      isGlobalAdmin
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: access.status });
    }

    const { error } = await admin
      .from('saved_field_sales_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Saved report delete error:', error);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Saved report DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
