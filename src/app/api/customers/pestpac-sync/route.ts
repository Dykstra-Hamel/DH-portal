import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  createOrFindServiceAddress,
  linkCustomerToServiceAddress,
  updateExistingServiceAddress,
} from '@/lib/service-addresses';
import { normalizePhoneNumber } from '@/lib/utils';

const PESTPAC_BASE_URL = 'https://api.workwave.com/pestpac/v1';
const PESTPAC_TOKEN_URL = 'https://is.workwave.com/oauth2/token?scope=openid';

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

export async function POST(request: NextRequest) {
  try {
  const authResult = await getAuthenticatedUser();
  if (authResult instanceof NextResponse) return authResult;
  const { user, isGlobalAdmin } = authResult;

  const body = await request.json();
  const { clientId, companyId } = body;

  if (!clientId || !companyId) {
    return NextResponse.json({ error: 'clientId and companyId are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

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

  // Fetch PestPac credentials
  const { data: settingsRows } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId)
    .in('setting_key', [
      'pestpac_api_key',
      'pestpac_tenant_id',
      'pestpac_oauth_client_id',
      'pestpac_oauth_client_secret',
      'pestpac_wwid_username',
      'pestpac_wwid_password',
    ]);

  const s: Record<string, string> = {};
  settingsRows?.forEach(row => { s[row.setting_key] = row.setting_value ?? ''; });

  const { pestpac_api_key: apiKey, pestpac_tenant_id: tenantId,
    pestpac_oauth_client_id: oauthClientId, pestpac_oauth_client_secret: oauthClientSecret,
    pestpac_wwid_username: wwUsername, pestpac_wwid_password: wwPassword } = s;

  if (!apiKey || !tenantId || !oauthClientId || !oauthClientSecret || !wwUsername || !wwPassword) {
    return NextResponse.json({ error: 'PestPac credentials not fully configured' }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getOAuthToken(oauthClientId, oauthClientSecret, wwUsername, wwPassword);
  } catch (err: any) {
    return NextResponse.json({ error: `PestPac auth failed: ${err.message}` }, { status: 502 });
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    apikey: apiKey,
    'tenant-id': tenantId,
    Accept: 'application/json',
  };

  // Fetch the single location by ID from PestPac GET /Locations/{locationID}
  const locUrl = `${PESTPAC_BASE_URL}/Locations/${encodeURIComponent(clientId)}`;
  const locRes = await fetch(locUrl, { headers });

  if (!locRes.ok) {
    const errBody = await locRes.text().catch(() => '');
    console.error(`[pestpac-sync] Location fetch failed (${locRes.status}):`, errBody.slice(0, 300));
    return NextResponse.json({ error: `Failed to fetch location from PestPac (${locRes.status})` }, { status: 502 });
  }

  let loc: any;
  try {
    const raw = await locRes.json();
    // Response may be a single object or an array; normalise to single object
    loc = Array.isArray(raw) ? raw[0] : raw;
  } catch {
    return NextResponse.json({ error: 'PestPac returned an unexpected response for this location' }, { status: 502 });
  }

  if (!loc) {
    return NextResponse.json({ error: 'PestPac location not found' }, { status: 404 });
  }

  // Map PestPac fields (PascalCase) to our schema
  const firstName = loc.FirstName ?? null;
  const lastName = loc.LastName ?? null;
  const rawPhone = loc.Phone ?? loc.PhoneNumber ?? null;
  const email = loc.Email ?? null;
  const normalizedPhone = normalizePhoneNumber(rawPhone);

  const addressData = {
    street_address: loc.Address ?? '',
    city: loc.City ?? '',
    state: loc.State ?? '',
    zip_code: loc.Zip ?? '',
    latitude: loc.Latitude ?? undefined,
    longitude: loc.Longitude ?? undefined,
  };

  // Match existing customer: pestpac_client_id → phone → email
  let existingCustomer: any = null;

  const { data: byPestPacId } = await adminSupabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .eq('pestpac_client_id', String(clientId))
    .single();

  if (byPestPacId) {
    existingCustomer = byPestPacId;
  }

  if (!existingCustomer && normalizedPhone) {
    const { data: allCustomers } = await adminSupabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .not('phone', 'is', null);

    existingCustomer = allCustomers?.find(c => normalizePhoneNumber(c.phone) === normalizedPhone) ?? null;
  }

  if (!existingCustomer && email) {
    const { data: byEmail } = await adminSupabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .ilike('email', email)
      .single();

    if (byEmail) existingCustomer = byEmail;
  }

  let customerId: string;

  if (existingCustomer) {
    const { data: updatedCustomer, error: updateError } = await adminSupabase
      .from('customers')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone,
        email,
        pestpac_client_id: String(clientId),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCustomer.id)
      .select('*')
      .single();

    if (updateError || !updatedCustomer) {
      return NextResponse.json({ error: 'Failed to update customer', detail: updateError?.message ?? null }, { status: 500 });
    }

    customerId = updatedCustomer.id;

    if (addressData.street_address || addressData.city) {
      const { data: existingLink } = await adminSupabase
        .from('customer_service_addresses')
        .select('service_address_id')
        .eq('customer_id', customerId)
        .eq('is_primary_address', true)
        .single();

      if (existingLink?.service_address_id) {
        await updateExistingServiceAddress(existingLink.service_address_id, addressData);
      } else {
        const createResult = await createOrFindServiceAddress(companyId, addressData);
        if (createResult.success && createResult.serviceAddressId) {
          await linkCustomerToServiceAddress(customerId, createResult.serviceAddressId, 'owner', true);
        }
      }
    }
  } else {
    const { data: newCustomer, error: insertError } = await adminSupabase
      .from('customers')
      .insert({
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone,
        email,
        pestpac_client_id: String(clientId),
      })
      .select('*')
      .single();

    if (insertError || !newCustomer) {
      return NextResponse.json({ error: 'Failed to create customer', detail: insertError?.message ?? null }, { status: 500 });
    }

    customerId = newCustomer.id;

    if (addressData.street_address || addressData.city) {
      const createResult = await createOrFindServiceAddress(companyId, addressData);
      if (createResult.success && createResult.serviceAddressId) {
        await linkCustomerToServiceAddress(customerId, createResult.serviceAddressId, 'owner', true);
      }
    }
  }

  const { data: finalCustomer } = await adminSupabase
    .from('customers')
    .select(`
      *,
      primary_service_address:customer_service_addresses(
        service_address:service_addresses(*)
      )
    `)
    .eq('id', customerId)
    .single();

  return NextResponse.json({ customer: finalCustomer });
  } catch (err: any) {
    console.error('[pestpac-sync] Unhandled error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
}
