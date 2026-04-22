import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  getSupabaseClient,
} from '@/lib/api-utils';

interface ZipCodeGroupRow {
  id: string;
  company_id: string;
  name: string;
  assigned_user_id: string | null;
  zip_codes: string[];
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/companies/[id]/zip-code-groups
 *
 * Returns all zip code groups for a company, with assigned user name.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;

    const { user, isGlobalAdmin, supabase } = authResult;

    const accessResult = await verifyCompanyAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (accessResult instanceof NextResponse) return accessResult;

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    const { data, error } = await queryClient
      .from('zip_code_groups')
      .select('id, company_id, name, assigned_user_id, zip_codes, created_at, updated_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching zip code groups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch zip code groups' },
        { status: 500 }
      );
    }

    const rows = (data || []) as ZipCodeGroupRow[];

    // Fetch display names for assigned users in a single query
    const userIds = [...new Set(rows.map(g => g.assigned_user_id).filter(Boolean))] as string[];
    const profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await queryClient
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      (profiles || []).forEach((p: { id: string; first_name: string | null; last_name: string | null }) => {
        profileMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      });
    }

    const groups = rows.map((g) => ({
      id: g.id,
      company_id: g.company_id,
      name: g.name,
      assigned_user_id: g.assigned_user_id,
      assigned_user_name: g.assigned_user_id ? (profileMap[g.assigned_user_id] || null) : null,
      zip_codes: g.zip_codes,
      created_at: g.created_at,
      updated_at: g.updated_at,
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error in zip-code-groups GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies/[id]/zip-code-groups
 *
 * Creates a new zip code group.
 * Body: { name: string, assigned_user_id?: string | null, zip_codes?: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;

    const { user, isGlobalAdmin, supabase } = authResult;

    const accessResult = await verifyCompanyAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (accessResult instanceof NextResponse) return accessResult;

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    const { data: group, error } = await queryClient
      .from('zip_code_groups')
      .insert({
        company_id: companyId,
        name: body.name.trim(),
        assigned_user_id: body.assigned_user_id || null,
        zip_codes: Array.isArray(body.zip_codes) ? body.zip_codes : [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating zip code group:', error);
      return NextResponse.json(
        { error: 'Failed to create zip code group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (error) {
    console.error('Error in zip-code-groups POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
