import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  getSupabaseClient,
} from '@/lib/api-utils';

/**
 * PUT /api/companies/[id]/zip-code-groups/[groupId]
 *
 * Updates a zip code group.
 * Body: { name?: string, assigned_user_id?: string | null, zip_codes?: string[] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id: companyId, groupId } = await params;
    const body = await request.json();

    if (!companyId || !groupId) {
      return NextResponse.json(
        { error: 'Company ID and Group ID are required' },
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

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json(
          { error: 'Group name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }
    if ('assigned_user_id' in body) {
      updateData.assigned_user_id = body.assigned_user_id || null;
    }
    if (body.zip_codes !== undefined) {
      if (!Array.isArray(body.zip_codes)) {
        return NextResponse.json(
          { error: 'zip_codes must be an array' },
          { status: 400 }
        );
      }
      updateData.zip_codes = body.zip_codes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: group, error } = await queryClient
      .from('zip_code_groups')
      .update(updateData)
      .eq('id', groupId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating zip code group:', error);
      return NextResponse.json(
        { error: 'Failed to update zip code group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error in zip-code-groups PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[id]/zip-code-groups/[groupId]
 *
 * Deletes a zip code group.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id: companyId, groupId } = await params;

    if (!companyId || !groupId) {
      return NextResponse.json(
        { error: 'Company ID and Group ID are required' },
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

    const { error } = await queryClient
      .from('zip_code_groups')
      .delete()
      .eq('id', groupId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting zip code group:', error);
      return NextResponse.json(
        { error: 'Failed to delete zip code group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error in zip-code-groups DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
