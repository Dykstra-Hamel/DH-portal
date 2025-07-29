import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface PestCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pest_count?: number;
}

interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

interface UpdateCategoryRequest extends CreateCategoryRequest {
  id: string;
}

// GET: Fetch all pest categories with usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get('include_usage') === 'true';
    const activeOnly = searchParams.get('active_only') === 'true';

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('pest_categories')
      .select('*')
      .order('display_order, name');

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching pest categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pest categories' },
        { status: 500 }
      );
    }

    let enrichedCategories = categories || [];

    // Add usage statistics if requested
    if (includeUsage) {
      const { data: pestCounts } = await supabase
        .from('pest_types')
        .select('category_id')
        .eq('is_active', true);

      // Count pest types for each category
      const categoryCounts = (pestCounts || []).reduce((acc: Record<string, number>, pest: any) => {
        if (pest.category_id) {
          acc[pest.category_id] = (acc[pest.category_id] || 0) + 1;
        }
        return acc;
      }, {});

      enrichedCategories = categories.map((category: any) => ({
        ...category,
        pest_count: categoryCounts[category.id] || 0,
      }));
    }

    return NextResponse.json({
      success: true,
      data: enrichedCategories,
      meta: {
        total: enrichedCategories.length,
      },
    });
  } catch (error) {
    console.error('Error in pest categories GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new pest category
export async function POST(request: NextRequest) {
  try {
    const categoryData: CreateCategoryRequest = await request.json();

    if (!categoryData.name || !categoryData.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if slug already exists
    const { data: existingSlug } = await supabase
      .from('pest_categories')
      .select('id')
      .eq('slug', categoryData.slug)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the category
    const { data: newCategory, error: createError } = await supabase
      .from('pest_categories')
      .insert({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || null,
        display_order: categoryData.display_order || 0,
        is_active: categoryData.is_active !== false, // Default to true
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating pest category:', createError);
      return NextResponse.json(
        { error: 'Failed to create pest category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Pest category created successfully',
    });
  } catch (error) {
    console.error('Error in pest categories POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing pest category
export async function PUT(request: NextRequest) {
  try {
    const categoryData: UpdateCategoryRequest = await request.json();

    if (!categoryData.id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    if (!categoryData.name || !categoryData.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if slug already exists for a different category
    const { data: existingSlug } = await supabase
      .from('pest_categories')
      .select('id')
      .eq('slug', categoryData.slug)
      .neq('id', categoryData.id)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A different category with this slug already exists' },
        { status: 409 }
      );
    }

    // Update the category
    const { data: updatedCategory, error: updateError } = await supabase
      .from('pest_categories')
      .update({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || null,
        display_order: categoryData.display_order || 0,
        is_active: categoryData.is_active !== false,
      })
      .eq('id', categoryData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating pest category:', updateError);
      return NextResponse.json(
        { error: 'Failed to update pest category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Pest category updated successfully',
    });
  } catch (error) {
    console.error('Error in pest categories PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Deactivate a pest category (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check how many pest types are using this category
    const { data: pestCount } = await supabase
      .from('pest_types')
      .select('id')
      .eq('category_id', id)
      .eq('is_active', true);

    if ((pestCount || []).length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete category. ${(pestCount || []).length} active pest types are using this category.`,
          affected_pests: (pestCount || []).length 
        },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { data: deactivatedCategory, error: deleteError } = await supabase
      .from('pest_categories')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      console.error('Error deactivating pest category:', deleteError);
      return NextResponse.json(
        { error: 'Failed to deactivate pest category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deactivatedCategory,
      message: 'Pest category deactivated successfully',
    });
  } catch (error) {
    console.error('Error in pest categories DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}