import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// PUT: Update a service address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Service address ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Prepare update data
    const updateData: any = {};

    if (body.home_size_range !== undefined) {
      updateData.home_size_range = body.home_size_range;
    }

    if (body.yard_size_range !== undefined) {
      updateData.yard_size_range = body.yard_size_range;
    }

    if (body.home_size !== undefined) {
      updateData.home_size = body.home_size;
    }

    if (body.yard_size !== undefined) {
      updateData.yard_size = body.yard_size;
    }

    // Update service address if there's data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    const { data: updatedAddress, error: updateError } = await supabase
      .from('service_addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service address:', updateError);
      return NextResponse.json(
        { error: 'Failed to update service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedAddress,
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

// GET: Fetch a specific service address by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Service address ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: address, error } = await supabase
      .from('service_addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service address not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching service address:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error('Error in service address GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}