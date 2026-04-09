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
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const referenceIds = Array.isArray(body?.referenceIds)
      ? body.referenceIds.filter(
          (value: unknown): value is string => typeof value === 'string' && UUID_REGEX.test(value)
        )
      : typeof body?.referenceId === 'string' && UUID_REGEX.test(body.referenceId)
        ? [body.referenceId]
        : [];

    if (!referenceType) {
      return createErrorResponse('referenceType is required', 400);
    }

    if (referenceIds.length === 0) {
      return createSuccessResponse({ markedNotificationIds: [], markedCount: 0 });
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
