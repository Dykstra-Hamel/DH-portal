import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Retell Webhook: Received webhook');
    
    const payload = await request.json();
    console.log('Retell Webhook: Payload received', payload);

    // Verify the webhook is from Retell (you should add proper authentication)
    // const authHeader = request.headers.get('authorization');
    
    const {
      call_id,
      call_type,
      phone_number,
      from_number,
      to_number,
      call_status,
      start_timestamp,
      end_timestamp,
      recording_url,
      transcript,
      call_analysis,
      retell_llm_dynamic_variables,
      call_duration,
      disconnect_reason
    } = payload;

    // Extract custom variables from the call analysis or transcript
    const extractedData = extractCallData(call_analysis, transcript);

    const supabase = createAdminClient();

    // Find the lead associated with this call
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, customer_id')
      .eq('customer_id', await findCustomerByPhone(to_number))
      .single();

    if (leadError) {
      console.error('Retell Webhook: Could not find lead:', leadError);
    }

    // Insert call record
    const { data: callRecord, error: insertError } = await supabase
      .from('call_records')
      .insert({
        call_id,
        lead_id: lead?.id || null,
        customer_id: lead?.customer_id || null,
        phone_number: to_number,
        from_number,
        call_status,
        start_timestamp: start_timestamp ? new Date(start_timestamp).toISOString() : null,
        end_timestamp: end_timestamp ? new Date(end_timestamp).toISOString() : null,
        duration_seconds: call_duration,
        recording_url,
        transcript,
        call_analysis,
        sentiment: extractedData.sentiment,
        home_size: extractedData.home_size,
        yard_size: extractedData.yard_size,
        budget_range: extractedData.budget_range,
        timeline: extractedData.timeline,
        pain_points: extractedData.pain_points,
        decision_maker: extractedData.decision_maker,
        disconnect_reason,
        retell_variables: retell_llm_dynamic_variables,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Retell Webhook: Error inserting call record:', insertError);
      return NextResponse.json({ error: 'Failed to save call record' }, { status: 500 });
    }

    // Update lead with call information
    if (lead) {
      await supabase
        .from('leads')
        .update({
          last_contacted_at: new Date().toISOString(),
          comments: lead ? `${lead.comments || ''}\n\nCall ${call_id}: ${extractedData.summary}`.trim() : null
        })
        .eq('id', lead.id);
    }

    console.log('Retell Webhook: Successfully processed call record', callRecord);
    return NextResponse.json({ success: true, call_record_id: callRecord.id });

  } catch (error) {
    console.error('Retell Webhook: Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function findCustomerByPhone(phoneNumber: string) {
  const supabase = createAdminClient();
  
  // Normalize phone number for comparison
  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .or(`phone.like.%${normalizedPhone.slice(-10)},phone.like.%${normalizedPhone}%`)
    .single();
    
  return customer?.id || null;
}

function extractCallData(callAnalysis: any, transcript: string) {
  // This function extracts structured data from the call analysis
  // You'll customize this based on what Retell provides
  
  const extractedData = {
    sentiment: 'neutral',
    home_size: null,
    yard_size: null,
    budget_range: null,
    timeline: null,
    pain_points: [],
    decision_maker: null,
    summary: ''
  };

  // Extract from call analysis if available
  if (callAnalysis) {
    extractedData.sentiment = callAnalysis.sentiment || 'neutral';
    extractedData.summary = callAnalysis.summary || '';
    
    // Extract custom fields based on your agent's configuration
    if (callAnalysis.custom_analysis) {
      extractedData.home_size = callAnalysis.custom_analysis.home_size;
      extractedData.yard_size = callAnalysis.custom_analysis.yard_size;
      extractedData.budget_range = callAnalysis.custom_analysis.budget_range;
      extractedData.timeline = callAnalysis.custom_analysis.timeline;
      extractedData.pain_points = callAnalysis.custom_analysis.pain_points || [];
      extractedData.decision_maker = callAnalysis.custom_analysis.decision_maker;
    }
  }

  // Fallback to transcript parsing if analysis doesn't have structured data
  if (transcript && !extractedData.home_size) {
    // Simple regex patterns - you'd want more sophisticated NLP
    const homeSizeMatch = transcript.match(/home.{0,20}(\d+).{0,10}(sq|square|feet|ft)/i);
    if (homeSizeMatch) {
      extractedData.home_size = homeSizeMatch[1];
    }
    
    const yardSizeMatch = transcript.match(/yard.{0,20}(\d+).{0,10}(sq|square|feet|ft|acre)/i);
    if (yardSizeMatch) {
      extractedData.yard_size = yardSizeMatch[1];
    }
    
    const budgetMatch = transcript.match(/budget.{0,20}\$?(\d+,?\d*)/i);
    if (budgetMatch) {
      extractedData.budget_range = budgetMatch[1];
    }
  }

  return extractedData;
}