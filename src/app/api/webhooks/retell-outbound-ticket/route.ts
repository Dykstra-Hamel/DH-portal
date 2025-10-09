import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';
import { normalizePhoneNumber } from '@/lib/utils';
import { findCompanyByAgentId, findCompanyAndDirectionByAgentId } from '@/lib/agent-utils';
import { sendCallSummaryNotifications } from '@/lib/email/call-summary-notifications';
import { CallSummaryEmailData } from '@/lib/email/types';

// Helper function to calculate billable duration (rounded up to nearest 30 seconds)
function calculateBillableDuration(
  durationSeconds: number | null
): number | null {
  if (!durationSeconds || durationSeconds <= 0) return 30; // Minimum billable time
  return Math.ceil(durationSeconds / 30) * 30;
}

// Simple rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(
  ip: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = ip;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {

    // Apply rate limiting
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip, 50, 60000)) {
      console.warn(`⚠️ [${requestId}] Rate limit exceeded`);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Verify the webhook is from Retell using signature verification
    const retellWebhookSecret = process.env.RETELL_WEBHOOK_SECRET;
    const signature = request.headers.get('x-retell-signature');

    if (!retellWebhookSecret || !signature) {
      console.error(`❌ [${requestId}] Webhook authentication not configured`);
    }

    if (!retellWebhookSecret) {
      console.error(`❌ [${requestId}] RETELL_WEBHOOK_SECRET not configured`);
      return NextResponse.json(
        { error: 'Webhook authentication not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error(`❌ [${requestId}] Missing signature header`);
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    const payload = await request.json();

    // Verify webhook signature using Retell SDK
    const isValidSignature = Retell.verify(
      JSON.stringify(payload),
      retellWebhookSecret,
      signature
    );

    if (!isValidSignature) {
      console.error(`❌ [${requestId}] Invalid webhook signature`);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Get event type - Retell sends this as 'event' at top level
    const eventType = payload.event;

    // Extract data from the nested call object
    const callData = payload.call || payload;
    const { call_id } = callData;


    if (!call_id) {
      console.error(`❌ [${requestId}] No call_id provided in payload`);
      return NextResponse.json(
        { error: 'call_id is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Add request ID to context for downstream functions
    callData._requestId = requestId;
    let result;

    switch (eventType) {
      case 'call_started':
        result = await handleOutboundCallStarted(supabase, callData);
        break;

      case 'call_ended':
        result = await handleOutboundCallEnded(supabase, callData);
        break;

      case 'call_analyzed':
        result = await handleOutboundCallAnalyzed(supabase, callData);
        break;

      default:
        console.warn(`⚠️ [${requestId}] Unknown event type: ${eventType}`);
        result = NextResponse.json({
          success: true,
          message: 'Event type not handled',
          eventType,
        });
        break;
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ [${requestId}] Webhook error after ${duration}ms:`,
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// Find customer by phone number and company ID and return full customer object
async function findCustomerByPhone(
  phoneNumber: string | undefined,
  companyId: string | undefined
) {
  if (!phoneNumber || !companyId) {
    return null;
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, first_name, last_name, address, city, state, zip_code')
      .eq('phone', phoneNumber)
      .eq('company_id', companyId)
      .single();

    if (data && !error) {
      return data;
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Customer lookup failed:', error.message);
    }
  } catch (error) {
    console.error('Customer lookup error:', error);
  }

  return null;
}

// Find existing call record or create one if it doesn't exist (for unanswered calls)
async function findOrCreateCallRecord(supabase: any, callData: any) {
  const requestId = callData._requestId;
  const { call_id } = callData;

  // First, try to find existing call record
  try {
    const { data: existingRecord, error } = await supabase
      .from('call_records')
      .select('*, tickets!call_records_ticket_id_fkey(id, description)')
      .eq('call_id', call_id)
      .single();

    if (existingRecord && !error) {
      return { data: existingRecord, created: false };
    }

    if (error && error.code !== 'PGRST116') {
      console.error(`❌ [${requestId}] Error looking up call record:`, error);
      throw error;
    }
  } catch (error: any) {
    if (error?.code !== 'PGRST116') {
      throw error;
    }
  }

  // If no record found, create one (this handles unanswered calls where call_started wasn't sent)
  console.log(`🔄 [${requestId}] Creating fallback call record for ${call_id}`);

  const {
    to_number,
    start_timestamp,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
    agent_id,
    retell_llm_id,
  } = callData;

  // For outbound calls, to_number is the called customer
  const rawCustomerPhone = to_number;
  const customerPhone = normalizePhoneNumber(rawCustomerPhone);

  if (!customerPhone) {
    console.error(`❌ [${requestId}] Invalid phone number format for fallback creation`);
    throw new Error('Invalid phone number format');
  }

  // Determine company and agent direction from agent ID
  const agentIdValue = agent_id || retell_llm_id || callData.llm_id || callData.agent_id;
  const { company_id: companyId, agent_direction } = await findCompanyAndDirectionByAgentId(agentIdValue);

  // Get agent details to find the phone number
  let agentPhoneNumber = null;
  if (companyId && agentIdValue) {
    const { data: agentData } = await supabase
      .from('agents')
      .select('phone_number')
      .eq('company_id', companyId)
      .eq('agent_id', agentIdValue)
      .single();

    agentPhoneNumber = agentData?.phone_number || null;
  }

  if (!companyId) {
    console.error(`❌ [${requestId}] No company found for agent during fallback creation`);
    throw new Error('Company not found for agent ID');
  }

  // Find or create customer from called phone number
  const existingCustomer = await findCustomerByPhone(customerPhone, companyId);
  let customerId;
  let customerAddress = null;

  if (!existingCustomer) {
    // Create new customer with name based on agent direction
    const defaultFirstName = agent_direction === 'outbound' ? 'Outbound' : 'Inbound';
    const defaultLastName = agent_direction === 'outbound' ? 'Call' : 'Caller';

    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        phone: customerPhone,
        company_id: companyId,
        first_name: defaultFirstName,
        last_name: defaultLastName,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (customerError) {
      console.error(`❌ [${requestId}] Customer creation failed during fallback:`, customerError.message);

      // If it's a unique constraint violation, try to find the existing customer
      if (customerError.code === '23505' && customerError.message.includes('customers_phone_company_unique')) {
        const retryCustomer = await findCustomerByPhone(customerPhone, companyId);
        if (retryCustomer) {
          customerId = retryCustomer.id;
        } else {
          throw new Error('Customer constraint violation and retry failed');
        }
      } else {
        throw new Error('Failed to create customer during fallback');
      }
    } else {
      customerId = newCustomer.id;
    }
  } else {
    customerId = existingCustomer.id;
    if (existingCustomer.address) {
      customerAddress = existingCustomer.address;
    } else {
      const addressComponents = [
        existingCustomer.city,
        existingCustomer.state,
        existingCustomer.zip_code
      ].filter(Boolean);
      if (addressComponents.length > 0) {
        customerAddress = addressComponents.join(', ');
      }
    }
  }

  // Create ticket for outbound calls with DEFAULT status of CLOSED
  const { data: newTicket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      company_id: companyId,
      customer_id: customerId,
      source: 'cold_call',
      type: 'phone_call',
      call_direction: 'outbound', // Set direction for filtering
      status: 'closed', // DEFAULT STATUS FOR OUTBOUND
      priority: 'medium',
      description: `📞 Outbound call started at ${new Date().toISOString()} (fallback creation)`,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (ticketError) {
    console.error(`❌ [${requestId}] Ticket creation failed during fallback:`, ticketError.message);
    throw new Error('Failed to create ticket during fallback');
  }

  // Extract data (will be mostly empty until call_analyzed event)
  const extractedData = extractCallData(undefined, undefined, retell_llm_dynamic_variables);

  // Create call record
  const { data: callRecord, error: insertError } = await supabase
    .from('call_records')
    .insert({
      call_id,
      ticket_id: newTicket.id, // Link to ticket instead of lead
      customer_id: customerId,
      phone_number: customerPhone, // TO number (customer being called)
      from_number: agentPhoneNumber, // FROM number (agent's phone number)
      call_status: 'not_connected', // Default for unanswered calls
      call_direction: 'outbound',
      agent_id: agentIdValue, // Store the agent_id for call direction tracking
      start_timestamp: start_timestamp ? new Date(start_timestamp).toISOString() : new Date().toISOString(),
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      // Add dynamic variable data immediately
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      pest_issue: extractedData.pest_issue,
      street_address: customerAddress || extractedData.street_address, // Use customer address if available
      preferred_service_time: extractedData.preferred_service_time,
      created_at: new Date().toISOString(),
    })
    .select('*, tickets!call_records_ticket_id_fkey(id, description)')
    .single();

  if (insertError) {
    console.error(`❌ [${requestId}] Call record creation failed during fallback:`, insertError.message);
    throw new Error('Failed to create call record during fallback');
  }

  return { data: callRecord, created: true };
}

// Handle outbound call_started event - create new ticket immediately with status CLOSED
async function handleOutboundCallStarted(supabase: any, callData: any) {
  const requestId = callData._requestId;

  const {
    call_id,
    to_number,
    start_timestamp,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
    agent_id,
    retell_llm_id,
  } = callData;

  // For outbound calls, to_number is the called customer
  const rawCustomerPhone = to_number;
  const customerPhone = normalizePhoneNumber(rawCustomerPhone);

  if (!customerPhone) {
    console.error(`❌ [${requestId}] Invalid phone number format`);
    return NextResponse.json(
      { error: 'Invalid phone number format' },
      { status: 400 }
    );
  }

  // Determine company and agent direction from agent ID
  const agentIdValue =
    agent_id || retell_llm_id || callData.llm_id || callData.agent_id;
  const { company_id: companyId, agent_direction } = await findCompanyAndDirectionByAgentId(agentIdValue);

  // Get agent details to find the phone number
  let agentPhoneNumber = null;
  if (companyId && agentIdValue) {
    const { data: agentData } = await supabase
      .from('agents')
      .select('phone_number')
      .eq('company_id', companyId)
      .eq('agent_id', agentIdValue)
      .single();

    agentPhoneNumber = agentData?.phone_number || null;
  }

  if (!companyId) {
    console.error(`❌ [${requestId}] No company found for agent`);
    return NextResponse.json(
      { error: 'Company not found for agent ID' },
      { status: 404 }
    );
  }

  // Find or create customer from called phone number
  const existingCustomer = await findCustomerByPhone(customerPhone, companyId);
  let customerId;
  let customerAddress = null;

  if (!existingCustomer) {
    // Create new customer with name based on agent direction
    const defaultFirstName = agent_direction === 'outbound' ? 'Outbound' : 'Inbound';
    const defaultLastName = agent_direction === 'outbound' ? 'Call' : 'Caller';

    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        phone: customerPhone,
        company_id: companyId,
        first_name: defaultFirstName,
        last_name: defaultLastName,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (customerError) {
      console.error(
        `❌ [${requestId}] Customer creation failed:`,
        customerError.message
      );

      // If it's a unique constraint violation, try to find the existing customer
      if (
        customerError.code === '23505' &&
        customerError.message.includes('customers_phone_company_unique')
      ) {
        const retryCustomer = await findCustomerByPhone(
          customerPhone,
          companyId
        );
        if (retryCustomer) {
          customerId = retryCustomer.id;
        } else {
          return NextResponse.json(
            { error: 'Customer constraint violation and retry failed' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }
    } else {
      customerId = newCustomer.id;
    }
  } else {
    customerId = existingCustomer.id;
    if (existingCustomer.address) {
      customerAddress = existingCustomer.address;
    } else {
      const addressComponents = [
        existingCustomer.city,
        existingCustomer.state,
        existingCustomer.zip_code
      ].filter(Boolean);
      if (addressComponents.length > 0) {
        customerAddress = addressComponents.join(', ');
      }
    }
  }

  // Create ticket for outbound calls with DEFAULT status of CLOSED
  const { data: newTicket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      company_id: companyId,
      customer_id: customerId,
      source: 'cold_call',
      type: 'phone_call',
      call_direction: 'outbound', // Set direction for filtering
      status: 'closed', // DEFAULT STATUS FOR OUTBOUND
      priority: 'medium',
      description: `📞 Outbound call started at ${new Date().toISOString()}`,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (ticketError) {
    console.error(`❌ [${requestId}] Ticket creation failed:`, ticketError.message);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }

  // Extract data (will be mostly empty until call_analyzed event)
  const extractedData = extractCallData(undefined, undefined, retell_llm_dynamic_variables);

  // Create call record
  const { data: callRecord, error: insertError } = await supabase
    .from('call_records')
    .insert({
      call_id,
      ticket_id: newTicket.id, // Link to ticket instead of lead
      customer_id: customerId,
      phone_number: customerPhone, // TO number (customer being called)
      from_number: agentPhoneNumber, // FROM number (agent's phone number)
      call_status: 'in-progress',
      call_direction: 'outbound',
      agent_id: agentIdValue, // Store the agent_id for call direction tracking
      start_timestamp: start_timestamp
        ? new Date(start_timestamp).toISOString()
        : new Date().toISOString(),
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      // Add dynamic variable data immediately
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      pest_issue: extractedData.pest_issue,
      street_address: customerAddress || extractedData.street_address, // Use customer address if available
      preferred_service_time: extractedData.preferred_service_time,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error(
      `❌ [${requestId}] Call record creation failed:`,
      insertError.message
    );
    return NextResponse.json(
      { error: 'Failed to create call record' },
      { status: 500 }
    );
  }


  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    ticket_id: newTicket.id,
    action: 'outbound_ticket_created',
  });
}

// Handle outbound call_ended event
async function handleOutboundCallEnded(supabase: any, callData: any) {
  const requestId = callData._requestId;
  const {
    call_id,
    call_status,
    end_timestamp,
    duration_ms,
    disconnection_reason,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
  } = callData;

  // Extract updated data from dynamic variables
  const extractedData = extractCallData(undefined, undefined, retell_llm_dynamic_variables);

  // Find or create call record (handles unanswered calls where call_started wasn't sent)
  let callRecord;
  try {
    const result = await findOrCreateCallRecord(supabase, callData);
    callRecord = result.data;

  } catch (error) {
    console.error(`❌ [${requestId}] Failed to find or create call record:`, error);
    return NextResponse.json(
      { error: 'Failed to find or create call record' },
      { status: 500 }
    );
  }

  // Update call record with call_ended data
  const { data: updatedCallRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status: call_status || 'completed',
      end_timestamp: end_timestamp
        ? new Date(end_timestamp).toISOString()
        : new Date().toISOString(),
      duration_seconds: duration_ms ? Math.round(duration_ms / 1000) : null,
      billable_duration_seconds: calculateBillableDuration(
        duration_ms ? Math.round(duration_ms / 1000) : null
      ),
      disconnect_reason: disconnection_reason,
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      // Update dynamic variable data
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      pest_issue: extractedData.pest_issue,
      street_address: extractedData.street_address,
      preferred_service_time: extractedData.preferred_service_time,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', call_id)
    .select('*, tickets!call_records_ticket_id_fkey(id, description)')
    .single();

  if (updateError) {
    console.error(
      `❌ [${requestId}] Error updating call record for call ${call_id}:`,
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Use updated record for subsequent operations
  callRecord = updatedCallRecord;

  // Update ticket with call summary and dynamic variables
  if (callRecord?.tickets) {
    const callOutcome =
      call_status === 'completed' ? 'completed' : call_status || 'ended';
    const callDate = end_timestamp ? new Date(end_timestamp) : new Date();
    const callSummary = `📞 Outbound call on ${callDate.toISOString()} - Status: ${callOutcome}${disconnection_reason ? ` (${disconnection_reason})` : ''}`;

    await supabase
      .from('tickets')
      .update({
        description: `${callRecord.tickets.description || ''}\n\n${callSummary}`.trim(),
        service_type: extractedData.pest_issue,
        pest_type: extractedData.pest_issue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', callRecord.tickets.id);
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: 'outbound_call_ended',
  });
}

// Handle outbound call_analyzed event - check action_required and change status accordingly
async function handleOutboundCallAnalyzed(supabase: any, callData: any) {
  const requestId = callData._requestId;
  const {
    call_id,
    recording_url,
    transcript,
    call_analysis,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
  } = callData;

  // Extract data from call analysis, transcript, and dynamic variables
  const extractedData = extractCallData(call_analysis, transcript, retell_llm_dynamic_variables);

  // Find or create call record (handles unanswered calls where call_started wasn't sent)
  let callRecord;
  try {
    const result = await findOrCreateCallRecord(supabase, callData);
    callRecord = result.data;

  } catch (error) {
    console.error(`❌ [${requestId}] Failed to find or create call record:`, error);
    return NextResponse.json(
      { error: 'Failed to find or create call record' },
      { status: 500 }
    );
  }

  // Update call record with analysis data
  const { data: updatedCallRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      recording_url,
      transcript,
      call_analysis,
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      sentiment: extractedData.sentiment,
      // Update dynamic variable data (final values)
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      pest_issue: extractedData.pest_issue,
      street_address: extractedData.street_address,
      preferred_service_time: extractedData.preferred_service_time,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', call_id)
    .select('*, tickets!call_records_ticket_id_fkey(id, description)')
    .single();

  if (updateError) {
    console.error(
      `❌ [${requestId}] Error updating call record for call ${call_id}:`,
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Use updated record for subsequent operations
  callRecord = updatedCallRecord;

  // Update ticket with analysis info and handle action_required logic
  if (callRecord.tickets) {
    const updateData: any = {
      description: callRecord.tickets.description || '',
      updated_at: new Date().toISOString(),
    };

    // Add analysis summary if available
    if (extractedData.summary) {
      updateData.description =
        `${updateData.description}\n\n📊 Outbound Call Analysis: ${extractedData.summary}`.trim();
    }

    // Set service_type based on AI qualification
    const isQualified = call_analysis?.custom_analysis_data?.is_qualified;
    if (isQualified === 'true' || isQualified === true) {
      updateData.service_type = 'Sales';
      updateData.description =
        `${updateData.description}\n\n✅ AI Qualification: QUALIFIED - Category set to Sales`.trim();
    } else if (isQualified === 'false' || isQualified === false) {
      updateData.service_type = 'Customer Service';
      updateData.description =
        `${updateData.description}\n\n❌ AI Qualification: UNQUALIFIED - Category set to Customer Service`.trim();
    }

    // OUTBOUND-SPECIFIC LOGIC: Check action_required and disconnect reason
    const actionRequired = call_analysis?.custom_analysis_data?.action_required;
    const disconnectReason = callData.disconnection_reason || callRecord.disconnect_reason;

    // Check if call was transferred - if so, always create active ticket
    const wasTransferred = disconnectReason === 'call_transfer';

    if (actionRequired === 'true' || actionRequired === true || wasTransferred) {
      if (wasTransferred) {
        updateData.status = 'new'; // Change from closed to new
        updateData.archived = false; // Unarchive for follow-up
        updateData.description =
          `${updateData.description}\n\n📞 Call Transferred: Ticket reopened for follow-up (${disconnectReason})`.trim();
      } else {
        updateData.status = 'new'; // Change from closed to new
        updateData.archived = false; // Unarchive for follow-up
        updateData.description =
          `${updateData.description}\n\n🔄 Action Required: TRUE - Ticket reopened for follow-up`.trim();
      }
    } else if (actionRequired === 'false' || actionRequired === false) {
      updateData.status = 'closed'; // Keep closed
      updateData.archived = true; // Archive by default
      updateData.description =
        `${updateData.description}\n\n🔒 Action Required: FALSE - Ticket closed and archived`.trim();
    } else {
      updateData.status = 'closed'; // Default closed for outbound
      updateData.archived = true; // Archive by default
      updateData.description =
        `${updateData.description}\n\n📞 Outbound Call: No action required - Ticket closed and archived`.trim();
    }

    // Add pest_type from extracted data
    updateData.pest_type = extractedData.pest_issue;

    await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', callRecord.tickets.id);
  }

  // Update customer data conditionally - only update if customer doesn't have existing data
  if (callRecord && call_analysis?.custom_analysis_data) {
    // Get existing customer data first
    const { data: existingCustomer, error: customerFetchError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, address, city, state, zip_code')
      .eq('id', callRecord.customer_id)
      .single();

    if (customerFetchError) {
      console.error(
        'Failed to fetch customer data:',
        customerFetchError.message
      );
    } else if (existingCustomer) {
      // Get customer data from call analysis (Post-Call Analysis)
      const customerFirstName =
        call_analysis.custom_analysis_data.customer_first_name;
      const customerLastName =
        call_analysis.custom_analysis_data.customer_last_name;
      const customerStreetAddress =
        call_analysis.custom_analysis_data.customer_street_address;
      const customerCity = call_analysis.custom_analysis_data.customer_city;
      const customerState = call_analysis.custom_analysis_data.customer_state;
      const customerZip = call_analysis.custom_analysis_data.customer_zip;

      // Helper: Check if a value needs updating (is null, empty, or "none")
      const needsUpdate = (value: string | null | undefined): boolean => {
        return !value || value.trim() === '' || value.toLowerCase() === 'none';
      };

      // Helper: Check if incoming value is valid (not null, empty, or "none")
      const isValidValue = (value: string | null | undefined): boolean => {
        return !!(value && value.trim() !== '' && value.toLowerCase() !== 'none');
      };

      // Build update object conditionally
      const customerUpdateData: any = {};

      // Name updates: ONLY update if customer still has default placeholder names
      const hasInboundPlaceholder = existingCustomer.first_name === 'Inbound' && existingCustomer.last_name === 'Caller';
      const hasOutboundPlaceholder = existingCustomer.first_name === 'Outbound' && existingCustomer.last_name === 'Call';
      const shouldUpdateFirstName =
        hasInboundPlaceholder ||
        hasOutboundPlaceholder ||
        needsUpdate(existingCustomer.first_name);
      const shouldUpdateLastName =
        hasInboundPlaceholder ||
        hasOutboundPlaceholder ||
        needsUpdate(existingCustomer.last_name);

      if (shouldUpdateFirstName && isValidValue(customerFirstName)) {
        customerUpdateData.first_name = customerFirstName.trim();
      }
      if (shouldUpdateLastName && isValidValue(customerLastName)) {
        customerUpdateData.last_name = customerLastName.trim();
      }

      // Field-by-field address updates: Update each component independently if it needs updating
      if (needsUpdate(existingCustomer.city) && isValidValue(customerCity)) {
        customerUpdateData.city = customerCity.trim();
      }

      if (needsUpdate(existingCustomer.state) && isValidValue(customerState)) {
        customerUpdateData.state = customerState.trim();
      }

      if (needsUpdate(existingCustomer.zip_code) && isValidValue(customerZip)) {
        customerUpdateData.zip_code = customerZip.trim();
      }

      // Rebuild formatted address from final values (mix of updated and existing)
      const finalCity = customerUpdateData.city || existingCustomer.city;
      const finalState = customerUpdateData.state || existingCustomer.state;
      const finalZip = customerUpdateData.zip_code || existingCustomer.zip_code;

      // Only build address if we have valid components or street address
      if (isValidValue(finalCity) || isValidValue(finalState) || isValidValue(finalZip) || isValidValue(customerStreetAddress)) {
        customerUpdateData.address = formatAddress(
          customerStreetAddress,
          finalCity,
          finalState,
          finalZip
        );
      }

      // Only update if we have changes to make
      if (Object.keys(customerUpdateData).length > 0) {
        customerUpdateData.updated_at = new Date().toISOString();

        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update(customerUpdateData)
          .eq('id', callRecord.customer_id);

        if (customerUpdateError) {
          console.error('Customer update failed:', customerUpdateError.message);
        }
      }
    }
  }

  // Send ticket notification emails if action_required is true OR call was transferred
  const actionRequired = call_analysis?.custom_analysis_data?.action_required;
  const disconnectReason = callData.disconnection_reason || callRecord.disconnect_reason;
  const wasTransferred = disconnectReason === 'call_transfer';

  try {
    if (actionRequired === 'true' || actionRequired === true || wasTransferred) {
      await sendTicketNotificationEmailsIfEnabled(supabase, callRecord, callData, extractedData);
    }
  } catch (error) {
    console.error(`[Ticket Notification Emails] Error sending emails for call ${callData.call_id}:`, error);
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: 'outbound_call_analyzed',
  });
}

// Format address components into a single formatted address string
function formatAddress(
  street: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
): string {
  const components = [];

  if (street && street.trim() !== '' && street.toLowerCase() !== 'none') {
    components.push(street.trim());
  }

  if (city && city.trim() !== '' && city.toLowerCase() !== 'none') {
    components.push(city.trim());
  }

  if (state && state.trim() !== '' && state.toLowerCase() !== 'none') {
    components.push(state.trim());
  }

  if (zip && zip.trim() !== '' && zip.toLowerCase() !== 'none') {
    components.push(zip.trim());
  }

  return components.join(', ');
}


// Extract structured data from call analysis, dynamic variables, and transcript
function extractCallData(callAnalysis: any, transcript: string | undefined, retellVariables?: any) {
  const extractedData = {
    sentiment: 'neutral',
    home_size: null as string | null,
    yard_size: null as string | null,
    pest_issue: null as string | null,
    street_address: null as string | null,
    preferred_service_time: null as string | null,
    // Add new fields from dynamic variables
    customer_city: null as string | null,
    customer_state: null as string | null,
    customer_zip: null as string | null,
    customer_first_name: null as string | null,
    customer_last_name: null as string | null,
    summary: '',
    action_required: null as string | null,
  };

  // Extract from call analysis (Post-Call Analysis) - primary data source
  if (callAnalysis?.custom_analysis_data) {
    extractedData.home_size =
      callAnalysis.custom_analysis_data.home_size || null;
    extractedData.yard_size =
      callAnalysis.custom_analysis_data.yard_size || null;
    extractedData.pest_issue =
      callAnalysis.custom_analysis_data.pest_issue || null;
    extractedData.street_address =
      callAnalysis.custom_analysis_data.customer_street_address || null;
    // Handle preferred_service_time - map invalid values to null
    const rawPreferredTime =
      callAnalysis.custom_analysis_data.preferred_service_time;
    if (
      rawPreferredTime &&
      ['AM', 'PM', 'anytime'].includes(rawPreferredTime)
    ) {
      extractedData.preferred_service_time = rawPreferredTime;
    } else {
      extractedData.preferred_service_time = null;
    }

    // Extract customer address and name fields
    extractedData.customer_city =
      callAnalysis.custom_analysis_data.customer_city || null;
    extractedData.customer_state =
      callAnalysis.custom_analysis_data.customer_state || null;
    extractedData.customer_zip =
      callAnalysis.custom_analysis_data.customer_zip || null;
    extractedData.customer_first_name =
      callAnalysis.custom_analysis_data.customer_first_name || null;
    extractedData.customer_last_name =
      callAnalysis.custom_analysis_data.customer_last_name || null;

    // Extract action_required field
    extractedData.action_required =
      callAnalysis.custom_analysis_data.action_required || null;
  }

  // Extract sentiment and summary from call analysis (highest priority)
  if (callAnalysis) {
    extractedData.sentiment =
      callAnalysis.user_sentiment?.toLowerCase() || 'neutral';
    extractedData.summary = callAnalysis.call_summary || '';
  }

  // Extract data from retell dynamic variables as fallback/supplement
  if (retellVariables && typeof retellVariables === 'object') {
    // Check for summary in various possible fields in dynamic variables
    if (!extractedData.summary) {
      extractedData.summary =
        retellVariables.call_summary ||
        retellVariables.summary ||
        retellVariables.conversation_summary ||
        '';
    }

    // Supplement missing data from dynamic variables if not already set
    if (!extractedData.home_size) {
      extractedData.home_size = retellVariables.home_size || null;
    }
    if (!extractedData.yard_size) {
      extractedData.yard_size = retellVariables.yard_size || null;
    }
    if (!extractedData.pest_issue) {
      extractedData.pest_issue = retellVariables.pest_issue || null;
    }
    if (!extractedData.street_address) {
      extractedData.street_address = retellVariables.customer_street_address || retellVariables.street_address || null;
    }
    if (!extractedData.preferred_service_time) {
      const dynamicPreferredTime = retellVariables.preferred_service_time;
      if (
        dynamicPreferredTime &&
        ['AM', 'PM', 'anytime'].includes(dynamicPreferredTime)
      ) {
        extractedData.preferred_service_time = dynamicPreferredTime;
      }
    }
    if (!extractedData.customer_city) {
      extractedData.customer_city = retellVariables.customer_city || null;
    }
    if (!extractedData.customer_state) {
      extractedData.customer_state = retellVariables.customer_state || null;
    }
    if (!extractedData.customer_zip) {
      extractedData.customer_zip = retellVariables.customer_zip || null;
    }
    if (!extractedData.customer_first_name) {
      extractedData.customer_first_name = retellVariables.customer_first_name || null;
    }
    if (!extractedData.customer_last_name) {
      extractedData.customer_last_name = retellVariables.customer_last_name || null;
    }
    if (!extractedData.action_required) {
      extractedData.action_required = retellVariables.action_required || null;
    }
  }

  // Parse transcript as final fallback
  if (transcript && typeof transcript === 'string') {
    if (!extractedData.pest_issue) {
      const pestMatches = transcript.match(
        /(ant|roach|cockroach|spider|termite|rodent|rat|mouse|wasp|bee|fly|mosquito|tick|flea|bed bug|pest|insect|bug).{0,50}/gi
      );
      if (pestMatches && pestMatches.length > 0) {
        extractedData.pest_issue = pestMatches.join(', ').substring(0, 255);
      }
    }
  }

  return extractedData;
}

// Helper function to send ticket notification emails if enabled for the company
async function sendTicketNotificationEmailsIfEnabled(
  supabase: any,
  callRecord: any,
  callData: any,
  extractedData: any
) {
  const callId = callData.call_id;

  try {
    // Only send emails for successful conversations where real interaction occurred
    const disconnectionReason = callData.disconnection_reason || callRecord.disconnect_reason;
    const callStatus = callData.call_status || callRecord.call_status;


    // Only send emails for successful conversations (user_hangup, agent_hangup, or call_transfer)
    // All other reasons indicate unsuccessful calls or technical issues
    if (disconnectionReason !== 'user_hangup' && disconnectionReason !== 'agent_hangup' && disconnectionReason !== 'call_transfer') {
      return;
    }

    // Determine company ID from the call record
    let companyId = null;

    // Try to get company ID from the ticket association
    if (callRecord.tickets?.id) {
      const { data: ticket } = await supabase
        .from('tickets')
        .select('company_id')
        .eq('id', callRecord.tickets.id)
        .single();

      if (ticket) {
        companyId = ticket.company_id;
      }
    }

    // If no company ID found from ticket, try to find via agent lookup
    if (!companyId) {
      const agentId = callData.agent_id || callData.retell_llm_id || callData.llm_id;
      if (agentId) {
        companyId = await findCompanyByAgentId(agentId);
      }
    }

    if (!companyId) {
      console.warn(`[Ticket Notification Emails] No company ID found for call ${callId}`);
      return;
    }

    // Check if call summary emails are enabled for this company
    const { data: emailSettings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .in('setting_key', ['call_summary_emails_enabled', 'call_summary_email_recipients']);

    const settingsMap = emailSettings?.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {}) || {};

    const emailsEnabled = settingsMap.call_summary_emails_enabled === 'true';
    const recipients = settingsMap.call_summary_email_recipients || '';

    if (!emailsEnabled || !recipients.trim()) {
      return;
    }

    // Get company name and customer data
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    let customerData = null;
    if (callRecord.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name, email')
        .eq('id', callRecord.customer_id)
        .single();

      customerData = customer;
    }


    // Build call summary data for email
    const callSummaryData: CallSummaryEmailData = {
      callId: callId,
      customerPhone: callRecord.phone_number || callRecord.from_number || 'Unknown',
      customerName: customerData ?
        `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || 'Unknown' :
        'Unknown',
      customerEmail: customerData?.email || '',
      companyName: company?.name || 'Unknown',
      callStatus: callData.call_status || callRecord.call_status || 'completed',
      callDuration: callRecord.duration_seconds || 0,
      callDate: callRecord.end_timestamp || callData.end_timestamp || new Date().toISOString(),
      fromNumber: callRecord.from_number || 'Unknown',
      disconnectReason: disconnectionReason || 'Unknown',
      sentiment: (callRecord.sentiment || extractedData.sentiment || 'neutral') as 'positive' | 'negative' | 'neutral',
      transcript: callRecord.transcript || '',
      callSummary: extractedData.summary || callData.call_analysis?.call_summary || 'No summary available',

      // Extract business data
      homeSize: extractedData.home_size || callRecord.home_size || '',
      yardSize: extractedData.yard_size || callRecord.yard_size || '',
      pestIssue: extractedData.pest_issue || callRecord.pest_issue || '',
      streetAddress: extractedData.street_address || callRecord.street_address || '',
      preferredServiceTime: extractedData.preferred_service_time || callRecord.preferred_service_time || '',

      // Optional fields for tickets
      leadId: callRecord.tickets?.id ? String(callRecord.tickets.id) : undefined,
      recordingUrl: callData.recording_url || callRecord.recording_url || undefined
    };

    // Parse recipient emails
    const emailList = recipients
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    if (emailList.length === 0) {
      console.warn(`[Ticket Notification Emails] No valid email recipients for call ${callId}`);
      return;
    }

    // Send the emails with call summary subject
    const emailConfig = {
      subjectLine: 'Outbound Call Summary: {customerPhone} - {callStatus} ({companyName})'
    };

    await sendCallSummaryNotifications(
      emailList,
      callSummaryData,
      emailConfig,
      companyId
    );


  } catch (error) {
    console.error(`[Ticket Notification Emails] Error processing call ${callId}:`, error);
  }
}
