import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  getSupabaseClient,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const { id: notificationId } = await params;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Mark notification as read (RLS ensures user can only update their own notifications)
    const { data, error } = await queryClient
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Extra security check
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return createErrorResponse('Failed to mark notification as read');
    }

    if (!data) {
      return createErrorResponse('Notification not found or unauthorized', 404);
    }

    return createSuccessResponse({ notification: data });

  } catch (error) {
    console.error('Error in mark notification read API:', error);
    return createErrorResponse('Internal server error');
  }
}