import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Department, validateDepartments } from '@/types/user';

// GET /api/users/[id]/departments?companyId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the requesting user has permission to view departments
    // (User viewing their own departments OR company admin/manager OR global admin)
    const canView =
      user.id === userId || // User viewing their own departments
      await hasCompanyPermission(supabase, user.id, companyId) || // Company admin/manager
      await isGlobalAdmin(supabase, user.id); // Global admin

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get user departments for the specified company
    const { data: departments, error: departmentsError } = await supabase
      .from('user_departments')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('department');

    if (departmentsError) {
      console.error('Error fetching user departments:', departmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch departments' },
        { status: 500 }
      );
    }

    const departmentNames = departments?.map(d => d.department as Department) || [];

    return NextResponse.json({
      userId,
      companyId,
      departments: departmentNames,
      departmentDetails: departments
    });

  } catch (error) {
    console.error('Error in GET /api/users/[id]/departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/departments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { companyId, departments }: { companyId: string; departments: Department[] } = await request.json();

    if (!companyId || !departments) {
      return NextResponse.json(
        { error: 'Company ID and departments are required' },
        { status: 400 }
      );
    }

    // Validate departments
    const validation = validateDepartments(departments);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid departments', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the requesting user has permission to assign departments
    // (Company admin/manager OR global admin)
    const canAssign =
      await hasCompanyPermission(supabase, user.id, companyId) ||
      await isGlobalAdmin(supabase, user.id);

    if (!canAssign) {
      return NextResponse.json(
        { error: 'Access denied. Only company managers and admins can assign departments.' },
        { status: 403 }
      );
    }

    // Verify the target user exists and has appropriate company role
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'User is not associated with this company' },
        { status: 404 }
      );
    }

    // Check if user has a role that can have departments (member or manager)
    if (!['member', 'manager'].includes(userCompany.role)) {
      return NextResponse.json(
        { error: 'Only users with member or manager roles can have departments assigned' },
        { status: 400 }
      );
    }

    // Delete existing departments for this user/company
    const { error: deleteError } = await supabase
      .from('user_departments')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('Error deleting existing departments:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update departments' },
        { status: 500 }
      );
    }

    // Insert new departments
    if (departments.length > 0) {
      const departmentInserts = departments.map(department => ({
        user_id: userId,
        company_id: companyId,
        department
      }));

      const { data: newDepartments, error: insertError } = await supabase
        .from('user_departments')
        .insert(departmentInserts)
        .select();

      if (insertError) {
        console.error('Error inserting departments:', insertError);
        return NextResponse.json(
          { error: 'Failed to assign departments' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Departments assigned successfully',
        userId,
        companyId,
        departments,
        departmentDetails: newDepartments
      });
    }

    return NextResponse.json({
      message: 'All departments removed successfully',
      userId,
      companyId,
      departments: [],
      departmentDetails: []
    });

  } catch (error) {
    console.error('Error in POST /api/users/[id]/departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if user has company permission (admin/manager/owner)
async function hasCompanyPermission(supabase: any, userId: string, companyId: string): Promise<boolean> {
  try {
    const { data: userCompany, error } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error || !userCompany) return false;

    return ['admin', 'manager', 'owner'].includes(userCompany.role);
  } catch {
    return false;
  }
}

// Helper function to check if user is global admin
async function isGlobalAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) return false;

    return profile.role === 'admin';
  } catch {
    return false;
  }
}