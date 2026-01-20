import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  getSupabaseClient,
} from '@/lib/api-utils';

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  published_at: string;
  expires_at: string | null;
  priority: number;
  is_active: boolean;
  published_by: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

/**
 * GET /api/companies/[id]/announcements
 *
 * Lists announcements for a company
 * Query params:
 *   - showAll=true: Returns all announcements (for admin settings)
 *   - default: Returns only active, non-expired announcements (for dashboard)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
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

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Build the query
    let query = queryClient
      .from('announcements')
      .select(`
        id,
        title,
        content,
        published_at,
        expires_at,
        priority,
        is_active,
        published_by,
        profiles:published_by (
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId);

    // If not showing all, filter to only active and non-expired announcements
    if (!showAll) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
    }

    const { data: announcements, error } = await query
      .order('priority', { ascending: false })
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: 500 }
      );
    }

    // Transform the data to include publisher name
    const transformedAnnouncements = ((announcements || []) as AnnouncementRow[]).map((ann: AnnouncementRow) => ({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      published_at: ann.published_at,
      expires_at: ann.expires_at,
      priority: ann.priority,
      is_active: ann.is_active,
      published_by_name: ann.profiles
        ? `${ann.profiles.first_name || ''} ${ann.profiles.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown',
    }));

    return NextResponse.json(transformedAnnouncements);
  } catch (error) {
    console.error('Error in announcements GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies/[id]/announcements
 *
 * Creates a new announcement (requires admin access)
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

    // Check if user is admin (only admins can create announcements)
    if (!isGlobalAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: 'Only admins can create announcements' },
          { status: 403 }
        );
      }
    }

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      );
    }

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    const { data: announcement, error } = await queryClient
      .from('announcements')
      .insert({
        company_id: companyId,
        title: body.title,
        content: body.content,
        published_by: user.id,
        published_at: body.published_at || new Date().toISOString(),
        expires_at: body.expires_at || null,
        priority: body.priority || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json(
        { error: 'Failed to create announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error('Error in announcements POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
