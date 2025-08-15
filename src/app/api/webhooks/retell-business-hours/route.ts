import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';

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
    console.log(`🕐 [${requestId}] Business hours webhook received at ${new Date().toISOString()}`);
    console.log(`📥 [${requestId}] Headers:`, Object.fromEntries(request.headers.entries()));
    
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
    console.log(`📦 [${requestId}] Received payload:`, JSON.stringify(payload, null, 2));
    
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
    console.log(`📞 [${requestId}] Processing business hours check for call from ${from_number} to ${to_number}`);

    const supabase = createAdminClient();
    
    // Determine company from agent_id or to_number
    let companyId = null;
    
    // First try to find company by agent_id (inbound agent)
    if (agent_id) {
      const { data: agentCompany } = await supabase
        .from('company_settings')
        .select('company_id')
        .eq('setting_key', 'retell_inbound_agent_id')
        .eq('setting_value', agent_id)
        .single();
      
      if (agentCompany) {
        companyId = agentCompany.company_id;
        console.log(`✅ [${requestId}] Found company ${companyId} from agent_id`);
      }
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
        console.warn(`⚠️ [${requestId}] Using fallback company ${companyId} (no agent mapping found)`);
      }
    }
    
    if (!companyId) {
      console.error(`❌ [${requestId}] No company found for this call`);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get company settings for business hours and off-hour calling
    const { data: settings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value, setting_type')
      .eq('company_id', companyId)
      .in('setting_key', [
        'off_hour_calling_enabled',
        'company_timezone',
        'business_hours_monday',
        'business_hours_tuesday', 
        'business_hours_wednesday',
        'business_hours_thursday',
        'business_hours_friday',
        'business_hours_saturday',
        'business_hours_sunday'
      ]);

    if (!settings) {
      console.error(`❌ [${requestId}] Failed to fetch company settings`);
      return NextResponse.json(
        { error: 'Failed to fetch company settings' },
        { status: 500 }
      );
    }

    // Convert settings array to object for easier access
    const settingsMap = settings.reduce((acc: any, setting: any) => {
      let value = setting.setting_value;
      
      // Parse JSON settings
      if (setting.setting_type === 'json' && typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.warn(`⚠️ [${requestId}] Failed to parse JSON setting ${setting.setting_key}:`, e);
        }
      }
      
      // Parse boolean settings
      if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === true;
      }
      
      acc[setting.setting_key] = value;
      return acc;
    }, {});

    // Get off-hour calling setting
    const offHourCallingEnabled = settingsMap.off_hour_calling_enabled ?? true;
    
    // Get company timezone (default to UTC if not set)
    const companyTimezone = settingsMap.company_timezone || 'UTC';
    
    // Calculate current time in company timezone
    const now = new Date();
    let currentTime: Date;
    
    try {
      // Convert to company timezone
      currentTime = new Date(now.toLocaleString('en-US', { timeZone: companyTimezone }));
    } catch (error) {
      console.warn(`⚠️ [${requestId}] Invalid timezone ${companyTimezone}, using UTC`);
      currentTime = now;
    }
    
    const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTimeStr = currentTime.toTimeString().slice(0, 5); // HH:MM format
    
    console.log(`🕐 [${requestId}] Current time: ${currentTimeStr} on ${currentDay} (${companyTimezone})`);
    
    // Check if current time is during business hours
    let isDuringBusinessHours = false;
    
    const dayHours = settingsMap[`business_hours_${currentDay}`];
    if (dayHours && dayHours.enabled) {
      const startTime = dayHours.start;
      const endTime = dayHours.end;
      
      if (startTime && endTime) {
        // Compare time strings (HH:MM format)
        const isAfterStart = currentTimeStr >= startTime;
        const isBeforeEnd = currentTimeStr <= endTime;
        isDuringBusinessHours = isAfterStart && isBeforeEnd;
        
        console.log(`🕐 [${requestId}] Business hours for ${currentDay}: ${startTime} - ${endTime}, current: ${currentTimeStr}, in hours: ${isDuringBusinessHours}`);
      }
    } else {
      console.log(`🕐 [${requestId}] ${currentDay} is not a business day`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Business hours check completed in ${duration}ms`);
    console.log(`📊 [${requestId}] Result: during_hours=${isDuringBusinessHours}, off_hour_enabled=${offHourCallingEnabled}`);
    
    // Return response with dynamic variables for Retell
    const response = {
      call_inbound: {
        dynamic_variables: {
          is_during_business_hours: isDuringBusinessHours.toString(),
          off_hour_calling_enabled: offHourCallingEnabled.toString()
        }
      }
    };
    
    console.log(`📤 [${requestId}] Sending response:`, JSON.stringify(response, null, 2));
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
    
    console.log(`📤 [${requestId}] Sending error response:`, JSON.stringify(errorResponse, null, 2));
    return NextResponse.json(errorResponse);
  }
}