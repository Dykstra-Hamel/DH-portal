import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/project-categories/[id] - Get single company category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get company category
    const { data: category, error } = await supabase
      .from('project_categories')
      .select('*')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error in GET /api/project-categories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/project-categories/[id] - Update company category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check for duplicate name (excluding current category)
    const { data: existing } = await supabase
      .from('project_categories')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Update company category
    const { data: category, error } = await supabase
      .from('project_categories')
      .update({
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
      })
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select()
      .single();

    if (error || !category) {
      console.error('Error updating company category:', error);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error in PUT /api/project-categories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-categories/[id] - Delete company category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if category exists and belongs to user's company
    const { data: category } = await supabase
      .from('project_categories')
      .select('id')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if any projects are using this category
    const { data: assignments, error: assignmentError } = await supabase
      .from('project_category_assignments')
      .select('project_id')
      .eq('category_id', id);

    if (assignmentError) {
      console.error('Error checking category assignments:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to check category usage' },
        { status: 500 }
      );
    }

    if (assignments && assignments.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category',
          message: 'This category is being used by projects',
          projectCount: assignments.length,
          projectIds: assignments.map(a => a.project_id),
        },
        { status: 409 }
      );
    }

    // Delete the category
    const { error } = await supabase
      .from('project_categories')
      .delete()
      .eq('id', id)
      .eq('company_id', profile.company_id);

    if (error) {
      console.error('Error deleting company category:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/project-categories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
