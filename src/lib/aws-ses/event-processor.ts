/**
 * AWS SES Event Processor
 *
 * Processes AWS SES events received via SNS webhooks.
 * Handles bounces, complaints, deliveries, opens, and clicks.
 */

import { SesEvent, ProcessedSesEvent } from '@/types/ses-events';
import { addToSuppressionList } from '@/lib/suppression';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * Process a bounce event
 * Hard bounces are added to the suppression list
 *
 * @param event - SES bounce event
 * @returns Processed event data
 */
export async function processBounceEvent(
  event: SesEvent
): Promise<{ success: boolean; error?: string }> {
  if (!event.bounce) {
    return { success: false, error: 'No bounce data in event' };
  }

  const { bounce, mail } = event;
  const messageId = mail.messageId;

  try {
    const supabase = createAdminClient();

    // Get the email log entry to find company_id
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .select('company_id, recipient_email')
      .eq('ses_message_id', messageId)
      .single();

    if (logError || !emailLog) {
      console.error(`Email log not found for message ID ${messageId}`);
      return { success: false, error: 'Email log not found' };
    }

    // Process each bounced recipient
    for (const recipient of bounce.bouncedRecipients) {
      const email = recipient.emailAddress;

      // Add to suppression list if permanent bounce
      if (bounce.bounceType === 'Permanent') {
        await addToSuppressionList(
          email,
          emailLog.company_id,
          'bounce',
          'hard_bounce',
          event,
          `Permanent bounce: ${bounce.bounceSubType}`
        );
      } else if (bounce.bounceType === 'Transient') {
        // For transient bounces, log but don't suppress immediately
        console.log(`Transient bounce for ${email}: ${bounce.bounceSubType}`);
      }
    }

    // Update email log with bounce information
    await supabase
      .from('email_logs')
      .update({
        delivery_status: 'bounced',
        bounce_type: bounce.bounceType,
        bounce_subtype: bounce.bounceSubType,
        bounced_at: bounce.timestamp,
        ses_event_data: event,
        updated_at: new Date().toISOString(),
      })
      .eq('ses_message_id', messageId);

    return { success: true };
  } catch (error) {
    console.error('Error processing bounce event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process bounce',
    };
  }
}

/**
 * Process a complaint event
 * All complaints are added to the suppression list
 *
 * @param event - SES complaint event
 * @returns Processed event data
 */
export async function processComplaintEvent(
  event: SesEvent
): Promise<{ success: boolean; error?: string }> {
  if (!event.complaint) {
    return { success: false, error: 'No complaint data in event' };
  }

  const { complaint, mail } = event;
  const messageId = mail.messageId;

  try {
    const supabase = createAdminClient();

    // Get the email log entry to find company_id
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .select('company_id, recipient_email')
      .eq('ses_message_id', messageId)
      .single();

    if (logError || !emailLog) {
      console.error(`Email log not found for message ID ${messageId}`);
      return { success: false, error: 'Email log not found' };
    }

    // Process each complained recipient
    for (const recipient of complaint.complainedRecipients) {
      const email = recipient.emailAddress;

      // Add all complaints to suppression list
      await addToSuppressionList(
        email,
        emailLog.company_id,
        'complaint',
        'complaint',
        event,
        `Complaint type: ${complaint.complaintFeedbackType || 'not specified'}`
      );
    }

    // Update email log with complaint information
    await supabase
      .from('email_logs')
      .update({
        delivery_status: 'complained',
        complaint_feedback_type: complaint.complaintFeedbackType || null,
        complained_at: complaint.timestamp,
        ses_event_data: event,
        updated_at: new Date().toISOString(),
      })
      .eq('ses_message_id', messageId);

    return { success: true };
  } catch (error) {
    console.error('Error processing complaint event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process complaint',
    };
  }
}

/**
 * Process a delivery event
 *
 * @param event - SES delivery event
 * @returns Processed event data
 */
export async function processDeliveryEvent(
  event: SesEvent
): Promise<{ success: boolean; error?: string }> {
  if (!event.delivery) {
    return { success: false, error: 'No delivery data in event' };
  }

  const { delivery, mail } = event;
  const messageId = mail.messageId;

  try {
    const supabase = createAdminClient();

    // Update email log with delivery confirmation
    await supabase
      .from('email_logs')
      .update({
        delivery_status: 'delivered',
        delivered_at: delivery.timestamp,
        ses_event_data: event,
        updated_at: new Date().toISOString(),
      })
      .eq('ses_message_id', messageId);

    return { success: true };
  } catch (error) {
    console.error('Error processing delivery event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process delivery',
    };
  }
}

/**
 * Process an open event
 *
 * @param event - SES open event
 * @returns Processed event data
 */
export async function processOpenEvent(
  event: SesEvent
): Promise<{ success: boolean; error?: string }> {
  if (!event.open) {
    return { success: false, error: 'No open data in event' };
  }

  const { open, mail } = event;
  const messageId = mail.messageId;

  try {
    const supabase = createAdminClient();

    // Update email log with open timestamp (first open only)
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('opened_at')
      .eq('ses_message_id', messageId)
      .single();

    // Only update if not already opened (track first open)
    if (existingLog && !existingLog.opened_at) {
      await supabase
        .from('email_logs')
        .update({
          delivery_status: 'opened',
          opened_at: open.timestamp,
          updated_at: new Date().toISOString(),
        })
        .eq('ses_message_id', messageId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing open event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process open',
    };
  }
}

/**
 * Process a click event
 *
 * @param event - SES click event
 * @returns Processed event data
 */
export async function processClickEvent(
  event: SesEvent
): Promise<{ success: boolean; error?: string }> {
  if (!event.click) {
    return { success: false, error: 'No click data in event' };
  }

  const { click, mail } = event;
  const messageId = mail.messageId;

  try {
    const supabase = createAdminClient();

    // Get email log to find context (customer_id, campaign_id, company_id)
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id, clicked_at, customer_id, campaign_id, company_id, lead_id')
      .eq('ses_message_id', messageId)
      .single();

    if (!emailLog) {
      return { success: false, error: 'Email log not found' };
    }

    // Update email log with click timestamp (first click only)
    if (!emailLog.clicked_at) {
      await supabase
        .from('email_logs')
        .update({
          delivery_status: 'clicked',
          clicked_at: click.timestamp,
          updated_at: new Date().toISOString(),
        })
        .eq('ses_message_id', messageId);
    }

    // Check if this click should generate a lead
    const linkTags = click.linkTags || {};
    const shouldGenerateLead = linkTags.generateLead?.[0] === 'true';

    if (shouldGenerateLead) {
      await handleLeadCreationFromClick(
        emailLog,
        linkTags,
        click,
        supabase
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing click event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process click',
    };
  }
}

/**
 * Handle lead creation from email click with generateLead tag
 *
 * Creates a lead in 'quoted' stage when a customer clicks a tracked link.
 * Prevents duplicate leads for the same customer + campaign combination.
 *
 * @param emailLog - Email log record with context
 * @param linkTags - SES link tags from click event
 * @param click - Click event data
 * @param supabase - Supabase client
 */
async function handleLeadCreationFromClick(
  emailLog: any,
  linkTags: Record<string, string[]>,
  click: any,
  supabase: any
): Promise<void> {
  const customerId = linkTags.customerId?.[0] || emailLog.customer_id;
  const campaignId = linkTags.campaignId?.[0] || emailLog.campaign_id;
  const companyId = linkTags.companyId?.[0] || emailLog.company_id;

  if (!customerId || !companyId) {
    console.warn('Missing customerId or companyId for lead creation from click');
    return;
  }

  // Fetch campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name, service_plan_id, discount_id, target_pest_id')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    console.error('[LEAD_CREATION] Campaign not found:', campaignId, campaignError);
    return; // Cannot create lead without campaign context
  }

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

  // Check if lead already exists for this customer + campaign
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id, lead_status')
    .eq('customer_id', customerId)
    .eq('company_id', companyId)
    .eq('campaign_id', campaignId)
    .single();

  if (existingLead) {
    console.log(`Lead already exists (${existingLead.id}) for customer ${customerId}, skipping creation`);
    return;
  }

  // Get customer and service address
  const { data: customer } = await supabase
    .from('customers')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone_number,
      customer_service_addresses!inner(
        service_address:service_addresses(id)
      )
    `)
    .eq('id', customerId)
    .single();

  const serviceAddressId = customer?.customer_service_addresses?.[0]?.service_address?.id || null;

  // Build lead comments
  let leadComments = `Lead created from email click engagement. Link: ${click.link}`;
  if (targetPestName) {
    leadComments += `\nTarget Pest: ${targetPestName}`;
  }
  if (campaign.service_plan_id) {
    leadComments += `\nCampaign Service Plan: ${campaign.name}`;
  }

  // Create lead in 'quoted' stage
  const { data: newLead, error: leadError } = await supabase
    .from('leads')
    .insert({
      company_id: companyId,
      customer_id: customerId,
      service_address_id: serviceAddressId,
      campaign_id: campaignId,
      lead_source: 'campaign',
      lead_status: 'quoted',
      pest_type: targetPestName,
      comments: leadComments,
      ip_address: click.ipAddress || null,
      user_agent: click.userAgent || null,
    })
    .select('id')
    .single();

  if (leadError) {
    console.error('Error creating lead from click:', leadError);
    return;
  }

  // Create quote if campaign has service plan
  if (campaign.service_plan_id && newLead) {
    console.log('[LEAD_CREATION] Creating quote for campaign service plan...');

    // Fetch service plan details
    const { data: servicePlan } = await supabase
      .from('service_plans')
      .select('id, plan_name, plan_description, initial_price, recurring_price, billing_frequency')
      .eq('id', campaign.service_plan_id)
      .single();

    if (servicePlan) {
      // Fetch campaign discount
      let campaignDiscount = null;
      if (campaign.discount_id) {
        const { data: discount, error: discountError } = await supabase
          .from('company_discounts')
          .select('*')
          .eq('id', campaign.discount_id)
          .single();

        if (discountError) {
          console.error('[LEAD_CREATION] Error fetching discount:', discountError);
        } else if (!discount) {
          console.warn('[LEAD_CREATION] Discount not found:', campaign.discount_id);
        } else {
          console.log('[LEAD_CREATION] Applying discount:', discount.discount_name, discount.discount_type, discount.discount_value);
        }

        campaignDiscount = discount;
      }

      // Calculate pricing with discount
      let planInitialPrice = servicePlan.initial_price || 0;
      let planRecurringPrice = servicePlan.recurring_price || 0;
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

      // Check if quote already exists for this lead
      const { data: existingQuote } = await supabase
        .from('quotes')
        .select('id')
        .eq('lead_id', newLead.id)
        .single();

      let quoteId: string;

      if (existingQuote) {
        // Update existing quote with new pricing
        console.log('[LEAD_CREATION] Quote already exists for lead, updating pricing');
        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            total_initial_price: planInitialPrice,
            total_recurring_price: planRecurringPrice,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingQuote.id);

        if (updateError) {
          console.error('[LEAD_CREATION] Error updating quote:', updateError);
          return;
        }

        quoteId = existingQuote.id;
      } else {
        // Create new quote
        const { data: newQuote, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            lead_id: newLead.id,
            company_id: companyId,
            customer_id: customerId,
            service_address_id: serviceAddressId,
            total_initial_price: planInitialPrice,
            total_recurring_price: planRecurringPrice,
            quote_status: 'draft',
          })
          .select('id')
          .single();

        if (quoteError) {
          console.error('[LEAD_CREATION] Error creating quote:', quoteError);
          return; // Stop if quote creation fails
        }

        if (!newQuote) {
          console.error('[LEAD_CREATION] Quote creation returned null');
          return;
        }

        quoteId = newQuote.id;
      }

      // Check if line items already exist for this quote
      const { data: existingLineItems } = await supabase
        .from('quote_line_items')
        .select('id')
        .eq('quote_id', quoteId)
        .eq('service_plan_id', servicePlan.id);

      if (existingLineItems && existingLineItems.length > 0) {
        // Update existing line item
        console.log('[LEAD_CREATION] Updating existing quote line item');
        const { error: updateLineItemError } = await supabase
          .from('quote_line_items')
          .update({
            plan_name: servicePlan.plan_name,
            plan_description: servicePlan.plan_description,
            initial_price: servicePlan.initial_price || 0,
            recurring_price: servicePlan.recurring_price || 0,
            billing_frequency: servicePlan.billing_frequency || 'one-time',
            discount_id: campaignDiscount?.id || null,
            discount_percentage: discountPercentage,
            discount_amount: discountAmount,
            final_initial_price: planInitialPrice,
            final_recurring_price: planRecurringPrice,
          })
          .eq('id', existingLineItems[0].id);

        if (updateLineItemError) {
          console.error('[LEAD_CREATION] Error updating quote line item:', updateLineItemError);
        } else {
          console.log('[LEAD_CREATION] Updated quote and line item for lead:', newLead.id);
        }
      } else {
        // Create new line item
        const { error: lineItemError } = await supabase
          .from('quote_line_items')
          .insert({
            quote_id: quoteId,
            service_plan_id: servicePlan.id,
            addon_service_id: null,
            plan_name: servicePlan.plan_name,
            plan_description: servicePlan.plan_description,
            initial_price: servicePlan.initial_price || 0,
            recurring_price: servicePlan.recurring_price || 0,
            billing_frequency: servicePlan.billing_frequency || 'one-time',
            discount_id: campaignDiscount?.id || null,
            discount_percentage: discountPercentage,
            discount_amount: discountAmount,
            final_initial_price: planInitialPrice,
            final_recurring_price: planRecurringPrice,
            display_order: 0,
          });

        if (lineItemError) {
          console.error('[LEAD_CREATION] Error creating quote line item:', lineItemError);
        } else {
          console.log('[LEAD_CREATION] Created quote and line item for lead:', newLead.id);
        }
      }
    }
  }

  // Update email log with lead reference
  await supabase
    .from('email_logs')
    .update({ lead_id: newLead.id })
    .eq('id', emailLog.id);

  // Log activity
  await supabase
    .from('activities')
    .insert({
      activity_type: 'lead_created_from_email_click',
      customer_id: customerId,
      lead_id: newLead.id,
      company_id: companyId,
      metadata: {
        campaign_id: campaignId,
        email_log_id: emailLog.id,
        clicked_link: click.link,
        link_tags: linkTags,
        ip_address: click.ipAddress,
        user_agent: click.userAgent,
      },
    });

  console.log(`Lead created (${newLead.id}) from email click for customer ${customerId}`);
}

/**
 * Route an SES event to the appropriate processor
 *
 * @param event - SES event from SNS
 * @returns Processing result
 */
export async function processEmailEvent(
  event: SesEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.eventType) {
      case 'Bounce':
        return await processBounceEvent(event);

      case 'Complaint':
        return await processComplaintEvent(event);

      case 'Delivery':
        return await processDeliveryEvent(event);

      case 'Open':
        return await processOpenEvent(event);

      case 'Click':
        return await processClickEvent(event);

      case 'Send':
        // Send events are logged when we send the email, no additional processing needed
        return { success: true };

      case 'Reject':
        // Log reject events
        console.warn('Email rejected by SES:', event);
        return { success: true };

      case 'Rendering Failure':
        // Log rendering failures
        console.error('Email rendering failure:', event);
        return { success: true };

      case 'DeliveryDelay':
        // Log delivery delays
        console.warn('Email delivery delayed:', event);
        return { success: true };

      default:
        console.warn(`Unknown SES event type: ${event.eventType}`);
        return { success: true };
    }
  } catch (error) {
    console.error('Error routing email event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process event',
    };
  }
}

/**
 * Parse and process SES event from SNS message
 *
 * @param snsMessage - SNS message string containing SES event
 * @returns Processing result
 */
export async function processSnsMessage(
  snsMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sesEvent: SesEvent = JSON.parse(snsMessage);
    return await processEmailEvent(sesEvent);
  } catch (error) {
    console.error('Error parsing SNS message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse SNS message',
    };
  }
}
