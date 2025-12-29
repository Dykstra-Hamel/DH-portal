import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
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
    const { newStatus, notes } = await request.json();

    // Validate the new status
    const validStatuses = ['new', 'in_process', 'quoted', 'scheduling'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: new, in_process, quoted, scheduling' },
        { status: 400 }
      );
    }

    // First get the current lead to verify access
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching lead:', fetchError);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
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
        .eq('company_id', lead.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this lead' },
          { status: 403 }
        );
      }
    }

    // Update the lead to recover it
    const updateData: any = {
      archived: false,
      lead_status: newStatus,
      lost_reason: null,
      lost_stage: null,
      updated_at: new Date().toISOString(),
    };

    // Add recovery notes to comments if provided
    if (notes) {
      const timestamp = new Date().toISOString();
      const recoveryNote = `[Lead Recovered on ${new Date(timestamp).toLocaleDateString()}]: ${notes}`;
      const existingComments = lead.comments || '';
      updateData.comments = existingComments
        ? `${existingComments}\n\n${recoveryNote}`
        : recoveryNote;
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers!leads_customer_id_fkey(
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
      console.error('Error recovering lead:', updateError);
      return NextResponse.json(
        { error: 'Failed to recover lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Lead recovered successfully',
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Error in lead recovery API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
