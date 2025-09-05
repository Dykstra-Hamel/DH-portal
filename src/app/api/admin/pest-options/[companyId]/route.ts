import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface PestOption {
  id: string;
  pest_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon_svg: string;
  custom_label: string | null;
  display_order: number;
  is_active: boolean;
  how_we_do_it_text: string | null;
  subspecies: string[];
  plan_comparison_header_text: string | null;
}

interface UpdatePestOptionsRequest {
  pestOptions: {
    pest_id: string;
    custom_label?: string;
    display_order: number;
    is_active: boolean;
    how_we_do_it_text?: string;
    subspecies?: string[];
    plan_comparison_header_text?: string;
  }[];
}

// GET: Fetch company's pest options
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

    // Fetch company's pest options with pest type details
    const { data: pestOptions, error } = await supabase
      .from('company_pest_options')
      .select(`
        id,
        pest_id,
        custom_label,
        display_order,
        is_active,
        how_we_do_it_text,
        subspecies,
        plan_comparison_header_text,
        pest_types (
          name,
          slug,
          description,
          icon_svg,
          is_active,
          pest_categories (
            name,
            slug
          )
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

    // Transform the data to flatten pest_types
    const transformedOptions: PestOption[] = (pestOptions || []).map((option: any) => ({
      id: option.id,
      pest_id: option.pest_id,
      name: option.pest_types.name,
      slug: option.pest_types.slug,
      description: option.pest_types.description,
      category: option.pest_types.pest_categories?.name || 'Unknown',
      icon_svg: option.pest_types.icon_svg,
      custom_label: option.custom_label,
      display_order: option.display_order,
      is_active: option.is_active && option.pest_types.is_active,
      how_we_do_it_text: option.how_we_do_it_text,
      subspecies: option.subspecies || [],
      plan_comparison_header_text: option.plan_comparison_header_text,
    }));

    // Also fetch all available pest types for admin interface
    const { data: allPestTypes, error: pestTypesError } = await supabase
      .from('pest_types')
      .select(`
        *,
        pest_categories (
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .order('pest_categories(name), name');

    if (pestTypesError) {
      console.error('Error fetching pest types:', pestTypesError);
      return NextResponse.json(
        { error: 'Failed to fetch available pest types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        companyPestOptions: transformedOptions,
        availablePestTypes: allPestTypes || [],
      },
    });
  } catch (error) {
    console.error('Error in pest options GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Update company's pest options
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const { pestOptions }: UpdatePestOptionsRequest = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!pestOptions || !Array.isArray(pestOptions)) {
      return NextResponse.json(
        { error: 'Invalid pest options data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Start a transaction-like operation
    // First, delete all existing pest options for this company
    const { error: deleteError } = await supabase
      .from('company_pest_options')
      .delete()
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('Error deleting existing pest options:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update pest options' },
        { status: 500 }
      );
    }

    // Then, insert the new pest options
    if (pestOptions.length > 0) {
      const insertData = pestOptions.map((option) => ({
        company_id: companyId,
        pest_id: option.pest_id,
        custom_label: option.custom_label || null,
        display_order: option.display_order,
        is_active: option.is_active,
        how_we_do_it_text: option.how_we_do_it_text || null,
        subspecies: option.subspecies || [],
        plan_comparison_header_text: option.plan_comparison_header_text || null,
      }));

      const { error: insertError } = await supabase
        .from('company_pest_options')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting pest options:', insertError);
        return NextResponse.json(
          { error: 'Failed to save pest options' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pest options updated successfully',
    });
  } catch (error) {
    console.error('Error in pest options POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}