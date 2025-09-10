import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';
import { normalizePhoneNumber } from '@/lib/utils';

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

// Find company by Retell inbound agent ID
async function findCompanyByInboundAgentId(agentId: string | undefined) {
  if (!agentId) {
    console.warn('No agent ID provided for company lookup');
    return null;
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('company_id')
      .eq('setting_key', 'retell_inbound_agent_id')
      .eq('setting_value', agentId)
      .single();

    if (error) {
      console.error('Company lookup failed:', error.message);
      return null;
    }

    if (data) {
      return data.company_id;
    }

    console.warn(`No company found for agent ID: ${agentId}`);
    return null;
  } catch (error) {
    console.error('Company lookup error:', error);
    return null;
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

  // Determine company from inbound agent ID
  const agentIdValue =
    agent_id || retell_llm_id || callData.llm_id || callData.agent_id;
  const companyId = await findCompanyByInboundAgentId(agentIdValue);

  if (!companyId) {
    console.error(`❌ [${requestId}] No company found for agent`);
    return NextResponse.json(
      { error: 'Company not found for inbound agent ID' },
      { status: 404 }
    );
  }

  // Find or create customer from caller's phone number
  const existingCustomer = await findCustomerByPhone(customerPhone, companyId);
  let customerId;
  let customerAddress = null;

  if (!existingCustomer) {
    // Create new customer for inbound caller
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        phone: customerPhone,
        company_id: companyId,
        first_name: 'Inbound', // Default name for inbound callers
        last_name: 'Caller', // Will be updated when we get actual name
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
    console.log('🏠 [DEBUG] Existing customer found:', {
      customer_id: customerId,
      address: existingCustomer.address,
      city: existingCustomer.city,
      state: existingCustomer.state,
      zip_code: existingCustomer.zip_code
    });
    
    // Use existing customer address if available
    if (existingCustomer.address) {
      customerAddress = existingCustomer.address;
      console.log('✅ [DEBUG] Using existing customer address:', customerAddress);
    } else {
      // Format address from customer address components if address field is empty
      const addressComponents = [
        existingCustomer.city,
        existingCustomer.state,
        existingCustomer.zip_code
      ].filter(Boolean);
      
      if (addressComponents.length > 0) {
        customerAddress = addressComponents.join(', ');
        console.log('🔧 [DEBUG] Built address from components:', customerAddress);
      } else {
        console.log('⚠️ [DEBUG] No address data available for existing customer');
      }
    }
  }

  // Create ticket for inbound calls
  const { data: newTicket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      company_id: companyId,
      customer_id: customerId,
      source: 'cold_call',
      type: 'phone_call',
      status: 'new',
      priority: 'medium',
      description: `📞 Inbound call started at ${new Date().toISOString()}`,
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
  const extractedData = extractCallData(undefined, undefined);

  console.log('📍 [DEBUG] Address assignment for call record:', {
    customerAddress: customerAddress,
    extractedData_street_address: extractedData.street_address,
    final_street_address: customerAddress || extractedData.street_address
  });

  // Create call record
  const { data: callRecord, error: insertError } = await supabase
    .from('call_records')
    .insert({
      call_id,
      ticket_id: newTicket.id, // Link to ticket instead of lead
      customer_id: customerId,
      phone_number: customerPhone, // Use normalized phone for consistency
      from_number: rawCustomerPhone, // Keep original format from Retell
      call_status: 'in-progress',
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
    action: 'inbound_ticket_created',
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
  const extractedData = extractCallData(undefined, undefined);

  // Update call record
  const { data: callRecord, error: updateError } = await supabase
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
        description: `${callRecord.tickets.description || ''}\n\n${callSummary}`.trim(),
        service_type: extractedData.pest_issue,
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

  // Extract data from call analysis and transcript
  const extractedData = extractCallData(call_analysis, transcript);

  // Update call record with analysis data
  const { data: callRecord, error: updateError } = await supabase
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
      'Retell Inbound Ticket Webhook: Error updating call record:',
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Update ticket with analysis and qualification info
  if (callRecord.tickets) {
    // Get is_qualified from call analysis (Post-Call Analysis)
    const isQualified = call_analysis?.custom_analysis_data?.is_qualified;
    
    // Debug logging for qualification
    console.log('🔍 [DEBUG] Call Analysis Data:', {
      call_analysis: call_analysis ? 'Present' : 'Missing',
      custom_analysis_data: call_analysis?.custom_analysis_data ? 'Present' : 'Missing',
      is_qualified_value: isQualified,
      is_qualified_type: typeof isQualified,
      ticket_id: callRecord.tickets.id
    });

    const updateData: any = {
      description: callRecord.tickets.description || '',
      updated_at: new Date().toISOString(),
    };

    // Add analysis summary if available
    if (extractedData.summary) {
      updateData.description =
        `${updateData.description}\n\n📊 Call Analysis: ${extractedData.summary}`.trim();
    }

    // Update ticket status and category based on AI qualification decision
    console.log('🎯 [DEBUG] Qualification Logic Check:', {
      isQualified_raw: isQualified,
      isQualified_string_true: isQualified === 'true',
      isQualified_boolean_true: isQualified === true,
      isQualified_string_false: isQualified === 'false',
      isQualified_boolean_false: isQualified === false
    });

    if (isQualified === 'true' || isQualified === true) {
      // AI determined this is qualified for sales - set category to sales
      console.log('✅ [DEBUG] Setting ticket as QUALIFIED SALES');
      updateData.type = 'phone_call'; // Keep as phone_call type
      updateData.service_type = 'Sales'; // Set category to Sales
      updateData.status = 'qualified';
      updateData.description =
        `${updateData.description}\n\n✅ AI Qualification: QUALIFIED - Category set to Sales`.trim();
    } else if (isQualified === 'false' || isQualified === false) {
      // AI determined this is not qualified for sales - set as customer service
      console.log('❌ [DEBUG] Setting ticket as UNQUALIFIED CUSTOMER SERVICE');
      updateData.service_type = 'Customer Service';
      updateData.status = 'resolved';
      updateData.description =
        `${updateData.description}\n\n❌ AI Qualification: UNQUALIFIED - Category set to Customer Service`.trim();
    } else {
      // No qualification decision provided - keep as contacted for follow-up
      console.log('🤷 [DEBUG] No qualification decision - setting as CONTACTED');
      updateData.status = 'contacted';
    }

    console.log('📝 [DEBUG] Final update data:', {
      service_type: updateData.service_type,
      status: updateData.status,
      type: updateData.type
    });

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

      // Build update object conditionally
      const customerUpdateData: any = {};

      // Name updates: ONLY update if customer still has default placeholder names
      if (
        existingCustomer.first_name === 'Inbound' &&
        existingCustomer.last_name === 'Caller'
      ) {
        if (customerFirstName && customerFirstName.trim() !== '') {
          customerUpdateData.first_name = customerFirstName.trim();
        }
        if (customerLastName && customerLastName.trim() !== '') {
          customerUpdateData.last_name = customerLastName.trim();
        }
      }

      // Address updates: ONLY if customer has NO existing address data
      if (!hasExistingAddress(existingCustomer)) {
        if (customerCity && customerCity.trim() !== '') {
          customerUpdateData.city = customerCity.trim();
        }

        if (customerState && customerState.trim() !== '') {
          customerUpdateData.state = customerState.trim();
        }

        if (customerZip && customerZip.trim() !== '') {
          customerUpdateData.zip_code = customerZip.trim();
        }

        // Create formatted address from components and store in address field
        if (
          customerStreetAddress ||
          customerCity ||
          customerState ||
          customerZip
        ) {
          customerUpdateData.address = formatAddress(
            customerStreetAddress,
            customerCity,
            customerState,
            customerZip
          );
        }
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

  if (street && street.trim() !== '') {
    components.push(street.trim());
  }

  if (city && city.trim() !== '') {
    components.push(city.trim());
  }

  if (state && state.trim() !== '') {
    components.push(state.trim());
  }

  if (zip && zip.trim() !== '') {
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

// Extract structured data from call analysis and transcript
function extractCallData(callAnalysis: any, transcript: string | undefined) {
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
  }

  // Extract sentiment and summary from call analysis
  if (callAnalysis) {
    extractedData.sentiment =
      callAnalysis.user_sentiment?.toLowerCase() || 'neutral';
    extractedData.summary = callAnalysis.call_summary || '';
  }

  // Parse transcript as fallback
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