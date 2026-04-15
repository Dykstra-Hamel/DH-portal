import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedUser();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const companyId = request.nextUrl.searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: stop, error } = await supabase
    .from('route_stops')
    .select(
      `customer_id, customers(
        id, first_name, last_name, email, phone, pestpac_client_id,
        customer_service_addresses(
          is_primary_address,
          service_address:service_addresses(id, street_address, city, state, zip_code, latitude, longitude)
        )
      )`
    )
    .eq('id', id)
    .eq('company_id', companyId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!stop?.customer_id || !stop.customers) {
    return NextResponse.json({ customer: null });
  }

  const raw = stop.customers as any;

  const primaryAddressEntry = Array.isArray(raw.customer_service_addresses)
    ? raw.customer_service_addresses.find(
        (a: any) => a.is_primary_address
      ) ?? raw.customer_service_addresses[0] ?? null
    : null;

  const customer = {
    id: raw.id,
    first_name: raw.first_name,
    last_name: raw.last_name,
    email: raw.email,
    phone: raw.phone,
    pestpac_client_id: raw.pestpac_client_id,
    primary_service_address: primaryAddressEntry
      ? [{ service_address: primaryAddressEntry.service_address }]
      : undefined,
  };

  return NextResponse.json({ customer });
}
