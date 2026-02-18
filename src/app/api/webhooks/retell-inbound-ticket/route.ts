import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';
import { normalizePhoneNumber } from '@/lib/utils';
import {
  findCompanyByAgentId,
  findCompanyAndDirectionByAgentId,
} from '@/lib/agent-utils';
import { sendCallSummaryNotifications } from '@/lib/email/call-summary-notifications';
import { CallSummaryEmailData } from '@/lib/email/types';
import {
  createOrFindServiceAddress,
  getCustomerPrimaryServiceAddress,
  linkCustomerToServiceAddress,
} from '@/lib/service-addresses';

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

    // SIGNATURE VALIDATION - Company-Specific
    const signature = request.headers.get('x-retell-signature');

    if (!signature) {
      console.error(`❌ [${requestId}] Missing signature header`);
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    // Parse payload to identify company (needed before we can validate signature)
    const bodyText = await request.text();
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (error) {
      console.error(`❌ [${requestId}] Invalid JSON payload`);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Extract agent ID to identify company
    const callData = payload.call || payload;
    const agentIdValue = callData.agent_id || callData.retell_llm_id || callData.llm_id || payload.agent_id;

    if (!agentIdValue) {
      console.error(`❌ [${requestId}] No agent_id in payload`);
      return NextResponse.json(
        { error: 'agent_id required in payload' },
        { status: 400 }
      );
    }

    // Look up company from agent ID
    const { company_id: companyId } = await findCompanyAndDirectionByAgentId(agentIdValue);

    if (!companyId) {
      console.error(`❌ [${requestId}] Company not found for agent: ${agentIdValue}`);
      return NextResponse.json(
        { error: 'Company not found for agent ID' },
        { status: 404 }
      );
    }

    // Get company's Retell API key (which is also the webhook secret)
    const supabase = createAdminClient();
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'retell_api_key')
      .single();

    if (!apiKeySetting?.setting_value) {
      console.error(`❌ [${requestId}] Retell API key not configured for company: ${companyId}`);
      return NextResponse.json(
        { error: 'Retell API key not configured for company' },
        { status: 500 }
      );
    }

    // Verify signature using company-specific API key (which serves as webhook secret)
    const isValidSignature = Retell.verify(
      bodyText, // Use original body text, not re-stringified
      apiKeySetting.setting_value,
      signature
    );

    if (!isValidSignature) {
      console.error(`❌ [${requestId}] Invalid webhook signature for company: ${companyId}`);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    console.log(`✅ [${requestId}] Signature validated for company: ${companyId}`);

    // Get event type - Retell sends this as 'event' at top level
    const eventType = payload.event;

    // Extract call_id (callData already extracted during signature validation)
    const { call_id } = callData;

    if (!call_id) {
      console.error(`❌ [${requestId}] No call_id provided in payload`);
      return NextResponse.json(
        { error: 'call_id is required' },
        { status: 400 }
      );
    }

    // Add request ID to context for downstream functions
    callData._requestId = requestId;
    let result;

    switch (eventType) {
      case 'call_started':
        result = await handleInboundCallStarted(supabase, callData);
        break;

      case 'call_ended':
        result = await handleInboundCallEnded(supabase, callData);
        break;

      case 'call_analyzed':
        result = await handleInboundCallAnalyzed(supabase, callData);
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

// Handle inbound call_started event - create new ticket immediately
async function handleInboundCallStarted(supabase: any, callData: any) {
  const requestId = callData._requestId;

  const {
    call_id,
    from_number,
    start_timestamp,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
    agent_id,
    retell_llm_id,
  } = callData;

  // For inbound calls, from_number is the caller (potential customer)
  const rawCustomerPhone = from_number;
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

  const { company_id: companyId, agent_direction } =
    await findCompanyAndDirectionByAgentId(agentIdValue);

  if (!companyId) {
    console.error(`❌ [${requestId}] No company found for agent`);
    return NextResponse.json(
      { error: 'Company not found for agent ID' },
      { status: 404 }
    );
  }

  // Find or create customer from caller's phone number
  const existingCustomer = await findCustomerByPhone(customerPhone, companyId);
  let customerId;
  let customerAddress = null;

  if (!existingCustomer) {
    // Create new customer with name based on agent direction
    const defaultFirstName =
      agent_direction === 'outbound' ? 'Outbound' : 'Inbound';
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

    // Use existing customer address if available
    if (existingCustomer.address) {
      customerAddress = existingCustomer.address;
    } else {
      // Format address from customer address components if address field is empty
      const addressComponents = [
        existingCustomer.city,
        existingCustomer.state,
        existingCustomer.zip_code,
      ].filter(Boolean);

      if (addressComponents.length > 0) {
        customerAddress = addressComponents.join(', ');
      }
    }
  }

  // Extract data (will be mostly empty until call_analyzed event)
  const extractedData = extractCallData(
    undefined,
    undefined,
    retell_llm_dynamic_variables
  );

  const { data: callRecord, error: insertError } = await supabase
    .from('call_records')
    .insert({
      call_id,
      company_id: companyId, // Store company_id for use in call_analyzed
      customer_id: customerId,
      phone_number: customerPhone, // Use normalized phone for consistency
      from_number: rawCustomerPhone, // Keep original format from Retell
      call_status: 'in-progress',
      call_direction: 'inbound',
      start_timestamp: start_timestamp
        ? new Date(start_timestamp).toISOString()
        : new Date().toISOString(),
      agent_id: agentIdValue, // Track which agent handled the call
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
    action: 'inbound_call_started',
  });
}

// Handle inbound call_ended event
async function handleInboundCallEnded(supabase: any, callData: any) {
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
  const extractedData = extractCallData(
    undefined,
    undefined,
    retell_llm_dynamic_variables
  );

  // Update call record
  const { data: callRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status: 'processing', // Set to processing to show loading state until analysis
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
    .select('*, tickets!call_records_ticket_id_fkey(id, description, service_address_id)')
    .single();

  if (updateError) {
    console.error(
      'Retell Inbound Ticket Webhook: Error updating call record:',
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Update ticket with call summary and dynamic variables
  if (callRecord?.tickets) {
    const callOutcome =
      call_status === 'completed' ? 'completed' : call_status || 'ended';
    const callDate = end_timestamp ? new Date(end_timestamp) : new Date();
    const callSummary = `📞 Inbound call on ${callDate.toISOString()} - Status: ${callOutcome}${disconnection_reason ? ` (${disconnection_reason})` : ''}`;

    await supabase
      .from('tickets')
      .update({
        description:
          `${callRecord.tickets.description || ''}\n\n${callSummary}`.trim(),
        service_type: extractedData.pest_issue,
        pest_type: extractedData.pest_issue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', callRecord.tickets.id);
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: 'inbound_call_ended',
  });
}

// Handle inbound call_analyzed event - use AI qualification
async function handleInboundCallAnalyzed(supabase: any, callData: any) {
  const {
    call_id,
    recording_url,
    transcript,
    call_analysis,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
  } = callData;

  // Extract data from call analysis, transcript, and dynamic variables
  const extractedData = extractCallData(
    call_analysis,
    transcript,
    retell_llm_dynamic_variables
  );

  // Check if we need to send to external webhook for specific agents
  const agentId =
    callData.agent_id || callData.retell_llm_id || callData.llm_id;
  const targetAgents = [
    'agent_df8001afec216b4940ef4a515c',
    'agent_a88d99054de578962c43714b13',
  ];

  if (agentId && targetAgents.includes(agentId)) {
    try {
      console.log(
        `[External Webhook] Sending payload for agent ${agentId} to Tadabase`
      );
      const response = await fetch(
        'https://catchtemp.tadabase.io/webhook/RBe3G7c8eL',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(callData),
        }
      );

      if (response.ok) {
        console.log(
          `[External Webhook] Successfully sent payload for call ${call_id}`
        );
      } else {
        console.warn(
          `[External Webhook] Failed to send payload for call ${call_id}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(
        `[External Webhook] Error sending payload for call ${call_id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Update call record with analysis data
  const { data: callRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status: 'completed', // Set to completed now that analysis is done
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
    .select('*, tickets!call_records_ticket_id_fkey(id, description, service_address_id)')
    .single();

  if (updateError) {
    console.error(
      'Retell Inbound Ticket Webhook: Error updating call record:',
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Only create a ticket if action is required
  let ticketId: string | null = null;

  if (extractedData.action_required === 'true') {
    // Build description from analysis
    let description = `📞 Inbound call - Action Required`;
    if (extractedData.summary) {
      description += `\n\n📊 Call Analysis: ${extractedData.summary}`;
    }

    // Determine service_type and add qualification context
    const isQualified = call_analysis?.custom_analysis_data?.is_qualified;
    let serviceType = 'Customer Service';
    if (isQualified === 'true' || isQualified === true) {
      serviceType = 'Sales';
      description += `\n\n✅ AI Qualification: QUALIFIED - Category set to Sales`;
    } else if (isQualified === 'false' || isQualified === false) {
      description += `\n\n❌ AI Qualification: UNQUALIFIED - Category set to Customer Service`;
    }
    description += `\n\n🔄 Action Required: TRUE - Follow-up needed`;

    const { data: newTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        company_id: callRecord.company_id,
        customer_id: callRecord.customer_id,
        source: 'cold_call',
        type: 'phone_call',
        call_direction: 'inbound',
        call_record_id: callRecord.id,
        status: 'new',
        priority: 'medium',
        service_type: serviceType,
        pest_type: extractedData.pest_issue,
        description: description.trim(),
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (!ticketError && newTicket) {
      ticketId = newTicket.id;
      // Link call_record back to the new ticket
      await supabase
        .from('call_records')
        .update({ ticket_id: ticketId })
        .eq('id', callRecord.id);
    } else {
      console.error(`❌ Failed to create inbound ticket:`, ticketError?.message);
    }
  }

  // Update customer data conditionally - only update if customer doesn't have existing data
  if (callRecord && call_analysis?.custom_analysis_data) {
    // Get existing customer data first
    const { data: existingCustomer, error: customerFetchError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, address, city, state, zip_code, company_id')
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

      // Build update object conditionally
      const customerUpdateData: any = {};

      // Helper: Check if a value needs updating (is null, empty, or "none")
      const needsUpdate = (value: string | null | undefined): boolean => {
        return !value || value.trim() === '' || value.toLowerCase() === 'none';
      };

      // Helper: Check if incoming value is valid (not null, empty, or "none")
      const isValidValue = (value: string | null | undefined): boolean => {
        return !!(
          value &&
          value.trim() !== '' &&
          value.toLowerCase() !== 'none'
        );
      };

      // Name updates: ONLY update if customer still has default placeholder names
      const hasInboundPlaceholder =
        existingCustomer.first_name === 'Inbound' &&
        existingCustomer.last_name === 'Caller';
      const hasOutboundPlaceholder =
        existingCustomer.first_name === 'Outbound' &&
        existingCustomer.last_name === 'Call';
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

      // Address updates: Update each field independently if it's null or "none"
      if (needsUpdate(existingCustomer.city) && isValidValue(customerCity)) {
        customerUpdateData.city = customerCity.trim();
      }

      if (needsUpdate(existingCustomer.state) && isValidValue(customerState)) {
        customerUpdateData.state = customerState.trim();
      }

      if (needsUpdate(existingCustomer.zip_code) && isValidValue(customerZip)) {
        customerUpdateData.zip_code = customerZip.trim();
      }

      // Store only street address in legacy address field (not concatenated with city/state/zip)
      // City, state, and zip are stored in separate fields to prevent duplication
      if (
        needsUpdate(existingCustomer.address) &&
        isValidValue(customerStreetAddress)
      ) {
        customerUpdateData.address = customerStreetAddress.trim();
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

      const primaryServiceAddress = await getCustomerPrimaryServiceAddress(
        existingCustomer.id
      );
      if (!primaryServiceAddress.serviceAddress && existingCustomer.company_id) {
        let serviceAddressId: string | null = null;

        if (!serviceAddressId) {
          const streetAddress = isValidValue(customerStreetAddress)
            ? customerStreetAddress.trim()
            : existingCustomer.address?.trim() || '';
          const city = isValidValue(customerCity)
            ? customerCity.trim()
            : existingCustomer.city?.trim() || '';
          const state = isValidValue(customerState)
            ? customerState.trim()
            : existingCustomer.state?.trim() || '';
          const zip = isValidValue(customerZip)
            ? customerZip.trim()
            : existingCustomer.zip_code?.trim() || '';
          const hasAddressData = [streetAddress, city, state, zip].some(
            value => value !== ''
          );

          if (hasAddressData) {
            const serviceAddressResult = await createOrFindServiceAddress(
              existingCustomer.company_id,
              {
                street_address: streetAddress || undefined,
                city: city || undefined,
                state: state || undefined,
                zip_code: zip || undefined,
              }
            );

            if (
              serviceAddressResult.success &&
              serviceAddressResult.serviceAddressId
            ) {
              serviceAddressId = serviceAddressResult.serviceAddressId;
            }
          }
        }

        if (serviceAddressId) {
          const linkResult = await linkCustomerToServiceAddress(
            existingCustomer.id,
            serviceAddressId,
            'owner',
            true
          );

          if (!linkResult.success && linkResult.error) {
            console.warn(
              'Failed to link service address to customer:',
              linkResult.error
            );
          }

          if (ticketId) {
            await supabase
              .from('tickets')
              .update({ service_address_id: serviceAddressId })
              .eq('id', ticketId)
              .is('service_address_id', null);
          }
        }
      }
    }
  }

  // Send ticket notification emails if enabled and action_required is true
  try {
    if (extractedData.action_required === 'true') {
      await sendTicketNotificationEmailsIfEnabled(
        supabase,
        callRecord,
        callData,
        extractedData,
        ticketId
      );
      console.log(
        `[Ticket Notification Emails] Sending email for call ${callData.call_id} - action_required: true`
      );
    } else {
      console.log(
        `[Ticket Notification Emails] Skipping email for call ${callData.call_id} - action_required: ${extractedData.action_required}`
      );
    }
  } catch (error) {
    console.error(
      `[Ticket Notification Emails] Error sending emails for call ${callData.call_id}:`,
      error
    );
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: 'inbound_call_analyzed',
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

// Check if customer has any existing address data
function hasExistingAddress(customer: any): boolean {
  return !!(
    (customer.address && customer.address.trim() !== '') ||
    (customer.city && customer.city.trim() !== '') ||
    (customer.state && customer.state.trim() !== '') ||
    (customer.zip_code && customer.zip_code.trim() !== '')
  );
}

// Extract structured data from call analysis, dynamic variables, and transcript
function extractCallData(
  callAnalysis: any,
  transcript: string | undefined,
  retellVariables?: any
) {
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

    // Extract action_required field (normalize to string to handle boolean true from Retell)
    const rawActionRequired = callAnalysis.custom_analysis_data.action_required;
    extractedData.action_required =
      rawActionRequired != null ? String(rawActionRequired) : null;
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
      extractedData.street_address =
        retellVariables.customer_street_address ||
        retellVariables.street_address ||
        null;
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
      extractedData.customer_first_name =
        retellVariables.customer_first_name || null;
    }
    if (!extractedData.customer_last_name) {
      extractedData.customer_last_name =
        retellVariables.customer_last_name || null;
    }
    if (!extractedData.action_required) {
      const rawRetellActionRequired = retellVariables.action_required;
      extractedData.action_required =
        rawRetellActionRequired != null ? String(rawRetellActionRequired) : null;
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
  extractedData: any,
  ticketId: string | null = null
) {
  const callId = callData.call_id;

  try {
    // Only send emails for successful conversations where real interaction occurred
    const disconnectionReason =
      callData.disconnection_reason || callRecord.disconnect_reason;
    const callStatus = callData.call_status || callRecord.call_status;

    // Only send emails for successful conversations (user_hangup or agent_hangup)
    // All other reasons indicate unsuccessful calls, transfers, or technical issues
    if (
      disconnectionReason !== 'user_hangup' &&
      disconnectionReason !== 'agent_hangup'
    ) {
      console.log(
        `[Ticket Notification Emails] Skipping email notifications for call ${callId} - not a successful conversation (reason: ${disconnectionReason})`
      );
      console.log(
        `[Ticket Notification Emails] Only user_hangup and agent_hangup trigger emails`
      );
      return;
    }

    console.log(
      `[Ticket Notification Emails] Proceeding with email notifications for call ${callId} - successful conversation (reason: ${disconnectionReason})`
    );

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
      const agentId =
        callData.agent_id || callData.retell_llm_id || callData.llm_id;
      if (agentId) {
        companyId = await findCompanyByAgentId(agentId);
      }
    }

    if (!companyId) {
      console.warn(
        `[Ticket Notification Emails] No company ID found for call ${callId}`
      );
      return;
    }

    // Check if call summary emails are enabled for this company
    const { data: emailSettings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .in('setting_key', [
        'call_summary_emails_enabled',
        'call_summary_email_recipients',
      ]);

    const settingsMap =
      emailSettings?.reduce((acc: any, setting: any) => {
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
      customerPhone:
        callRecord.phone_number || callRecord.from_number || 'Unknown',
      customerName: customerData
        ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() ||
          'Unknown'
        : 'Unknown',
      customerEmail: customerData?.email || '',
      companyName: company?.name || 'Unknown',
      callStatus: callData.call_status || callRecord.call_status || 'completed',
      callDuration: callRecord.duration_seconds || 0,
      callDate:
        callRecord.end_timestamp ||
        callData.end_timestamp ||
        new Date().toISOString(),
      fromNumber: callRecord.from_number || 'Unknown',
      disconnectReason: disconnectionReason || 'Unknown',
      sentiment: (callRecord.sentiment ||
        extractedData.sentiment ||
        'neutral') as 'positive' | 'negative' | 'neutral',
      transcript: callRecord.transcript || '',
      callSummary:
        extractedData.summary ||
        callData.call_analysis?.call_summary ||
        'No summary available',

      // Extract business data
      homeSize: extractedData.home_size || callRecord.home_size || '',
      yardSize: extractedData.yard_size || callRecord.yard_size || '',
      pestIssue: extractedData.pest_issue || callRecord.pest_issue || '',
      streetAddress:
        extractedData.street_address || callRecord.street_address || '',
      preferredServiceTime:
        extractedData.preferred_service_time ||
        callRecord.preferred_service_time ||
        '',

      // Optional fields for tickets
      leadId: ticketId ? String(ticketId) : undefined,
      recordingUrl:
        callData.recording_url || callRecord.recording_url || undefined,
    };

    // Parse recipient emails
    const emailList = recipients
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    if (emailList.length === 0) {
      console.warn(
        `[Ticket Notification Emails] No valid email recipients for call ${callId}`
      );
      return;
    }

    // Send the emails with call summary subject
    const emailConfig = {
      subjectLine:
        'Call Summary: {customerPhone} - {callStatus} ({companyName})',
    };

    await sendCallSummaryNotifications(
      emailList,
      callSummaryData,
      emailConfig,
      companyId
    );

    console.log(
      `[Ticket Notification Emails] Successfully sent notifications for call ${callId} to ${emailList.length} recipients`
    );
  } catch (error) {
    console.error(
      `[Ticket Notification Emails] Error processing call ${callId}:`,
      error
    );
  }
}
