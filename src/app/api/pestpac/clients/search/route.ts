import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';

const PESTPAC_BASE_URL = 'https://api.workwave.com/pestpac/v1';
const PESTPAC_TOKEN_URL = 'https://is.workwave.com/oauth2/token?scope=openid';

interface PestPacLocation {
  LocationID: number;
  LocationCode?: string;
  Company?: string;
  FirstName?: string;
  LastName?: string;
  Address?: string;
  City?: string;
  State?: string;
  Zip?: string;
  Phone?: string;
  Email?: string;
  Latitude?: number;
  Longitude?: number;
  Active?: boolean;
}

async function getOAuthToken(
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<string> {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(PESTPAC_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: 'password', username, password }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OAuth failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedUser();
  if (authResult instanceof NextResponse) return authResult;
  const { user, isGlobalAdmin } = authResult;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const companyId = searchParams.get('companyId');

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  const supabase = await createClient();

  if (!isGlobalAdmin) {
    const { data: userCompany, error: accessError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (accessError || !userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId)
    .in('setting_key', [
      'pestpac_enabled',
      'pestpac_api_key',
      'pestpac_tenant_id',
      'pestpac_oauth_client_id',
      'pestpac_oauth_client_secret',
      'pestpac_wwid_username',
      'pestpac_wwid_password',
    ]);

  if (settingsError) {
    return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
  }

  const s: Record<string, string> = {};
  settingsRows?.forEach(row => { s[row.setting_key] = row.setting_value ?? ''; });

  if (s.pestpac_enabled !== 'true') {
    return NextResponse.json({ error: 'PestPac integration is not enabled' }, { status: 400 });
  }

  const { pestpac_api_key: apiKey, pestpac_tenant_id: tenantId,
    pestpac_oauth_client_id: clientId, pestpac_oauth_client_secret: clientSecret,
    pestpac_wwid_username: wwUsername, pestpac_wwid_password: wwPassword } = s;

  if (!apiKey || !tenantId || !clientId || !clientSecret || !wwUsername || !wwPassword) {
    return NextResponse.json(
      { error: 'PestPac credentials incomplete. Set API Key, Tenant ID, OAuth Client ID/Secret, and WWID credentials in Integrations settings.' },
      { status: 400 }
    );
  }

  // Get OAuth token
  let accessToken: string;
  try {
    accessToken = await getOAuthToken(clientId, clientSecret, wwUsername, wwPassword);
  } catch (err: any) {
    console.error('[PestPac] OAuth error:', err.message);
    return NextResponse.json({ error: `PestPac authentication failed: ${err.message}` }, { status: 502 });
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    apikey: apiKey,
    'tenant-id': tenantId,
    Accept: 'application/json',
  };

  // Search locations — PestPac uses /Locations with a ?q= param
  const searchUrl = `${PESTPAC_BASE_URL}/Locations?${new URLSearchParams({ q, includeInactive: 'false' })}`;

  let searchRes: Response;
  try {
    searchRes = await fetch(searchUrl, { headers });
  } catch (err) {
    console.error('[PestPac] Network error:', err);
    return NextResponse.json({ error: 'Could not reach PestPac API.' }, { status: 502 });
  }

  if (!searchRes.ok) {
    const errorText = await searchRes.text().catch(() => '');
    console.error(`[PestPac] Search failed — ${searchRes.status}:`, errorText);
    return NextResponse.json(
      { error: `PestPac search returned ${searchRes.status}${errorText ? `: ${errorText.slice(0, 200)}` : ''}` },
      { status: 502 }
    );
  }

  const locations: PestPacLocation[] = await searchRes.json();

  const clients = locations
    .filter(l => l.Active !== false)
    .slice(0, 15)
    .map(l => {
      const nameParts = [l.FirstName, l.LastName].filter(Boolean);
      return {
        clientId: String(l.LocationID),
        firstName: l.FirstName ?? null,
        lastName: l.LastName ?? null,
        companyName: l.Company ?? null,
        displayName: l.Company || nameParts.join(' ') || `Location ${l.LocationID}`,
        phone: l.Phone ?? null,
        email: l.Email ?? null,
        locationCode: l.LocationCode ?? null,
        primaryAddress: (l.Address || l.City) ? {
          street: l.Address ?? '',
          city: l.City ?? '',
          state: l.State ?? '',
          zip: l.Zip ?? '',
          latitude: typeof l.Latitude === 'number' ? l.Latitude : null,
          longitude: typeof l.Longitude === 'number' ? l.Longitude : null,
        } : null,
      };
    });

  return NextResponse.json({ clients });
}
