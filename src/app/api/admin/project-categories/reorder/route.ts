import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/project-categories/reorder - Bulk update sort_order for drag-and-drop
export async function PATCH(request: NextRequest) {
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

    // Parse request body - expecting array of { id, sort_order }
    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: categories array is required' },
        { status: 400 }
      );
    }

    // Validate all items have required fields
    for (const cat of categories) {
      if (!cat.id || typeof cat.sort_order !== 'number') {
        return NextResponse.json(
          { error: 'Invalid request: each category must have id and sort_order' },
          { status: 400 }
        );
      }
    }

    // Update each category's sort_order
    const updates = [];
    for (const cat of categories) {
      const { error } = await supabase
        .from('project_categories')
        .update({ sort_order: cat.sort_order })
        .eq('id', cat.id)
        .is('company_id', null); // Only internal categories

      if (error) {
        console.error(`Error updating sort_order for category ${cat.id}:`, error);
        updates.push({ id: cat.id, success: false, error: error.message });
      } else {
        updates.push({ id: cat.id, success: true });
      }
    }

    // Check if all updates succeeded
    const allSuccess = updates.every(u => u.success);

    return NextResponse.json({
      success: allSuccess,
      updates,
      message: allSuccess
        ? 'Category order updated successfully'
        : 'Some categories failed to update',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/project-categories/reorder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
