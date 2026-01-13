import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateQuoteUrl, generateQuoteToken } from '@/lib/quote-utils';

/**
 * Public endpoint to fetch quote data for customer viewing
 * No authentication required - uses RLS policy that allows public access for quotes with quote_url
 */
export async function GET(
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

    // Extract and validate token and companySlug from query params
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const companySlug = url.searchParams.get('companySlug');

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the quote with all related data
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(
        `
        *,
        line_items:quote_line_items(
          *,
          service_plan:service_plans(
            plan_features,
            plan_faqs,
            plan_image_url,
            plan_disclaimer
          ),
          addon_service:add_on_services(
            addon_description
          )
        ),
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        service_address:service_addresses(
          id,
          street_address,
          apartment_unit,
          address_line_2,
          city,
          state,
          zip_code,
          latitude,
          longitude,
          home_size_range,
          yard_size_range
        ),
        lead:leads(
          id,
          lead_status,
          service_type,
          comments,
          requested_date,
          requested_time
        ),
        company:companies(
          id,
          name,
          slug,
          email,
          phone,
          website
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }

      console.error('Error fetching public quote:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: 500 }
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

    // Generate quote_url path if it doesn't exist (for quotes created before this feature)
    if (!quote.quote_url && quote.company?.slug) {
      // Generate token if it doesn't exist
      const token = quote.quote_token || generateQuoteToken();
      const quoteUrlPath = generateQuoteUrl(quote.company.slug, id, token);

      // Update the quote with the generated path and token
      await supabase
        .from('quotes')
        .update({ quote_url: quoteUrlPath, quote_token: token })
        .eq('id', id);

      // Update the quote object for the response
      quote.quote_url = quoteUrlPath;
      quote.quote_token = token;
    }

    // Optional: Validate company slug from query params if provided
    if (companySlug && quote.company?.slug !== companySlug) {
      return NextResponse.json(
        { error: 'Quote not found for this company' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Error in public quote GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
