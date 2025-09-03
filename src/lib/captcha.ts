import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export interface CaptchaConfig {
  provider: 'turnstile';
  siteKey?: string;
  secretKey?: string;
  enabled: boolean;
  required: boolean;
}

export async function getCompanyCaptchaConfig(companyId: string): Promise<CaptchaConfig> {
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId)
    .in('setting_key', [
      'captcha_provider',
      'captcha_enabled',
      'captcha_required',
    ]);

  const map = new Map((settings || []).map(s => [s.setting_key, s.setting_value]));

  const provider = (map.get('captcha_provider') || 'turnstile') as 'turnstile';
  // Use global environment variables for all companies
  const siteKey = process.env.TURNSTILE_GLOBAL_SITE_KEY || undefined;
  const secretKey = process.env.TURNSTILE_GLOBAL_SECRET_KEY || undefined;
  const enabled = (map.get('captcha_enabled') ?? 'true') === 'true';
  const required = (map.get('captcha_required') ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';

  return { provider, siteKey, secretKey, enabled, required };
}

export interface CaptchaPayload {
  provider?: string;
  token?: string;
  action?: string;
}

export interface CaptchaVerifyResult {
  success: boolean;
  reason?: string;
  provider?: string;
}

/**
 * Verify Turnstile token using company-specific secret and origin hostname.
 * Ensures the token was solved on the same origin hostname.
 */
export async function verifyTurnstile(
  token: string,
  secretKey: string,
  origin: string | null,
  request: NextRequest
): Promise<CaptchaVerifyResult> {
  try {
    const remoteip = request.headers.get('x-forwarded-for') || undefined;
    const params = new URLSearchParams();
    params.set('secret', secretKey);
    params.set('response', token);
    if (remoteip) params.set('remoteip', remoteip.split(',')[0].trim());

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { success: false, reason: `Turnstile verify HTTP ${resp.status} ${text}`, provider: 'turnstile' };
    }

    const data: any = await resp.json().catch(() => ({}));
    if (!data.success) {
      return { success: false, reason: `Turnstile unsuccessful: ${(data['error-codes'] || []).join(', ')}`, provider: 'turnstile' };
    }

    // Optional: hostname check – compare verify response with request origin
    const originHostname = origin ? safeHostname(origin) : null;
    const tokenHostname = typeof data.hostname === 'string' ? data.hostname : null;
    if (originHostname && tokenHostname && originHostname !== tokenHostname) {
      // Allow subdomain equivalence if needed: origin ends with tokenHostname or vice-versa
      const isSubdomainOk = originHostname.endsWith(`.${tokenHostname}`) || tokenHostname.endsWith(`.${originHostname}`);
      if (!isSubdomainOk) {
        return { success: false, reason: `Hostname mismatch: token for ${tokenHostname}, origin ${originHostname}`, provider: 'turnstile' };
      }
    }

    return { success: true, provider: 'turnstile' };
  } catch (err) {
    return { success: false, reason: err instanceof Error ? err.message : 'Verification error', provider: 'turnstile' };
  }
}

function safeHostname(origin: string): string | null {
  try {
    const url = new URL(origin);
    return url.hostname;
  } catch {
    return null;
  }
}

