import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// POST /api/admin/tasks/[taskId]/mark-viewed - Mark task as viewed by current user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`[POST /api/admin/tasks/${taskId}/mark-viewed] User ${user.id} marking task as viewed`);

    // Upsert the task view record (insert or update last_viewed_at)
    const { error } = await supabase
      .from('project_task_views')
      .upsert(
        {
          user_id: user.id,
          task_id: taskId,
          last_viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,task_id',
        }
      );

    if (error) {
      console.error(`[POST /api/admin/tasks/${taskId}/mark-viewed] Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[POST /api/admin/tasks/${taskId}/mark-viewed] Task marked as viewed successfully`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/tasks/[taskId]/mark-viewed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
