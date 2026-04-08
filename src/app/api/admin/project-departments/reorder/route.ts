import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/admin/project-departments/reorder - Bulk update sort_order for drag-and-drop
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'project_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { departments } = body;

  // Validation
  if (!Array.isArray(departments) || departments.length === 0) {
    return NextResponse.json({ error: 'Invalid departments array' }, { status: 400 });
  }

  // Update each department's sort_order
  const updates = departments.map(async (dept: { id: string; sort_order: number }) => {
    return supabase
      .from('project_departments')
      .update({
        sort_order: dept.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dept.id)
      .is('company_id', null);
  });

  try {
    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering departments:', error);
    return NextResponse.json({ error: 'Failed to reorder departments' }, { status: 500 });
  }
}
