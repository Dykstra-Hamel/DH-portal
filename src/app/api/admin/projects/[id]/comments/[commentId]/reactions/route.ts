import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdminOrPM } from '@/lib/auth-helpers';

const VALID_EMOJIS = ['thumbs_up', 'smile', 'laugh', 'eyes', 'check'];

// POST /api/admin/projects/[id]/comments/[commentId]/reactions - Toggle a reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authorized = await isAuthorizedAdminOrPM(user);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { emoji } = body;

    if (!emoji || !VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Check for existing reaction
    const { data: existing } = await adminDb
      .from('comment_reactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .eq('project_comment_id', commentId)
      .maybeSingle();

    if (existing) {
      const { error: deleteError } = await adminDb
        .from('comment_reactions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ action: 'removed', id: existing.id });
    }

    const { data: reaction, error: insertError } = await adminDb
      .from('comment_reactions')
      .insert({
        user_id: user.id,
        emoji,
        project_comment_id: commentId,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ action: 'added', reaction });
  } catch (error) {
    console.error('Error toggling project comment reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
