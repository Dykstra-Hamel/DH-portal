import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCustomerPrimaryServiceAddress, createOrFindServiceAddress, linkCustomerToServiceAddress, updateExistingServiceAddress } from '@/lib/service-addresses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: customerId } = await params;

    // First check if customer exists and user has access
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this customer's company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', customer.company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this customer' },
        { status: 403 }
      );
    }

    // Get primary service address
    const result = await getCustomerPrimaryServiceAddress(customerId);

    if (result.error) {
      return NextResponse.json({ serviceAddress: null });
    }

    return NextResponse.json({ serviceAddress: result.serviceAddress });

  } catch (error) {
    console.error('Error in customer service address GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: customerId } = await params;
    const body = await request.json();

    // First check if customer exists and user has access
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this customer's company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', customer.company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this customer' },
        { status: 403 }
      );
    }

    // Geocode the address if coordinates aren't provided
    let latitude = body.latitude ?? null;
    let longitude = body.longitude ?? null;
    let hasStreetView = false;

    if (!latitude || !longitude) {
      // Only geocode if we have city and state
      if (body.city && body.state) {
        try {
          const geocodeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/internal/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              street: body.street_address,
              city: body.city,
              state: body.state,
              zip: body.zip_code,
            }),
          });

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.success && geocodeData.coordinates) {
              latitude = geocodeData.coordinates.lat;
              longitude = geocodeData.coordinates.lng;
              hasStreetView = geocodeData.coordinates.hasStreetView || false;
              console.log(`✅ Geocoded service address: ${latitude}, ${longitude}`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Geocoding failed for service address:', error);
          // Continue without coordinates
        }
      }
    }

    // Create new service address
    const addressData = {
      street_address: body.street_address?.trim() || '',
      city: body.city?.trim() || '',
      state: body.state?.trim() || '',
      zip_code: body.zip_code?.trim() || '',
      apartment_unit: body.apartment_unit?.trim() || null,
      address_line_2: body.address_line_2?.trim() || null,
      address_type: body.address_type || 'residential',
      property_notes: body.property_notes?.trim() || null,
      home_size_range: body.home_size_range || null,
      yard_size_range: body.yard_size_range || null,
      latitude,
      longitude,
      hasStreetView,
    };

    // Validate required fields
    if (!addressData.street_address || !addressData.city || !addressData.state || !addressData.zip_code) {
      return NextResponse.json(
        { error: 'Street address, city, state, and zip code are required' },
        { status: 400 }
      );
    }

    // Create or find service address
    const serviceAddressResult = await createOrFindServiceAddress(
      customer.company_id,
      addressData
    );

    if (!serviceAddressResult.success || !serviceAddressResult.serviceAddressId) {
      return NextResponse.json(
        { error: serviceAddressResult.error || 'Failed to create service address' },
        { status: 500 }
      );
    }

    // Link to customer as primary address
    const linkResult = await linkCustomerToServiceAddress(
      customerId,
      serviceAddressResult.serviceAddressId,
      'owner',
      true // isPrimary
    );

    if (!linkResult.success) {
      return NextResponse.json(
        { error: linkResult.error || 'Failed to link service address to customer' },
        { status: 500 }
      );
    }

    // Get the created/found service address
    const { data: serviceAddress, error: fetchError } = await supabase
      .from('service_addresses')
      .select('*')
      .eq('id', serviceAddressResult.serviceAddressId)
      .single();

    if (fetchError || !serviceAddress) {
      return NextResponse.json(
        { error: 'Failed to fetch created service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ serviceAddress });

  } catch (error) {
    console.error('Error in customer service address POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: customerId } = await params;
    const body = await request.json();

    // First check if customer exists and user has access
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this customer's company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', customer.company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this customer' },
        { status: 403 }
      );
    }

    // Get customer's primary service address
    const primaryAddressResult = await getCustomerPrimaryServiceAddress(customerId);

    if (primaryAddressResult.error || !primaryAddressResult.serviceAddress) {
      return NextResponse.json(
        { error: 'No primary service address found to update' },
        { status: 404 }
      );
    }

    const serviceAddressId = primaryAddressResult.serviceAddress.id;

    // Geocode the address if coordinates aren't provided
    let latitude = body.latitude ?? null;
    let longitude = body.longitude ?? null;
    let hasStreetView = false;

    if (!latitude || !longitude) {
      // Only geocode if we have city and state
      const city = body.city || primaryAddressResult.serviceAddress.city;
      const state = body.state || primaryAddressResult.serviceAddress.state;

      if (city && state) {
        try {
          const geocodeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/internal/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              street: body.street_address || primaryAddressResult.serviceAddress.street_address,
              city,
              state,
              zip: body.zip_code || primaryAddressResult.serviceAddress.zip_code,
            }),
          });

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.success && geocodeData.coordinates) {
              latitude = geocodeData.coordinates.lat;
              longitude = geocodeData.coordinates.lng;
              hasStreetView = geocodeData.coordinates.hasStreetView || false;
              console.log(`✅ Geocoded updated service address: ${latitude}, ${longitude}`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Geocoding failed for updated service address:', error);
          // Continue without coordinates
        }
      }
    }

    // Prepare update data
    const addressData = {
      street_address: body.street_address?.trim() || '',
      city: body.city?.trim() || '',
      state: body.state?.trim() || '',
      zip_code: body.zip_code?.trim() || '',
      apartment_unit: body.apartment_unit?.trim() || null,
      address_line_2: body.address_line_2?.trim() || null,
      address_type: body.address_type || 'residential',
      property_notes: body.property_notes?.trim() || null,
      home_size_range: body.home_size_range || null,
      yard_size_range: body.yard_size_range || null,
      latitude,
      longitude,
      hasStreetView,
    };

    // If only updating a single field, preserve existing data
    if (Object.keys(body).length === 1) {
      const currentAddress = primaryAddressResult.serviceAddress;
      Object.keys(addressData).forEach(key => {
        if (!(key in body) && currentAddress[key] !== undefined) {
          (addressData as any)[key] = currentAddress[key];
        }
      });
    }

    // Update the service address
    const updateResult = await updateExistingServiceAddress(serviceAddressId, addressData);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error || 'Failed to update service address' },
        { status: 500 }
      );
    }

    // Get the updated service address
    const { data: serviceAddress, error: fetchError } = await supabase
      .from('service_addresses')
      .select('*')
      .eq('id', serviceAddressId)
      .single();

    if (fetchError || !serviceAddress) {
      return NextResponse.json(
        { error: 'Failed to fetch updated service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ serviceAddress });

  } catch (error) {
    console.error('Error in customer service address PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}