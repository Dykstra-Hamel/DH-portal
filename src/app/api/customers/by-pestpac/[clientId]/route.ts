import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = await params;
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId query param is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(
        `
        *,
        primary_service_address:customer_service_addresses!customer_service_addresses_customer_id_fkey(
          service_address:service_addresses(
            id,
            street_address,
            apartment_unit,
            city,
            state,
            zip_code,
            latitude,
            longitude
          )
        )
      `
      )
      .eq('pestpac_client_id', clientId)
      .eq('company_id', companyId)
      .eq('customer_service_addresses.is_primary_address', true)
      .limit(1)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Flatten primary service address
    const primaryServiceAddress =
      customer.primary_service_address &&
      Array.isArray(customer.primary_service_address) &&
      customer.primary_service_address.length > 0
        ? customer.primary_service_address[0]?.service_address
        : null;

    return NextResponse.json({
      customer: {
        ...customer,
        primary_service_address: primaryServiceAddress,
      },
    });
  } catch (error) {
    console.error('Error in by-pestpac lookup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
