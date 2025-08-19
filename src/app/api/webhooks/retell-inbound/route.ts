import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';
import { normalizePhoneNumber } from '@/lib/utils';
import { sendCallSummaryNotifications } from '@/lib/email/call-summary-notifications';
import { CallSummaryEmailData } from '@/lib/email/types';

// Helper function to calculate billable duration (rounded up to nearest 30 seconds)
function calculateBillableDuration(durationSeconds: number | null): number | null {
  if (!durationSeconds || durationSeconds <= 0) return 30; // Minimum billable time
  return Math.ceil(durationSeconds / 30) * 30;
}

// Simple rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
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
    console.log(`📞 [${requestId}] Retell inbound webhook received`);
    
    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
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
    
    console.log(`📞 [${requestId}] Processing ${eventType} for call ${call_id}`);

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
          eventType
        });
        break;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Completed ${eventType} in ${duration}ms`);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${requestId}] Webhook error after ${duration}ms:`, error instanceof Error ? error.message : error);
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

// Find customer by phone number and return full customer object
async function findCustomerByPhone(phoneNumber: string | undefined) {
  if (!phoneNumber) {
    return null;
  }

  const supabase = createAdminClient();
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, first_name, last_name, address, city, state, zip_code')
      .eq('phone', phoneNumber)
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

// Format address components into a single formatted address string
function formatAddress(street: string | null, city: string | null, state: string | null, zip: string | null): string {
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

// Handle inbound call_started event - create new lead immediately
async function handleInboundCallStarted(supabase: any, callData: any) {
  const requestId = callData._requestId;
  
  const {
    call_id,
    from_number,
    to_number,
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
  const agentIdValue = agent_id || retell_llm_id || callData.llm_id || callData.agent_id;
  const companyId = await findCompanyByInboundAgentId(agentIdValue);

  if (!companyId) {
    console.error(`❌ [${requestId}] No company found for agent`);
    return NextResponse.json(
      { error: 'Company not found for inbound agent ID' },
      { status: 404 }
    );
  }

  // Find or create customer from caller's phone number
  const existingCustomer = await findCustomerByPhone(customerPhone);
  let customerId;

  if (!existingCustomer) {
    // Create new customer for inbound caller
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        phone: customerPhone,
        company_id: companyId,
        first_name: 'Inbound', // Default name for inbound callers
        last_name: 'Caller',   // Will be updated when we get actual name
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (customerError) {
      console.error(`❌ [${requestId}] Customer creation failed:`, customerError.message);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    customerId = newCustomer.id;
    console.log(`✅ [${requestId}] Created customer ${customerId}`);
  } else {
    customerId = existingCustomer.id;
    console.log(`✅ [${requestId}] Found existing customer ${customerId}`);
  }

  // Always create a new lead for inbound calls
  const { data: newLead, error: leadError } = await supabase
    .from('leads')
    .insert({
      company_id: companyId,
      customer_id: customerId,
      lead_source: 'cold_call',
      lead_type: 'phone_call',
      lead_status: 'new', // Will be updated based on AI qualification later
      priority: 'medium',
      comments: `📞 Inbound call started at ${new Date().toISOString()}`,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (leadError) {
    console.error(`❌ [${requestId}] Lead creation failed:`, leadError.message);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }

  // Extract data (will be mostly empty until call_analyzed event)
  const extractedData = extractCallData(
    undefined,
    undefined
  );

  // Create call record
  const { data: callRecord, error: insertError } = await supabase
    .from('call_records')
    .insert({
      call_id,
      lead_id: newLead.id,
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
      street_address: extractedData.street_address,
      preferred_service_time: extractedData.preferred_service_time,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error(`❌ [${requestId}] Call record creation failed:`, insertError.message);
    return NextResponse.json(
      { error: 'Failed to create call record' },
      { status: 500 }
    );
  }

  console.log(`✅ [${requestId}] Created lead ${newLead.id} and call record ${callRecord.id}`);

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    lead_id: newLead.id,
    action: 'inbound_lead_created',
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
    undefined
  );

  // Update call record
  const { data: callRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status: call_status || 'completed',
      end_timestamp: end_timestamp
        ? new Date(end_timestamp).toISOString()
        : new Date().toISOString(),
      duration_seconds: duration_ms ? Math.round(duration_ms / 1000) : null,
      billable_duration_seconds: calculateBillableDuration(duration_ms ? Math.round(duration_ms / 1000) : null),
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
    .select('*, leads(id, customer_id, comments)')
    .single();

  if (updateError) {
    console.error('Retell Inbound Webhook: Error updating call record:', updateError);
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Update lead with call summary and dynamic variables
  if (callRecord?.leads) {
    const callOutcome = call_status === 'completed' ? 'completed' : call_status || 'ended';
    const callDate = end_timestamp ? new Date(end_timestamp) : new Date();
    const callSummary = `📞 Inbound call on ${callDate.toISOString()} - Status: ${callOutcome}${disconnection_reason ? ` (${disconnection_reason})` : ''}`;
    
    await supabase
      .from('leads')
      .update({
        last_contacted_at: new Date().toISOString(),
        comments: `${callRecord.leads.comments || ''}\n\n${callSummary}`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', callRecord.leads.id);
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
  const extractedData = extractCallData(
    call_analysis,
    transcript
  );

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
    .select('*, leads(id, customer_id, comments)')
    .single();

  if (updateError) {
    console.error('Retell Inbound Webhook: Error updating call record:', updateError);
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Update lead status based on AI qualification decision
  if (callRecord.leads) {
    // Get is_qualified from call analysis (Post-Call Analysis)
    const isQualified = call_analysis?.custom_analysis_data?.is_qualified;
    

    const updateData: any = {
      comments: callRecord.leads.comments || '',
      updated_at: new Date().toISOString(),
    };

    // Add analysis summary if available
    if (extractedData.summary) {
      updateData.comments =
        `${updateData.comments}\n\n📊 Call Analysis: ${extractedData.summary}`.trim();
    }

    // Update lead status based on AI qualification decision
    if (isQualified === 'true' || isQualified === true) {
      // AI determined this is a qualified lead - keep as 'new' for follow-up
      updateData.lead_status = 'new';
      updateData.comments = `${updateData.comments}\n\n✅ AI Qualification: QUALIFIED - Ready for follow-up`.trim();
    } else if (isQualified === 'false' || isQualified === false) {
      // AI determined this is not a qualified lead
      updateData.lead_status = 'unqualified';
      updateData.comments = `${updateData.comments}\n\n❌ AI Qualification: UNQUALIFIED - Not a sales opportunity`.trim();
    } else {
      // No qualification decision provided - keep as 'new' for inbound calls (available for follow-up)
      updateData.lead_status = 'new';
    }
    

    await supabase
      .from('leads')
      .update(updateData)
      .eq('id', callRecord.leads.id);
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
      console.error('Failed to fetch customer data:', customerFetchError.message);
    } else if (existingCustomer) {
      // Get customer data from call analysis (Post-Call Analysis)
      const customerFirstName = call_analysis.custom_analysis_data.customer_first_name;
      const customerLastName = call_analysis.custom_analysis_data.customer_last_name;
      const customerStreetAddress = call_analysis.custom_analysis_data.customer_street_address;
      const customerCity = call_analysis.custom_analysis_data.customer_city;
      const customerState = call_analysis.custom_analysis_data.customer_state;
      const customerZip = call_analysis.custom_analysis_data.customer_zip;
      
      // Build update object conditionally
      const customerUpdateData: any = {};
      
      // Name updates: ONLY update if customer still has default placeholder names
      if (existingCustomer.first_name === 'Inbound' && existingCustomer.last_name === 'Caller') {
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
        if (customerStreetAddress || customerCity || customerState || customerZip) {
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

  // Send call summary emails if enabled
  try {
    await sendCallSummaryEmailsIfEnabled(supabase, callRecord, callData, extractedData);
  } catch (error) {
    console.error(`[Call Summary Emails] Error sending emails for call ${callData.call_id}:`, error);
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: 'inbound_call_analyzed',
  });
}

// Extract structured data from call analysis and transcript
function extractCallData(
  callAnalysis: any,
  transcript: string | undefined
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
  };

  // Extract from call analysis (Post-Call Analysis) - primary data source
  if (callAnalysis?.custom_analysis_data) {
    extractedData.home_size = callAnalysis.custom_analysis_data.home_size || null;
    extractedData.yard_size = callAnalysis.custom_analysis_data.yard_size || null;
    extractedData.pest_issue = callAnalysis.custom_analysis_data.pest_issue || null;
    extractedData.street_address = callAnalysis.custom_analysis_data.customer_street_address || null;
    extractedData.preferred_service_time = callAnalysis.custom_analysis_data.preferred_service_time || null;
    
    // Extract customer address and name fields
    extractedData.customer_city = callAnalysis.custom_analysis_data.customer_city || null;
    extractedData.customer_state = callAnalysis.custom_analysis_data.customer_state || null;
    extractedData.customer_zip = callAnalysis.custom_analysis_data.customer_zip || null;
    extractedData.customer_first_name = callAnalysis.custom_analysis_data.customer_first_name || null;
    extractedData.customer_last_name = callAnalysis.custom_analysis_data.customer_last_name || null;
  }

  // Extract sentiment and summary from call analysis
  if (callAnalysis) {
    extractedData.sentiment = callAnalysis.user_sentiment?.toLowerCase() || 'neutral';
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

// Helper function to send call summary emails if enabled for the company
async function sendCallSummaryEmailsIfEnabled(
  supabase: any,
  callRecord: any,
  callData: any,
  extractedData: any
) {
  const callId = callData.call_id;
  
  try {
    // Determine company ID from the call record
    let companyId = null;
    
    // Try to get company ID from the lead association
    if (callRecord.leads?.id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('company_id')
        .eq('id', callRecord.leads.id)
        .single();
      
      if (lead) {
        companyId = lead.company_id;
      }
    }
    
    // If no company ID found from lead, try to find via call settings
    if (!companyId) {
      const agentId = callData.agent_id || callData.retell_llm_id || callData.llm_id;
      if (agentId) {
        const { data: companySetting } = await supabase
          .from('company_settings')
          .select('company_id')
          .or(`setting_key.eq.retell_inbound_agent_id,setting_key.eq.retell_outbound_agent_id`)
          .eq('setting_value', agentId)
          .single();
        
        if (companySetting) {
          companyId = companySetting.company_id;
        }
      }
    }
    
    if (!companyId) {
      console.warn(`[Call Summary Emails] No company ID found for call ${callId}`);
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
        .select('name, email')
        .eq('id', callRecord.customer_id)
        .single();
      
      customerData = customer;
    }

    // Prepare call summary email data
    const callSummaryData: CallSummaryEmailData = {
      callId: callData.call_id,
      companyName: company?.name || 'Unknown Company',
      customerName: customerData?.name || extractedData.decision_maker || undefined,
      customerEmail: customerData?.email || undefined,
      customerPhone: callRecord.phone_number,
      fromNumber: callRecord.from_number,
      callStatus: callRecord.call_status || callData.call_status || 'completed',
      callDuration: callRecord.duration_seconds || (callData.duration_ms ? Math.round(callData.duration_ms / 1000) : undefined),
      callDate: callRecord.end_timestamp || callRecord.start_timestamp || new Date().toISOString(),
      sentiment: extractedData.sentiment,
      transcript: callData.transcript,
      callSummary: extractedData.summary || callData.call_analysis?.call_summary,
      pestIssue: extractedData.pest_issue,
      streetAddress: extractedData.street_address,
      homeSize: extractedData.home_size,
      yardSize: extractedData.yard_size,
      decisionMaker: extractedData.decision_maker,
      preferredServiceTime: extractedData.preferred_service_time,
      contactedOtherCompanies: extractedData.contacted_other_companies,
      leadId: callRecord.lead_id,
      recordingUrl: callData.recording_url,
      disconnectReason: callData.disconnection_reason || callRecord.disconnect_reason,
    };

    // Parse recipient emails
    const emailList = recipients
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    if (emailList.length === 0) {
      console.warn(`[Call Summary Emails] No valid email recipients for call ${callId}`);
      return;
    }

    // Send the emails
    const result = await sendCallSummaryNotifications(
      emailList,
      callSummaryData,
      undefined,
      companyId
    );

    console.log(`[Call Summary Emails] Sent to ${result.successCount}/${emailList.length} recipients for call ${callId}`);

  } catch (error) {
    console.error(`[Call Summary Emails] Error processing call ${callId}:`, error);
  }
}