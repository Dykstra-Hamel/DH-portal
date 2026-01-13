import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { validateOrigin, createCorsResponse, createCorsErrorResponse, handleCorsPrelight } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { isValid, origin, response } = await validateOrigin(request, 'widget');
  if (!isValid && response) {
    return response;
  }

  try {
    const { companyId } = await params;

    if (!companyId) {
      return await createCorsErrorResponse('Company ID is required', origin, 'widget', 400);
    }

    const supabase = createAdminClient();

    // Check if company has any Google Places listings configured
    const { data: listings } = await supabase
      .from('google_places_listings')
      .select('place_id')
      .eq('company_id', companyId)
      .limit(1);

    // If no listings found, check for legacy single Place ID
    let hasPlaceIds = listings && listings.length > 0;
    if (!hasPlaceIds) {
      const { data: settings } = await supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', companyId)
        .eq('setting_key', 'google_place_id')
        .single();

      hasPlaceIds = Boolean(settings?.setting_value);
    }

    // If no Google Place IDs are configured, return nothing (hide reviews section)
    if (!hasPlaceIds) {
      return await createCorsResponse({
        rating: 0,
        reviewCount: 0,
        isStatic: true,
        source: 'no_listings'
      }, origin, 'widget');
    }

    // Get cached review data (populated by daily cron job)
    const { data: cachedDataResult } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'google_reviews_data')
      .single();

    const cachedData = cachedDataResult?.setting_value;

    // Parse and return cached data if available
    if (cachedData && cachedData !== '{}') {
      try {
        const parsedData = JSON.parse(cachedData);
        if (parsedData && parsedData.rating && parsedData.reviewCount) {
          return await createCorsResponse({
            rating: parsedData.rating,
            reviewCount: parsedData.reviewCount,
            isStatic: false,
            source: 'cache',
            lastUpdated: parsedData.lastUpdated
          }, origin, 'widget');
        }
      } catch (parseError) {
        console.error('Error parsing cached Google reviews data:', parseError);
      }
    }

    // Fallback: return static placeholder data if cache is empty/invalid
    // (Cache will be populated by daily cron job)
    return await createCorsResponse({
      rating: 5.0,
      reviewCount: 2034,
      isStatic: true,
      source: 'static_fallback'
    }, origin, 'widget');

  } catch (error) {
    console.error('Unexpected error in Google Places reviews endpoint:', error);
    return await createCorsErrorResponse('Internal server error', origin, 'widget', 500);
  }
}