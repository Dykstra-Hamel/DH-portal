import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Retell with proper authentication
    const authHeader = request.headers.get('authorization');
    const retellWebhookSecret = process.env.RETELL_WEBHOOK_SECRET;
    
    if (!retellWebhookSecret) {
      console.error('Retell Webhook: RETELL_WEBHOOK_SECRET not configured');
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

// Handle call_started event - create initial call record
async function handleCallStarted(supabase: any, callData: any) {
  const {
    call_id,
    from_number,
    to_number,
    start_timestamp,
    retell_llm_dynamic_variables,
    opt_out_sensitive_data_storage,
  } = callData;

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
    // Find the customer/lead associated with this call (original logic for new calls)
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

      if (result.error) {
        console.error('Retell Webhook: Error finding new lead:', result.error);
      }
    }
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
    } else {
    }
  }

  // Create initial call record with all available data
  const { data: callRecord, error: insertError } = await supabase
    .from('call_records')
    .insert({
      call_id,
      lead_id: lead?.id || null,
      customer_id: lead?.customer_id || null,
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
    action: 'created',
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

  // Try to update existing call record first
  const { data: existingRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status: call_status || 'completed',
      end_timestamp: end_timestamp
        ? new Date(end_timestamp).toISOString()
        : new Date().toISOString(),
      duration_seconds: duration_ms ? Math.round(duration_ms / 1000) : null,
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
        duration_seconds: duration_ms ? Math.round(duration_ms / 1000) : null,
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
    const formattedDate = callDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const callSummary = `📞 Call on ${formattedDate} - Status: ${callOutcome}${disconnection_reason ? ` (${disconnection_reason})` : ''}`;
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

  // Update lead status based on call analysis (more reliable than call_ended)
  if (callRecord.leads) {
    const isFollowUp = retell_llm_dynamic_variables?.is_follow_up === 'true';

    const updateData: any = {
      comments: callRecord.leads.comments || '',
      updated_at: new Date().toISOString(),
    };

    // Add analysis summary if available
    if (extractedData.summary) {
      updateData.comments =
        `${updateData.comments}\n\n📊 Call Analysis: ${extractedData.summary}`.trim();
    }

    // Update lead status based on call success (regardless of call type)
    if (call_analysis?.call_successful === true) {
      // For any successful call (first call or follow-up), upgrade to 'qualified'
      updateData.lead_status = 'qualified';
    } else if (!isFollowUp) {
      // Only update to 'contacted' for unsuccessful first calls
      updateData.lead_status = 'contacted';
    } else {
    }

    await supabase
      .from('leads')
      .update(updateData)
      .eq('id', callRecord.leads.id);
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

  const { data: callRecord, error: updateError } = await supabase
    .from('call_records')
    .update({
      call_status,
      end_timestamp: end_timestamp
        ? new Date(end_timestamp).toISOString()
        : null,
      duration_seconds: duration_ms ? Math.round(duration_ms / 1000) : null,
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
