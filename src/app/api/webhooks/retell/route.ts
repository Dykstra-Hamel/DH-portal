import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEvent } from '@/lib/inngest/client';

// Helper function to calculate billable duration (rounded up to nearest 30 seconds)
function calculateBillableDuration(durationSeconds: number | null): number | null {
  if (!durationSeconds || durationSeconds <= 0) return 30; // Minimum billable time
  return Math.ceil(durationSeconds / 30) * 30;
}

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Retell with proper authentication
    const authHeader = request.headers.get('authorization');
    const retellWebhookSecret = process.env.RETELL_WEBHOOK_SECRET;
    
    if (!retellWebhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // Validate authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Retell Webhook: Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - missing bearer token' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Use constant-time comparison to prevent timing attacks
    const expectedToken = Buffer.from(retellWebhookSecret, 'utf8');
    const providedToken = Buffer.from(token, 'utf8');
    
    // Ensure buffers are the same length to prevent length-based timing attacks
    if (expectedToken.length !== providedToken.length) {
      console.error('Retell Webhook: Invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }
    
    // Use crypto.timingSafeEqual for constant-time comparison
    const { timingSafeEqual } = await import('crypto');
    if (!timingSafeEqual(expectedToken, providedToken)) {
      console.error('Retell Webhook: Invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    const payload = await request.json();

    // Get event type - Retell sends this as 'event' at top level
    const eventType = payload.event;

    // Extract data from the nested call object
    const callData = payload.call || payload;
    const { call_id } = callData;

    if (!call_id) {
      console.error('Retell Webhook: No call_id provided');
      return NextResponse.json(
        { error: 'call_id is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Handle different event types
    switch (eventType) {
      case 'call_started':
        return await handleCallStarted(supabase, callData);

      case 'call_ended':
        return await handleCallEnded(supabase, callData);

      case 'call_analyzed':
        return await handleCallAnalyzed(supabase, callData);

      default:
        // Fallback for unknown event types - try to update existing record
        return await handleGenericUpdate(supabase, callData);
    }
  } catch (error) {
    console.error('Retell Webhook: Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle call_started event - create initial call record and lead
async function handleCallStarted(supabase: any, callData: any) {
  const {
    call_id,
    from_number,
    to_number,
    start_timestamp,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
    agent_id, // This may be in the webhook payload - need to check Retell docs
    retell_llm_id, // Alternative field name
  } = callData;

  // Check if this is a follow-up call
  const isFollowUp = retell_llm_dynamic_variables?.is_follow_up === 'true';
  const providedLeadId = retell_llm_dynamic_variables?.lead_id;

  let lead = null;
  let customerId = null;
  let companyId = null;

  if (isFollowUp && providedLeadId) {
    // For follow-up calls, use the provided lead ID
    const result = await supabase
      .from('leads')
      .select('id, customer_id, company_id, comments')
      .eq('id', providedLeadId)
      .single();

    if (result.data) {
      lead = result.data;
      customerId = result.data.customer_id;
      companyId = result.data.company_id;
    } else {
      console.error('Retell Webhook: Follow-up call but lead not found:', providedLeadId);
    }
  } else {
    // For new calls, determine company from agent ID and always create a new lead
    const agentIdValue = agent_id || retell_llm_id || callData.llm_id || callData.agent_id;
    companyId = await findCompanyByAgentId(agentIdValue);

    if (!companyId) {
      console.error('Retell Webhook: No company found for agent ID:', agentIdValue);
      return NextResponse.json(
        { error: 'Company not found for agent ID' },
        { status: 404 }
      );
    }

    // Find or create customer from phone number
    customerId = await findCustomerByPhone(to_number);

    if (!customerId) {
      // Create new customer if not found
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          phone: to_number,
          company_id: companyId,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Retell Webhook: Error creating customer:', customerError);
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
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
      console.error('Retell Webhook: Error creating lead:', leadError);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    lead = { id: newLead.id, customer_id: customerId, company_id: companyId };
  }

  // Extract data from dynamic variables (available immediately)
  const extractedData = extractCallData(
    retell_llm_dynamic_variables,
    undefined,
    undefined
  );

  // Find parent call ID for follow-up calls
  let parentCallId = null;
  if (isFollowUp && lead?.id) {
    const parentCallResult = await supabase
      .from('call_records')
      .select('call_id')
      .eq('lead_id', lead.id)
      .is('parent_call_id', null) // Find the original call (no parent)
      .order('created_at', { ascending: true })
      .limit(1);

    if (parentCallResult.data && parentCallResult.data.length > 0) {
      parentCallId = parentCallResult.data[0].call_id;
    }
  }

  // Create initial call record with all available data
  const { data: callRecord, error: insertError } = await supabase
    .from('call_records')
    .insert({
      call_id,
      lead_id: lead?.id || null,
      customer_id: customerId,
      // parent_call_id: parentCallId, // Temporarily disabled until migration is applied
      phone_number: to_number,
      from_number,
      call_status: 'in-progress',
      start_timestamp: start_timestamp
        ? new Date(start_timestamp).toISOString()
        : new Date().toISOString(),
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      // Add dynamic variable data immediately
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      decision_maker: extractedData.decision_maker,
      pest_issue: extractedData.pest_issue,
      street_address: extractedData.street_address,
      preferred_service_time: extractedData.preferred_service_time,
      contacted_other_companies: extractedData.contacted_other_companies,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Retell Webhook: Error creating call record:', insertError);
    return NextResponse.json(
      { error: 'Failed to create call record' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    lead_id: lead?.id,
    action: isFollowUp ? 'follow_up_call_started' : 'new_lead_created',
  });
}

// Handle call_ended event - update with end time and basic info (or create if missing)
async function handleCallEnded(supabase: any, callData: any) {
  const {
    call_id,
    call_status,
    from_number,
    to_number,
    start_timestamp,
    end_timestamp,
    duration_ms,
    disconnection_reason,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
  } = callData;

  // Extract updated data from dynamic variables (may have changed during call)
  const extractedData = extractCallData(
    retell_llm_dynamic_variables,
    undefined,
    undefined
  );

  // Calculate duration and billable duration
  const durationSeconds = duration_ms ? Math.round(duration_ms / 1000) : null;
  const billableDurationSeconds = calculateBillableDuration(durationSeconds);

  // Try to update existing call record first
  const { data: existingRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status: call_status || 'completed',
      end_timestamp: end_timestamp
        ? new Date(end_timestamp).toISOString()
        : new Date().toISOString(),
      duration_seconds: durationSeconds,
      billable_duration_seconds: billableDurationSeconds,
      disconnect_reason: disconnection_reason,
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      // Update dynamic variable data (may have changed during call)
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      decision_maker: extractedData.decision_maker,
      pest_issue: extractedData.pest_issue,
      street_address: extractedData.street_address,
      preferred_service_time: extractedData.preferred_service_time,
      contacted_other_companies: extractedData.contacted_other_companies,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', call_id)
    .select('*, leads(id, customer_id, comments)')
    .single();

  let callRecord = existingRecord;

  // If update failed because record doesn't exist, create it
  if (updateError && updateError.code === 'PGRST116') {
    // Check if this is a follow-up call
    const isFollowUp = retell_llm_dynamic_variables?.is_follow_up === 'true';
    const providedLeadId = retell_llm_dynamic_variables?.lead_id;

    let lead = null;
    let customerId = null;

    if (isFollowUp && providedLeadId) {
      // For follow-up calls, use the provided lead ID
      const result = await supabase
        .from('leads')
        .select('id, customer_id, comments')
        .eq('id', providedLeadId)
        .single();

      if (result.data) {
        lead = result.data;
        customerId = result.data.customer_id;
      } else {
      }
    } else {
      // Find the customer/lead associated with this call (original logic)
      customerId = await findCustomerByPhone(to_number);

      if (customerId) {
        const result = await supabase
          .from('leads')
          .select('id, customer_id, comments')
          .eq('customer_id', customerId)
          .eq('lead_status', 'new')
          .order('created_at', { ascending: false })
          .limit(1);

        if (result.data && result.data.length > 0) {
          lead = result.data[0];
        } else {
        }
      }
    }

    // Find parent call ID for follow-up calls
    let parentCallId = null;
    if (isFollowUp && lead?.id) {
      const parentCallResult = await supabase
        .from('call_records')
        .select('call_id')
        .eq('lead_id', lead.id)
        .is('parent_call_id', null)
        .order('created_at', { ascending: true })
        .limit(1);

      if (parentCallResult.data && parentCallResult.data.length > 0) {
        parentCallId = parentCallResult.data[0].call_id;
      }
    }

    // Create the call record
    const { data: newRecord, error: insertError } = await supabase
      .from('call_records')
      .insert({
        call_id,
        lead_id: lead?.id || null,
        customer_id: lead?.customer_id || null,
        // parent_call_id: parentCallId, // Temporarily disabled until migration is applied
        phone_number: to_number,
        from_number,
        call_status: call_status || 'completed',
        start_timestamp: start_timestamp
          ? new Date(start_timestamp).toISOString()
          : null,
        end_timestamp: end_timestamp
          ? new Date(end_timestamp).toISOString()
          : new Date().toISOString(),
        duration_seconds: durationSeconds,
        billable_duration_seconds: billableDurationSeconds,
        disconnect_reason: disconnection_reason,
        retell_variables: retell_llm_dynamic_variables,
        opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
        // Add dynamic variable data
        home_size: extractedData.home_size,
        yard_size: extractedData.yard_size,
        decision_maker: extractedData.decision_maker,
        pest_issue: extractedData.pest_issue,
        street_address: extractedData.street_address,
        preferred_service_time: extractedData.preferred_service_time,
        contacted_other_companies: extractedData.contacted_other_companies,
        created_at: new Date().toISOString(),
      })
      .select('*, leads(id, customer_id, comments)')
      .single();

    if (insertError) {
      console.error(
        'Retell Webhook: Error creating call record for call_ended:',
        insertError
      );
      return NextResponse.json(
        { error: 'Failed to create call record' },
        { status: 500 }
      );
    }

    callRecord = newRecord;
  } else if (updateError) {
    console.error(
      'Retell Webhook: Error updating call record for call_ended:',
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  } else {
  }

  // Update lead status to 'contacted' for initial calls only, always update last_contacted_at
  if (callRecord?.leads) {
    const callOutcome =
      call_status === 'completed' ? 'completed' : call_status || 'ended';
    const callDate = end_timestamp ? new Date(end_timestamp) : new Date();
    const callSummary = `📞 Call on ${callDate.toISOString()} - Status: ${callOutcome}${disconnection_reason ? ` (${disconnection_reason})` : ''}`;
    const isFollowUp = retell_llm_dynamic_variables?.is_follow_up === 'true';

    const updateData: any = {
      last_contacted_at: new Date().toISOString(),
      comments: `${callRecord.leads.comments || ''}\n\n${callSummary}`.trim(),
    };

    // Only change lead_status for initial calls (not follow-ups) - except for successful calls
    if (!isFollowUp) {
      // For any first contact, set to 'contacted' initially
      if (
        call_status === 'completed' ||
        call_status === 'ended' ||
        disconnection_reason
      ) {
        updateData.lead_status = 'contacted';
      }
    } else {
    }

    // Override with 'qualified' status for any successful call (first call or follow-up)
    if (call_status === 'completed') {
      updateData.lead_status = 'qualified';
    }

    await supabase
      .from('leads')
      .update(updateData)
      .eq('id', callRecord.leads.id);
  }

  // Send event to call outcome tracker for automation workflows
  try {
    // Check if this call was initiated by automation
    const { data: automationLog } = await supabase
      .from('call_automation_log')
      .select('execution_id, workflow_id, step_id')
      .eq('call_id', call_id)
      .single();

    if (automationLog) {
      // Map call status to outcome
      let callOutcome: 'successful' | 'failed' | 'no_answer' | 'busy' | 'voicemail' = 'failed';
      
      if (call_status === 'completed') {
        callOutcome = duration_ms && duration_ms > 10000 ? 'successful' : 'no_answer';
      } else if (call_status === 'no-answer') {
        callOutcome = 'no_answer';
      } else if (call_status === 'busy') {
        callOutcome = 'busy';
      } else if (disconnection_reason === 'voicemail_reached') {
        callOutcome = 'voicemail';
      }

      await sendEvent({
        name: 'retell/call_ended',
        data: {
          call_id,
          call_status: call_status || 'completed',
          call_duration: duration_ms ? Math.round(duration_ms / 1000) : 0,
          transcript: '',
          call_analysis: null
        }
      });
    }
  } catch (error) {
    console.error('Failed to send call outcome event:', error);
    // Don't fail the webhook if event sending fails
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: existingRecord ? 'updated' : 'created',
  });
}

// Handle call_analyzed event - update with all analysis data
async function handleCallAnalyzed(supabase: any, callData: any) {
  const {
    call_id,
    recording_url,
    transcript,
    call_analysis,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
  } = callData;

  // Extract data from both dynamic variables and call analysis
  const extractedData = extractCallData(
    retell_llm_dynamic_variables,
    call_analysis,
    transcript
  );

  const { data: callRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      recording_url,
      transcript,
      call_analysis,
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      // Update with analysis data (sentiment, summary from call_analysis)
      sentiment: extractedData.sentiment,
      // Update dynamic variable data (final values)
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      decision_maker: extractedData.decision_maker,
      pest_issue: extractedData.pest_issue,
      street_address: extractedData.street_address,
      preferred_service_time: extractedData.preferred_service_time,
      contacted_other_companies: extractedData.contacted_other_companies,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', call_id)
    .select('*, leads(id, customer_id, comments)')
    .single();

  if (updateError) {
    console.error(
      'Retell Webhook: Error updating call record for call_analyzed:',
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  // Update lead status based on AI qualification decision
  if (callRecord.leads) {
    const isFollowUp = retell_llm_dynamic_variables?.is_follow_up === 'true';
    const isQualified = retell_llm_dynamic_variables?.is_qualified;

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
      // No qualification decision provided - fallback to old logic for backward compatibility
      if (call_analysis?.call_successful === true) {
        updateData.lead_status = 'new';
        updateData.comments = `${updateData.comments}\n\n📞 Call completed successfully - No AI qualification provided`.trim();
      } else if (!isFollowUp) {
        updateData.lead_status = 'contacted';
        updateData.comments = `${updateData.comments}\n\n📞 Initial contact made - No AI qualification provided`.trim();
      }
    }

    await supabase
      .from('leads')
      .update(updateData)
      .eq('id', callRecord.leads.id);
  }

  // Send comprehensive call outcome event with analysis data
  try {
    // Check if this call was initiated by automation
    const { data: automationLog } = await supabase
      .from('call_automation_log')
      .select('execution_id, workflow_id, step_id, company_id, lead_id')
      .eq('call_id', call_id)
      .single();

    if (automationLog) {
      // Determine call outcome based on analysis
      let callOutcome: 'successful' | 'failed' | 'no_answer' | 'busy' | 'voicemail' = 'failed';
      
      if (call_analysis?.call_successful === true) {
        callOutcome = 'successful';
      } else if (callData.call_status === 'no-answer') {
        callOutcome = 'no_answer';
      } else if (callData.call_status === 'busy') {
        callOutcome = 'busy';
      } else if (callData.disconnection_reason === 'voicemail_reached') {
        callOutcome = 'voicemail';
      }

      // Parse analysis data for conditional branching
      const callAnalysisData = call_analysis ? {
        sentiment: (call_analysis.user_sentiment?.toLowerCase() as 'positive' | 'negative' | 'neutral') || 'neutral',
        appointmentScheduled: call_analysis.appointment_scheduled === true || call_analysis.call_summary?.toLowerCase().includes('appointment'),
        followUpRequested: call_analysis.follow_up_requested === true || call_analysis.call_summary?.toLowerCase().includes('follow up'),
        objections: call_analysis.objections || [],
        leadQuality: call_analysis.lead_quality || (call_analysis.call_successful ? 'warm' : 'cold') as 'hot' | 'warm' | 'cold'
      } : undefined;

      await sendEvent({
        name: 'automation/call_completed',
        data: {
          callId: call_id,
          companyId: automationLog.company_id,
          leadId: automationLog.lead_id,
          executionId: automationLog.execution_id,
          workflowId: automationLog.workflow_id || '',
          stepId: automationLog.step_id || '',
          callOutcome,
          callDuration: callData.duration_ms ? Math.round(callData.duration_ms / 1000) : 0,
          callTranscript: transcript || '',
          callAnalysis: callAnalysisData,
          retellCallData: callData
        }
      });
    }
  } catch (error) {
    console.error('Failed to send call analysis outcome event:', error);
    // Don't fail the webhook if event sending fails
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: 'analyzed',
  });
}

// Fallback handler for unknown event types or backwards compatibility
async function handleGenericUpdate(supabase: any, callData: any) {
  const {
    call_id,
    call_status,
    end_timestamp,
    duration_ms,
    recording_url,
    transcript,
    call_analysis,
    disconnection_reason,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
  } = callData;

  // Check if call record exists
  const { data: existingCall } = await supabase
    .from('call_records')
    .select('id')
    .eq('call_id', call_id)
    .single();

  if (!existingCall) {
    return NextResponse.json(
      { error: 'Call record not found' },
      { status: 404 }
    );
  }

  // Extract analysis data if available
  const extractedData = extractCallData(
    retell_llm_dynamic_variables,
    call_analysis,
    transcript
  );

  // Calculate duration and billable duration
  const durationSeconds = duration_ms ? Math.round(duration_ms / 1000) : null;
  const billableDurationSeconds = calculateBillableDuration(durationSeconds);

  const { data: callRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status,
      end_timestamp: end_timestamp
        ? new Date(end_timestamp).toISOString()
        : null,
      duration_seconds: durationSeconds,
      billable_duration_seconds: billableDurationSeconds,
      recording_url,
      transcript,
      call_analysis,
      retell_variables: retell_llm_dynamic_variables,
      opt_out_sensitive_data_storage: opt_out_sensitive_data_storage === true,
      sentiment: extractedData.sentiment,
      home_size: extractedData.home_size,
      yard_size: extractedData.yard_size,
      decision_maker: extractedData.decision_maker,
      pest_issue: extractedData.pest_issue,
      street_address: extractedData.street_address,
      preferred_service_time: extractedData.preferred_service_time,
      contacted_other_companies: extractedData.contacted_other_companies,
      disconnect_reason: disconnection_reason,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', call_id)
    .select()
    .single();

  if (updateError) {
    console.error(
      'Retell Webhook: Error updating call record for generic update:',
      updateError
    );
    return NextResponse.json(
      { error: 'Failed to update call record' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    call_record_id: callRecord.id,
    action: 'updated',
  });
}

async function findCustomerByPhone(phoneNumber: string | undefined) {
  if (!phoneNumber) {
    return null;
  }

  const supabase = createAdminClient();

  // Normalize phone number for comparison (remove all non-digits)
  const normalizedPhone = phoneNumber.replace(/\D/g, '');

  // Try multiple phone number patterns for matching
  const phonePatterns = [
    normalizedPhone, // 12074789013 (full with country code)
    normalizedPhone.slice(-10), // 2074789013 (10 digits, remove country code)
  ];

  // Try each phone pattern using database-level normalization for security
  for (const pattern of phonePatterns) {
    try {
      // Use Supabase's built-in functions to normalize and compare phone numbers safely
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .or(`phone.eq.${pattern},phone.eq.+1${pattern.slice(-10)},phone.eq.(${pattern.slice(-3, -7)}) ${pattern.slice(-7, -4)}-${pattern.slice(-4)}`)
        .limit(1)
        .single();

      if (data && !error) {
        return data.id;
      }
    } catch (error) {
      // Try next pattern if this one fails
      console.error('findCustomerByPhone: pattern failed:', pattern, error);
    }
  }

  // Fallback: try exact match without formatting
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phoneNumber)
      .single();

    if (data && !error) {
      return data.id;
    }
  } catch (error) {
    console.error('findCustomerByPhone: exact match failed:', error);
  }

  return null;
}

// Find company by Retell agent ID
async function findCompanyByAgentId(agentId: string | undefined) {
  if (!agentId) {
    console.warn('findCompanyByAgentId: No agent ID provided');
    return null;
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('company_id')
      .eq('setting_key', 'retell_agent_id')
      .eq('setting_value', agentId)
      .single();

    if (error) {
      console.error('findCompanyByAgentId: Database error:', error);
      return null;
    }

    if (data) {
      console.log('findCompanyByAgentId: Found company', data.company_id, 'for agent', agentId);
      return data.company_id;
    }

    console.warn('findCompanyByAgentId: No company found for agent ID:', agentId);
    return null;
  } catch (error) {
    console.error('findCompanyByAgentId: Error:', error);
    return null;
  }
}

function extractCallData(
  dynamicVariables: any,
  callAnalysis: any,
  transcript: string | undefined
) {
  // This function extracts structured data from Retell's dynamic variables and call analysis
  // Dynamic variables are available in ALL events, call analysis only in call_analyzed

  const extractedData = {
    sentiment: 'neutral',
    home_size: null as string | null,
    yard_size: null as string | null,
    decision_maker: null as string | null,
    pest_issue: null as string | null,
    street_address: null as string | null,
    preferred_service_time: null as string | null,
    contacted_other_companies: false,
    summary: '',
  };

  // Extract from dynamic variables first (available in all events)
  if (dynamicVariables) {
    // Extract all custom fields from dynamic variables
    extractedData.home_size = dynamicVariables.home_size || null;
    extractedData.yard_size = dynamicVariables.yard_size || null;
    extractedData.decision_maker = dynamicVariables.decision_maker || null;
    extractedData.pest_issue = dynamicVariables.pest_issue || null;
    extractedData.street_address =
      dynamicVariables.street_address ||
      dynamicVariables.customer_street_address ||
      null;
    extractedData.preferred_service_time =
      dynamicVariables.preferred_service_time || null;
    extractedData.contacted_other_companies =
      dynamicVariables.contacted_other_companies === true;

    // Also extract customer_name if available (though we may not store this)
    if (dynamicVariables.customer_name) {
    }
  }

  // Extract from call analysis if available (only in call_analyzed events)
  if (callAnalysis) {
    extractedData.sentiment =
      callAnalysis.user_sentiment?.toLowerCase() || 'neutral';
    extractedData.summary = callAnalysis.call_summary || '';

    // Also check custom_analysis_data if dynamic variables are missing
    if (callAnalysis.custom_analysis_data) {
      // Use custom_analysis_data as fallback if dynamic variables don't have the data
      extractedData.home_size =
        extractedData.home_size ||
        callAnalysis.custom_analysis_data.home_size ||
        null;
      extractedData.yard_size =
        extractedData.yard_size ||
        callAnalysis.custom_analysis_data.yard_size ||
        null;
      extractedData.decision_maker =
        extractedData.decision_maker ||
        callAnalysis.custom_analysis_data.decision_maker ||
        null;
      extractedData.pest_issue =
        extractedData.pest_issue ||
        callAnalysis.custom_analysis_data.pest_issue ||
        null;
      extractedData.street_address =
        extractedData.street_address ||
        callAnalysis.custom_analysis_data.street_address ||
        null;
      extractedData.preferred_service_time =
        extractedData.preferred_service_time ||
        callAnalysis.custom_analysis_data.preferred_service_time ||
        null;
      extractedData.contacted_other_companies =
        extractedData.contacted_other_companies ||
        callAnalysis.custom_analysis_data.contacted_other_companies === true;
    }
  }

  // Fallback to transcript parsing if analysis doesn't have structured data
  if (transcript && typeof transcript === 'string') {
    // Parse existing fields if not already extracted
    if (!extractedData.home_size) {
      const homeSizeMatch = transcript.match(
        /home.{0,20}(\d+).{0,10}(sq|square|feet|ft)/i
      );
      if (homeSizeMatch) {
        extractedData.home_size = homeSizeMatch[1];
      }
    }

    if (!extractedData.yard_size) {
      const yardSizeMatch = transcript.match(
        /yard.{0,20}(\d+).{0,10}(sq|square|feet|ft|acre)/i
      );
      if (yardSizeMatch) {
        extractedData.yard_size = yardSizeMatch[1];
      }
    }

    // Parse new fields
    if (!extractedData.pest_issue) {
      const pestMatches = transcript.match(
        /(ant|roach|cockroach|spider|termite|rodent|rat|mouse|wasp|bee|fly|mosquito|tick|flea|bed bug|pest|insect|bug).{0,50}/gi
      );
      if (pestMatches && pestMatches.length > 0) {
        extractedData.pest_issue = pestMatches.join(', ').substring(0, 255);
      }
    }

    if (!extractedData.street_address) {
      const addressMatch = transcript.match(
        /(\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard|circle|cir|court|ct|place|pl))/i
      );
      if (addressMatch) {
        extractedData.street_address = addressMatch[1];
      }
    }

    if (!extractedData.preferred_service_time) {
      if (transcript.match(/(morning|am|a\.m\.|before noon)/i)) {
        extractedData.preferred_service_time = 'AM';
      } else if (
        transcript.match(/(afternoon|evening|pm|p\.m\.|after noon)/i)
      ) {
        extractedData.preferred_service_time = 'PM';
      }
    }
  }

  return extractedData;
}
