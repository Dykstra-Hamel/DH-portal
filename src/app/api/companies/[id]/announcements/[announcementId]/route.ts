import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  getSupabaseClient,
} from '@/lib/api-utils';

/**
 * GET /api/companies/[id]/announcements/[announcementId]
 *
 * Gets a specific announcement
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id: companyId, announcementId } = await params;

    if (!companyId || !announcementId) {
      return NextResponse.json(
        { error: 'Company ID and Announcement ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Verify user has access to this company
    const accessResult = await verifyCompanyAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (accessResult instanceof NextResponse) {
      return accessResult;
    }

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    const { data: announcement, error } = await queryClient
      .from('announcements')
      .select(`
        *,
        profiles:published_by (
          first_name,
          last_name
        )
      `)
      .eq('id', announcementId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching announcement:', error);
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error in announcement GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[id]/announcements/[announcementId]
 *
 * Updates an announcement (requires admin access)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id: companyId, announcementId } = await params;
    const body = await request.json();

    if (!companyId || !announcementId) {
      return NextResponse.json(
        { error: 'Company ID and Announcement ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Verify user has access to this company
    const accessResult = await verifyCompanyAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (accessResult instanceof NextResponse) {
      return accessResult;
    }

    // Check if user is admin
    if (!isGlobalAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: 'Only admins can update announcements' },
          { status: 403 }
        );
      }
    }

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: announcement, error } = await queryClient
      .from('announcements')
      .update(updateData)
      .eq('id', announcementId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      return NextResponse.json(
        { error: 'Failed to update announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error('Error in announcement PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[id]/announcements/[announcementId]
 *
 * Deletes an announcement (requires admin access)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id: companyId, announcementId } = await params;

    if (!companyId || !announcementId) {
      return NextResponse.json(
        { error: 'Company ID and Announcement ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Verify user has access to this company
    const accessResult = await verifyCompanyAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (accessResult instanceof NextResponse) {
      return accessResult;
    }

    // Check if user is admin
    if (!isGlobalAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: 'Only admins can delete announcements' },
          { status: 403 }
        );
      }
    }

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    const { error } = await queryClient
      .from('announcements')
      .delete()
      .eq('id', announcementId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json(
        { error: 'Failed to delete announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error in announcement DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
