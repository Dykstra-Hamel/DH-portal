import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface PestType {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  icon_svg: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

interface CreatePestTypeRequest {
  name: string;
  slug: string;
  description?: string;
  category_id: string;
  icon_svg: string;
  is_active?: boolean;
}

interface UpdatePestTypeRequest extends CreatePestTypeRequest {
  id: string;
}

// GET: Fetch all pest types with usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get('include_usage') === 'true';
    const category = searchParams.get('category');
    const active_only = searchParams.get('active_only') === 'true';

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('pest_types')
      .select('*, pest_categories!inner(name)')
      .order('category_id, name');

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }
    if (active_only) {
      query = query.eq('is_active', true);
    }

    const { data: pestTypes, error } = await query;

    if (error) {
      console.error('Error fetching pest types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pest types' },
        { status: 500 }
      );
    }

    let enrichedPestTypes = pestTypes || [];

    // Add usage statistics if requested
    if (includeUsage) {
      const { data: usageStats } = await supabase
        .from('company_pest_options')
        .select('pest_id')
        .eq('is_active', true);

      // Count usage for each pest type
      const usageCounts = (usageStats || []).reduce((acc: Record<string, number>, option: any) => {
        acc[option.pest_id] = (acc[option.pest_id] || 0) + 1;
        return acc;
      }, {});

      enrichedPestTypes = pestTypes.map((pestType: any) => ({
        ...pestType,
        usage_count: usageCounts[pestType.id] || 0,
      }));
    }

    return NextResponse.json({
      success: true,
      data: enrichedPestTypes,
      meta: {
        total: enrichedPestTypes.length,
        categories: ['general', 'rodents', 'wood_destroying_insects', 'other'],
      },
    });
  } catch (error) {
    console.error('Error in pest types GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new pest type
export async function POST(request: NextRequest) {
  try {
    const pestTypeData: CreatePestTypeRequest = await request.json();

    if (!pestTypeData.name || !pestTypeData.slug || !pestTypeData.category_id || !pestTypeData.icon_svg) {
      return NextResponse.json(
        { error: 'Name, slug, category_id, and icon_svg are required' },
        { status: 400 }
      );
    }

    // Basic SVG validation
    if (!pestTypeData.icon_svg.trim().startsWith('<svg') || !pestTypeData.icon_svg.includes('</svg>')) {
      return NextResponse.json(
        { error: 'icon_svg must be valid SVG markup starting with <svg> and ending with </svg>' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Validate category exists
    const { data: categoryExists } = await supabase
      .from('pest_categories')
      .select('id')
      .eq('id', pestTypeData.category_id)
      .eq('is_active', true)
      .single();

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Invalid category. Category does not exist or is inactive.' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingSlug } = await supabase
      .from('pest_types')
      .select('id')
      .eq('slug', pestTypeData.slug)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A pest type with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the pest type
    const { data: newPestType, error: createError } = await supabase
      .from('pest_types')
      .insert({
        name: pestTypeData.name,
        slug: pestTypeData.slug,
        description: pestTypeData.description || null,
        category_id: pestTypeData.category_id,
        icon_svg: pestTypeData.icon_svg,
        is_active: pestTypeData.is_active !== false, // Default to true
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating pest type:', createError);
      return NextResponse.json(
        { error: 'Failed to create pest type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newPestType,
      message: 'Pest type created successfully',
    });
  } catch (error) {
    console.error('Error in pest types POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing pest type
export async function PUT(request: NextRequest) {
  try {
    const pestTypeData: UpdatePestTypeRequest = await request.json();

    if (!pestTypeData.id) {
      return NextResponse.json(
        { error: 'Pest type ID is required' },
        { status: 400 }
      );
    }

    if (!pestTypeData.name || !pestTypeData.slug || !pestTypeData.category_id || !pestTypeData.icon_svg) {
      return NextResponse.json(
        { error: 'Name, slug, category_id, and icon_svg are required' },
        { status: 400 }
      );
    }

    // Basic SVG validation
    if (!pestTypeData.icon_svg.trim().startsWith('<svg') || !pestTypeData.icon_svg.includes('</svg>')) {
      return NextResponse.json(
        { error: 'icon_svg must be valid SVG markup starting with <svg> and ending with </svg>' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Validate category exists
    const { data: categoryExists } = await supabase
      .from('pest_categories')
      .select('id')
      .eq('id', pestTypeData.category_id)
      .eq('is_active', true)
      .single();

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Invalid category. Category does not exist or is inactive.' },
        { status: 400 }
      );
    }

    // Check if slug already exists for a different pest type
    const { data: existingSlug } = await supabase
      .from('pest_types')
      .select('id')
      .eq('slug', pestTypeData.slug)
      .neq('id', pestTypeData.id)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A different pest type with this slug already exists' },
        { status: 409 }
      );
    }

    // Update the pest type
    const { data: updatedPestType, error: updateError } = await supabase
      .from('pest_types')
      .update({
        name: pestTypeData.name,
        slug: pestTypeData.slug,
        description: pestTypeData.description || null,
        category_id: pestTypeData.category_id,
        icon_svg: pestTypeData.icon_svg,
        is_active: pestTypeData.is_active !== false,
      })
      .eq('id', pestTypeData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating pest type:', updateError);
      return NextResponse.json(
        { error: 'Failed to update pest type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPestType,
      message: 'Pest type updated successfully',
    });
  } catch (error) {
    console.error('Error in pest types PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Deactivate a pest type (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Pest type ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check how many companies are using this pest type
    const { data: usageCount } = await supabase
      .from('company_pest_options')
      .select('id')
      .eq('pest_id', id)
      .eq('is_active', true);

    // Soft delete by setting is_active to false
    const { data: deactivatedPestType, error: deleteError } = await supabase
      .from('pest_types')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      console.error('Error deactivating pest type:', deleteError);
      return NextResponse.json(
        { error: 'Failed to deactivate pest type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deactivatedPestType,
      message: `Pest type deactivated successfully. ${(usageCount || []).length} companies were using this pest type.`,
      affected_companies: (usageCount || []).length,
    });
  } catch (error) {
    console.error('Error in pest types DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}