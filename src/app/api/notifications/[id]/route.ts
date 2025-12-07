import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  getSupabaseClient,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-utils';

export async function DELETE(
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

    // Delete notification (RLS ensures user can only delete their own notifications)
    const { data, error } = await queryClient
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id) // Extra security check
      .select()
      .single();

    if (error) {
      console.error('Error deleting notification:', error);
      return createErrorResponse('Failed to delete notification');
    }

    if (!data) {
      return createErrorResponse('Notification not found or unauthorized', 404);
    }

    return createSuccessResponse({
      message: 'Notification deleted successfully',
      deletedNotification: data
    });

  } catch (error) {
    console.error('Error in delete notification API:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function GET(
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

    // Get specific notification
    const { data, error } = await queryClient
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user can only see their own notifications
      .single();

    if (error) {
      console.error('Error fetching notification:', error);
      return createErrorResponse('Failed to fetch notification');
    }

    if (!data) {
      return createErrorResponse('Notification not found or unauthorized', 404);
    }

    return createSuccessResponse({ notification: data });

  } catch (error) {
    console.error('Error in get notification API:', error);
    return createErrorResponse('Internal server error');
  }
}