import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { recalculateAllLineItemPrices } from '@/lib/quote-utils';

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

    if (body.latitude !== undefined) {
      updateData.latitude = body.latitude;
    }

    if (body.longitude !== undefined) {
      updateData.longitude = body.longitude;
    }

    // Note: hasStreetView field doesn't exist in database schema yet
    // Ignoring this field to prevent 500 errors
    // TODO: Add has_street_view column in future migration if needed

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

    // Bi-directional sync: If size ranges updated, also update associated quote
    if (body.home_size_range !== undefined || body.yard_size_range !== undefined) {
      // Find quote associated with this service address
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, home_size_range, yard_size_range')
        .eq('service_address_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (quotes && quotes.length > 0) {
        const quote = quotes[0];
        const quoteUpdate: any = {};

        // Only update if the values are different to avoid unnecessary recalculations
        if (body.home_size_range !== undefined && body.home_size_range !== quote.home_size_range) {
          quoteUpdate.home_size_range = body.home_size_range;
        }

        if (body.yard_size_range !== undefined && body.yard_size_range !== quote.yard_size_range) {
          quoteUpdate.yard_size_range = body.yard_size_range;
        }

        // Update quote if there are changes using Supabase admin client directly
        if (Object.keys(quoteUpdate).length > 0) {
          try {
            // Update the quote directly in the database
            const { error: quoteUpdateError } = await supabase
              .from('quotes')
              .update(quoteUpdate)
              .eq('id', quote.id);

            if (quoteUpdateError) {
              console.error('Failed to sync quote with service address changes:', quoteUpdateError);
              // Don't fail the request - service address was updated successfully
            } else {
              // Recalculate all line item prices with the new size ranges
              await recalculateAllLineItemPrices(
                supabase,
                quote.id,
                quoteUpdate.home_size_range,
                quoteUpdate.yard_size_range
              );
            }
          } catch (error) {
            console.error('Error syncing quote:', error);
            // Don't fail the request - service address was updated successfully
          }
        }
      }
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