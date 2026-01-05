/**
 * Pest Types API
 *
 * GET - Fetch company-specific pest options
 * Query params: companyId (required)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Fetch company-specific pest options with pest type details
    const { data: pestOptions, error } = await supabase
      .from('company_pest_options')
      .select(`
        id,
        pest_id,
        custom_label,
        display_order,
        is_active,
        pest_types!inner (
          id,
          name,
          slug,
          description,
          category_id
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching pest options:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pest options' },
        { status: 500 }
      );
    }

    // Transform the data to a simpler format
    const pestTypes = (pestOptions || []).map((option: any) => ({
      id: option.pest_types.id,
      name: option.custom_label || option.pest_types.name,
      slug: option.pest_types.slug,
      description: option.pest_types.description,
      category_id: option.pest_types.category_id,
      is_active: option.is_active,
    }));

    return NextResponse.json({
      success: true,
      pestTypes: pestTypes,
    });
  } catch (error) {
    console.error('Error in pest-types API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
