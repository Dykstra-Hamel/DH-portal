import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// GET: Fetch company's active pest options for lead form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch company's active pest options with pest type details
    const { data: pestOptions, error } = await supabase
      .from('company_pest_options')
      .select(`
        id,
        pest_id,
        custom_label,
        display_order,
        pest_types (
          id,
          name,
          slug,
          description
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching pest options:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pest options' },
        { status: 500 }
      );
    }

    // Transform the data for the frontend
    const transformedOptions = (pestOptions || []).map((option: any) => ({
      id: option.pest_id,
      name: option.pest_types.name,
      slug: option.pest_types.slug,
      custom_label: option.custom_label || option.pest_types.name,
      description: option.pest_types.description,
      display_order: option.display_order,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOptions,
    });
  } catch (error) {
    console.error('Error in pest options GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}