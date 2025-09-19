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
    const { qualification, assignedTo } = await request.json();

    if (!qualification || !['sales', 'customer_service', 'junk'].includes(qualification)) {
      return NextResponse.json(
        { error: 'Invalid qualification. Must be "sales", "customer_service", or "junk"' },
        { status: 400 }
      );
    }

    // First get the current ticket to verify access and get data
    const { data: ticket, error: fetchError } = await supabase
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
        .eq('company_id', ticket.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this ticket' },
          { status: 403 }
        );
      }
    }

    if (qualification === 'junk') {
      // Mark ticket as junk (archived)
      const { data: updatedTicket, error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'closed',
          archived: true,
          updated_at: new Date().toISOString()
        })
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
        console.error('Error marking ticket as junk:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark ticket as junk' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Ticket marked as junk and archived',
        qualification: 'junk',
        ticket: updatedTicket
      });
    } else if (qualification === 'sales') {
      // Convert to lead directly
      if (!ticket.customer_id) {
        return NextResponse.json(
          { error: 'Cannot convert ticket without customer' },
          { status: 400 }
        );
      }

      // Check if this ticket has already been converted to a lead
      if (ticket.converted_to_lead_id) {
        // Update the existing lead instead of creating a new one
        const updateData: any = {
          lead_status: 'new',
          priority: ticket.priority,
          estimated_value: ticket.estimated_value || 0,
          comments: ticket.description || '',
          updated_at: new Date().toISOString()
        };

        // Add assignment if provided
        if (assignedTo) {
          updateData.assigned_to = assignedTo;
        }

        const { data: updatedLead, error: updateLeadError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', ticket.converted_to_lead_id)
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

        if (updateLeadError) {
          console.error('Error updating existing lead:', updateLeadError);
          return NextResponse.json(
            { error: 'Failed to update existing lead' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Existing lead updated successfully',
          qualification: 'sales',
          lead: updatedLead,
          customer: updatedLead.customer
        });
      }

      // Create a new lead from the ticket
      const leadData = {
        company_id: ticket.company_id,
        customer_id: ticket.customer_id,
        lead_source: ticket.source,
        lead_type: ticket.type,
        service_type: ticket.service_type,
        lead_status: 'new',
        priority: ticket.priority,
        estimated_value: ticket.estimated_value || 0,
        comments: ticket.description || '',
        assigned_to: assignedTo || ticket.assigned_to,
        utm_source: ticket.utm_source,
        utm_medium: ticket.utm_medium,
        utm_campaign: ticket.utm_campaign,
        utm_term: ticket.utm_term,
        utm_content: ticket.utm_content,
        referrer_url: ticket.referrer_url,
        ip_address: ticket.ip_address,
        user_agent: ticket.user_agent,
        converted_from_ticket_id: ticket.id  // Required for database trigger validation
      };

      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
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

      if (leadError) {
        console.error('Error creating lead:', leadError);
        return NextResponse.json(
          { error: 'Failed to convert ticket to lead' },
          { status: 500 }
        );
      }

      // Update the ticket to mark it as converted and archived
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          converted_to_lead_id: newLead.id,
          converted_at: new Date().toISOString(),
          archived: true,
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (ticketUpdateError) {
        console.error('Error updating ticket conversion status:', ticketUpdateError);
      }

      return NextResponse.json({
        message: 'Ticket qualified as sales and converted to lead',
        qualification: 'sales',
        lead: newLead,
        customer: newLead.customer
      });
    } else {
      // Convert to support case (similar to sales flow)
      if (!ticket.customer_id) {
        return NextResponse.json(
          { error: 'Cannot convert ticket without customer' },
          { status: 400 }
        );
      }

      // Check if this ticket has already been converted to a support case
      if (ticket.converted_to_support_case_id) {
        // Update the existing support case instead of creating a new one
        const updateData: any = {
          status: 'new',
          priority: ticket.priority || 'medium',
          updated_at: new Date().toISOString()
        };

        // Add assignment if provided
        if (assignedTo) {
          updateData.assigned_to = assignedTo;
        }

        const { data: updatedSupportCase, error: updateSupportCaseError } = await supabase
          .from('support_cases')
          .update(updateData)
          .eq('id', ticket.converted_to_support_case_id)
          .select(`
            *,
            customer:customers!support_cases_customer_id_fkey(
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

        if (updateSupportCaseError) {
          console.error('Error updating existing support case:', updateSupportCaseError);
          return NextResponse.json(
            { error: 'Failed to update existing support case' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Existing support case updated successfully',
          qualification: 'customer_service',
          supportCase: updatedSupportCase,
          customer: updatedSupportCase.customer
        });
      }

      // Determine issue type based on ticket data
      let issueType = 'general_inquiry'; // default
      if (ticket.service_type?.toLowerCase().includes('billing')) {
        issueType = 'billing';
      } else if (ticket.service_type?.toLowerCase().includes('schedule')) {
        issueType = 'scheduling';
      } else if (ticket.description?.toLowerCase().includes('complaint')) {
        issueType = 'complaint';
      } else if (ticket.description?.toLowerCase().includes('service') || ticket.description?.toLowerCase().includes('quality')) {
        issueType = 'service_quality';
      }

      // Generate summary from ticket data
      const summary = ticket.description || 
                     `${ticket.type} inquiry from ${ticket.source}` ||
                     'Support request';

      // Create a new support case from the ticket
      const supportCaseData = {
        company_id: ticket.company_id,
        customer_id: ticket.customer_id,
        ticket_id: ticket.id,
        issue_type: issueType,
        summary: summary.substring(0, 255), // Ensure it fits in summary field
        description: ticket.description,
        status: 'new',
        priority: ticket.priority || 'medium',
        assigned_to: assignedTo || ticket.assigned_to,
        archived: false
      };

      const { data: newSupportCase, error: supportCaseError } = await supabase
        .from('support_cases')
        .insert(supportCaseData)
        .select(`
          *,
          customer:customers!support_cases_customer_id_fkey(
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

      if (supportCaseError) {
        console.error('Error creating support case:', supportCaseError);
        return NextResponse.json(
          { error: 'Failed to convert ticket to support case' },
          { status: 500 }
        );
      }

      // Update the ticket to mark it as converted and archived
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          converted_to_support_case_id: newSupportCase.id,
          converted_at: new Date().toISOString(),
          archived: true,
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (ticketUpdateError) {
        console.error('Error updating ticket conversion status:', ticketUpdateError);
      }

      return NextResponse.json({
        message: 'Ticket qualified as customer service and converted to support case',
        qualification: 'customer_service',
        supportCase: newSupportCase,
        customer: newSupportCase.customer
      });
    }
  } catch (error) {
    console.error('Error in ticket qualification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}