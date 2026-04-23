import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getAuthenticatedUser } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin } = authResult;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const leadId = searchParams.get('leadId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // When a single leadId is requested, allow company admins/managers/owners
    // (or global admins) to drill into leads submitted by other users on their
    // team — this powers the admin dashboard's Recent Leads detail modal.
    let allowCrossUser = false;
    if (leadId) {
      if (isGlobalAdmin) {
        allowCrossUser = true;
      } else {
        const { data: membership } = await supabase
          .from('user_companies')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();
        if (
          membership?.role &&
          ['owner', 'admin', 'manager'].includes(membership.role)
        ) {
          allowCrossUser = true;
        }
      }
    }

    const leadQueryClient = allowCrossUser ? createAdminClient() : supabase;

    let query = leadQueryClient
      .from('leads')
      .select(
        `
        id,
        lead_status,
        created_at,
        comments,
        lead_type,
        lead_source,
        priority,
        service_type,
        pest_type,
        estimated_value,
        photo_urls,
        customers(
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        ),
        service_address:service_addresses(
          street_address,
          city,
          state,
          zip_code
        )
        `
      )
      .eq('company_id', companyId);

    if (!allowCrossUser) {
      query = query.eq('submitted_by', user.id);
    }

    if (leadId) {
      query = query.eq('id', leadId).limit(1);
    } else {
      query = query
        .eq('lead_source', 'technician')
        .order('created_at', { ascending: false })
        .limit(50);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching tech leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    const leadIds = (leads ?? []).map(lead => lead.id);
    const notesByLead: Record<string, Array<{ id: string; notes: string | null; created_at: string }>> = {};

    if (leadIds.length > 0) {
      const { data: noteRows, error: notesError } = await leadQueryClient
        .from('activity_log')
        .select('id, entity_id, notes, created_at')
        .eq('entity_type', 'lead')
        .eq('activity_type', 'note_added')
        .in('entity_id', leadIds)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error fetching tech lead notes:', notesError);
      } else {
        noteRows?.forEach(note => {
          if (!note.entity_id) return;
          if (!notesByLead[note.entity_id]) {
            notesByLead[note.entity_id] = [];
          }
          notesByLead[note.entity_id].push({
            id: note.id,
            notes: note.notes,
            created_at: note.created_at,
          });
        });
      }
    }

    const enrichedLeads = (leads ?? []).map(lead => ({
      ...lead,
      submitted_notes: notesByLead[lead.id] ?? [],
    }));

    if (leadId) {
      return NextResponse.json({ lead: enrichedLeads[0] ?? null });
    }

    return NextResponse.json({ leads: enrichedLeads });
  } catch (error) {
    console.error('Unexpected error in tech-leads leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
