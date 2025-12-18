/**
 * Campaign Redemption API
 *
 * Handles campaign offer redemption with signature acceptance.
 * Creates a lead only after signature is provided.
 * Public endpoint - no authentication required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { captureDeviceData } from '@/lib/device-utils';
import { inngest } from '@/lib/inngest/client';
import { notifyLeadCreated } from '@/lib/notifications/lead-notifications';

interface RedeemRequest {
  customerId: string;
  signature_data?: string;
  terms_accepted?: boolean;
  requested_date?: string;
  requested_time?: string;
  phone_number?: string;
  client_device_data?: {
    timezone?: string;
    screen_resolution?: string;
    language?: string;
  };
  selected_addon_ids?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body: RedeemRequest = await request.json();

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Field whitelisting to prevent unauthorized field injection
    const allowedFields = ['customerId', 'signature_data', 'terms_accepted', 'requested_date', 'requested_time', 'phone_number', 'client_device_data', 'selected_addon_ids'];
    const requestedFields = Object.keys(body);
    const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));

    if (unauthorizedFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Unauthorized fields: ${unauthorizedFields.join(', ')}. Only ${allowedFields.join(', ')} are allowed.` },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch campaign
    console.log('[REDEEM] Looking up campaign with campaign_id:', campaignId);
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, campaign_id, name, company_id, discount_id, service_plan_id, target_pest_id')
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('[REDEEM] Campaign not found:', { campaignId, campaignError });
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    console.log('[REDEEM] Campaign found:', campaign.name);

    // Fetch target pest name if campaign has one
    let targetPestName: string | null = null;
    if (campaign.target_pest_id) {
      const { data: pestType } = await supabase
        .from('pest_types')
        .select('name')
        .eq('id', campaign.target_pest_id)
        .single();
      targetPestName = pestType?.name || null;
    }

    // Fetch customer with service addresses
    console.log('[REDEEM] Looking up customer:', { customerId: body.customerId, companyId: campaign.company_id });
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        customer_service_addresses (
          is_primary_address,
          service_addresses (
            id,
            street_address,
            city,
            state,
            zip_code
          )
        )
      `)
      .eq('id', body.customerId)
      .eq('company_id', campaign.company_id)
      .single();

    if (customerError || !customer) {
      console.error('[REDEEM] Customer not found:', { customerId: body.customerId, companyId: campaign.company_id, customerError });
      return NextResponse.json(
        { success: false, error: 'Customer not found or does not belong to this campaign' },
        { status: 404 }
      );
    }
    console.log('[REDEEM] Customer found:', customer.email);

    // Get primary service address (nested through junction table)
    const primaryAddressLink = Array.isArray(customer.customer_service_addresses)
      ? customer.customer_service_addresses.find((link: any) => link.is_primary_address) || customer.customer_service_addresses[0]
      : null;

    const primaryAddress = primaryAddressLink?.service_addresses || null;

    // Normalize address data (handle if Supabase returns as array or object)
    const addressData = primaryAddress
      ? (Array.isArray(primaryAddress) ? primaryAddress[0] : primaryAddress)
      : null;

    // Service address is optional for campaign redemption
    // If missing, will be noted in lead comments for follow-up

    // Capture device data (server + client merge)
    const serverDeviceData = captureDeviceData(request);
    const completeDeviceData = {
      ...serverDeviceData,
      timezone: body.client_device_data?.timezone || serverDeviceData.timezone,
      session: {
        ...serverDeviceData.session,
        screen_resolution: body.client_device_data?.screen_resolution,
        language: body.client_device_data?.language || serverDeviceData.session.language,
      },
    };

    // Check for contact lists - support both old and new systems
    let memberRecord: any = null;
    let contactListId: string | null = null;

    // FIRST: Check new reusable contact list system
    console.log('[REDEEM] Checking reusable contact list system...');
    const { data: contactListAssignments } = await supabase
      .from('campaign_contact_list_assignments')
      .select('contact_list_id')
      .eq('campaign_id', campaign.id);

    if (contactListAssignments && contactListAssignments.length > 0) {
      console.log('[REDEEM] Found reusable contact list assignments:', contactListAssignments.length);

      // Get contact list IDs
      const assignedListIds = contactListAssignments.map(a => a.contact_list_id);

      // Check if customer is a member of any assigned list
      const { data: reusableMember } = await supabase
        .from('contact_list_members')
        .select('id, contact_list_id, customer_id')
        .eq('customer_id', body.customerId)
        .in('contact_list_id', assignedListIds)
        .maybeSingle();

      if (reusableMember) {
        console.log('[REDEEM] Customer found in reusable contact list:', reusableMember.contact_list_id);

        // Create corresponding campaign member record if doesn't exist
        // (for tracking redemption in campaign_contact_list_members)
        const { data: campaignMember } = await supabase
          .from('campaign_contact_list_members')
          .select('id')
          .eq('customer_id', body.customerId)
          .eq('campaign_id', campaign.id)
          .maybeSingle();

        if (!campaignMember) {
          // Create campaign member record for tracking
          console.log('[REDEEM] Creating campaign member record for tracking');
          const { data: newMember } = await supabase
            .from('campaign_contact_list_members')
            .insert({
              contact_list_id: reusableMember.contact_list_id,
              customer_id: body.customerId,
              campaign_id: campaign.id,
              status: 'pending',
            })
            .select('id, redeemed_at')
            .single();

          memberRecord = newMember;
        } else {
          // Fetch existing member record
          const { data: existingMember } = await supabase
            .from('campaign_contact_list_members')
            .select('id, redeemed_at')
            .eq('id', campaignMember.id)
            .single();

          memberRecord = existingMember;
        }

        contactListId = reusableMember.contact_list_id;
      }
    }

    // FALLBACK: Check old direct upload contact list system
    if (!memberRecord) {
      console.log('[REDEEM] Checking old campaign_contact_lists system...');

      const { data: oldContactLists } = await supabase
        .from('campaign_contact_lists')
        .select('id')
        .eq('campaign_id', campaign.id);

      if (oldContactLists && oldContactLists.length > 0) {
        console.log('[REDEEM] Found old contact lists:', oldContactLists.length);
        contactListId = oldContactLists[0].id;

        // Find existing member record
        const { data: oldMember } = await supabase
          .from('campaign_contact_list_members')
          .select('id, redeemed_at')
          .eq('contact_list_id', contactListId)
          .eq('customer_id', body.customerId)
          .maybeSingle();

        memberRecord = oldMember;
      }
    }

    // STRICT VALIDATION: Member MUST exist in either system
    if (!memberRecord) {
      console.error('[REDEEM] Customer not found in any contact list for campaign');
      return NextResponse.json(
        {
          success: false,
          error: 'You are not authorized to redeem this campaign. This link may have expired or is invalid.'
        },
        { status: 403 }
      );
    }
    console.log('[REDEEM] Member found:', memberRecord.id);

    // Check if already redeemed
    if (memberRecord.redeemed_at) {
      return NextResponse.json(
        { success: false, error: 'This campaign has already been redeemed' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Build update object conditionally
    const updateData: any = {
      redeemed_at: now,
      device_data: completeDeviceData,
      requested_date: body.requested_date || null,
      requested_time: body.requested_time || null,
      status: 'processed',
    };

    // Only include signature data if provided (backward compatibility with old modal flow)
    if (body.signature_data) {
      updateData.signed_at = now;
      updateData.signature_data = body.signature_data;
      updateData.terms_accepted = body.terms_accepted || false;
    }

    // Idempotent update: only update if not already redeemed (prevents race conditions)
    const { data: updatedMember } = await supabase
      .from('campaign_contact_list_members')
      .update(updateData)
      .eq('id', memberRecord.id)
      .is('redeemed_at', null)
      .select()
      .single();

    if (!updatedMember) {
      return NextResponse.json(
        { success: false, error: 'This campaign has already been redeemed' },
        { status: 400 }
      );
    }

    // Build lead comments
    let leadComments = body.signature_data
      ? `Campaign: ${campaign.name}\nRedeemed with signature on ${new Date().toLocaleDateString()}`
      : `Campaign: ${campaign.name}\nRedeemed via inline form on ${new Date().toLocaleDateString()}`;

    // Add pest targeting info if applicable
    if (targetPestName) {
      leadComments += `\n\nTarget Pest: ${targetPestName}`;
    }

    // Add note if no service address provided
    if (!addressData) {
      leadComments += `\n\nNote: Customer did not have a service address on file. Please collect service address when scheduling.`;
    }

    // Add phone number if provided
    if (body.phone_number) {
      leadComments += `\n\nContact Phone: ${body.phone_number}`;
    }

    if (body.requested_date || body.requested_time) {
      leadComments += `\n\nCustomer preferred schedule:`;
      if (body.requested_date) {
        leadComments += `\nDate: ${new Date(body.requested_date).toLocaleDateString()}`;
      }
      if (body.requested_time) {
        const timeLabels: Record<string, string> = {
          morning: 'Morning (8am - 12pm)',
          afternoon: 'Afternoon (12pm - 4pm)',
          evening: 'Evening (4pm - 8pm)',
          anytime: 'Anytime',
        };
        leadComments += `\nTime: ${timeLabels[body.requested_time] || body.requested_time}`;
      }
    }

    // Check for existing lead first (may have been created from email click)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, lead_status, comments, service_address_id, assigned_to')
      .eq('customer_id', body.customerId)
      .eq('company_id', campaign.company_id)
      .eq('campaign_id', campaign.id)
      .maybeSingle();

    let lead;
    const signedAt = new Date().toLocaleDateString();

    if (existingLead) {
      // Update existing lead to 'ready_to_schedule' stage
      const acceptanceMethod = body.signature_data ? 'Signature captured' : 'Offer accepted via inline form';
      const updatedComments = existingLead.comments
        ? `${existingLead.comments}\n\nCampaign offer accepted. ${acceptanceMethod} on ${signedAt}. Requested: ${body.requested_date || 'ASAP'} ${body.requested_time || ''}`
        : `Campaign: ${campaign.name}. ${acceptanceMethod} on ${signedAt}. Requested: ${body.requested_date || 'ASAP'} ${body.requested_time || ''}`;

      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({
          lead_status: 'scheduling',
          service_address_id: addressData?.id || existingLead.service_address_id,
          requested_date: body.requested_date || null,
          requested_time: body.requested_time || null,
          comments: updatedComments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating existing lead:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update lead' },
          { status: 500 }
        );
      }

      lead = updatedLead;
      console.log(`Updated existing lead ${lead.id} from '${existingLead.lead_status}' to 'scheduling'`);
    } else {
      // Create new lead in 'scheduling' stage (no prior email engagement)
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          company_id: campaign.company_id,
          customer_id: body.customerId,
          service_address_id: addressData?.id || null,
          campaign_id: campaign.id,
          lead_source: 'campaign',
          lead_status: 'scheduling',
          pest_type: targetPestName,
          comments: leadComments,
          requested_date: body.requested_date || null,
          requested_time: body.requested_time || null,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating lead:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create lead' },
          { status: 500 }
        );
      }

      lead = newLead;
      console.log(`Created new lead ${lead.id} in 'scheduling' stage`);
    }

    // UPDATE CUSTOMER PHONE NUMBER: If phone number provided and different from existing
    if (body.phone_number && body.phone_number !== customer.phone) {
      console.log('[REDEEM] Updating customer phone number...');
      const { error: phoneUpdateError } = await supabase
        .from('customers')
        .update({ phone: body.phone_number })
        .eq('id', body.customerId)
        .eq('company_id', campaign.company_id); // Security: ensure same company

      if (phoneUpdateError) {
        console.error('[REDEEM] Error updating customer phone:', phoneUpdateError);
        // Don't fail redemption if phone update fails, just log it
      } else {
        console.log('[REDEEM] Successfully updated customer phone number');
      }
    }

    // QUOTE CREATION: Only create quote if campaign has a service plan
    if (campaign.service_plan_id) {
      console.log('[REDEEM] Campaign has service plan, creating quote...');

      // 1. Fetch service plan details
      const { data: servicePlan, error: planError } = await supabase
        .from('service_plans')
        .select('id, plan_name, plan_description, initial_price, recurring_price, billing_frequency')
        .eq('id', campaign.service_plan_id)
        .single();

      if (planError || !servicePlan) {
        console.error('[REDEEM] Service plan not found:', campaign.service_plan_id, planError);
        // Don't fail redemption, just skip quote creation
      } else {
        // 2. Fetch campaign discount (if exists)
        let campaignDiscount = null;
        if (campaign.discount_id) {
          const { data: discount } = await supabase
            .from('company_discounts')
            .select('*')
            .eq('id', campaign.discount_id)
            .single();
          campaignDiscount = discount;
        }

        // 3. Calculate service plan pricing with discount
        let planInitialPrice = servicePlan.initial_price || 0;
        let planRecurringPrice = servicePlan.recurring_price;
        let discountPercentage = 0;
        let discountAmount = 0;

        if (campaignDiscount && campaignDiscount.is_active) {
          if (campaignDiscount.discount_type === 'percentage') {
            discountPercentage = campaignDiscount.discount_value;
            if (campaignDiscount.applies_to_price === 'initial' || campaignDiscount.applies_to_price === 'both') {
              planInitialPrice = planInitialPrice * (1 - discountPercentage / 100);
            }
            if (campaignDiscount.applies_to_price === 'recurring' || campaignDiscount.applies_to_price === 'both') {
              planRecurringPrice = planRecurringPrice * (1 - discountPercentage / 100);
            }
          } else if (campaignDiscount.discount_type === 'fixed_amount') {
            discountAmount = campaignDiscount.discount_value;
            if (campaignDiscount.applies_to_price === 'initial' || campaignDiscount.applies_to_price === 'both') {
              planInitialPrice = Math.max(0, planInitialPrice - discountAmount);
            }
            if (campaignDiscount.applies_to_price === 'recurring' || campaignDiscount.applies_to_price === 'both') {
              planRecurringPrice = Math.max(0, planRecurringPrice - discountAmount);
            }
          }
        }

        // 4. Fetch and validate selected add-ons
        let selectedAddOns: any[] = [];
        if (body.selected_addon_ids && body.selected_addon_ids.length > 0) {
          // Validate eligibility using RPC function
          const { data: eligibleAddons } = await supabase
            .rpc('get_eligible_addons_for_plan', {
              p_service_plan_id: campaign.service_plan_id,
              p_company_id: campaign.company_id,
            });

          const eligibleIds = new Set(
            eligibleAddons?.filter((a: any) => a.is_eligible).map((a: any) => a.addon_id) || []
          );

          // Filter to only eligible add-ons
          const validAddonIds = body.selected_addon_ids.filter(id => eligibleIds.has(id));

          if (validAddonIds.length > 0) {
            const { data: addons } = await supabase
              .from('add_on_services')
              .select('id, addon_name, addon_description, initial_price, recurring_price, billing_frequency')
              .in('id', validAddonIds)
              .eq('company_id', campaign.company_id)
              .eq('is_active', true);

            if (addons) {
              selectedAddOns = addons;
            }
          }
        }

        // 5. Calculate total pricing (service plan + add-ons)
        let totalInitialPrice = planInitialPrice;
        let totalRecurringPrice = planRecurringPrice;

        selectedAddOns.forEach(addon => {
          totalInitialPrice += (addon.initial_price || 0);
          totalRecurringPrice += addon.recurring_price;
        });

        // 6. Check for existing quote (avoid duplicates)
        const { data: existingQuote } = await supabase
          .from('quotes')
          .select('id')
          .eq('lead_id', lead.id)
          .maybeSingle();

        let quoteId: string | undefined;

        if (existingQuote) {
          // Update existing quote
          quoteId = existingQuote.id;
          console.log('[REDEEM] Updating existing quote:', quoteId);

          const { error: updateError } = await supabase
            .from('quotes')
            .update({
              total_initial_price: totalInitialPrice,
              total_recurring_price: totalRecurringPrice,
              quote_status: 'draft',
              updated_at: new Date().toISOString(),
            })
            .eq('id', quoteId);

          if (updateError) {
            console.error('[REDEEM] Error updating quote:', updateError);
          }

          // Delete old line items
          await supabase
            .from('quote_line_items')
            .delete()
            .eq('quote_id', quoteId);
        } else {
          // Create new quote
          console.log('[REDEEM] Creating new quote for lead:', lead.id);

          const { data: newQuote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
              lead_id: lead.id,
              company_id: campaign.company_id,
              customer_id: body.customerId,
              service_address_id: addressData?.id || null,
              total_initial_price: totalInitialPrice,
              total_recurring_price: totalRecurringPrice,
              quote_status: 'draft',
            })
            .select('id')
            .single();

          if (quoteError || !newQuote) {
            console.error('[REDEEM] Error creating quote:', quoteError);
            // Don't fail redemption
          } else {
            quoteId = newQuote.id;
          }
        }

        // 7. Create quote line items (service plan + add-ons)
        if (quoteId) {
          const lineItems: any[] = [];

          // Service plan line item
          lineItems.push({
            quote_id: quoteId,
            service_plan_id: servicePlan.id,
            addon_service_id: null,
            plan_name: servicePlan.plan_name,
            plan_description: servicePlan.plan_description,
            initial_price: servicePlan.initial_price || 0,
            recurring_price: servicePlan.recurring_price,
            billing_frequency: servicePlan.billing_frequency,
            discount_percentage: discountPercentage,
            discount_amount: discountAmount,
            final_initial_price: planInitialPrice,
            final_recurring_price: planRecurringPrice,
            display_order: 0,
          });

          // Add-on line items
          selectedAddOns.forEach((addon, index) => {
            lineItems.push({
              quote_id: quoteId,
              service_plan_id: null,
              addon_service_id: addon.id,
              plan_name: addon.addon_name,
              plan_description: addon.addon_description,
              initial_price: addon.initial_price || 0,
              recurring_price: addon.recurring_price,
              billing_frequency: addon.billing_frequency || servicePlan.billing_frequency,
              discount_percentage: 0,
              discount_amount: 0,
              final_initial_price: addon.initial_price || 0,
              final_recurring_price: addon.recurring_price,
              display_order: index + 1,
            });
          });

          const { error: lineItemsError } = await supabase
            .from('quote_line_items')
            .insert(lineItems);

          if (lineItemsError) {
            console.error('[REDEEM] Error creating quote line items:', lineItemsError);
          } else {
            console.log(`[REDEEM] Created quote ${quoteId} with ${lineItems.length} line items`);
          }
        }
      }
    } else {
      console.log('[REDEEM] Campaign has no service plan, skipping quote creation');
    }

    // Update member record with lead_id
    await supabase
      .from('campaign_contact_list_members')
      .update({ lead_id: lead.id })
      .eq('id', updatedMember.id);

    // CANCEL WORKFLOW: If a workflow execution is running for this customer + campaign, cancel it
    // This prevents unnecessary follow-up steps (like AI calls) after the customer has already redeemed
    console.log('[REDEEM] Checking for active workflow executions to cancel...');
    const { data: campaignExecution } = await supabase
      .from('campaign_executions')
      .select('automation_execution_id, execution_status')
      .eq('campaign_id', campaign.id)
      .eq('customer_id', body.customerId)
      .in('execution_status', ['pending', 'running'])
      .maybeSingle();

    if (campaignExecution?.automation_execution_id) {
      console.log(`[REDEEM] Found active workflow execution ${campaignExecution.automation_execution_id}, cancelling...`);

      // Update automation execution status to cancelled
      const { error: cancelError } = await supabase
        .from('automation_executions')
        .update({
          execution_status: 'cancelled',
          completed_at: new Date().toISOString(),
          execution_data: {
            cancellationReason: 'Lead redeemed offer via landing page',
            cancellationProcessed: true,
            cancelledAtStep: 'redemption',
            cancelledBy: 'system',
            cancelledAt: new Date().toISOString(),
          },
        })
        .eq('id', campaignExecution.automation_execution_id)
        .in('execution_status', ['pending', 'running']); // Only cancel if still active

      if (cancelError) {
        console.error('[REDEEM] Error cancelling workflow execution:', cancelError);
        // Don't fail redemption if cancellation fails - log and continue
      } else {
        // Also update campaign execution status
        await supabase
          .from('campaign_executions')
          .update({
            execution_status: 'cancelled',
            completed_at: new Date().toISOString(),
          })
          .eq('automation_execution_id', campaignExecution.automation_execution_id);

        // Update member status to 'processed' since customer completed the workflow by redeeming
        await supabase
          .from('campaign_contact_list_members')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('execution_id', campaignExecution.automation_execution_id);

        // Send workflow completion event for campaign tracking
        // This ensures campaign completion logic runs even if workflow doesn't send it
        try {
          await inngest.send({
            name: 'workflow/completed',
            data: {
              executionId: campaignExecution.automation_execution_id,
              workflowId: null,
              companyId: campaign.company_id,
              triggerType: 'campaign',
              success: false,
              cancelled: true,
              cancellationReason: 'Lead redeemed offer via landing page',
            },
          });
        } catch (eventError) {
          console.error('[REDEEM] Failed to send workflow completion event:', eventError);
          // Don't fail redemption if event sending fails
        }

        console.log(`[REDEEM] Successfully cancelled workflow execution ${campaignExecution.automation_execution_id}`);
      }
    } else {
      console.log('[REDEEM] No active workflow execution found for this customer + campaign');
    }

    // Log activity
    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        activity_type: existingLead ? 'campaign_lead_updated' : 'campaign_redeemed',
        customer_id: body.customerId,
        lead_id: lead.id,
        company_id: campaign.company_id,
        metadata: {
          campaign_id: campaign.id,
          campaign_identifier: campaign.campaign_id,
          discount_id: campaign.discount_id,
          signature_captured: true,
          signed_at: now,
          requested_date: body.requested_date,
          requested_time: body.requested_time,
          device_data: completeDeviceData,
          previous_lead_status: existingLead?.lead_status || null,
          new_lead_status: 'scheduling',
          selected_addon_ids: body.selected_addon_ids || [],
          workflow_cancelled: !!campaignExecution?.automation_execution_id,
          cancelled_execution_id: campaignExecution?.automation_execution_id || null,
        },
      });

    if (activityError) {
      console.error('Error logging activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    // Send lead creation notification (non-blocking)
    notifyLeadCreated(lead.id, campaign.company_id, {
      assignedUserId: undefined, // Campaign leads are unassigned
    }).catch(error => {
      console.error('Campaign lead notification failed:', error);
    });

    // If updating existing lead to scheduling status, trigger status-changed event
    if (existingLead && existingLead.lead_status !== 'scheduling') {
      try {
        await inngest.send({
          name: 'lead/status-changed',
          data: {
            leadId: existingLead.id,
            companyId: campaign.company_id,
            fromStatus: existingLead.lead_status,
            toStatus: 'scheduling',
            assignedUserId: existingLead.assigned_to,
            userId: 'system',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('Failed to trigger status-changed event:', error);
        // Don't fail the redemption
      }
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Campaign redeemed successfully',
      data: {
        lead_id: lead.id,
        signed_at: now,
      },
    });
  } catch (error) {
    console.error('Error redeeming campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
