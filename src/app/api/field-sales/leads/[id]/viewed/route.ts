import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id: leadId } = await params;
  if (!leadId) {
    return NextResponse.json({ error: 'lead id is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('lead_views')
    .upsert(
      { user_id: authResult.user.id, lead_id: leadId },
      { onConflict: 'user_id,lead_id', ignoreDuplicates: true }
    );

  if (error) {
    console.error('Error marking lead viewed:', error);
    return NextResponse.json({ error: 'Failed to mark lead viewed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
