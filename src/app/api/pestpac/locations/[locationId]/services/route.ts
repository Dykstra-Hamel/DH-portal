import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import { getOAuthToken } from '@/lib/pestpac-auth';

const PESTPAC_BASE_URL = 'https://api.workwave.com/pestpac/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const { locationId } = await params;

  const authResult = await getAuthenticatedUser();
  if (authResult instanceof NextResponse) return authResult;
  const { user, isGlobalAdmin } = authResult;

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }
  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
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
    return NextResponse.json({ orders: [], serviceTypes: [], error: 'PestPac integration is not enabled' });
  }

  const {
    pestpac_api_key: apiKey,
    pestpac_tenant_id: tenantId,
    pestpac_oauth_client_id: clientId,
    pestpac_oauth_client_secret: clientSecret,
    pestpac_wwid_username: wwUsername,
    pestpac_wwid_password: wwPassword,
  } = s;

  if (!apiKey || !tenantId || !clientId || !clientSecret || !wwUsername || !wwPassword) {
    return NextResponse.json({ orders: [], serviceTypes: [], error: 'PestPac credentials incomplete' });
  }

  let accessToken: string;
  try {
    accessToken = await getOAuthToken(clientId, clientSecret, wwUsername, wwPassword);
  } catch (err: any) {
    console.error('[PestPac services] OAuth error:', err.message);
    return NextResponse.json({ orders: [], serviceTypes: [], error: `PestPac auth failed: ${err.message}` });
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    apikey: apiKey,
    'tenant-id': tenantId,
    Accept: 'application/json',
  };

  // Try to fetch orders — attempt nested location URL first, then global filter fallback
  // URLSearchParams encodes '$' as '%24' breaking OData, so URLs are built manually
  const ordersUrlNested = `${PESTPAC_BASE_URL}/Locations/${encodeURIComponent(locationId)}/Orders?$top=20`;
  const ordersUrlFiltered = `${PESTPAC_BASE_URL}/Orders?$filter=LocationID eq ${encodeURIComponent(locationId)}&$orderby=OrderDate desc&$top=20`;
  const serviceTypesUrl = `${PESTPAC_BASE_URL}/ServiceTypes`;

  // Fetch all three in parallel; if nested 404s we fall back to filtered
  const [nestedOrdersRes, filteredOrdersRes, serviceTypesRes] = await Promise.allSettled([
    fetch(ordersUrlNested, { headers }),
    fetch(ordersUrlFiltered, { headers }),
    fetch(serviceTypesUrl, { headers }),
  ]);

  console.log('[PestPac services] nested orders status:', nestedOrdersRes.status === 'fulfilled' ? nestedOrdersRes.value.status : 'network error');
  console.log('[PestPac services] filtered orders status:', filteredOrdersRes.status === 'fulfilled' ? filteredOrdersRes.value.status : 'network error');
  console.log('[PestPac services] servicetypes status:', serviceTypesRes.status === 'fulfilled' ? serviceTypesRes.value.status : 'network error');

  let orders: any[] = [];
  let serviceTypes: any[] = [];
  const errors: string[] = [];

  // Pick whichever orders response succeeded
  const ordersRes = (nestedOrdersRes.status === 'fulfilled' && nestedOrdersRes.value.ok)
    ? nestedOrdersRes
    : filteredOrdersRes;

  if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
    try {
      const raw = await ordersRes.value.json();
      orders = Array.isArray(raw) ? raw : (raw?.value ?? []);
      console.log(`[PestPac services] Got ${orders.length} orders`);
    } catch {
      orders = [];
    }
  } else if (ordersRes.status === 'fulfilled') {
    const body = await ordersRes.value.text().catch(() => '');
    console.error(`[PestPac services] Orders ${ordersRes.value.status}:`, body.slice(0, 300));
    // Not surfacing as error in UI — orders section will just show "no active services"
  } else {
    console.error('[PestPac services] Orders network error');
  }

  if (serviceTypesRes.status === 'fulfilled' && serviceTypesRes.value.ok) {
    try {
      const raw = await serviceTypesRes.value.json();
      serviceTypes = Array.isArray(raw) ? raw : (raw?.value ?? []);
    } catch {
      serviceTypes = [];
    }
  } else if (serviceTypesRes.status === 'fulfilled') {
    const body = await serviceTypesRes.value.text().catch(() => '');
    console.error(`[PestPac services] ServiceTypes ${serviceTypesRes.value.status}:`, body.slice(0, 300));
    // Not surfacing as error in UI — available services section will just be hidden
  } else {
    console.error('[PestPac services] ServiceTypes network error');
  }

  // Surface an error only if both completely failed (for diagnostics)
  if (orders.length === 0 && serviceTypes.length === 0) {
    errors.push('No service data could be retrieved from PestPac for this location');
  }

  return NextResponse.json({
    orders,
    serviceTypes,
    ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
  });
}
