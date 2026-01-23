import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/project-categories/[id] - Get single internal category
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

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get internal category
    const { data: category, error } = await supabase
      .from('project_categories')
      .select('*')
      .eq('id', id)
      .is('company_id', null)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error in GET /api/admin/project-categories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/project-categories/[id] - Update internal category
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

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
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
      .is('company_id', null)
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Update internal category
    const { data: category, error } = await supabase
      .from('project_categories')
      .update({
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
      })
      .eq('id', id)
      .is('company_id', null)
      .select()
      .single();

    if (error || !category) {
      console.error('Error updating internal category:', error);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error in PUT /api/admin/project-categories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/project-categories/[id] - Delete internal category
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

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get category to check if it's system default
    const { data: category } = await supabase
      .from('project_categories')
      .select('is_system_default')
      .eq('id', id)
      .is('company_id', null)
      .single();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system default categories
    if (category.is_system_default) {
      return NextResponse.json(
        { error: 'Cannot delete system default categories' },
        { status: 403 }
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
      .is('company_id', null);

    if (error) {
      console.error('Error deleting internal category:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/project-categories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
