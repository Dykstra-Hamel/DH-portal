import { NextRequest, NextResponse } from 'next/server';
import { 
  getAuthenticatedUser, 
  verifyCompanyAccess, 
  getSupabaseClient, 
  createErrorResponse,
  createSuccessResponse 
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user and admin status
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    const { user, isGlobalAdmin, supabase } = authResult;
    const { id: companyId } = await params;

    // Verify user has access to this company
    const accessCheck = await verifyCompanyAccess(supabase, user.id, companyId, isGlobalAdmin);
    if (accessCheck instanceof NextResponse) {
      return accessCheck; // Return error response
    }

    // Use appropriate client based on admin status
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // First, get all user IDs associated with this company
    const { data: companyUsers, error: fetchError } = await queryClient
      .from('user_companies')
      .select('user_id')
      .eq('company_id', companyId);

    if (fetchError) {
      console.error('Error fetching company users:', fetchError);
      return createErrorResponse('Failed to fetch company users');
    }

    if (!companyUsers || companyUsers.length === 0) {
      return createSuccessResponse({ users: [] });
    }

    // Get user IDs to query profiles
    const userIds = companyUsers.map((cu: { user_id: string }) => cu.user_id);

    // Now fetch the profiles for those users with their departments (using admin client if admin)
    const { data: profiles, error: profilesError } = await queryClient
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        user_departments!left(department)
      `)
      .in('id', userIds)
      .eq('user_departments.company_id', companyId);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return createErrorResponse('Failed to fetch user profiles');
    }

    // Since we're using LEFT join, all users are already included in profiles
    // No need to fetch separately or combine
    const allProfiles = profiles || [];

    // Group departments by user
    const userDepartments: { [userId: string]: string[] } = {};
    allProfiles.forEach((profile: any) => {
      if (!userDepartments[profile.id]) {
        userDepartments[profile.id] = [];
      }

      // Handle array of department objects from LEFT join
      if (Array.isArray(profile.user_departments)) {
        profile.user_departments.forEach((deptObj: any) => {
          if (deptObj?.department && !userDepartments[profile.id].includes(deptObj.department)) {
            userDepartments[profile.id].push(deptObj.department);
          }
        });
      } else if (profile.user_departments?.department && !userDepartments[profile.id].includes(profile.user_departments.department)) {
        // Handle single department object (fallback)
        userDepartments[profile.id].push(profile.user_departments.department);
      }
    });


    // Remove duplicates and format the response data
    const uniqueProfiles = allProfiles.reduce((acc: any[], current: any) => {
      const existingUser = acc.find(user => user.id === current.id);
      if (!existingUser) {
        acc.push(current);
      }
      return acc;
    }, []);

    const users = uniqueProfiles.map((profile: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      avatar_url: string | null;
    }) => ({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
      departments: userDepartments[profile.id] || []
    }));


    return createSuccessResponse({ users });

  } catch (error) {
    console.error('Error in company users API:', error);
    return createErrorResponse('Internal server error');
  }
}