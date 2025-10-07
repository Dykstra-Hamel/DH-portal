import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

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
    const { qualification, assignedTo, customStatus } = await request.json();

    if (
      !qualification ||
      !['sales', 'customer_service', 'junk'].includes(qualification)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid qualification. Must be "sales", "customer_service", or "junk"',
        },
        { status: 400 }
      );
    }

    // First get the current ticket to verify access and get data
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select(
        `
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
      `
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching ticket:', fetchError);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
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
        `
        )
        .single();

      if (updateError) {
        console.error('Error marking ticket as junk:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark ticket as junk' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Ticket has been archived',
        qualification: 'junk',
        ticket: updatedTicket,
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
          lead_status: customStatus || (assignedTo ? 'contacting' : 'unassigned'),
          priority: ticket.priority,
          estimated_value: ticket.estimated_value || 0,
          comments: ticket.description || '',
          updated_at: new Date().toISOString(),
        };

        // If jumping straight to quoted (live call), set furthest_completed_stage to contacting
        if (customStatus === 'quoted') {
          updateData.furthest_completed_stage = 'contacting';
        }

        // Add assignment if provided
        if (assignedTo) {
          updateData.assigned_to = assignedTo;
        }

        const { data: updatedLead, error: updateLeadError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', ticket.converted_to_lead_id)
          .select(
            `
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
          `
          )
          .single();

        if (updateLeadError) {
          console.error('Error updating existing lead:', updateLeadError);
          return NextResponse.json(
            { error: 'Failed to update existing lead' },
            { status: 500 }
          );
        }

        // Ensure call_record is linked to the lead (in case it wasn't done previously)
        if (ticket.call_record_id) {
          // Use admin client to bypass RLS for updating call_records
          const adminSupabase = createAdminClient();
          const { error: callRecordUpdateError } = await adminSupabase
            .from('call_records')
            .update({ lead_id: ticket.converted_to_lead_id })
            .eq('id', ticket.call_record_id)
            .select();

          if (callRecordUpdateError) {
            console.error('Failed to update call_record with lead_id:', callRecordUpdateError);
            // Don't fail the request - the lead was updated successfully
          }
        }

        return NextResponse.json({
          message: 'Existing lead updated successfully',
          qualification: 'sales',
          lead: updatedLead,
          customer: updatedLead.customer,
          leadId: updatedLead.id,
        });
      }

      // Create a new lead from the ticket
      const leadInsertData: any = {
        company_id: ticket.company_id,
        customer_id: ticket.customer_id,
        lead_source: ticket.source,
        lead_type: ticket.type,
        service_type: ticket.service_type,
        lead_status:
          customStatus || (assignedTo || ticket.assigned_to ? 'contacting' : 'unassigned'),
        priority: ticket.priority,
        estimated_value: ticket.estimated_value || 0,
        comments: ticket.description || '',
        assigned_to: assignedTo || ticket.assigned_to,
        pest_type: ticket.pest_type,
        utm_source: ticket.utm_source,
        utm_medium: ticket.utm_medium,
        utm_campaign: ticket.utm_campaign,
        utm_term: ticket.utm_term,
        utm_content: ticket.utm_content,
        referrer_url: ticket.referrer_url,
        ip_address: ticket.ip_address,
        user_agent: ticket.user_agent,
        converted_from_ticket_id: ticket.id, // Required for database trigger validation
      };

      // If jumping straight to quoted (live call), set furthest_completed_stage to contacting
      if (customStatus === 'quoted') {
        leadInsertData.furthest_completed_stage = 'contacting';
      }

      // Start a transaction for lead creation and ticket update
      let newLead;
      await supabase.rpc('begin');

      try {
        // Create the lead
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .insert(leadInsertData)
          .select(
            `
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
          `
          )
          .single();

        if (leadError) {
          await supabase.rpc('rollback');
          console.error('Error creating lead:', leadError);
          return NextResponse.json(
            { error: 'Failed to convert ticket to lead' },
            { status: 500 }
          );
        }

        newLead = leadData;

        // Update the ticket to mark it as converted and archived (atomic with lead creation)
        const { error: ticketUpdateError } = await supabase
          .from('tickets')
          .update({
            converted_to_lead_id: newLead.id,
            converted_at: new Date().toISOString(),
            archived: true,
            status: 'resolved',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (ticketUpdateError) {
          await supabase.rpc('rollback');
          console.error(
            'Error updating ticket conversion status:',
            ticketUpdateError
          );
          return NextResponse.json(
            { error: 'Failed to update ticket after lead creation' },
            { status: 500 }
          );
        }

        // Commit the transaction
        await supabase.rpc('commit');
        console.log(
          '✅ Lead creation and ticket archival completed atomically'
        );
      } catch (error) {
        await supabase.rpc('rollback');
        console.error('Transaction rolled back due to error:', error);
        return NextResponse.json(
          { error: 'Failed to convert ticket to lead' },
          { status: 500 }
        );
      }

      // After successful lead creation, geocode customer address and create service address
      try {
        const { createOrFindServiceAddress } = await import('@/lib/service-addresses');

        // Fetch customer data to get address
        const customer = ticket.customer;

        if (customer) {
          // Try to geocode the customer's address
          const geocodeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/internal/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              street: customer.address,
              city: customer.city,
              state: customer.state,
              zip: customer.zip_code
            })
          });

          let coordinates = null;
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.success && geocodeData.coordinates) {
              coordinates = geocodeData.coordinates;
              console.log('✅ Successfully geocoded customer address:', coordinates);
            }
          } else {
            console.warn('⚠️ Geocoding failed or skipped for customer address');
          }

          // Create service address with or without coordinates
          const serviceAddressData: any = {
            street_address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            zip_code: customer.zip_code || ''
          };

          // Add coordinates if geocoding was successful
          if (coordinates) {
            serviceAddressData.latitude = coordinates.lat;
            serviceAddressData.longitude = coordinates.lng;
            serviceAddressData.hasStreetView = coordinates.hasStreetView;
          }

          // Create or find the service address
          const serviceAddressResult = await createOrFindServiceAddress(
            ticket.company_id,
            serviceAddressData
          );

          if (serviceAddressResult.success && serviceAddressResult.serviceAddressId) {
            // Link service address to the lead
            const { error: linkError } = await supabase
              .from('leads')
              .update({ service_address_id: serviceAddressResult.serviceAddressId })
              .eq('id', newLead.id);

            if (linkError) {
              console.error('Failed to link service address to lead:', linkError);
            } else {
              console.log('✅ Service address linked to lead with coordinates');
            }
          }
        }
      } catch (serviceAddressError) {
        // Don't fail the entire request if service address creation fails
        console.error('Error creating service address for lead:', serviceAddressError);
      }

      // Update call_record to link it to the newly created lead
      // This ensures call information shows up on the lead detail page
      if (ticket.call_record_id) {
        // Use admin client to bypass RLS for updating call_records
        const adminSupabase = createAdminClient();
        const { error: callRecordUpdateError } = await adminSupabase
          .from('call_records')
          .update({ lead_id: newLead.id })
          .eq('id', ticket.call_record_id)
          .select();

        if (callRecordUpdateError) {
          console.error('Failed to update call_record with lead_id:', callRecordUpdateError);
          // Don't fail the request - the lead was created successfully
        }
      }

      // Create assignment notification if lead was assigned to someone
      if (assignedTo) {
        try {
          const { createAdminClient } = await import(
            '@/lib/supabase/server-admin'
          );
          const adminSupabase = createAdminClient();

          // Helper function to format lead type
          const formatLeadType = (source: string) => {
            switch (source) {
              case 'cold_call':
                return 'Call';
              case 'web_form':
                return 'Form';
              case 'website_form':
                return 'Form';
              case 'phone_call':
                return 'Call';
              default:
                return (
                  source
                    ?.replace('_', ' ')
                    .replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
                );
            }
          };

          // Build customer info for notification (Customer Name | Lead Type)
          const customerName =
            `${ticket.customer?.first_name || ''} ${ticket.customer?.last_name || ''}`.trim() ||
            'Unknown Customer';
          const leadType = formatLeadType(ticket.source);
          const customerDetails = `${customerName} | ${leadType}`;

          console.log('Creating lead assignment notification with params:', {
            p_user_id: assignedTo,
            p_company_id: ticket.company_id,
            p_type: 'assignment',
            p_title: 'New Lead Assigned To You',
            p_message: customerDetails,
            p_reference_id: newLead.id,
            p_reference_type: 'lead',
            p_assigned_to: assignedTo,
          });

          const { data, error } = await adminSupabase.rpc(
            'create_notification',
            {
              p_user_id: assignedTo,
              p_company_id: ticket.company_id,
              p_type: 'assignment',
              p_title: 'New Lead Assigned To You',
              p_message: customerDetails,
              p_reference_id: newLead.id,
              p_reference_type: 'lead',
              p_assigned_to: assignedTo,
            }
          );

          if (error) {
            console.error(
              'Database error creating lead assignment notification:',
              error
            );
            throw error;
          }

          console.log(
            'Successfully created lead assignment notification:',
            data
          );
        } catch (notificationError) {
          console.error(
            'Error creating lead assignment notification:',
            notificationError
          );
          // Don't throw to avoid breaking the main flow, but log thoroughly
        }
      } else {
        // Lead is unassigned - notify all sales department members
        try {
          const { createAdminClient } = await import(
            '@/lib/supabase/server-admin'
          );
          const adminSupabase = createAdminClient();

          // Build customer info for department notification (Customer Name | Lead Type)
          const formatLeadType = (source: string) => {
            switch (source) {
              case 'cold_call':
                return 'Call';
              case 'web_form':
                return 'Form';
              case 'website_form':
                return 'Form';
              case 'phone_call':
                return 'Call';
              default:
                return (
                  source
                    ?.replace('_', ' ')
                    .replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
                );
            }
          };

          const deptCustomerName =
            `${ticket.customer?.first_name || ''} ${ticket.customer?.last_name || ''}`.trim() ||
            'Unknown Customer';
          const deptLeadType = formatLeadType(ticket.source);
          const deptCustomerDetails = `${deptCustomerName} | ${deptLeadType}`;

          console.log('Creating department notification for unassigned lead');

          const { data, error } = await adminSupabase.rpc(
            'notify_department_and_managers',
            {
              p_company_id: ticket.company_id,
              p_department: 'sales',
              p_type: 'new_lead_unassigned',
              p_title: 'New Sales Lead In The Bucket!',
              p_message: deptCustomerDetails,
              p_reference_id: newLead.id,
              p_reference_type: 'lead',
            }
          );

          if (error) {
            console.error(
              'Database error creating department lead notification:',
              error
            );
            throw error;
          }

          console.log(
            'Successfully created department lead notification:',
            data
          );
        } catch (notificationError) {
          console.error(
            'Error creating department lead notification:',
            notificationError
          );
          // Don't throw to avoid breaking the main flow, but log thoroughly
        }
      }

      return NextResponse.json({
        message: 'Ticket qualified as sales and converted to lead',
        qualification: 'sales',
        lead: newLead,
        customer: newLead.customer,
        leadId: newLead.id,
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
          status: customStatus || (assignedTo ? 'in_progress' : 'unassigned'),
          priority: ticket.priority || 'medium',
          updated_at: new Date().toISOString(),
        };

        // Add assignment if provided, otherwise ensure it's unassigned
        if (assignedTo) {
          updateData.assigned_to = assignedTo;
        } else {
          updateData.assigned_to = null;
        }

        const { data: updatedSupportCase, error: updateSupportCaseError } =
          await supabase
            .from('support_cases')
            .update(updateData)
            .eq('id', ticket.converted_to_support_case_id)
            .select(
              `
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
          `
            )
            .single();

        if (updateSupportCaseError) {
          console.error(
            'Error updating existing support case:',
            updateSupportCaseError
          );
          return NextResponse.json(
            { error: 'Failed to update existing support case' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Existing support case updated successfully',
          qualification: 'customer_service',
          supportCase: updatedSupportCase,
          customer: updatedSupportCase.customer,
          supportCaseId: updatedSupportCase.id,
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
      } else if (
        ticket.description?.toLowerCase().includes('service') ||
        ticket.description?.toLowerCase().includes('quality')
      ) {
        issueType = 'service_quality';
      }

      // Generate summary from ticket data
      const summary =
        ticket.description ||
        `${ticket.type} inquiry from ${ticket.source}` ||
        'Support request';

      // Create a new support case from the ticket
      const supportCaseInsertData = {
        company_id: ticket.company_id,
        customer_id: ticket.customer_id,
        ticket_id: ticket.id,
        issue_type: issueType,
        summary: summary.substring(0, 255), // Ensure it fits in summary field
        description: ticket.description,
        status: customStatus || (assignedTo || ticket.assigned_to ? 'in_progress' : 'unassigned'),
        priority: ticket.priority || 'medium',
        assigned_to: assignedTo || ticket.assigned_to || null,
        archived: false,
      };

      // Start a transaction for support case creation and ticket update
      let newSupportCase;
      await supabase.rpc('begin');

      try {
        // Create the support case
        const { data: supportCaseData, error: supportCaseError } =
          await supabase
            .from('support_cases')
            .insert(supportCaseInsertData)
            .select(
              `
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
          `
            )
            .single();

        if (supportCaseError) {
          await supabase.rpc('rollback');
          console.error('Error creating support case:', supportCaseError);
          return NextResponse.json(
            { error: 'Failed to convert ticket to support case' },
            { status: 500 }
          );
        }

        newSupportCase = supportCaseData;

        // Update the ticket to mark it as converted and archived (atomic with support case creation)
        const { error: ticketUpdateError } = await supabase
          .from('tickets')
          .update({
            converted_to_support_case_id: newSupportCase.id,
            converted_at: new Date().toISOString(),
            archived: true,
            status: 'resolved',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (ticketUpdateError) {
          await supabase.rpc('rollback');
          console.error(
            'Error updating ticket conversion status:',
            ticketUpdateError
          );
          return NextResponse.json(
            { error: 'Failed to update ticket after support case creation' },
            { status: 500 }
          );
        }

        // Commit the transaction
        await supabase.rpc('commit');
        console.log(
          '✅ Support case creation and ticket archival completed atomically'
        );
      } catch (error) {
        await supabase.rpc('rollback');
        console.error('Transaction rolled back due to error:', error);
        return NextResponse.json(
          { error: 'Failed to convert ticket to support case' },
          { status: 500 }
        );
      }

      // Create assignment notification if ticket was assigned to someone
      if (assignedTo) {
        try {
          const { createAdminClient } = await import(
            '@/lib/supabase/server-admin'
          );
          const adminSupabase = createAdminClient();

          // Helper function to format priority
          const formatPriority = (priority: string) => {
            switch (priority) {
              case 'low':
                return 'Low';
              case 'medium':
                return 'Medium';
              case 'high':
                return 'High';
              case 'urgent':
                return 'Urgent';
              default:
                return (
                  priority?.replace(/\b\w/g, l => l.toUpperCase()) || 'Medium'
                );
            }
          };

          // Build customer info for notification (Customer Name | Priority)
          const customerName =
            `${ticket.customer?.first_name || ''} ${ticket.customer?.last_name || ''}`.trim() ||
            'Unknown Customer';
          const ticketPriority = formatPriority(ticket.priority);
          const customerDetails = `${customerName} | ${ticketPriority}`;

          console.log('Creating ticket assignment notification with params:', {
            p_user_id: assignedTo,
            p_company_id: ticket.company_id,
            p_type: 'assignment',
            p_title: 'New Support Ticket Assigned To You',
            p_message: customerDetails,
            p_reference_id: ticket.id,
            p_reference_type: 'ticket',
            p_assigned_to: assignedTo,
          });

          const { data, error } = await adminSupabase.rpc(
            'create_notification',
            {
              p_user_id: assignedTo,
              p_company_id: ticket.company_id,
              p_type: 'assignment',
              p_title: 'New Support Ticket Assigned To You',
              p_message: customerDetails,
              p_reference_id: ticket.id,
              p_reference_type: 'ticket',
              p_assigned_to: assignedTo,
            }
          );

          if (error) {
            console.error(
              'Database error creating ticket assignment notification:',
              error
            );
            throw error;
          }

          console.log(
            'Successfully created ticket assignment notification:',
            data
          );
        } catch (notificationError) {
          console.error(
            'Error creating ticket assignment notification:',
            notificationError
          );
          // Don't throw to avoid breaking the main flow, but log thoroughly
        }
      } else {
        // Ticket is unassigned - notify all support department members
        try {
          const { createAdminClient } = await import(
            '@/lib/supabase/server-admin'
          );
          const adminSupabase = createAdminClient();

          // Build customer info for department notification (Customer Name | Priority)
          const formatPriority = (priority: string) => {
            switch (priority) {
              case 'low':
                return 'Low';
              case 'medium':
                return 'Medium';
              case 'high':
                return 'High';
              case 'urgent':
                return 'Urgent';
              default:
                return (
                  priority?.replace(/\b\w/g, l => l.toUpperCase()) || 'Medium'
                );
            }
          };

          const deptTicketCustomerName =
            `${ticket.customer?.first_name || ''} ${ticket.customer?.last_name || ''}`.trim() ||
            'Unknown Customer';
          const deptTicketPriority = formatPriority(ticket.priority);
          const deptTicketCustomerDetails = `${deptTicketCustomerName} | ${deptTicketPriority}`;

          console.log(
            'Creating department notification for unassigned support ticket'
          );

          const { data, error } = await adminSupabase.rpc(
            'notify_department_and_managers',
            {
              p_company_id: ticket.company_id,
              p_department: 'support',
              p_type: 'new_support_case_unassigned',
              p_title: 'New Support Ticket In The Bucket!',
              p_message: deptTicketCustomerDetails,
              p_reference_id: ticket.id,
              p_reference_type: 'ticket',
            }
          );

          if (error) {
            console.error(
              'Database error creating department ticket notification:',
              error
            );
            throw error;
          }

          console.log(
            'Successfully created department ticket notification:',
            data
          );
        } catch (notificationError) {
          console.error(
            'Error creating department ticket notification:',
            notificationError
          );
          // Don't throw to avoid breaking the main flow, but log thoroughly
        }
      }

      return NextResponse.json({
        message:
          'Ticket qualified as customer service and converted to support case',
        qualification: 'customer_service',
        supportCase: newSupportCase,
        customer: newSupportCase.customer,
        supportCaseId: newSupportCase.id,
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
