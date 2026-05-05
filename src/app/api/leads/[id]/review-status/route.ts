import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/leads/[id]/review-status
// Body: { action: 'start' | 'heartbeat' | 'end' }
//
// Mirrors /api/tickets/[id]/review-status. Claims/refreshes/releases a
// 5-minute review lock on a lead so concurrent users get a 409 and the
// list views can show a "Viewing" pill.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const { action } = body;

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('company_id, reviewed_by, reviewed_at, review_expires_at')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Global admin bypass for the access check (still subject to the conflict
    // check below — admins respect another user's active lock, same as tickets).
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const isAdmin = profile?.role === 'admin';

    if (!isAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', lead.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this lead' },
          { status: 403 }
        );
      }
    }

    let updateData: Record<string, string | null> = {};

    if (action === 'start') {
      const lockedByOther =
        lead.reviewed_by &&
        lead.reviewed_by !== user.id &&
        lead.review_expires_at &&
        new Date(lead.review_expires_at) > new Date();

      if (lockedByOther) {
        // Surface the holder profile so the UI can render the overlay
        // without a follow-up query.
        const { data: holder } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, email, avatar_url, uploaded_avatar_url'
          )
          .eq('id', lead.reviewed_by!)
          .single();

        return NextResponse.json(
          {
            error: 'Lead is currently being reviewed by another user',
            reviewed_by: lead.reviewed_by,
            review_expires_at: lead.review_expires_at,
            reviewed_by_profile: holder ?? null,
          },
          { status: 409 }
        );
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      updateData = {
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_expires_at: expiresAt.toISOString(),
      };
    } else if (action === 'end') {
      if (lead.reviewed_by === user.id) {
        updateData = {
          reviewed_by: null,
          reviewed_at: null,
          review_expires_at: null,
        };
      } else {
        return NextResponse.json({ success: true });
      }
    } else if (action === 'heartbeat') {
      if (lead.reviewed_by === user.id) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        updateData = { review_expires_at: expiresAt.toISOString() };
      } else {
        return NextResponse.json({ success: true });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select(
        `
        id,
        reviewed_by,
        reviewed_at,
        review_expires_at,
        reviewed_by_profile:profiles!reviewed_by(
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          uploaded_avatar_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating lead review status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lead review status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    // ECONNRESET / aborted requests are expected when a holder's tab
    // closes mid-flight (the keepalive `end` request gets cancelled by the
    // OS). They aren't real errors — silence them so the server log
    // doesn't fill up. Any other failure still surfaces.
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : undefined;
    const isAborted =
      code === 'ECONNRESET' ||
      code === 'ABORT_ERR' ||
      (error instanceof Error && error.name === 'AbortError') ||
      (error instanceof Error && /aborted/i.test(error.message));
    if (!isAborted) {
      console.error('Error in lead review status API:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
