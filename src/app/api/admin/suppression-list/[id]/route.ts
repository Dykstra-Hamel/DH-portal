import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * DELETE /api/admin/suppression-list/[id]
 *
 * Remove a specific entry from the suppression list (re-subscribe)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Get the suppression entry to check company access
    const adminSupabase = createAdminClient();
    const { data: suppressionEntry } = await adminSupabase
      .from('suppression_list')
      .select('company_id')
      .eq('id', id)
      .single();

    if (!suppressionEntry) {
      return NextResponse.json(
        { error: 'Suppression entry not found' },
        { status: 404 }
      );
    }

    // Check user has access to this company (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', suppressionEntry.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Delete the suppression entry
    const { error } = await adminSupabase
      .from('suppression_list')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully removed from suppression list',
    });

  } catch (error) {
    console.error('Error in suppression list DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/suppression-list/[id]
 *
 * Get a specific suppression entry details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Get the suppression entry
    const adminSupabase = createAdminClient();
    const { data: suppressionEntry, error } = await adminSupabase
      .from('suppression_list')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !suppressionEntry) {
      return NextResponse.json(
        { error: 'Suppression entry not found' },
        { status: 404 }
      );
    }

    // Check user has access to this company (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', suppressionEntry.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: suppressionEntry,
    });

  } catch (error) {
    console.error('Error in suppression list GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
