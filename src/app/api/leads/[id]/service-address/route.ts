import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceAddressForLead,
  updateExistingServiceAddress,
  ServiceAddressData,
} from '@/lib/service-addresses';

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
