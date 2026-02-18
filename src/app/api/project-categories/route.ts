import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/project-categories - List all categories for user's company
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    // If user has no company, return empty array (no categories to show)
    if (!profile?.company_id) {
      return NextResponse.json([]);
    }

    // Get all company-specific categories
    const { data: categories, error } = await supabase
      .from('project_categories')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching company categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in GET /api/project-categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-categories - Create new company-specific category
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'User is not associated with a company' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, color, icon } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate name within company categories
    const { data: existing } = await supabase
      .from('project_categories')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Get the highest sort_order to append new category at the end
    const { data: maxOrder } = await supabase
      .from('project_categories')
      .select('sort_order')
      .eq('company_id', profile.company_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = maxOrder ? maxOrder.sort_order + 1 : 1;

    // Insert new company category
    const { data: category, error } = await supabase
      .from('project_categories')
      .insert({
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        is_system_default: false, // Company categories are never system defaults
        company_id: profile.company_id,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating company category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/project-categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
