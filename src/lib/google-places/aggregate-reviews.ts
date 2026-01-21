import { createAdminClient } from '@/lib/supabase/server-admin';

interface GooglePlacesResponse {
  rating?: number;
  userRatingCount?: number;
}

interface AggregatedReviewsData {
  rating: number;
  reviewCount: number;
  lastUpdated: string;
}

/**
 * Fetches and aggregates Google Places review data for a company's locations
 * @param companyId - The company's UUID
 * @returns Aggregated rating and review count, or null if no data available
 */
export async function aggregateGoogleReviews(
  companyId: string
): Promise<AggregatedReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('Google Places API key not configured');
    return null;
  }

  const supabase = createAdminClient();

  // Get Google Places listings for this company
  const { data: listings, error: listingsError } = await supabase
    .from('google_places_listings')
    .select('place_id')
    .eq('company_id', companyId);

  if (listingsError) {
    console.error('Database error fetching listings:', listingsError);
    return null;
  }

  // Get Place IDs
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

  // If no Place IDs are configured, return null
  if (placeIds.length === 0) {
    return null;
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
      console.error('No valid Google Places data retrieved');
      return null;
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
    const newCachedData: AggregatedReviewsData = {
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

    return newCachedData;

  } catch (apiError) {
    console.error('Google Places API error:', apiError);
    return null;
  }
}
