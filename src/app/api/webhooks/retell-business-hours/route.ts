import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';
import { findCompanyByAgentId } from '@/lib/agent-utils';
import { isBusinessHours } from '@/lib/campaigns/business-hours';

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

    // Verify the webhook is from Retell using signature verification
    const retellWebhookSecret = process.env.RETELL_WEBHOOK_SECRET;
    const signature = request.headers.get('x-retell-signature');
    
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

    const supabase = createAdminClient();
    
    // Determine company from agent_id or to_number
    let companyId = null;
    
    // First try to find company by agent_id
    if (agent_id) {
      companyId = await findCompanyByAgentId(agent_id);
    }
    
    // If no company found by agent_id, try to find by phone number mapping
    // This would require a phone number -> company mapping table if needed
    // For now, we'll use the first company as fallback for development
    if (!companyId) {
      const { data: fallbackCompany } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single();
      
      if (fallbackCompany) {
        companyId = fallbackCompany.id;
      }
    }
    
    if (!companyId) {
      console.error(`❌ [${requestId}] No company found for this call`);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Use business hours library to check current time
    const now = new Date();
    const isDuringBusinessHours = await isBusinessHours(now, companyId);

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