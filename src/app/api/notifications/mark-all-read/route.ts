import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  getSupabaseClient,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Mark all user's notifications as read
    const { data, error, count } = await queryClient
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false) // Only update unread notifications
      .select();

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return createErrorResponse('Failed to mark all notifications as read');
    }

    return createSuccessResponse({
      updatedCount: data?.length || 0,
      message: `Marked ${data?.length || 0} notifications as read`
    });

  } catch (error) {
    console.error('Error in mark all notifications read API:', error);
    return createErrorResponse('Internal server error');
  }
}