import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { sendEvent } from '@/lib/inngest/client';
import { getCustomerPrimaryServiceAddress } from '@/lib/service-addresses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try Bearer token authentication first (for API client calls)
    const authHeader = request.headers.get('authorization');
    let user = null;
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Bearer token authentication - use admin client
      const { user: authUser, error: authError } = await verifyAuth(request);
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
      supabase = createAdminClient();
    } else {
      // Session-based authentication - use regular client
      supabase = await createClient();
      const {
        data: { user: sessionUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !sessionUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = sessionUser;
    }

    const { id } = await params;

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
          phone,
          address,
          city,
          state,
          zip_code,
          customer_status,
          notes,
          created_at,
          updated_at
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
      console.error('Error fetching lead:', leadError);
      if (leadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch lead' },
        { status: 500 }
      );
    }

    // Get call record separately using lead_id foreign key
    const { data: callRecord, error: callError } = await supabase
      .from('call_records')
      .select('*')
      .eq('lead_id', id)
      .single();

    console.log('Call record query results:', {
      leadId: id,
      callRecord,
      callError,
      hasCallRecord: !!callRecord
    });

    // Note: Call record might not exist, so we don't error on callError

    // For session-based auth, verify user has access to this lead's company
    // Bearer token auth relies on RLS policies for access control
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    // Get customer's primary service address if lead has a customer
    let primaryServiceAddress = null;
    if (lead.customer_id) {
      try {
        const result = await getCustomerPrimaryServiceAddress(lead.customer_id);
        primaryServiceAddress = result.serviceAddress;
      } catch (serviceAddressError) {
        console.error(
          'Error fetching primary service address:',
          serviceAddressError
        );
        // Don't fail the API call if service address fetching fails
      }
    }

    // Enhanced lead object
    const enhancedLead = {
      ...lead,
      call_record: callRecord || null,
      assigned_user: assignedUser,
      primary_service_address: primaryServiceAddress,
    };

    console.log('Returning enhanced lead with call record:', {
      leadId: enhancedLead.id,
      hasCallRecord: !!enhancedLead.call_record,
      callRecordId: enhancedLead.call_record?.id
    });

    return NextResponse.json(enhancedLead);
  } catch (error) {
    console.error('Error in lead detail API:', error);
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
    // Try Bearer token authentication first (for API client calls)
    const authHeader = request.headers.get('authorization');
    let user = null;
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Bearer token authentication - use admin client
      const { user: authUser, error: authError } = await verifyAuth(request);
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
      supabase = createAdminClient();
    } else {
      // Session-based authentication - use regular client
      supabase = await createClient();
      const {
        data: { user: sessionUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !sessionUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = sessionUser;
    }

    const { id } = await params;
    const body = await request.json();

    // First get the lead to check company access and capture current status and assignment
    const { data: existingLead, error: existingLeadError } = await supabase
      .from('leads')
      .select('company_id, lead_status, assigned_to')
      .eq('id', id)
      .single();

    if (existingLeadError) {
      console.error('Error fetching existing lead:', existingLeadError);
      if (existingLeadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch lead' },
        { status: 500 }
      );
    }

    // For session-based auth, verify user has access to this lead's company
    // Bearer token auth relies on RLS policies for access control
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', existingLead.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this lead' },
          { status: 403 }
        );
      }
    }

    // Log the update attempt for debugging
    console.log('Attempting to update lead:', {
      leadId: id,
      updateData: body,
      userId: user.id,
      companyId: existingLead.company_id
    });

    // Update the lead
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
          phone,
          address,
          city,
          state,
          zip_code,
          customer_status,
          notes,
          created_at,
          updated_at
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
      console.error('Error updating lead:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        leadId: id,
        updateData: body,
        userId: user.id
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
      } catch (eventError) {
        console.error('Error sending lead status changed event:', eventError);
        // Don't fail the API call if event sending fails
      }
    }

    // Check if assignment changed and trigger notifications
    const oldAssignedTo = existingLead.assigned_to;
    const newAssignedTo = body.assigned_to;

    if (newAssignedTo !== oldAssignedTo) {
      try {
        const adminSupabase = createAdminClient();

        if (newAssignedTo && !oldAssignedTo) {
          // Lead became assigned (was unassigned, now assigned)
          await adminSupabase.rpc('notify_assigned_and_managers', {
            p_company_id: existingLead.company_id,
            p_assigned_user_id: newAssignedTo,
            p_type: 'new_lead_assigned',
            p_title: 'Lead Assigned to You',
            p_message: `A lead has been assigned to you${lead.customer?.first_name ? ` from ${lead.customer.first_name} ${lead.customer.last_name || ''}`.trim() : ''}`,
            p_reference_id: id,
            p_reference_type: 'lead'
          });
        } else if (!newAssignedTo && oldAssignedTo) {
          // Lead became unassigned (was assigned, now unassigned)
          await adminSupabase.rpc('notify_department_and_managers', {
            p_company_id: existingLead.company_id,
            p_department: 'sales',
            p_type: 'new_lead_unassigned',
            p_title: 'Lead Unassigned - Needs Assignment',
            p_message: `A lead has been unassigned and needs a new assignee${lead.customer?.first_name ? ` from ${lead.customer.first_name} ${lead.customer.last_name || ''}`.trim() : ''}`,
            p_reference_id: id,
            p_reference_type: 'lead'
          });
        } else if (newAssignedTo && oldAssignedTo && newAssignedTo !== oldAssignedTo) {
          // Assignment changed from one user to another
          await adminSupabase.rpc('notify_assigned_and_managers', {
            p_company_id: existingLead.company_id,
            p_assigned_user_id: newAssignedTo,
            p_type: 'new_lead_assigned',
            p_title: 'Lead Reassigned to You',
            p_message: `A lead has been reassigned to you${lead.customer?.first_name ? ` from ${lead.customer.first_name} ${lead.customer.last_name || ''}`.trim() : ''}`,
            p_reference_id: id,
            p_reference_type: 'lead'
          });
        }
      } catch (notificationError) {
        console.error('Error creating assignment notifications:', notificationError);
        // Don't fail the API call if notification creation fails
      }
    }

    // Get call record separately using lead_id foreign key
    const { data: callRecord, error: callError } = await supabase
      .from('call_records')
      .select('*')
      .eq('lead_id', id)
      .single();

    console.log('Call record query results:', {
      leadId: id,
      callRecord,
      callError,
      hasCallRecord: !!callRecord
    });

    // Note: Call record might not exist, so we don't error on callError

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

    // Get customer's primary service address if lead has a customer
    let primaryServiceAddress = null;
    if (lead.customer_id) {
      try {
        const result = await getCustomerPrimaryServiceAddress(lead.customer_id);
        primaryServiceAddress = result.serviceAddress;
      } catch (serviceAddressError) {
        console.error(
          'Error fetching primary service address:',
          serviceAddressError
        );
        // Don't fail the API call if service address fetching fails
      }
    }

    // Enhanced lead object
    const enhancedLead = {
      ...lead,
      call_record: callRecord || null,
      assigned_user: assignedUser,
      primary_service_address: primaryServiceAddress,
    };

    console.log('Returning enhanced lead with call record:', {
      leadId: enhancedLead.id,
      hasCallRecord: !!enhancedLead.call_record,
      callRecordId: enhancedLead.call_record?.id
    });

    return NextResponse.json(enhancedLead);
  } catch (error) {
    console.error('Error in lead detail API:', error);
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
    // Try Bearer token authentication first (for API client calls)
    const authHeader = request.headers.get('authorization');
    let user = null;
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Bearer token authentication - use admin client
      const { user: authUser, error: authError } = await verifyAuth(request);
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
      supabase = createAdminClient();
    } else {
      // Session-based authentication - use regular client
      supabase = await createClient();
      const {
        data: { user: sessionUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !sessionUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = sessionUser;
    }

    const { id } = await params;

    // Check if user is a full app admin
    const isAdmin = await isAuthorizedAdmin(user);

    // If not admin, verify user has company access
    if (!isAdmin) {
      // First get the lead to check company access
      const { data: existingLead, error: existingLeadError } = await supabase
        .from('leads')
        .select('company_id')
        .eq('id', id)
        .single();

      if (existingLeadError) {
        console.error('Error fetching existing lead:', existingLeadError);
        if (existingLeadError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }
        return NextResponse.json(
          { error: 'Failed to fetch lead' },
          { status: 500 }
        );
      }

      // Verify user has access to this lead's company
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', existingLead.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this lead' },
          { status: 403 }
        );
      }
    }

    // Delete the lead
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting lead:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead deleted successfully' 
    });
  } catch (error) {
    console.error('Error in lead delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}