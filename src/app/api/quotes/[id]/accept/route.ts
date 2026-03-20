import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { captureDeviceData } from '@/lib/device-utils';
import { sendQuoteSignedNotification } from '@/lib/email/quote-notifications';
import { QuoteSignedEmailData } from '@/lib/email/types';
import { logActivity } from '@/lib/activity-logger';
import { inngest } from '@/lib/inngest/client';
import { stopActiveCadence } from '@/lib/leads/stop-active-cadence';

interface AcceptQuoteRequest {
  signature_data: string;
  terms_accepted: boolean;
  token: string;
  preferred_date?: string;
  preferred_time?: string;
  selected_addon_ids?: string[];
  selected_plan_ids?: string[];
  interested_in_financing?: boolean;
  client_device_data?: {
    timezone?: string;
    screen_resolution?: string;
    language?: string;
  };
}

/**
 * Public endpoint to accept a quote with signature and terms
 * No authentication required - uses RLS policy that allows updates for quotes with quote_url
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const body: AcceptQuoteRequest = await request.json();

    // Validate required fields
    if (!body.token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 403 }
      );
    }

    if (!body.signature_data) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      );
    }

    if (!body.terms_accepted) {
      return NextResponse.json(
        { error: 'Terms must be accepted' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the quote to verify it exists, get lead_id, and validate token
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, lead_id, company_id, quote_status, quote_url, quote_token, token_expires_at')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Validate token matches quote
    if (quote.quote_token !== body.token) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    // Check if token has expired
    if (quote.token_expires_at) {
      const expiryDate = new Date(quote.token_expires_at);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'Access token has expired' },
          { status: 403 }
        );
      }
    }

    // Validate that the quote has a quote_url (has been shared with customer)
    if (!quote.quote_url) {
      return NextResponse.json(
        { error: 'This quote is not publicly accessible' },
        { status: 403 }
      );
    }

    // Check if quote is already accepted/completed
    if (quote.quote_status === 'accepted' || quote.quote_status === 'completed') {
      return NextResponse.json(
        { error: 'This quote has already been accepted' },
        { status: 400 }
      );
    }

    // FIELD WHITELISTING: Validate that only allowed fields are present in body
    const allowedFields = ['signature_data', 'terms_accepted', 'token', 'preferred_date', 'preferred_time', 'selected_addon_ids', 'selected_plan_ids', 'interested_in_financing', 'client_device_data'];
    const requestedFields = Object.keys(body);
    const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));

    if (unauthorizedFields.length > 0) {
      return NextResponse.json(
        { error: `Unauthorized fields: ${unauthorizedFields.join(', ')}. Only ${allowedFields.join(', ')} are allowed.` },
        { status: 400 }
      );
    }

    // Capture server-side device data
    const serverDeviceData = captureDeviceData(request);

    // Merge with client-side device data
    const completeDeviceData = {
      ...serverDeviceData,
      timezone: body.client_device_data?.timezone || serverDeviceData.timezone,
      session: {
        ...serverDeviceData.session,
        screen_resolution: body.client_device_data?.screen_resolution || serverDeviceData.session.screen_resolution,
        language: body.client_device_data?.language || serverDeviceData.session.language,
      },
    };

    // Update the quote - ONLY updating whitelisted fields
    const { error: updateQuoteError } = await supabase
      .from('quotes')
      .update({
        quote_status: 'accepted',
        signed_at: new Date().toISOString(),
        signature_data: body.signature_data,
        device_data: completeDeviceData,
      })
      .eq('id', id);

    if (updateQuoteError) {
      console.error('Error updating quote:', updateQuoteError);
      return NextResponse.json(
        { error: 'Failed to accept quote' },
        { status: 500 }
      );
    }

    // Update regular plan line items based on selected_plan_ids
    if (body.selected_plan_ids !== undefined) {
      const { data: regularItems } = await supabase
        .from('quote_line_items')
        .select('id')
        .eq('quote_id', id)
        .is('addon_service_id', null);

      if (regularItems && regularItems.length > 0) {
        for (const item of regularItems) {
          await supabase
            .from('quote_line_items')
            .update({ is_selected: body.selected_plan_ids.includes(item.id) })
            .eq('id', item.id);
        }
      }
    }

    // Delete all existing addon line items for this quote, then re-insert selected ones
    const selectedAddonIds = body.selected_addon_ids || [];

    await supabase
      .from('quote_line_items')
      .delete()
      .eq('quote_id', id)
      .not('addon_service_id', 'is', null);

    if (selectedAddonIds.length > 0) {
      const { data: addons } = await supabase
        .from('add_on_services')
        .select('id, addon_name, initial_price, recurring_price, billing_frequency')
        .in('id', selectedAddonIds)
        .eq('company_id', quote.company_id)
        .eq('is_active', true);

      if (addons && addons.length > 0) {
        const addonLineItems = addons.map((addon: any) => ({
          quote_id: id,
          addon_service_id: addon.id,
          plan_name: addon.addon_name,
          initial_price: addon.initial_price || 0,
          recurring_price: addon.recurring_price || 0,
          final_initial_price: addon.initial_price || 0,
          final_recurring_price: addon.recurring_price || 0,
          billing_frequency: addon.billing_frequency || 'monthly',
          is_selected: true,
        }));

        await supabase.from('quote_line_items').insert(addonLineItems);
      }
    }

    // Recalculate quote totals from all selected line items
    const { data: selectedItems } = await supabase
      .from('quote_line_items')
      .select('final_initial_price, final_recurring_price, initial_price, recurring_price')
      .eq('quote_id', id)
      .eq('is_selected', true);

    if (selectedItems) {
      const newInitial = selectedItems.reduce((s, i) => s + (i.final_initial_price ?? i.initial_price ?? 0), 0);
      const newRecurring = selectedItems.reduce((s, i) => s + (i.final_recurring_price ?? i.recurring_price ?? 0), 0);
      await supabase
        .from('quotes')
        .update({ total_initial_price: newInitial, total_recurring_price: newRecurring })
        .eq('id', id);
    }

    // Log Wisetack financing interest as a system note on the lead
    if (body.interested_in_financing && quote.lead_id) {
      try {
        await supabase.from('activity_log').insert({
          company_id: quote.company_id,
          entity_type: 'lead',
          entity_id: quote.lead_id,
          activity_type: 'note_added',
          user_id: null,
          notes: 'Customer expressed interest in Wisetack financing when signing their quote.',
          metadata: { system_note: true, source: 'quote_acceptance' },
        });
      } catch (noteError) {
        console.error('Error logging Wisetack financing note:', noteError);
      }
    }

    // Log activity for quote acceptance
    try {
      await logActivity({
        company_id: quote.company_id,
        entity_type: 'lead',
        entity_id: quote.lead_id,
        activity_type: 'status_change',
        field_name: 'quote_status',
        old_value: quote.quote_status,
        new_value: 'accepted',
        user_id: null, // Customer action, no internal user
        notes: 'Quote signed by customer',
        metadata: {
          quote_id: id,
          signed_at: new Date().toISOString(),
          signature_captured: true,
          device_data: completeDeviceData,
        },
      });
    } catch (activityError) {
      console.error('Error logging quote acceptance activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    // Update the associated lead status
    if (quote.lead_id) {
      // Get previous lead status before updating
      const { data: previousLead } = await supabase
        .from('leads')
        .select('lead_status, assigned_to')
        .eq('id', quote.lead_id)
        .single();

      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({
          lead_status: 'scheduling',
        })
        .eq('id', quote.lead_id);

      if (updateLeadError) {
        console.error('Error updating lead status:', updateLeadError);
        // Don't fail the request if lead update fails - quote is already accepted
      } else {
        // Stop any active cadence, tasks, and workflows now that lead is scheduling
        try {
          await stopActiveCadence(quote.lead_id);
        } catch (cadenceError) {
          console.error('Error stopping active cadence on quote acceptance:', cadenceError);
          // Non-fatal: don't fail the quote acceptance
        }
      }

      // Trigger status-changed event for scheduling notifications
      if (previousLead && previousLead.lead_status !== 'scheduling') {
        try {
          await inngest.send({
            name: 'lead/status-changed',
            data: {
              leadId: quote.lead_id,
              companyId: quote.company_id,
              fromStatus: previousLead.lead_status,
              toStatus: 'scheduling',
              assignedUserId: previousLead.assigned_to,
              userId: 'system',
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error('Failed to trigger status-changed event:', error);
          // Don't fail quote acceptance
        }
      }

      // Store preferred date/time in lead comments if provided
      if (body.preferred_date || body.preferred_time) {
        const preferredScheduleNote = `Customer preferred schedule: ${body.preferred_date || 'Not specified'} at ${body.preferred_time || 'Not specified'}`;

        // Fetch current comments
        const { data: lead } = await supabase
          .from('leads')
          .select('comments')
          .eq('id', quote.lead_id)
          .single();

        const updatedComments = lead?.comments
          ? `${lead.comments}\n\n${preferredScheduleNote}`
          : preferredScheduleNote;

        await supabase
          .from('leads')
          .update({
            comments: updatedComments,
          })
          .eq('id', quote.lead_id);
      }

      // Send email notification to assigned user
      try {
        // Fetch lead with assigned user, customer, company, and service address info
        const { data: leadData } = await supabase
          .from('leads')
          .select(`
            id,
            assigned_to,
            company_id,
            service_type,
            companies:company_id (
              id,
              name
            ),
            customers:customer_id (
              id,
              first_name,
              last_name,
              email
            ),
            service_addresses:service_address_id (
              street_address,
              apartment_unit,
              city,
              state,
              zip_code
            )
          `)
          .eq('id', quote.lead_id)
          .single();

        // Only send notification if lead has assigned user
        if (leadData && leadData.assigned_to) {
          // Get assigned user profile
          const { data: assignedProfile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', leadData.assigned_to)
            .single();

          if (assignedProfile && assignedProfile.email) {
            // Calculate quote total from final prices (discounts already applied)
            const { data: lineItems } = await supabase
              .from('quote_line_items')
              .select('final_initial_price')
              .eq('quote_id', id)
              .eq('is_selected', true);

            let quoteTotal = 0;
            if (lineItems && lineItems.length > 0) {
              quoteTotal = lineItems.reduce((sum, item) => {
                return sum + (item.final_initial_price || 0);
              }, 0);
            }

            // Build service address string
            let serviceAddress = '';
            if (leadData.service_addresses) {
              const addr = leadData.service_addresses as any;
              const parts = [
                addr.street_address,
                addr.apartment_unit,
                addr.city,
                addr.state,
                addr.zip_code
              ].filter(Boolean);
              serviceAddress = parts.join(', ');
            }

            // Build quote URL
            const quoteUrl = quote.quote_url ? `${process.env.NEXT_PUBLIC_SITE_URL}${quote.quote_url}` : undefined;

            // Build lead URL
            const leadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tickets/leads/${leadData.id}`;

            // Prepare email data
            const emailData: QuoteSignedEmailData = {
              quoteId: id,
              leadId: leadData.id,
              companyName: (leadData.companies as any)?.name || 'Your Company',
              customerName: `${(leadData.customers as any)?.first_name || ''} ${(leadData.customers as any)?.last_name || ''}`.trim() || (leadData.customers as any)?.email || 'Customer',
              customerEmail: (leadData.customers as any)?.email || '',
              quoteTotal: quoteTotal,
              signedAt: new Date().toISOString(),
              quoteUrl: quoteUrl,
              leadUrl: leadUrl,
              assignedUserName: `${assignedProfile.first_name || ''} ${assignedProfile.last_name || ''}`.trim() || assignedProfile.email,
              assignedUserEmail: assignedProfile.email,
              serviceType: leadData.service_type,
              serviceAddress: serviceAddress || undefined,
            };

            // Send email notification
            await sendQuoteSignedNotification(emailData, leadData.company_id);
          }
        }
      } catch (emailError) {
        // Log error but don't fail the request - quote is already accepted
        console.error('Error sending quote signed notification email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      data: {
        quote_id: id,
        signed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in quote accept POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
