import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { validateOrigin, createCorsResponse, createCorsErrorResponse, handleCorsPrelight } from '@/lib/cors';

interface GooglePlacesResponse {
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    rating: number;
    text: { text: string };
    authorAttribution: { displayName: string };
    publishTime: string;
  }>;
}

interface CachedReviewsData {
  rating: number;
  reviewCount: number;
  lastUpdated: string;
}

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

    // Get Google Places listings for this company
    const { data: listings, error: listingsError } = await supabase
      .from('google_places_listings')
      .select('place_id')
      .eq('company_id', companyId);

    if (listingsError) {
      console.error('Database error fetching listings:', listingsError);
      return await createCorsErrorResponse('Failed to fetch company listings', origin, 'widget', 500);
    }

    // If no listings found, check for legacy single Place ID
    let placeIds: string[] = [];
    if (listings && listings.length > 0) {
      placeIds = listings.map(listing => listing.place_id).filter(Boolean);
    } else {
      // Fallback to legacy single Place ID from company_settings
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', companyId)
        .eq('setting_key', 'google_place_id')
        .single();

      if (!settingsError && settings?.setting_value) {
        placeIds = [settings.setting_value];
      }
    }

    // Get cached data
    const { data: cachedDataResult, error: cacheError } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'google_reviews_data')
      .single();

    const cachedData = cachedDataResult?.setting_value || '{}';

    // If no Google Place IDs are configured, return nothing (hide reviews section)
    if (placeIds.length === 0) {
      return await createCorsResponse({
        rating: 0,
        reviewCount: 0,
        isStatic: true,
        source: 'no_listings'
      }, origin, 'widget');
    }

    // Check if we have valid cached data (less than 24 hours old)
    let parsedCachedData: CachedReviewsData | null = null;
    try {
      if (cachedData && cachedData !== '{}') {
        parsedCachedData = JSON.parse(cachedData);
        if (parsedCachedData) {
          const lastUpdated = new Date(parsedCachedData.lastUpdated);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
          
          // If cached data is less than 24 hours old, return it
          if (hoursSinceUpdate < 24) {
            return await createCorsResponse({
              rating: parsedCachedData.rating,
              reviewCount: parsedCachedData.reviewCount,
              isStatic: false,
              source: 'cache',
              lastUpdated: parsedCachedData.lastUpdated
            }, origin, 'widget');
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing cached data:', parseError);
    }

    // Fetch fresh data from Google Places API
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.error('Google Places API key not configured');
      // Return cached data if available, otherwise static data
      if (parsedCachedData) {
        return await createCorsResponse({
          rating: parsedCachedData.rating,
          reviewCount: parsedCachedData.reviewCount,
          isStatic: false,
          source: 'cache_fallback',
          lastUpdated: parsedCachedData.lastUpdated
        }, origin, 'widget');
      }
      
      return await createCorsResponse({
        rating: 5.0,
        reviewCount: 2034,
        isStatic: true,
        source: 'static_fallback'
      }, origin, 'widget');
    }

    try {
      // Fetch data for all Place IDs concurrently
      const apiPromises = placeIds.map(async (placeId) => {
        const response = await fetch(
          `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount&key=${apiKey}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.warn(`Google API returned ${response.status} for Place ID: ${placeId}`);
          return null;
        }

        const data: GooglePlacesResponse = await response.json();
        return {
          placeId,
          rating: data.rating || 0,
          reviewCount: data.userRatingCount || 0
        };
      });

      const results = await Promise.all(apiPromises);
      const validResults = results.filter(result => result !== null);

      if (validResults.length === 0) {
        throw new Error('No valid Google Places data retrieved');
      }

      // Aggregate the results
      let totalReviewCount = 0;
      let weightedRatingSum = 0;

      validResults.forEach(result => {
        totalReviewCount += result.reviewCount;
        weightedRatingSum += result.rating * result.reviewCount; // Weight by review count
      });

      // Calculate weighted average rating
      const aggregatedRating = totalReviewCount > 0 ? weightedRatingSum / totalReviewCount : 0;
      
      const rating = Math.round(aggregatedRating * 10) / 10; // Round to 1 decimal place
      const reviewCount = totalReviewCount;
      const currentTime = new Date().toISOString();

      // Cache the fresh data
      const newCachedData: CachedReviewsData = {
        rating,
        reviewCount,
        lastUpdated: currentTime
      };

      // Update cached data in database
      await supabase
        .from('company_settings')
        .upsert({
          company_id: companyId,
          setting_key: 'google_reviews_data',
          setting_value: JSON.stringify(newCachedData),
          setting_type: 'json',
          description: 'Cached Google Reviews data including rating, review count, and last updated timestamp'
        }, {
          onConflict: 'company_id,setting_key'
        });

      return await createCorsResponse({
        rating,
        reviewCount,
        isStatic: false,
        source: 'google_api',
        lastUpdated: currentTime
      }, origin, 'widget');

    } catch (apiError) {
      console.error('Google Places API error:', apiError);
      
      // Return cached data if available, otherwise static data
      if (parsedCachedData) {
        return await createCorsResponse({
          rating: parsedCachedData.rating,
          reviewCount: parsedCachedData.reviewCount,
          isStatic: false,
          source: 'cache_fallback',
          lastUpdated: parsedCachedData.lastUpdated
        }, origin, 'widget');
      }
      
      return await createCorsResponse({
        rating: 5.0,
        reviewCount: 2034,
        isStatic: true,
        source: 'static_fallback'
      }, origin, 'widget');
    }

  } catch (error) {
    console.error('Unexpected error in Google Places reviews endpoint:', error);
    return await createCorsErrorResponse('Internal server error', origin, 'widget', 500);
  }
}