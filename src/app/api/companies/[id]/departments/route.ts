import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Department, DepartmentStats } from '@/types/user';

// GET /api/companies/[id]/departments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the requesting user has permission to view company departments
    // (Company admin/manager/owner OR global admin)
    const canView =
      await hasCompanyPermission(supabase, user.id, companyId) ||
      await isGlobalAdmin(supabase, user.id);

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all users with departments in this company
    const { data: userDepartments, error: departmentsError } = await supabase
      .from('user_departments')
      .select(`
        *,
        profiles!user_departments_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('company_id', companyId)
      .order('department');

    if (departmentsError) {
      console.error('Error fetching company departments:', departmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch departments' },
        { status: 500 }
      );
    }

    // Calculate department statistics
    const stats: DepartmentStats = {
      sales: 0,
      support: 0,
      scheduling: 0,
      total: 0
    };

    // Count unique users per department
    const uniqueUsersPerDepartment = {
      sales: new Set<string>(),
      support: new Set<string>(),
      scheduling: new Set<string>()
    };

    userDepartments?.forEach(ud => {
      const dept = ud.department as Department;
      uniqueUsersPerDepartment[dept].add(ud.user_id);
    });

    stats.sales = uniqueUsersPerDepartment.sales.size;
    stats.support = uniqueUsersPerDepartment.support.size;
    stats.scheduling = uniqueUsersPerDepartment.scheduling.size;
    stats.total = new Set([
      ...uniqueUsersPerDepartment.sales,
      ...uniqueUsersPerDepartment.support,
      ...uniqueUsersPerDepartment.scheduling
    ]).size;

    // Group departments by user
    const userDepartmentMap = new Map<string, {
      user: any;
      departments: Department[];
    }>();

    userDepartments?.forEach(ud => {
      const userId = ud.user_id;
      const dept = ud.department as Department;

      if (!userDepartmentMap.has(userId)) {
        userDepartmentMap.set(userId, {
          user: ud.profiles,
          departments: []
        });
      }

      userDepartmentMap.get(userId)!.departments.push(dept);
    });

    const usersWithDepartments = Array.from(userDepartmentMap.values()).map(item => ({
      ...item.user,
      departments: item.departments.sort()
    }));

    return NextResponse.json({
      companyId,
      stats,
      usersWithDepartments,
      departmentDetails: userDepartments
    });

  } catch (error) {
    console.error('Error in GET /api/companies/[id]/departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/companies/[id]/departments/users
// Returns all users in the company who can have departments (members/managers)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { action }: { action?: string } = await request.json();

    if (action === 'get-eligible-users') {
      const supabase = await createClient();

      // Get the current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check permissions
      const canView =
        await hasCompanyPermission(supabase, user.id, companyId) ||
        await isGlobalAdmin(supabase, user.id);

      if (!canView) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get users who can have departments (members and managers)
      const { data: eligibleUsers, error: usersError } = await supabase
        .from('user_companies')
        .select(`
          user_id,
          role,
          profiles!user_companies_user_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('company_id', companyId)
        .in('role', ['member', 'manager'])
        .order('profiles(first_name)');

      if (usersError) {
        console.error('Error fetching eligible users:', usersError);
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      // Get current department assignments for these users
      const userIds = eligibleUsers?.map(u => u.user_id) || [];

      const { data: currentDepartments } = await supabase
        .from('user_departments')
        .select('user_id, department')
        .eq('company_id', companyId)
        .in('user_id', userIds);

      // Group departments by user ID
      const departmentsByUser = new Map<string, Department[]>();
      currentDepartments?.forEach(ud => {
        const userId = ud.user_id;
        if (!departmentsByUser.has(userId)) {
          departmentsByUser.set(userId, []);
        }
        departmentsByUser.get(userId)!.push(ud.department as Department);
      });

      // Combine user data with their departments
      const usersWithDepartments = eligibleUsers?.map(userCompany => ({
        ...userCompany.profiles,
        companyRole: userCompany.role,
        departments: departmentsByUser.get(userCompany.user_id) || []
      })) || [];

      return NextResponse.json({
        companyId,
        eligibleUsers: usersWithDepartments
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in POST /api/companies/[id]/departments:', error);
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