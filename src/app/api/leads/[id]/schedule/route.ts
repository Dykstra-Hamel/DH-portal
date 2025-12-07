import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * Public endpoint to update lead scheduling information (requested_date and requested_time)
 * Used by the public quote page to save customer preferences
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { requested_date, requested_time, quote_id, token } = body;

    // Require quote_id and token for security verification
    if (!quote_id) {
      return NextResponse.json(
        { error: 'Quote ID is required for verification' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Verify that the quote_id is associated with this lead_id AND token is valid
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, lead_id, quote_token, token_expires_at')
      .eq('id', quote_id)
      .eq('lead_id', id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Unauthorized: Quote does not match lead' },
        { status: 403 }
      );
    }

    // Validate token matches quote
    if (quote.quote_token !== token) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    // Check if token has expired
    if (quote.token_expires_at) {
      const expiryDate = new Date(quote.token_expires_at);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'Access token has expired' },
          { status: 403 }
        );
      }
    }

    // FIELD WHITELISTING: Only allow these exact fields to be updated
    const allowedFields = ['requested_date', 'requested_time'];
    const requestedFields = Object.keys(body).filter(
      key => !['quote_id', 'token'].includes(key)
    );

    const unauthorizedFields = requestedFields.filter(
      field => !allowedFields.includes(field)
    );

    if (unauthorizedFields.length > 0) {
      return NextResponse.json(
        { error: `Unauthorized fields: ${unauthorizedFields.join(', ')}. Only ${allowedFields.join(', ')} can be updated.` },
        { status: 400 }
      );
    }

    // Validate requested_time if provided
    const validTimes = ['morning', 'afternoon', 'evening', 'anytime'];
    if (requested_time && !validTimes.includes(requested_time)) {
      return NextResponse.json(
        { error: 'Invalid requested_time. Must be one of: morning, afternoon, evening, anytime' },
        { status: 400 }
      );
    }

    // Build update data object with ONLY whitelisted fields
    const updateData: {
      requested_date?: string | null;
      requested_time?: string | null;
    } = {};

    if (requested_date !== undefined) {
      updateData.requested_date = requested_date || null;
    }

    if (requested_time !== undefined) {
      updateData.requested_time = requested_time || null;
    }

    // Update the lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('id, requested_date, requested_time')
      .single();

    if (error) {
      console.error('Error updating lead schedule:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('Error in lead schedule PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
