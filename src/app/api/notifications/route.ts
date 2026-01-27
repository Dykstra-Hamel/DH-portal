import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  getSupabaseClient,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const assignedOnly = searchParams.get('assigned_only') === 'true';
    const companyId = searchParams.get('companyId');
    const offset = (page - 1) * limit;

    // Build the query
    let query = queryClient
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by company if specified, but always include mention notifications
    if (companyId) {
      query = query.or(`company_id.eq.${companyId},type.eq.mention`);
    }

    // Filter by read status if requested
    if (unreadOnly) {
      query = query.eq('read', false);
    }

    // Filter by assigned notifications if requested
    if (assignedOnly) {
      query = query.eq('assigned_to', user.id);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return createErrorResponse('Failed to fetch notifications');
    }

    // Also get unread count for the badge
    let unreadQuery = queryClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    // Filter unread count by company if specified, but always include mention notifications
    if (companyId) {
      unreadQuery = unreadQuery.or(`company_id.eq.${companyId},type.eq.mention`);
    }

    const { count: unreadCount, error: countError } = await unreadQuery;

    return createSuccessResponse({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      unreadCount: countError ? 0 : (unreadCount || 0)
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return createErrorResponse('Internal server error');
  }
}