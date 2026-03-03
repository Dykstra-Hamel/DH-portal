import { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  getSupabaseClient,
} from '@/lib/api-utils';

const ALLOWED_REFERENCE_TYPES = new Set([
  'project_comment',
  'task_comment',
  'monthly_service_comment',
]);

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof Response) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);
    const body = await request.json().catch(() => null);
    const referenceType =
      typeof body?.referenceType === 'string' ? body.referenceType : '';
    const referenceIds = Array.isArray(body?.referenceIds)
      ? body.referenceIds.filter(
          (value: unknown): value is string => typeof value === 'string' && value.length > 0
        )
      : typeof body?.referenceId === 'string' && body.referenceId
        ? [body.referenceId]
        : [];

    if (!referenceType || referenceIds.length === 0) {
      return createErrorResponse(
        'referenceType and at least one referenceId are required',
        400
      );
    }

    if (!ALLOWED_REFERENCE_TYPES.has(referenceType)) {
      return createErrorResponse('Invalid referenceType', 400);
    }

    let query = queryClient
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('type', 'mention')
      .eq('reference_type', referenceType)
      .eq('read', false);

    if (referenceIds.length === 1) {
      query = query.eq('reference_id', referenceIds[0]);
    } else {
      query = query.in('reference_id', referenceIds);
    }

    const { data, error } = await query.select('id');

    if (error) {
      console.error('Error marking mention notifications as read:', error);
      return createErrorResponse('Failed to mark mention notifications as read');
    }

    const markedNotificationIds = Array.isArray(data)
      ? data.map((notification) => notification.id)
      : [];

    return createSuccessResponse({
      markedNotificationIds,
      markedCount: markedNotificationIds.length,
    });
  } catch (error) {
    console.error('Error in mark mention by reference API:', error);
    return createErrorResponse('Internal server error');
  }
}
