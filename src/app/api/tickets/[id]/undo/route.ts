import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { previousState } = await request.json();

    if (!previousState) {
      return NextResponse.json(
        { error: 'Previous state is required for undo operation' },
        { status: 400 }
      );
    }

    // First get the current ticket to verify access and get current state
    const { data: currentTicket, error: fetchError } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customers!tickets_customer_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching ticket:', fetchError);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Check if user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', currentTicket.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this ticket' },
          { status: 403 }
        );
      }
    }

    // Handle lead conversion undo
    if (currentTicket.converted_to_lead_id || currentTicket.converted_at) {
      try {
        // Only try to delete lead if we have a valid lead ID
        if (currentTicket.converted_to_lead_id) {
          // First check if the lead exists
          const { data: leadExists, error: leadCheckError } = await supabase
            .from('leads')
            .select('id')
            .eq('id', currentTicket.converted_to_lead_id)
            .single();

          if (leadCheckError && leadCheckError.code !== 'PGRST116') {
            console.error('Error checking lead existence:', leadCheckError);
            return NextResponse.json(
              { error: `Failed to verify lead existence: ${leadCheckError.message}` },
              { status: 500 }
            );
          }

          // If lead exists, try to delete it or mark as closed
          if (leadExists) {
            const { error: deleteLeadError } = await supabase
              .from('leads')
              .delete()
              .eq('id', currentTicket.converted_to_lead_id);

            if (deleteLeadError) {
              console.error('Error deleting lead during undo:', deleteLeadError);

              // If deletion fails due to constraints, try to mark as archived instead
              const { error: archiveLeadError } = await supabase
                .from('leads')
                .update({
                  archived: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentTicket.converted_to_lead_id);

              if (archiveLeadError) {
                console.error('Error archiving lead during undo:', archiveLeadError);
                return NextResponse.json(
                  { error: `Failed to remove lead: ${deleteLeadError.message}. Could not archive lead either: ${archiveLeadError.message}` },
                  { status: 500 }
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error during lead handling:', error);
        return NextResponse.json(
          { error: 'Unexpected error during lead handling' },
          { status: 500 }
        );
      }
    }

    // Restore ticket to previous state
    const restoreData = {
      status: previousState.status,
      service_type: previousState.service_type,
      assigned_to: previousState.assigned_to,
      archived: previousState.archived || false,
      converted_to_lead_id: null,
      converted_at: null,
      updated_at: new Date().toISOString()
    };

    const { data: restoredTicket, error: updateError } = await supabase
      .from('tickets')
      .update(restoreData)
      .eq('id', id)
      .select(`
        *,
        customer:customers!tickets_customer_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        )
      `)
      .single();

    if (updateError) {
      console.error('Error restoring ticket:', updateError);
      return NextResponse.json(
        { error: 'Failed to undo ticket qualification' },
        { status: 500 }
      );
    }

    // After ticket is restored, handle lead deletion
    if (currentTicket.converted_to_lead_id) {
      try {
        // First check if the lead exists
        const { data: leadExists, error: leadCheckError } = await supabase
          .from('leads')
          .select('id')
          .eq('id', currentTicket.converted_to_lead_id)
          .single();

        if (leadCheckError && leadCheckError.code !== 'PGRST116') {
          console.error('Error checking lead existence:', leadCheckError);
          // Don't fail the whole operation if lead check fails - ticket is already restored
          console.warn('Lead check failed, but ticket was successfully restored');
        } else if (leadExists) {
          // Try to delete the lead
          const { error: deleteLeadError } = await supabase
            .from('leads')
            .delete()
            .eq('id', currentTicket.converted_to_lead_id);

          if (deleteLeadError) {
            console.error('Error deleting lead during undo:', deleteLeadError);

            // If deletion fails, try to mark as archived instead
            const { error: archiveLeadError } = await supabase
              .from('leads')
              .update({
                archived: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentTicket.converted_to_lead_id);

            if (archiveLeadError) {
              console.error('Error archiving lead during undo:', archiveLeadError);
              // Don't fail the whole operation - ticket is already restored
              console.warn('Lead archiving failed, but ticket was successfully restored');
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error during lead handling:', error);
        // Don't fail the whole operation - ticket is already restored
        console.warn('Lead handling failed, but ticket was successfully restored');
      }
    }

    return NextResponse.json({
      message: 'Ticket qualification undone successfully',
      ticket: restoredTicket
    });

  } catch (error) {
    console.error('Error in ticket undo API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}