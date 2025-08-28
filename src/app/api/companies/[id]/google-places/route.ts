import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get all Google Places listings for the company
    const { data: listings, error } = await supabase
      .from('google_places_listings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching Google Places listings:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    return NextResponse.json({ listings: listings || [] });
  } catch (error) {
    console.error('Unexpected error in Google Places listings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();
    const { listings } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    if (!Array.isArray(listings)) {
      return NextResponse.json({ error: 'Listings must be an array' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Start a transaction by deleting existing listings and inserting new ones
    const { error: deleteError } = await supabase
      .from('google_places_listings')
      .delete()
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('Error deleting existing listings:', deleteError);
      return NextResponse.json({ error: 'Failed to update listings' }, { status: 500 });
    }

    // Insert new listings (only if they have a place_id)
    const validListings = listings.filter((listing: any) => 
      listing.place_id && listing.place_id.trim()
    );

    if (validListings.length > 0) {
      const listingsToInsert = validListings.map((listing: any) => ({
        company_id: companyId,
        place_id: listing.place_id.trim(),
        place_name: listing.place_name?.trim() || null,
        is_primary: Boolean(listing.is_primary)
      }));

      const { error: insertError } = await supabase
        .from('google_places_listings')
        .insert(listingsToInsert);

      if (insertError) {
        console.error('Error inserting new listings:', insertError);
        return NextResponse.json({ error: 'Failed to save listings' }, { status: 500 });
      }
    }

    // Clear the cached reviews data since listings changed
    await supabase
      .from('company_settings')
      .upsert({
        company_id: companyId,
        setting_key: 'google_reviews_data',
        setting_value: '{}',
        setting_type: 'json',
        description: 'Cached Google Reviews data including aggregated rating, review count, and last updated timestamp'
      }, {
        onConflict: 'company_id,setting_key'
      });

    return NextResponse.json({ success: true, count: validListings.length });
  } catch (error) {
    console.error('Unexpected error in Google Places listings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}