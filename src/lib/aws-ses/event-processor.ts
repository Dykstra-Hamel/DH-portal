/**
 * AWS SES Event Processor
 *
 * Processes AWS SES events received via SNS webhooks.
 * Handles bounces, complaints, deliveries, opens, and clicks.
 */

import { SesEvent, ProcessedSesEvent } from '@/types/ses-events';
import { addToSuppressionList } from './suppression';
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
  const companyId = emailLog.company_id;

  if (!customerId || !companyId) {
    console.warn('Missing customerId or companyId for lead creation from click');
    return;
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
      comments: `Lead created from email click engagement. Link: ${click.link}`,
      ip_address: click.ipAddress || null,
      user_agent: click.userAgent || null,
    })
    .select('id')
    .single();

  if (leadError) {
    console.error('Error creating lead from click:', leadError);
    return;
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
