import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/users/[id]/company-role?companyId=xxx
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

    // Check if the requesting user has permission to view company role
    // (User viewing their own role OR company admin/manager OR global admin)
    const canView =
      user.id === userId || // User viewing their own role
      await hasCompanyPermission(supabase, user.id, companyId) || // Company admin/manager
      await isGlobalAdmin(supabase, user.id); // Global admin

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get user's company role
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

    return NextResponse.json({
      userId,
      companyId,
      role: userCompany.role
    });

  } catch (error) {
    console.error('Error in GET /api/users/[id]/company-role:', error);
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