import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: leads, error } = await supabase
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
      .eq('lead_source', 'technician')
      .eq('submitted_by', user.id)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching tech leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    const leadIds = (leads ?? []).map(lead => lead.id);
    const notesByLead: Record<string, Array<{ id: string; notes: string | null; created_at: string }>> = {};

    if (leadIds.length > 0) {
      const { data: noteRows, error: notesError } = await supabase
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

    return NextResponse.json({ leads: enrichedLeads });
  } catch (error) {
    console.error('Unexpected error in tech-leads leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
