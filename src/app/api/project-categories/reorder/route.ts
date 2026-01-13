import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/project-categories/reorder - Bulk update sort_order for drag-and-drop (company categories)
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
        .eq('company_id', profile.company_id); // Only company categories

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
    console.error('Error in PATCH /api/project-categories/reorder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
