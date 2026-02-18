import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/project-departments/[id] - Get single system department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch department
  const { data: department, error } = await supabase
    .from('project_departments')
    .select('*')
    .eq('id', id)
    .is('company_id', null)
    .single();

  if (error || !department) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  return NextResponse.json(department);
}

// PUT /api/admin/project-departments/[id] - Update system department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, icon } = body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Check for duplicate name (excluding current department)
  const { data: existingDept } = await supabase
    .from('project_departments')
    .select('id')
    .is('company_id', null)
    .eq('name', name.trim())
    .neq('id', id)
    .single();

  if (existingDept) {
    return NextResponse.json({ error: 'A system department with this name already exists' }, { status: 400 });
  }

  // Update department
  const { data: department, error } = await supabase
    .from('project_departments')
    .update({
      name: name.trim(),
      icon: icon || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('company_id', null)
    .select()
    .single();

  if (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!department) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  return NextResponse.json(department);
}

// DELETE /api/admin/project-departments/[id] - Delete system department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete department (will fail via trigger if in use)
  const { error } = await supabase
    .from('project_departments')
    .delete()
    .eq('id', id)
    .is('company_id', null);

  if (error) {
    // Check if it's the trigger error
    if (error.message.includes('Cannot delete department')) {
      return NextResponse.json({
        error: 'Cannot delete department: it is currently assigned to one or more projects'
      }, { status: 400 });
    }
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
