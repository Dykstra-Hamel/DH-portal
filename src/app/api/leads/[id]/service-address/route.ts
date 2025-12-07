import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceAddressForLead,
  updateExistingServiceAddress,
  ServiceAddressData,
} from '@/lib/service-addresses';
import { createAdminClient } from '@/lib/supabase/server-admin';

// POST: Create new service address for lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body = await request.json();

    const {
      companyId,
      customerId,
      isPrimary,
      addressData,
    }: {
      companyId: string;
      customerId: string;
      isPrimary: boolean;
      addressData: ServiceAddressData;
    } = body;

    if (!companyId || !customerId || !addressData) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, customerId, addressData' },
        { status: 400 }
      );
    }

    const result = await createServiceAddressForLead(
      companyId,
      customerId,
      leadId,
      addressData,
      isPrimary
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Service address created successfully',
    });
  } catch (error) {
    console.error('Error in service address POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update existing service address for lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body = await request.json();

    const {
      serviceAddressId,
      addressData,
    }: {
      serviceAddressId: string;
      addressData: ServiceAddressData;
    } = body;

    if (!serviceAddressId || !addressData) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceAddressId, addressData' },
        { status: 400 }
      );
    }

    const result = await updateExistingServiceAddress(
      serviceAddressId,
      addressData
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update service address' },
        { status: 500 }
      );
    }

    // Update all quotes for this lead to reference the new service address
    // This ensures quote hero images and address data reflect the current address
    const supabase = createAdminClient();
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id')
      .eq('lead_id', leadId);

    if (quotes && quotes.length > 0) {
      await supabase
        .from('quotes')
        .update({ service_address_id: serviceAddressId })
        .in('id', quotes.map(q => q.id));
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Service address updated successfully',
    });
  } catch (error) {
    console.error('Error in service address PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
