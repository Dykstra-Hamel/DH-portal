import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Retell } from 'retell-sdk';
import { normalizePhoneNumber } from '@/lib/utils';
import { findCompanyByAgentId } from '@/lib/agent-utils';

// Simple rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit: number = 50, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count++;
  return false;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'last week';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return 'last month';
  return `${Math.floor(diffDays / 30)} months ago`;
}

const FALLBACK_RESPONSE = {
  call_inbound: {
    dynamic_variables: {
      customer_found: 'false',
      customer_first_name: '',
      customer_last_name: '',
      customer_status: '',
      has_recent_activity: 'false',
      recent_activity_summary: 'No previous activity found for this caller.',
    },
  },
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      console.warn(`⚠️ [${requestId}] Rate limit exceeded`);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const signature = request.headers.get('x-retell-signature');
    if (!signature) {
      console.error(`❌ [${requestId}] Missing signature header`);
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    const bodyText = await request.text();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      console.error(`❌ [${requestId}] Invalid JSON payload`);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const callInbound = payload.call_inbound as Record<string, string> | undefined;
    if (!callInbound) {
      console.error(`❌ [${requestId}] No call_inbound data in payload`);
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }

    const { agent_id, from_number } = callInbound;
    if (!agent_id) {
      console.error(`❌ [${requestId}] No agent_id in payload`);
      return NextResponse.json({ error: 'agent_id required in payload' }, { status: 400 });
    }

    // Identify company from agent ID
    const companyId = await findCompanyByAgentId(agent_id);
    if (!companyId) {
      console.error(`❌ [${requestId}] Company not found for agent: ${agent_id}`);
      return NextResponse.json({ error: 'Company not found for agent ID' }, { status: 404 });
    }

    // Fetch Retell API key (also serves as webhook secret)
    const supabase = createAdminClient();
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'retell_api_key')
      .single();

    if (!apiKeySetting?.setting_value) {
      console.error(`❌ [${requestId}] Retell API key not configured for company: ${companyId}`);
      return NextResponse.json({ error: 'Retell API key not configured' }, { status: 500 });
    }

    // Validate signature
    const isValidSignature = Retell.verify(bodyText, apiKeySetting.setting_value, signature);
    if (!isValidSignature) {
      console.error(`❌ [${requestId}] Invalid webhook signature for company: ${companyId}`);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Normalize the caller's phone number
    const normalizedPhone = from_number ? normalizePhoneNumber(from_number) : null;
    if (!normalizedPhone) {
      console.warn(`⚠️ [${requestId}] No from_number in payload, returning fallback`);
      return NextResponse.json(FALLBACK_RESPONSE);
    }

    // Look up customer by phone number
    const { data: customer } = await supabase
      .from('customers')
      .select('id, first_name, last_name, customer_status')
      .eq('company_id', companyId)
      .eq('phone', normalizedPhone)
      .limit(1)
      .single();

    if (!customer) {
      console.log(`ℹ️ [${requestId}] Unknown caller: ${normalizedPhone}`);
      return NextResponse.json(FALLBACK_RESPONSE);
    }

    console.log(`✅ [${requestId}] Customer found: ${customer.id}`);

    // Fetch recent call records
    const { data: recentCalls } = await supabase
      .from('call_records')
      .select('pest_issue, call_direction, created_at')
      .eq('company_id', companyId)
      .eq('call_status', 'completed')
      .or(`customer_id.eq.${customer.id},phone_number.eq.${normalizedPhone}`)
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch recent form submissions
    const { data: recentForms } = await supabase
      .from('form_submissions')
      .select('normalized_data, created_at')
      .eq('company_id', companyId)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(3);

    // Build activity summary
    const activityParts: string[] = [];

    if (recentCalls && recentCalls.length > 0) {
      for (const call of recentCalls) {
        const when = formatRelativeDate(new Date(call.created_at));
        if (call.pest_issue) {
          activityParts.push(`${customer.first_name} called ${when} about ${call.pest_issue}`);
        } else {
          activityParts.push(`${customer.first_name} called ${when}`);
        }
      }
    }

    if (recentForms && recentForms.length > 0) {
      for (const form of recentForms) {
        const when = formatRelativeDate(new Date(form.created_at));
        const normalized = form.normalized_data as Record<string, string> | null;
        const pestIssue = normalized?.pest_issue;
        if (pestIssue) {
          activityParts.push(`submitted a web form ${when} about ${pestIssue}`);
        } else {
          activityParts.push(`submitted a web form ${when}`);
        }
      }
    }

    const hasActivity = activityParts.length > 0;
    const recentActivitySummary = hasActivity
      ? activityParts.join('. ') + '.'
      : 'No previous activity found for this caller.';

    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Customer lookup complete in ${duration}ms`);

    return NextResponse.json({
      call_inbound: {
        dynamic_variables: {
          customer_found: 'true',
          customer_first_name: customer.first_name ?? '',
          customer_last_name: customer.last_name ?? '',
          customer_status: customer.customer_status ?? '',
          has_recent_activity: hasActivity ? 'true' : 'false',
          recent_activity_summary: recentActivitySummary,
        },
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ [${requestId}] Customer lookup webhook error after ${duration}ms:`,
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(FALLBACK_RESPONSE);
  }
}
