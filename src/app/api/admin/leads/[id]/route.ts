import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEvent } from '@/lib/inngest/client';
import { getCustomerPrimaryServiceAddress } from '@/lib/service-addresses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Use admin client to fetch lead with all related data
    const supabase = createAdminClient();

    // Get lead with customer and company info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(
        `
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        company:companies(
          id,
          name,
          website
        )
      `
      )
      .eq('id', id)
      .single();

    if (leadError) {
      console.error('Admin Lead Detail API: Error fetching lead:', leadError);
      if (leadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch lead' },
        { status: 500 }
      );
    }

    // Get customer's primary service address if lead has a customer
    let primaryServiceAddress = null;
    if (lead.customer_id) {
      try {
        const result = await getCustomerPrimaryServiceAddress(lead.customer_id);
        primaryServiceAddress = result.serviceAddress;
      } catch (serviceAddressError) {
        console.error('Error fetching primary service address:', serviceAddressError);
        // Don't fail the API call if service address fetching fails
      }
    }

    // Get assigned user profile if lead has one
    let assignedUser = null;
    if (lead.assigned_to) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', lead.assigned_to)
        .single();

      if (!profileError && profileData) {
        assignedUser = profileData;
      }
    }

    // Get call record separately using lead_id foreign key
    const { data: callRecord, error: callError } = await supabase
      .from('call_records')
      .select('*')
      .eq('lead_id', id)
      .single();

    // Enhanced lead object
    const enhancedLead = {
      ...lead,
      call_record: callRecord || null,
      assigned_user: assignedUser,
      primary_service_address: primaryServiceAddress,
    };

    return NextResponse.json(enhancedLead);
  } catch (error) {
    console.error('Admin Lead Detail API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Use admin client to update lead
    const supabase = createAdminClient();

    // Get the existing lead to capture old status before update
    const { data: existingLead, error: existingLeadError } = await supabase
      .from('leads')
      .select('lead_status, company_id')
      .eq('id', id)
      .single();

    if (existingLeadError) {
      console.error('Admin Lead Detail API: Error fetching existing lead:', existingLeadError);
      if (existingLeadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch lead' },
        { status: 500 }
      );
    }

    // Log the admin update attempt for debugging
    console.log('Admin attempting to update lead:', {
      leadId: id,
      updateData: body,
      adminUserId: user.id,
      oldStatus: existingLead.lead_status,
      newStatus: body.lead_status
    });

    const { data: lead, error } = await supabase
      .from('leads')
      .update(body)
      .eq('id', id)
      .select(
        `
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        company:companies(
          id,
          name,
          website
        )
      `
      )
      .single();

    if (error) {
      console.error('Admin Lead Detail API: Error updating lead:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        leadId: id,
        updateData: body,
        adminUserId: user.id
      });
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      
      // Return more specific error message
      const errorMessage = error.message || 'Failed to update lead';
      const errorDetails = error.details ? ` Details: ${error.details}` : '';
      const errorHint = error.hint ? ` Hint: ${error.hint}` : '';
      
      return NextResponse.json(
        { 
          error: `${errorMessage}${errorDetails}${errorHint}`,
          errorCode: error.code,
          originalError: error.message
        },
        { status: 500 }
      );
    }

    // Check if lead status changed and trigger automation
    const oldStatus = existingLead.lead_status;
    const newStatus = body.lead_status;
    
    if (newStatus && oldStatus !== newStatus) {
      try {
        await sendEvent({
          name: 'lead/status-changed',
          data: {
            leadId: id,
            companyId: existingLead.company_id,
            fromStatus: oldStatus,
            toStatus: newStatus,
            leadData: {
              ...lead,
              oldStatus,
              newStatus,
            },
            userId: user.id,
            timestamp: new Date().toISOString(),
          },
        });
        console.log(`Admin Lead Status Change Event: ${oldStatus} → ${newStatus} for lead ${id}`);
      } catch (eventError) {
        console.error('Error sending lead status changed event:', eventError);
        // Don't fail the API call if event sending fails
      }
    }

    // Get customer's primary service address if lead has a customer
    let primaryServiceAddress = null;
    if (lead.customer_id) {
      try {
        const result = await getCustomerPrimaryServiceAddress(lead.customer_id);
        primaryServiceAddress = result.serviceAddress;
      } catch (serviceAddressError) {
        console.error('Error fetching primary service address:', serviceAddressError);
        // Don't fail the API call if service address fetching fails
      }
    }

    // Get assigned user profile if lead has one
    let assignedUser = null;
    if (lead.assigned_to) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', lead.assigned_to)
        .single();

      if (!profileError && profileData) {
        assignedUser = profileData;
      }
    }

    // Get call record separately using lead_id foreign key
    const { data: callRecord, error: callError } = await supabase
      .from('call_records')
      .select('*')
      .eq('lead_id', id)
      .single();

    // Enhanced lead object
    const enhancedLead = {
      ...lead,
      call_record: callRecord || null,
      assigned_user: assignedUser,
      primary_service_address: primaryServiceAddress,
    };

    return NextResponse.json(enhancedLead);
  } catch (error) {
    console.error('Admin Lead Detail API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Use admin client to delete lead
    const supabase = createAdminClient();

    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      console.error('Admin Lead Detail API: Error deleting lead:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Admin Lead Detail API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
