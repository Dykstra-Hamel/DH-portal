import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/project-departments - List all system departments
export async function GET() {
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

  // Fetch all system departments (company_id IS NULL)
  const { data: departments, error } = await supabase
    .from('project_departments')
    .select('*')
    .is('company_id', null)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(departments);
}

// POST /api/admin/project-departments - Create new system department
export async function POST(request: NextRequest) {
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
  const { name, icon } = body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Check for duplicate name in system departments
  const { data: existingDept } = await supabase
    .from('project_departments')
    .select('id')
    .is('company_id', null)
    .eq('name', name.trim())
    .single();

  if (existingDept) {
    return NextResponse.json({ error: 'A system department with this name already exists' }, { status: 400 });
  }

  // Get max sort_order for new department
  const { data: maxSortOrder } = await supabase
    .from('project_departments')
    .select('sort_order')
    .is('company_id', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxSortOrder?.sort_order || 0) + 1;

  // Create department
  const { data: department, error } = await supabase
    .from('project_departments')
    .insert({
      name: name.trim(),
      icon: icon || null,
      company_id: null, // System department
      sort_order: nextSortOrder,
      is_system_default: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(department, { status: 201 });
}
