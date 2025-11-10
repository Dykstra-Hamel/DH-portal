#!/usr/bin/env tsx

/**
 * Backfill Coordinates Script
 *
 * Geocodes existing pest_pressure_data_points records that are missing lat/lng coordinates.
 * This is a one-time fix for historical data. New records will automatically include coordinates
 * via the updated data aggregator.
 *
 * Usage:
 *   PROD_SUPABASE_URL=<url> PROD_SUPABASE_SERVICE_KEY=<key> GOOGLE_PLACES_API_KEY=<key> tsx scripts/backfill-coordinates.ts
 *
 * Rate Limiting:
 *   - Google Geocoding API free tier: 15 requests/min
 *   - Script uses 4 second delays between requests (same as aggregator)
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Environment Validation
// ============================================================================

interface Environment {
  supabaseUrl: string;
  supabaseKey: string;
  googleApiKey: string;
}

function validateEnvironment(): Environment {
  const supabaseUrl = process.env.PROD_SUPABASE_URL;
  const supabaseKey = process.env.PROD_SUPABASE_SERVICE_KEY;
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!supabaseUrl) {
    throw new Error('PROD_SUPABASE_URL environment variable is required');
  }

  if (!supabaseKey) {
    throw new Error('PROD_SUPABASE_SERVICE_KEY environment variable is required');
  }

  if (!googleApiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
  }

  return { supabaseUrl, supabaseKey, googleApiKey };
}

// ============================================================================
// Geocoding Logic (Server-side compatible version)
// ============================================================================

interface GeocodeResult {
  success: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  error?: string;
}

function isValidAddressField(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (trimmed.toLowerCase() === 'none') return false;
  return true;
}

function buildGeocodableAddress(
  street?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null
): string | null {
  const parts: string[] = [];

  if (isValidAddressField(street)) parts.push(street!.trim());
  if (isValidAddressField(city)) parts.push(city!.trim());
  if (isValidAddressField(state)) parts.push(state!.trim());
  if (isValidAddressField(zip)) parts.push(zip!.trim());

  // Require at least city + state for meaningful geocoding
  if (!isValidAddressField(city) || !isValidAddressField(state)) {
    return null;
  }

  return parts.join(', ');
}

async function geocodeAddress(
  addressString: string,
  apiKey: string
): Promise<GeocodeResult> {
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      return {
        success: false,
        error: `Geocoding API error: ${geocodeResponse.status}`,
      };
    }

    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      return {
        success: false,
        error: `Geocoding failed: ${geocodeData.status}`,
      };
    }

    const location = geocodeData.results[0].geometry?.location;
    if (!location?.lat || !location?.lng) {
      return {
        success: false,
        error: 'No coordinates found in geocoding response',
      };
    }

    return {
      success: true,
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown geocoding error',
    };
  }
}

// ============================================================================
// Main Backfill Logic
// ============================================================================

interface DataPoint {
  id: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  lat: number | null;
  lng: number | null;
}

async function backfillCoordinates() {
  console.log('[Backfill Coordinates] Starting...');

  // Validate environment
  const { supabaseUrl, supabaseKey, googleApiKey } = validateEnvironment();

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Query all data points without coordinates
  console.log('[Backfill Coordinates] Fetching records without coordinates...');

  // Fetch all records using pagination (Supabase has a 1000 row default limit)
  let dataPoints: DataPoint[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error: fetchError } = await supabase
      .from('pest_pressure_data_points')
      .select('id, city, state, zip_code, lat, lng')
      .is('lat', null)
      .range(from, from + pageSize - 1);

    if (fetchError) {
      console.error('[Backfill Coordinates] Error fetching data points:', fetchError);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    dataPoints = dataPoints.concat(data as DataPoint[]);
    console.log(`[Backfill Coordinates] Fetched ${dataPoints.length} records so far...`);

    if (data.length < pageSize) break; // Last page
    from += pageSize;
  }

  if (dataPoints.length === 0) {
    console.log('[Backfill Coordinates] No records found without coordinates. Exiting.');
    return;
  }

  console.log(`[Backfill Coordinates] Found ${dataPoints.length} records to geocode`);
  console.log('[Backfill Coordinates] Rate limiting: 15 requests/min (4 sec between calls)');

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < dataPoints.length; i++) {
    const point = dataPoints[i] as DataPoint;

    try {
      // Progress logging every 10 records
      if (i > 0 && i % 10 === 0) {
        console.log(`[Backfill Coordinates] Progress: ${i}/${dataPoints.length} processed`);
        console.log(`[Backfill Coordinates] Stats: ${updated} updated, ${skipped} skipped, ${errors} errors`);
      }

      // Build address string
      const addressString = buildGeocodableAddress(
        null, // No street address in data points table
        point.city,
        point.state,
        point.zip_code
      );

      if (!addressString) {
        console.warn(`[Backfill Coordinates] Skipping record ${point.id}: insufficient address data`);
        skipped++;
        continue;
      }

      // Geocode the address
      const result = await geocodeAddress(addressString, googleApiKey);

      // Rate limiting: 15 RPM = 4 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 4000));

      if (!result.success || !result.coordinates) {
        console.warn(`[Backfill Coordinates] Failed to geocode ${point.id}: ${result.error}`);
        errors++;
        continue;
      }

      // Update the record with coordinates
      const { error: updateError } = await supabase
        .from('pest_pressure_data_points')
        .update({
          lat: result.coordinates.lat,
          lng: result.coordinates.lng,
        })
        .eq('id', point.id);

      if (updateError) {
        console.error(`[Backfill Coordinates] Error updating record ${point.id}:`, updateError);
        errors++;
        continue;
      }

      updated++;
    } catch (error) {
      console.error(`[Backfill Coordinates] Error processing record ${point.id}:`, error);
      errors++;
    }
  }

  console.log('[Backfill Coordinates] Completed!');
  console.log('[Backfill Coordinates] Final Stats:');
  console.log(`  - Updated: ${updated}`);
  console.log(`  - Skipped: ${skipped}`);
  console.log(`  - Errors: ${errors}`);
  console.log(`  - Total Processed: ${dataPoints.length}`);
}

// ============================================================================
// Execute
// ============================================================================

backfillCoordinates()
  .then(() => {
    console.log('[Backfill Coordinates] Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Backfill Coordinates] Script failed:', error);
    process.exit(1);
  });
