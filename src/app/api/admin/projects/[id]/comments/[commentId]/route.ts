import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// PATCH /api/admin/projects/[id]/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: projectId, commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const { data: updatedComment, error } = await supabase
      .from('project_comments')
      .update({ comment: body.comment })
      .eq('id', commentId)
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email)
      `
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
      console.error('Error updating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error in PATCH /api/admin/projects/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: projectId, commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId)
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/projects/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
