import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface UpdateCommentRequest {
  customer_comments: string;
  token: string;
}

/**
 * Public endpoint to update customer comments on a quote
 * No authentication required - uses token validation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const body: UpdateCommentRequest = await request.json();

    // Validate required fields
    if (!body.token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the quote to verify it exists and validate token
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, quote_token, token_expires_at, quote_url')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Validate token matches quote
    if (quote.quote_token !== body.token) {
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

    // Validate that the quote has a quote_url (has been shared with customer)
    if (!quote.quote_url) {
      return NextResponse.json(
        { error: 'This quote is not publicly accessible' },
        { status: 403 }
      );
    }

    // Update the quote with customer comment
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        customer_comments: body.customer_comments || null,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating quote comment:', updateError);
      return NextResponse.json(
        { error: 'Failed to save comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment saved successfully',
    });
  } catch (error) {
    console.error('Error in quote comment PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
