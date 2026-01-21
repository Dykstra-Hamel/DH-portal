import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';
import { findCompanyByAgentId } from '@/lib/agent-utils';
import { isBusinessHours, fetchCompanyBusinessHours } from '@/lib/campaigns/business-hours';

// Simple rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit: number = 50, windowMs: number = 60000): boolean {
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
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    if (isRateLimited(ip, 50, 60000)) {
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

    // Extract call information from payload
    const callInbound = payload.call_inbound;
    if (!callInbound) {
      console.error(`❌ [${requestId}] No call_inbound data in payload`);
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    const { agent_id, from_number, to_number } = callInbound;

    // Extract agent ID to identify company
    if (!agent_id) {
      console.error(`❌ [${requestId}] No agent_id in payload`);
      return NextResponse.json(
        { error: 'agent_id required in payload' },
        { status: 400 }
      );
    }

    // Look up company from agent ID
    const companyId = await findCompanyByAgentId(agent_id);

    if (!companyId) {
      console.error(`❌ [${requestId}] Company not found for agent: ${agent_id}`);
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

    // Use business hours library to check current time
    const now = new Date();
    const businessHoursSettings = await fetchCompanyBusinessHours(companyId);
    const isDuringBusinessHours = isBusinessHours(now, businessHoursSettings);

    // Get off-hour calling setting
    const { data: offHourSetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'off_hour_calling_enabled')
      .single();

    const offHourCallingEnabled = offHourSetting?.setting_value === 'true' || offHourSetting?.setting_value === true || true;
    
    const duration = Date.now() - startTime;
    
    // Return response with dynamic variables for Retell
    const response = {
      call_inbound: {
        dynamic_variables: {
          is_during_business_hours: isDuringBusinessHours.toString(),
          off_hour_calling_enabled: offHourCallingEnabled.toString()
        }
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${requestId}] Business hours webhook error after ${duration}ms:`, error instanceof Error ? error.message : error);
    console.error(`❌ [${requestId}] Full error:`, error);
    
    // Return minimal response to allow call to proceed in case of error
    const errorResponse = {
      call_inbound: {
        dynamic_variables: {
          is_during_business_hours: "false",
          off_hour_calling_enabled: "true"
        }
      }
    };
    
    return NextResponse.json(errorResponse);
  }
}