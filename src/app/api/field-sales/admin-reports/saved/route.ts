import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyCompanyAdminAccess } from '@/lib/field-sales/admin-reports';

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

    const { data, error } = await admin
      .from('saved_field_sales_reports')
      .select(
        `
        id,
        name,
        prompt,
        filters,
        last_result,
        created_by,
        created_at,
        updated_at
        `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Saved reports list error:', error);
      return NextResponse.json({ error: 'Failed to load saved reports' }, { status: 500 });
    }

    const rows = data ?? [];
    const creatorIds = Array.from(
      new Set(rows.map(r => r.created_by).filter(Boolean) as string[])
    );

    const profileById = new Map<
      string,
      { first_name: string | null; last_name: string | null; email: string | null }
    >();
    if (creatorIds.length > 0) {
      const { data: profileRows } = await admin
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', creatorIds);
      for (const p of profileRows ?? []) {
        profileById.set(p.id as string, {
          first_name: (p.first_name as string | null) ?? null,
          last_name: (p.last_name as string | null) ?? null,
          email: (p.email as string | null) ?? null,
        });
      }
    }

    const reports = rows.map(row => {
      const p = row.created_by ? profileById.get(row.created_by as string) : null;
      const creatorName = p
        ? [p.first_name, p.last_name].filter(Boolean).join(' ') ||
          p.email ||
          'Unknown'
        : 'Unknown';
      return {
        id: row.id,
        name: row.name,
        prompt: row.prompt,
        filters: row.filters ?? {},
        lastResult: row.last_result ?? null,
        createdBy: row.created_by,
        createdByName: creatorName,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Saved reports GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user, isGlobalAdmin } = authResult;

    const body = await request.json();
    const { companyId, name, prompt, filters, lastResult } = body ?? {};

    if (!companyId || !name || !prompt) {
      return NextResponse.json(
        { error: 'companyId, name, and prompt are required' },
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

    const { data, error } = await admin
      .from('saved_field_sales_reports')
      .insert({
        company_id: companyId,
        created_by: user.id,
        name: String(name).slice(0, 200),
        prompt: String(prompt).slice(0, 5000),
        filters: filters ?? {},
        last_result: lastResult ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Saved report create error:', error);
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    console.error('Saved reports POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
