/**
 * Utility functions for capturing device and session data
 */

export interface DeviceData {
  ip_address: string | null;
  user_agent: string | null;
  browser: {
    name: string | null;
    version: string | null;
  };
  device: {
    type: string | null;
    vendor: string | null;
    model: string | null;
  };
  os: {
    name: string | null;
    version: string | null;
  };
  timezone: string | null;
  timestamp: string;
  referrer: string | null;
  session: {
    origin: string | null;
    language: string | null;
    screen_resolution: string | null;
  };
}

/**
 * Extract IP address from request headers
 * Checks common proxy headers in order of preference
 */
export function extractIPFromHeaders(headers: Headers): string | null {
  // Check common proxy headers in order of preference
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-cluster-client-ip',
    'forwarded',
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (ip) return ip;
    }
  }

  return null;
}

/**
 * Parse user agent string to extract browser, device, and OS info
 */
export function parseUserAgent(userAgent: string | null): {
  browser: { name: string | null; version: string | null };
  device: { type: string | null; vendor: string | null; model: string | null };
  os: { name: string | null; version: string | null };
} {
  if (!userAgent) {
    return {
      browser: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
      os: { name: null, version: null },
    };
  }

  const ua = userAgent.toLowerCase();

  // Browser detection
  let browserName: string | null = null;
  let browserVersion: string | null = null;

  if (ua.includes('edg/')) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/edg\/([\d.]+)/i)?.[1] || null;
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/chrome\/([\d.]+)/i)?.[1] || null;
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/version\/([\d.]+)/i)?.[1] || null;
  } else if (ua.includes('firefox/')) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/firefox\/([\d.]+)/i)?.[1] || null;
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browserName = 'Opera';
    browserVersion = userAgent.match(/(?:opera|opr)\/([\d.]+)/i)?.[1] || null;
  }

  // Device type detection
  let deviceType: string | null = null;
  let deviceVendor: string | null = null;
  let deviceModel: string | null = null;

  if (ua.includes('mobile')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  // Device vendor detection
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    deviceVendor = 'Apple';
    if (ua.includes('iphone')) deviceModel = 'iPhone';
    if (ua.includes('ipad')) deviceModel = 'iPad';
    if (ua.includes('ipod')) deviceModel = 'iPod';
  } else if (ua.includes('android')) {
    deviceVendor = 'Android';
  } else if (ua.includes('windows phone')) {
    deviceVendor = 'Microsoft';
  }

  // OS detection
  let osName: string | null = null;
  let osVersion: string | null = null;

  if (ua.includes('windows nt')) {
    osName = 'Windows';
    const versionMatch = userAgent.match(/windows nt ([\d.]+)/i);
    osVersion = versionMatch ? versionMatch[1] : null;
  } else if (ua.includes('mac os x')) {
    osName = 'macOS';
    const versionMatch = userAgent.match(/mac os x ([\d_]+)/i);
    osVersion = versionMatch ? versionMatch[1].replace(/_/g, '.') : null;
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    osName = 'iOS';
    const versionMatch = userAgent.match(/os ([\d_]+)/i);
    osVersion = versionMatch ? versionMatch[1].replace(/_/g, '.') : null;
  } else if (ua.includes('android')) {
    osName = 'Android';
    const versionMatch = userAgent.match(/android ([\d.]+)/i);
    osVersion = versionMatch ? versionMatch[1] : null;
  } else if (ua.includes('linux')) {
    osName = 'Linux';
  }

  return {
    browser: { name: browserName, version: browserVersion },
    device: { type: deviceType, vendor: deviceVendor, model: deviceModel },
    os: { name: osName, version: osVersion },
  };
}

/**
 * Capture comprehensive device and session data from request
 * This is used server-side in API routes
 */
export function captureDeviceData(request: Request): DeviceData {
  const headers = request.headers;
  const userAgent = headers.get('user-agent');
  const referrer = headers.get('referer') || headers.get('referrer');

  const ip = extractIPFromHeaders(headers);
  const parsed = parseUserAgent(userAgent);

  const url = new URL(request.url);

  return {
    ip_address: ip,
    user_agent: userAgent,
    browser: parsed.browser,
    device: parsed.device,
    os: parsed.os,
    timezone: null, // Will be set from client-side
    timestamp: new Date().toISOString(),
    referrer: referrer,
    session: {
      origin: url.origin,
      language: headers.get('accept-language')?.split(',')[0] || null,
      screen_resolution: null, // Will be set from client-side
    },
  };
}

/**
 * Get client-side device data (to be called from browser)
 * Returns data that can only be captured on the client
 */
export function getClientDeviceData(): {
  timezone: string;
  screen_resolution: string;
  language: string;
} {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  };
}
