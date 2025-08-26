import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// Origin configuration types
export type CorsConfigType = 'widget' | 'admin' | 'public' | 'webhook';

// Static origin configurations for non-widget endpoints
const STATIC_ORIGIN_CONFIGS: Record<Exclude<CorsConfigType, 'widget'>, string[]> = {
  // Admin endpoints - restricted to dashboard only
  admin: [
    'http://localhost:3000',
    'https://localhost:3000', 
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[],

  // Public API endpoints - controlled access
  public: [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[],

  // Webhook endpoints - typically no CORS needed
  webhook: [],
};

// Base widget origins (always allowed)
const BASE_WIDGET_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[];

// Removed caching for immediate updates when domains are added/removed

/**
 * Get global whitelisted domains from environment variable or database
 */
function getGlobalWhitelistedDomains(): string[] {
  // Try environment variable first (comma-separated list)
  const envDomains = process.env.WIDGET_ALLOWED_DOMAINS;
  if (envDomains) {
    return envDomains.split(',').map(d => d.trim()).filter(Boolean);
  }
  
  // Fall back to empty array if no env var
  return [];
}

/**
 * Ensure the widget_allowed_domains setting exists in the database
 */
async function ensureWidgetDomainsSettingExists(supabase: any): Promise<void> {
  try {
    // Try to insert the setting if it doesn't exist
    await supabase
      .from('system_settings')
      .upsert({
        key: 'widget_allowed_domains',
        value: [],
        description: 'Global whitelist of domains allowed to embed widgets. Any domain in this list can embed widgets for any company.'
      }, {
        onConflict: 'key',
        ignoreDuplicates: true
      });
  } catch (error) {
    console.error('Failed to ensure widget domains setting exists:', error);
  }
}

/**
 * Get allowed widget origins (base + global whitelist)
 */
async function getWidgetOrigins(): Promise<string[]> {
  try {
    // Get from database settings (no caching for immediate updates)
    const supabase = createAdminClient();
    
    // Ensure the setting exists first
    await ensureWidgetDomainsSettingExists(supabase);
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'widget_allowed_domains')
      .single();

    let globalDomains: string[] = [];
    
    if (!error && settings?.value) {
      const domains = Array.isArray(settings.value) ? settings.value : JSON.parse(settings.value);
      globalDomains = domains.filter(Boolean);
    } else {
      // Fall back to environment variable
      globalDomains = getGlobalWhitelistedDomains();
    }

    return [...BASE_WIDGET_ORIGINS, ...globalDomains];
  } catch (error) {
    console.error('Failed to fetch global widget domains:', error);
    // Fall back to environment variable only
    return [...BASE_WIDGET_ORIGINS, ...getGlobalWhitelistedDomains()];
  }
}

// Method configurations for different endpoint types
const METHOD_CONFIGS: Record<CorsConfigType, string> = {
  widget: 'GET, POST, OPTIONS',
  admin: 'GET, POST, PUT, DELETE, OPTIONS',
  public: 'GET, POST, OPTIONS',
  webhook: 'POST, OPTIONS',
};

/**
 * Check if an origin is allowed for a given configuration type
 */
export async function isOriginAllowed(origin: string | null, configType: CorsConfigType): Promise<boolean> {
  if (!origin || origin === 'null') {
    // Allow same-origin requests (when origin is null or missing)
    // This is common for same-origin requests from localhost
    return true;
  }
  
  let allowedOrigins: string[];
  
  if (configType === 'widget') {
    // For widget endpoints, get dynamic list from database
    allowedOrigins = await getWidgetOrigins();
  } else {
    // For other endpoints, use static configuration
    allowedOrigins = STATIC_ORIGIN_CONFIGS[configType];
  }
  
  const isAllowed = allowedOrigins.some(allowedOrigin => {
    // Exact match
    if (allowedOrigin === origin) {
      return true;
    }
    
    // Subdomain match (for widget integrations)
    if (configType === 'widget') {
      const domain = allowedOrigin.replace(/^https?:\/\//, '');
      const subdomainMatch = origin.endsWith(`.${domain}`) || origin.includes(domain);
      if (subdomainMatch) {
        return true;
      }
    }
    
    return false;
  });
  
  return isAllowed;
}

/**
 * Add CORS headers to a response with origin validation
 */
export async function addCorsHeaders(
  response: NextResponse, 
  origin: string | null, 
  configType: CorsConfigType
): Promise<NextResponse> {
  if (await isOriginAllowed(origin, configType)) {
    // Handle null origin case (for same-origin requests like localhost)
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', METHOD_CONFIGS[configType]);
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Handle CORS preflight requests (OPTIONS method)
 */
export async function handleCorsPrelight(request: NextRequest, configType: CorsConfigType): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  
  // For webhook endpoints, don't require CORS
  if (configType === 'webhook') {
    return new NextResponse(null, { status: 200 });
  }
  
  // Reject unauthorized origins
  if (!(await isOriginAllowed(origin, configType))) {
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 200 });
  return await addCorsHeaders(response, origin, configType);
}

/**
 * Create a JSON response with proper CORS headers
 */
export async function createCorsResponse(
  data: any,
  origin: string | null,
  configType: CorsConfigType,
  options: { status?: number } = {}
): Promise<NextResponse> {
  const response = NextResponse.json(data, { status: options.status || 200 });
  return await addCorsHeaders(response, origin, configType);
}

/**
 * Create an error response with proper CORS headers
 */
export async function createCorsErrorResponse(
  error: string,
  origin: string | null,
  configType: CorsConfigType,
  status: number = 400
): Promise<NextResponse> {
  return await createCorsResponse({ error }, origin, configType, { status });
}

/**
 * Middleware function to validate origin before processing request
 */
export async function validateOrigin(request: NextRequest, configType: CorsConfigType): Promise<{
  isValid: boolean;
  origin: string | null;
  response?: NextResponse;
}> {
  const origin = request.headers.get('origin');
  
  // Webhook endpoints don't need origin validation
  if (configType === 'webhook') {
    return { isValid: true, origin };
  }
  
  if (!(await isOriginAllowed(origin, configType))) {
    return {
      isValid: false,
      origin,
      response: await createCorsErrorResponse('Unauthorized origin', origin, configType, 403)
    };
  }
  
  return { isValid: true, origin };
}

/**
 * No caching - domain changes take effect immediately
 */

/**
 * Add allowed origins for a specific configuration type
 * Note: For widget origins, use the database/admin interface instead
 */
export function addAllowedOrigin(configType: CorsConfigType, origin: string): void {
  if (configType === 'widget') {
    console.warn('Use admin interface to manage widget domains instead of addAllowedOrigin');
    return;
  }
  
  const config = STATIC_ORIGIN_CONFIGS[configType as Exclude<CorsConfigType, 'widget'>];
  if (config && !config.includes(origin)) {
    config.push(origin);
  }
}

/**
 * Get all allowed origins for a configuration type
 */
export async function getAllowedOrigins(configType: CorsConfigType): Promise<string[]> {
  if (configType === 'widget') {
    return await getWidgetOrigins();
  }
  return [...STATIC_ORIGIN_CONFIGS[configType]];
}